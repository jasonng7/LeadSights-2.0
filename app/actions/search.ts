"use server"

import { fetchPlaces, fetchPlaceReviews } from "@/lib/google-places"
import type { Lead, LeadFilters, PlaceReview } from "@/lib/types"

export interface SearchParams {
  business_type: string
  location: string
  radius: number
  max_results: number
  filters?: LeadFilters
}

export async function searchLeads(params: SearchParams): Promise<Lead[]> {
  return fetchPlaces(params)
}

export async function getPlaceReviews(placeId: string): Promise<PlaceReview[]> {
  return fetchPlaceReviews(placeId)
}
