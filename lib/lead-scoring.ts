import type { Lead } from "@/lib/types"

export function scoreLead(lead: Omit<Lead, "lead_score" | "score_reasons">): Pick<Lead, "lead_score" | "score_reasons"> {
  const reasons: string[] = []
  let score = 40

  if (!lead.website) {
    score += 22
    reasons.push("No website listed")
  } else {
    score += 6
    reasons.push("Website available")
  }

  if (lead.rating > 0 && lead.rating < 4.2) {
    score += 18
    reasons.push("Review rating suggests service gaps")
  } else if (lead.rating >= 4.2) {
    score += 8
    reasons.push("Strong reputation to scale")
  }

  if (lead.user_ratings_total >= 100) {
    score += 14
    reasons.push("High review volume")
  } else if (lead.user_ratings_total >= 25) {
    score += 9
    reasons.push("Moderate review volume")
  } else if (lead.user_ratings_total > 0) {
    score += 4
    reasons.push("Low review volume")
  }

  if (lead.phone_number) {
    score += 6
    reasons.push("Direct phone contact available")
  }

  if (lead.business_status === "OPERATIONAL") {
    score += 6
    reasons.push("Business is operational")
  }

  if (typeof lead.distance_meters === "number") {
    if (lead.distance_meters <= 3000) {
      score += 6
      reasons.push("Close to target location")
    } else if (lead.distance_meters <= 10000) {
      score += 3
      reasons.push("Within target area")
    }
  }

  return {
    lead_score: Math.max(0, Math.min(100, Math.round(score))),
    score_reasons: reasons.slice(0, 4),
  }
}

export function formatDistance(distanceMeters?: number): string {
  if (typeof distanceMeters !== "number") return "-"
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`
  return `${(distanceMeters / 1000).toFixed(1)} km`
}
