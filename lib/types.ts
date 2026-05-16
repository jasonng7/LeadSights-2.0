export interface Lead {
  place_id: string
  name: string
  address: string
  phone_number?: string
  website?: string
  latitude: number
  longitude: number
  rating: number
  user_ratings_total: number
  price_level?: number
  types: string[]
  business_status: string
  open_now?: boolean
  google_maps_url: string
  distance_meters?: number
  lead_score: number
  score_reasons: string[]
}

export interface LeadFilters {
  min_rating?: number
  max_rating?: number
  min_reviews?: number
  missing_website?: boolean
  business_status?: string
  max_distance_meters?: number
}

export interface PlaceReview {
  author_name: string
  author_url?: string
  profile_photo_url?: string
  rating: number
  relative_time_description: string
  text: string
  time: number
}

export interface BattleCard {
  pitch_angle: string
  pain_points: string[]
  value_proposition: string
  objection_handling: string[]
  conversation_starters: string[]
  review_sentiment: string
}
