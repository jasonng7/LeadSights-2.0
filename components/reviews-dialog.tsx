"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Star } from "lucide-react"
import { getPlaceReviews } from "@/app/actions/search"
import type { Lead, PlaceReview } from "@/lib/types"

interface ReviewsDialogProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReviewsDialog({ lead, open, onOpenChange }: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<PlaceReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && lead) {
      setLoading(true)
      getPlaceReviews(lead.place_id)
        .then((data) => {
          setReviews(data)
        })
        .catch((error) => {
          console.error("Error fetching reviews:", error)
          setReviews([])
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, lead])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead.name}</DialogTitle>
          <DialogDescription>
            {lead.rating.toFixed(1)} ★ average from {lead.user_ratings_total} reviews
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No reviews available</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.profile_photo_url || "/placeholder.svg"} alt={review.author_name} />
                      <AvatarFallback>{review.author_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            {review.author_url ? (
                              <a
                                href={review.author_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {review.author_name}
                              </a>
                            ) : (
                              review.author_name
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{review.relative_time_description}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed">{review.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-muted-foreground text-center">
              Note: Google Maps API returns a maximum of 5 most helpful reviews
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
