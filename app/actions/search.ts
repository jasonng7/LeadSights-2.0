"use server"

import { fetchPlaces, fetchPlaceReviews } from "@/lib/google-places"
import type { Lead, LeadFilters, PlaceReview, SearchExpansionSelection } from "@/lib/types"

export interface SearchParams {
  business_type: string
  location: string
  radius: number
  max_results: number
  filters?: LeadFilters
  expansions?: SearchExpansionSelection
}

export async function searchLeads(params: SearchParams): Promise<Lead[]> {
  try {
    return await fetchPlaces(params)
  } catch (error) {
    console.error("Search failed:", error)
    throw new Error(getSafeSearchError(error))
  }
}

export async function getPlaceReviews(placeId: string): Promise<PlaceReview[]> {
  return fetchPlaceReviews(placeId)
}

function getSafeSearchError(error: unknown): string {
  const message = error instanceof Error ? error.message : ""

  if (message.includes("GOOGLE_MAPS_API_KEY")) {
    return "Google Maps API key is missing. Add GOOGLE_MAPS_API_KEY in your environment variables."
  }

  if (message.includes("REQUEST_DENIED")) {
    return "Google Maps rejected the request. Check that Places API is enabled and billing is active."
  }

  if (message.includes("OVER_QUERY_LIMIT")) {
    return "Google Maps quota was reached. Try Fast 20 or check your Google Cloud quota."
  }

  if (message.includes("OPENAI_API_KEY")) {
    return "OpenAI API key is missing. Add OPENAI_API_KEY in your environment variables."
  }

  return "Search failed. Check your API keys, billing, and filters, then try again."
}
