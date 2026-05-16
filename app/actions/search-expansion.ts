"use server"

import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

export interface BusinessCategoryExpansion {
  id: string
  label: string
  search_term: string
  google_place_type: string
  rationale: string
}

export interface AreaTagExpansion {
  id: string
  label: string
  search_term: string
  rationale: string
}

export interface SearchExpansionPlan {
  business_categories: BusinessCategoryExpansion[]
  area_tags: AreaTagExpansion[]
  source: "ai" | "fallback"
}

const googlePlaceTypes = [
  "accounting",
  "bakery",
  "bar",
  "beauty_salon",
  "cafe",
  "car_dealer",
  "car_repair",
  "clothing_store",
  "dentist",
  "doctor",
  "electronics_store",
  "florist",
  "furniture_store",
  "gym",
  "hair_care",
  "hardware_store",
  "home_goods_store",
  "insurance_agency",
  "jewelry_store",
  "laundry",
  "lawyer",
  "lodging",
  "meal_delivery",
  "meal_takeaway",
  "pet_store",
  "pharmacy",
  "physiotherapist",
  "real_estate_agency",
  "restaurant",
  "shoe_store",
  "spa",
  "store",
  "travel_agency",
  "veterinary_care",
] as const

const expansionSchema = z.object({
  business_categories: z.array(
    z.object({
      label: z.string().min(2).max(40),
      search_term: z.string().min(2).max(60),
      google_place_type: z.string().min(2).max(40),
      rationale: z.string().min(8).max(140),
    }),
  ).min(3).max(8),
  area_tags: z.array(
    z.object({
      label: z.string().min(2).max(50),
      search_term: z.string().min(2).max(80),
      rationale: z.string().min(8).max(140),
    }),
  ).min(3).max(6),
})

const expansionModel = openai(process.env.OPENAI_MODEL || "gpt-4o-mini")

export async function generateSearchExpansionPlan(businessType: string, location: string): Promise<SearchExpansionPlan> {
  const normalizedBusinessType = businessType.trim()
  const normalizedLocation = location.trim()

  if (!normalizedBusinessType || !normalizedLocation || !process.env.OPENAI_API_KEY) {
    return buildFallbackPlan(normalizedBusinessType, normalizedLocation)
  }

  try {
    const { object } = await generateObject({
      model: expansionModel,
      schema: expansionSchema,
      schemaName: "SearchExpansionPlan",
      temperature: 0.3,
      prompt: `You help a local lead-generation app expand a Google Maps search.

Original business search: ${normalizedBusinessType}
Confirmed location: ${normalizedLocation}

Return:
1. Business category expansions that are adjacent to the user's original search intent.
2. Nearby area tags that a Google Maps user would naturally search around the confirmed location.

Rules:
- Every google_place_type must be one of these supported Google Places type tags:
${googlePlaceTypes.join(", ")}
- search_term should be a natural Google Maps query keyword, not a sentence.
- Do not include broad non-business categories unless the original query is broad.
- Keep suggestions commercially useful for outbound sales prospecting.
- Nearby area tags should be specific neighborhoods, malls, streets, districts, or city areas near the confirmed location.
- Do not invent addresses.`,
    })

    return {
      business_categories: sanitizeBusinessCategories(object.business_categories, normalizedBusinessType),
      area_tags: sanitizeAreaTags(object.area_tags, normalizedLocation),
      source: "ai",
    }
  } catch (error) {
    console.error("Search expansion failed:", error)
    return buildFallbackPlan(normalizedBusinessType, normalizedLocation)
  }
}

function sanitizeBusinessCategories(
  categories: Array<Omit<BusinessCategoryExpansion, "id">>,
  businessType: string,
): BusinessCategoryExpansion[] {
  const seen = new Set<string>()
  const safeTypes = new Set<string>(googlePlaceTypes)

  return categories
    .map((category) => ({
      ...category,
      google_place_type: safeTypes.has(category.google_place_type) ? category.google_place_type : "store",
    }))
    .filter((category) => {
      const key = `${category.search_term.toLowerCase()}|${category.google_place_type}`
      if (seen.has(key)) return false
      seen.add(key)
      return category.search_term.toLowerCase() !== businessType.toLowerCase()
    })
    .slice(0, 8)
    .map((category, index) => ({
      id: `category-${index}-${slugify(category.google_place_type)}-${slugify(category.search_term)}`,
      label: category.label,
      search_term: category.search_term,
      google_place_type: category.google_place_type,
      rationale: category.rationale,
    }))
}

function sanitizeAreaTags(areas: Array<Omit<AreaTagExpansion, "id">>, location: string): AreaTagExpansion[] {
  const seen = new Set<string>()

  return areas
    .filter((area) => {
      const key = area.search_term.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return area.search_term.toLowerCase() !== location.toLowerCase()
    })
    .slice(0, 6)
    .map((area, index) => ({
      id: `area-${index}-${slugify(area.search_term)}`,
      label: area.label,
      search_term: area.search_term,
      rationale: area.rationale,
    }))
}

function buildFallbackPlan(businessType: string, location: string): SearchExpansionPlan {
  const category = inferFallbackCategory(businessType)

  return {
    business_categories: [
      {
        id: `category-0-${category.google_place_type}`,
        label: category.label,
        search_term: category.search_term,
        google_place_type: category.google_place_type,
        rationale: "Closest Google Places category match for the original business search.",
      },
      {
        id: "category-1-store",
        label: "Related local businesses",
        search_term: businessType || "local businesses",
        google_place_type: "store",
        rationale: "Keeps the search close to the original keyword while broadening matching.",
      },
    ],
    area_tags: [
      {
        id: "area-0-confirmed-location",
        label: "Confirmed location",
        search_term: location || "current area",
        rationale: "Uses the confirmed location without adding extra nearby areas.",
      },
    ],
    source: "fallback",
  }
}

function inferFallbackCategory(businessType: string): Omit<BusinessCategoryExpansion, "id" | "rationale"> {
  const text = businessType.toLowerCase()

  if (text.includes("restaurant")) return { label: "Restaurants", search_term: "restaurant", google_place_type: "restaurant" }
  if (text.includes("cafe") || text.includes("coffee")) return { label: "Cafes", search_term: "cafe", google_place_type: "cafe" }
  if (text.includes("bakery")) return { label: "Bakeries", search_term: "bakery", google_place_type: "bakery" }
  if (text.includes("hotel")) return { label: "Hotels", search_term: "hotel", google_place_type: "lodging" }
  if (text.includes("salon")) return { label: "Beauty salons", search_term: "beauty salon", google_place_type: "beauty_salon" }
  if (text.includes("gym")) return { label: "Gyms", search_term: "gym", google_place_type: "gym" }
  if (text.includes("clinic")) return { label: "Clinics", search_term: "clinic", google_place_type: "doctor" }
  if (text.includes("dentist")) return { label: "Dentists", search_term: "dentist", google_place_type: "dentist" }

  return { label: "Local stores", search_term: businessType || "store", google_place_type: "store" }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
