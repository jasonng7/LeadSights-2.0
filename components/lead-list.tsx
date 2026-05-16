"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, ExternalLink, Phone, Globe, MessageSquare, Sparkles, Star } from "lucide-react"
import { BattleCardDialog } from "./battle-card-dialog"
import { ReviewsDialog } from "./reviews-dialog"
import { formatDistance } from "@/lib/lead-scoring"
import type { Lead } from "@/lib/types"

interface LeadListProps {
  leads: Lead[]
}

type SortField = "name" | "lead_score" | "rating" | "user_ratings_total" | "distance_meters"
type SortDirection = "asc" | "desc"

export function LeadList({ leads }: LeadListProps) {
  const [sortField, setSortField] = useState<SortField>("lead_score")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showBattleCard, setShowBattleCard] = useState(false)
  const [showReviews, setShowReviews] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedLeads = [...leads].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    const aNum = Number(aValue) || 0
    const bNum = Number(bValue) || 0
    return sortDirection === "asc" ? aNum - bNum : bNum - aNum
  })

  return (
    <Card className="shadow-xl border-2 animate-scale-in">
      <CardHeader className="bg-muted/50 border-b-2 border-border">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <CardTitle className="text-2xl">Lead List</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("name")} className="h-10 px-3 font-semibold">
                    Business Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("lead_score")}
                    className="h-10 px-3 font-semibold"
                  >
                    Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("rating")} className="h-10 px-3 font-semibold">
                    Rating
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("user_ratings_total")}
                    className="h-10 px-3 font-semibold"
                  >
                    Reviews
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("distance_meters")}
                    className="h-10 px-3 font-semibold"
                  >
                    Distance
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeads.map((lead, index) => (
                <TableRow
                  key={lead.place_id}
                  className="hover:bg-accent/50 transition-colors border-b border-border"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell className="font-medium py-4">
                    <div>
                      <div className="font-semibold text-foreground text-base mb-1">{lead.name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">{lead.address}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant={lead.lead_score >= 75 ? "default" : lead.lead_score >= 55 ? "secondary" : "outline"}
                        className="text-base font-bold px-3 py-1"
                      >
                        {lead.lead_score}
                      </Badge>
                      <div className="max-w-44 text-xs text-muted-foreground">{lead.score_reasons[0]}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={lead.rating >= 4.5 ? "default" : lead.rating >= 4.0 ? "secondary" : "outline"}
                        className="text-base font-bold px-3 py-1"
                      >
                        {lead.rating.toFixed(1)}
                      </Badge>
                      <Star className="h-4 w-4 fill-secondary text-secondary" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground font-medium">
                      {lead.user_ratings_total.toLocaleString()} reviews
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatDistance(lead.distance_meters)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {lead.phone_number && (
                        <a
                          href={`tel:${lead.phone_number}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                        >
                          <Phone className="h-4 w-4" />
                          {lead.phone_number}
                        </a>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      )}
                      {!lead.website && <span className="text-sm text-muted-foreground">No website</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLead(lead)
                          setShowReviews(true)
                        }}
                        title="View Reviews"
                        className="hover:bg-accent hover:border-primary transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLead(lead)
                          setShowBattleCard(true)
                        }}
                        title="Generate Battle Card with AI"
                        className="hover:bg-primary/10 hover:border-primary transition-colors"
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="hover:bg-accent hover:border-primary transition-colors bg-transparent"
                      >
                        <a
                          href={lead.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Google Maps"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {selectedLead && (
          <>
            <ReviewsDialog
              lead={selectedLead}
              open={showReviews}
              onOpenChange={(open) => {
                setShowReviews(open)
                if (!open) setSelectedLead(null)
              }}
            />
            <BattleCardDialog
              lead={selectedLead}
              open={showBattleCard}
              onOpenChange={(open) => {
                setShowBattleCard(open)
                if (!open) setSelectedLead(null)
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
