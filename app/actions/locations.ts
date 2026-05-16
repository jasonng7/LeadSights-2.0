"use server"

import { getRequiredEnv } from "@/lib/env"

export interface LocationCandidate {
  place_id: string
  name: string
  address: string
  confidence: number
}

interface TextSearchResponse {
  status: string
  results?: Array<{
    place_id?: string
    name?: string
    formatted_address?: string
  }>
}

export async function getLocationCandidates(input: string): Promise<LocationCandidate[]> {
  const query = input.trim()
  if (!query) return []

  const apiKey = getRequiredEnv("GOOGLE_MAPS_API_KEY")
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query,
  )}&key=${apiKey}`

  const searchResponse = await fetch(searchUrl)
  const searchData = (await searchResponse.json()) as TextSearchResponse

  if (searchData.status !== "OK" || !searchData.results?.length) {
    return []
  }

  const candidates = searchData.results
    .slice(0, 5)
    .filter((result) => result.place_id && result.name)
    .map((result, index) => {
      const name = result.name || "Unknown place"
      const address = result.formatted_address || name

      return {
        place_id: result.place_id as string,
        name,
        address,
        confidence: getCandidateConfidence(query, name, address, index),
      }
    })

  return candidates
}

function getCandidateConfidence(query: string, name: string, address: string, index: number): number {
  const normalizedQuery = normalize(query)
  const normalizedName = normalize(name)
  const normalizedAddress = normalize(address)
  const rankScore = Math.max(0, 45 - index * 8)
  const exactScore = normalizedName === normalizedQuery ? 40 : 0
  const prefixScore = normalizedName.startsWith(normalizedQuery) ? 25 : 0
  const containsScore = normalizedAddress.includes(normalizedQuery) ? 15 : 0

  return Math.max(10, Math.min(95, rankScore + exactScore + prefixScore + containsScore))
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}
