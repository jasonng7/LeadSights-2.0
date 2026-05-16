import { getRequiredEnv } from "@/lib/env"
import { scoreLead } from "@/lib/lead-scoring"
import type { Lead, LeadFilters, PlaceReview, SearchExpansionSelection } from "@/lib/types"

export interface PlacesSearchParams {
  business_type: string
  location: string
  radius: number
  max_results: number
  filters?: LeadFilters
  expansions?: SearchExpansionSelection
}

interface GooglePlacesResponse<T> {
  status: string
  error_message?: string
  results?: T[]
  result?: T
  next_page_token?: string
}

interface GoogleTextSearchResult {
  place_id?: string
}

interface GooglePlaceDetails {
  place_id?: string
  name?: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  geometry?: {
    location?: {
      lat?: number
      lng?: number
    }
  }
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types?: string[]
  business_status?: string
  opening_hours?: {
    open_now?: boolean
  }
  url?: string
  reviews?: GoogleReview[]
}

interface GoogleReview {
  author_name?: string
  author_url?: string
  profile_photo_url?: string
  rating?: number
  relative_time_description?: string
  text?: string
  time?: number
}

interface GoogleGeocodeResponse {
  status: string
  error_message?: string
  results?: Array<{
    geometry?: {
      location?: {
        lat?: number
        lng?: number
      }
    }
  }>
}

interface Coordinates {
  lat: number
  lng: number
}

interface SearchVariant {
  businessType: string
  location: string
  placeType?: string
}

interface SearchState {
  variant: SearchVariant
  targetLocation: Coordinates | null
  nextPageToken?: string
  exhausted: boolean
  pageCount: number
}

const MAX_GOOGLE_RESULTS = 60
const MAX_SEARCH_VARIANTS = 6

/**
 * Fetch places from Google Places API
 * Uses Google Places Text Search and Place Details API
 */
