"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Target, AlertTriangle, TrendingUp, MessageCircle, Lightbulb } from "lucide-react"
import { generateBattleCard } from "@/app/actions/battle-card"
import type { BattleCard, Lead } from "@/lib/types"

interface BattleCardDialogProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BattleCardDialog({ lead, open, onOpenChange }: BattleCardDialogProps) {
  const [battleCard, setBattleCard] = useState<BattleCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && lead) {
      setLoading(true)
      setError(null)
      generateBattleCard(lead)
        .then((data) => {
          setBattleCard(data)
        })
        .catch((error) => {
          setError(error instanceof Error ? error.message : "Failed to generate battle card")
          setBattleCard(null)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, lead])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Battle Card: {lead.name}</DialogTitle>
          <DialogDescription>
            AI-generated sales strategy based on Google&apos;s available review excerpts, up to 5 reviews, plus{" "}
            {lead.user_ratings_total.toLocaleString()} total-review metadata and a {lead.rating.toFixed(1)}★ rating
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !battleCard ? (
          <div className="text-center py-8 text-muted-foreground">{error || "Failed to generate battle card"}</div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-primary" />
                  Pitch Angle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{battleCard.pitch_angle}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Pain Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {battleCard.pain_points.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Value Proposition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{battleCard.value_proposition}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Objection Handling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {battleCard.objection_handling.map((objection, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span className="leading-relaxed">{objection}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Conversation Starters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {battleCard.conversation_starters.map((starter, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span className="leading-relaxed italic">&ldquo;{starter}&rdquo;</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Review Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{battleCard.review_sentiment}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
