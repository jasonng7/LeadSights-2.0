"use server"

import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"
import { fetchPlaceReviews } from "@/lib/google-places"
import type { BattleCard, Lead } from "@/lib/types"
import { getActiveProfile } from "./profiles"

const battleCardSchema = z.object({
  pitch_angle: z.string(),
  pain_points: z.array(z.string()).min(3).max(4),
  value_proposition: z.string(),
  objection_handling: z.array(z.string()).min(3).max(4),
  conversation_starters: z.array(z.string()).min(3).max(4),
  review_sentiment: z.string(),
})

const battleCardModel = openai(process.env.OPENAI_MODEL || "gpt-4o-mini")

export async function generateBattleCard(lead: Lead): Promise<BattleCard> {
  const reviews = await fetchPlaceReviews(lead.place_id)
  const activeProfile = await getActiveProfile()

  const reviewsText =
    reviews.length > 0
      ? reviews
          .map((r) => `Rating: ${r.rating}★ - "${r.text.slice(0, 200)}${r.text.length > 200 ? "..." : ""}"`)
          .join("\n")
      : "No reviews available"

  const companyContext = activeProfile
    ? `
Your Company Profile:
Profile Name: ${activeProfile.name}
Company Information & Pitch:
${activeProfile.knowledge_base}

Use this company information to tailor your sales approach and demonstrate how your specific products/services address the business's needs.
`
    : `
Note: No company profile is currently active. Generate a generic sales approach.
`

  const prompt = `You are a B2B sales strategist analyzing this business for lead generation.

Business: ${lead.name}
Location: ${lead.address}
Rating: ${lead.rating}/5 stars
Total Reviews: ${lead.user_ratings_total}
Lead Score: ${lead.lead_score}/100
Score Reasons: ${lead.score_reasons.join(", ") || "No score reasons available"}

Recent Reviews (from Google):
${reviewsText}

${companyContext}

Based on the actual customer reviews, business data, and YOUR COMPANY PROFILE, create a comprehensive sales battle card that counters negative sentiments and leverages opportunities using your specific strengths and products:

1. Pitch Angle: 2-3 sentence approach tailored to this specific business based on review themes AND how your company's offerings can help
2. Pain Points: 3-4 specific challenges evident from the reviews and business profile
3. Value Proposition: How YOUR SPECIFIC PRODUCTS/SERVICES address the pain points identified in reviews
4. Objection Handling: 3 common objections with data-driven responses using your company's strengths
5. Conversation Starters: 3 opening questions based on review insights that lead to your solutions
6. Review Sentiment: Detailed analysis of the ${reviews.length} reviews - common themes, strengths, complaints, and overall sentiment

IMPORTANT: The battle card should be a strategic document that shows how YOUR company can solve THEIR problems based on what customers are saying in reviews.

Return a concise, tactical battle card.`

  try {
    const { object } = await generateObject({
      model: battleCardModel,
      schema: battleCardSchema,
      schemaName: "BattleCard",
      prompt,
      temperature: 0.7,
    })

    return object as BattleCard
  } catch (error) {
    console.error("Error generating battle card:", error)
    throw new Error("Failed to generate battle card")
  }
}