export async function fetchPlaces(params: PlacesSearchParams): Promise<Lead[]> {
  const apiKey = getRequiredEnv("GOOGLE_MAPS_API_KEY")

  try {
    const maxResults = Math.min(Math.max(params.max_results || 20, 1), MAX_GOOGLE_RESULTS)
    const searchStates = await buildSearchStates(params, apiKey)
    const placeOrigins = await collectPlaceIds(searchStates, params.radius, maxResults, apiKey)

    if (placeOrigins.size === 0) {
      return []
    }

    const placeIds = Array.from(placeOrigins.keys()).slice(0, maxResults)

    const detailedPlaces = await Promise.all(
      placeIds.map(async (placeId: string) => {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,formatted_phone_number,website,geometry,rating,user_ratings_total,price_level,types,business_status,opening_hours,url&key=${apiKey}`

        const detailsResponse = await fetch(detailsUrl)
        const detailsData = (await detailsResponse.json()) as GooglePlacesResponse<GooglePlaceDetails>

        if (detailsData.status !== "OK") {
          return null
        }

        const place = detailsData.result
        if (!place?.place_id || !place.name) {
          return null
        }

        const baseLead: Omit<Lead, "lead_score" | "score_reasons"> = {
          place_id: place.place_id,
          name: place.name,
          address: place.formatted_address || "Address not available",
          latitude: place.geometry?.location?.lat || 0,
          longitude: place.geometry?.location?.lng || 0,
          rating: place.rating || 0,
          user_ratings_total: place.user_ratings_total || 0,
          types: place.types || [],
          business_status: place.business_status || "OPERATIONAL",
          google_maps_url: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        }

        const origin = placeOrigins.get(placeId)
        const targetLocation = origin?.targetLocation

        if (targetLocation && baseLead.latitude && baseLead.longitude) {
          baseLead.distance_meters = getDistanceMeters(targetLocation, {
            lat: baseLead.latitude,
            lng: baseLead.longitude,
          })
        }

        if (place.formatted_phone_number) {
          baseLead.phone_number = place.formatted_phone_number
        }

        if (place.website) {
          baseLead.website = place.website
        }

        if (typeof place.price_level === "number") {
          baseLead.price_level = place.price_level
        }

        if (typeof place.opening_hours?.open_now === "boolean") {
          baseLead.open_now = place.opening_hours.open_now
        }

        const lead: Lead = {
          ...baseLead,
          ...scoreLead(baseLead),
        }

        return lead
      }),
    )

    const validPlaces = detailedPlaces
      .filter((place): place is Lead => place !== null)
      .filter((place) => matchesFilters(place, params.filters))

    validPlaces.sort((a, b) => {
      if (b.lead_score !== a.lead_score) {
        return b.lead_score - a.lead_score
      }
      if (b.rating !== a.rating) {
        return b.rating - a.rating
      }
      return b.user_ratings_total - a.user_ratings_total
    })

    return validPlaces
  } catch (error) {
    throw error
  }
}

async function buildSearchStates(params: PlacesSearchParams, apiKey: string): Promise<SearchState[]> {
  const geocodeCache = new Map<string, Coordinates | null>()
  const variants = buildSearchVariants(params).slice(0, MAX_SEARCH_VARIANTS)

  return Promise.all(
    variants.map(async (variant) => {
      const cacheKey = variant.location.toLowerCase()
      const targetLocation = geocodeCache.has(cacheKey)
        ? geocodeCache.get(cacheKey) || null
        : await geocodeLocation(variant.location, apiKey)

      geocodeCache.set(cacheKey, targetLocation)

      return {
        variant,
        targetLocation,
        exhausted: false,
        pageCount: 0,
      }
    }),
  )
}

function buildSearchVariants(params: PlacesSearchParams): SearchVariant[] {
  const variants: SearchVariant[] = [{ businessType: params.business_type, location: params.location }]
  const categories = params.expansions?.business_categories || []
  const areas = params.expansions?.area_tags || []
  const targetAreas = areas.length > 0 ? areas : [{ label: params.location, search_term: params.location }]
  const seen = new Set<string>([getVariantKey(variants[0])])

  categories.forEach((category) => {
    targetAreas.forEach((area) => {
      const variant = {
        businessType: category.search_term,
        location: area.search_term,
        placeType: category.google_place_type,
      }
      const key = getVariantKey(variant)

      if (!seen.has(key)) {
        variants.push(variant)
        seen.add(key)
      }
    })
  })

  return variants
}

function getVariantKey(variant: SearchVariant): string {
  return `${variant.businessType.toLowerCase()}|${variant.location.toLowerCase()}|${variant.placeType || ""}`
}

async function collectPlaceIds(
  searchStates: SearchState[],
  radius: number,
  maxResults: number,
  apiKey: string,
): Promise<Map<string, SearchState>> {
  const placeOrigins = new Map<string, SearchState>()
  const maxPages = Math.ceil(maxResults / 20)

  while (placeOrigins.size < maxResults && searchStates.some((state) => !state.exhausted && state.pageCount < maxPages)) {
    for (const state of searchStates) {
      if (placeOrigins.size >= maxResults || state.exhausted || state.pageCount >= maxPages) continue

      const searchData = await fetchTextSearchPageWithRetry(state, radius, apiKey)

      if (searchData.status === "ZERO_RESULTS") {
        state.exhausted = true
        continue
      }

      if (searchData.status !== "OK") {
        throw new Error(
          `Google Places API error: ${searchData.status}${searchData.error_message ? ` - ${searchData.error_message}` : ""}`,
        )
      }

      searchData.results?.forEach((place) => {
        if (place.place_id && !placeOrigins.has(place.place_id) && placeOrigins.size < maxResults) {
          placeOrigins.set(place.place_id, state)
        }
      })

      state.pageCount += 1
      state.nextPageToken = searchData.next_page_token
      state.exhausted = !state.nextPageToken
    }
  }

  return placeOrigins
}

async function fetchTextSearchPageWithRetry(
  state: SearchState,
  radius: number,
  apiKey: string,
): Promise<GooglePlacesResponse<GoogleTextSearchResult>> {
  const maxAttempts = state.nextPageToken ? 3 : 1

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (state.nextPageToken) {
      await waitForNextPageToken()
    }

    const searchData = await fetchTextSearchPage(state, radius, apiKey)

    if (searchData.status !== "INVALID_REQUEST" || !state.nextPageToken || attempt === maxAttempts) {
      return searchData
    }
  }

  return fetchTextSearchPage(state, radius, apiKey)
}

async function fetchTextSearchPage(
  state: SearchState,
  radius: number,
  apiKey: string,
): Promise<GooglePlacesResponse<GoogleTextSearchResult>> {
  if (state.nextPageToken) {
    const params = new URLSearchParams({
      pagetoken: state.nextPageToken,
      key: apiKey,
    })
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
    const searchResponse = await fetch(searchUrl)

    return (await searchResponse.json()) as GooglePlacesResponse<GoogleTextSearchResult>
  }

  const searchQuery = `${state.variant.businessType} in ${state.variant.location}`
  const params = new URLSearchParams({
    query: searchQuery,
    radius: String(radius),
    key: apiKey,
  })

  if (state.targetLocation) {
    params.set("location", `${state.targetLocation.lat},${state.targetLocation.lng}`)
  }

  if (state.variant.placeType) {
    params.set("type", state.variant.placeType)
  }

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
  const searchResponse = await fetch(searchUrl)

  return (await searchResponse.json()) as GooglePlacesResponse<GoogleTextSearchResult>
}

function waitForNextPageToken(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 2000))
}

async function geocodeLocation(location: string, apiKey: string): Promise<Coordinates | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
  const response = await fetch(url)
  const data = (await response.json()) as GoogleGeocodeResponse

  if (data.status !== "OK") {
    return null
  }

  const coordinates = data.results?.[0]?.geometry?.location
  if (typeof coordinates?.lat !== "number" || typeof coordinates.lng !== "number") {
    return null
  }

  return {
    lat: coordinates.lat,
    lng: coordinates.lng,
  }
}

function getDistanceMeters(from: Coordinates, to: Coordinates): number {
  const earthRadiusMeters = 6371000
  const latDelta = toRadians(to.lat - from.lat)
  const lngDelta = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a =
    Math.sin(latDelta / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(earthRadiusMeters * c)
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function matchesFilters(lead: Lead, filters?: LeadFilters): boolean {
  if (!filters) return true
  if (typeof filters.min_rating === "number" && lead.rating < filters.min_rating) return false
  if (typeof filters.max_rating === "number" && lead.rating > filters.max_rating) return false
  if (typeof filters.min_reviews === "number" && lead.user_ratings_total < filters.min_reviews) return false
  if (filters.missing_website && lead.website) return false
  if (filters.business_status && filters.business_status !== "ANY" && lead.business_status !== filters.business_status) {
    return false
  }
  if (
    typeof filters.max_distance_meters === "number" &&
    typeof lead.distance_meters === "number" &&
    lead.distance_meters > filters.max_distance_meters
  ) {
    return false
  }

  return true
}

/**
 * Fetch reviews for a specific place
 * Google Places API returns maximum 5 most helpful reviews
 */
export async function fetchPlaceReviews(placeId: string): Promise<PlaceReview[]> {
  const apiKey = getRequiredEnv("GOOGLE_MAPS_API_KEY")

  try {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`

    const response = await fetch(detailsUrl)
    const data = (await response.json()) as GooglePlacesResponse<GooglePlaceDetails>

    if (data.status !== "OK") {
      return []
    }

    const reviews = data.result?.reviews || []

    return reviews.map((review) => ({
      author_name: review.author_name || "Anonymous",
      author_url: review.author_url,
      profile_photo_url: review.profile_photo_url,
      rating: review.rating || 0,
      relative_time_description: review.relative_time_description || "Recently",
      text: review.text || "",
      time: review.time || Date.now() / 1000,
    }))
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return []
  }
}
