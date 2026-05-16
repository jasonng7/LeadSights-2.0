"use client"

import { LeadList } from "@/components/lead-list"
import { LeadMap } from "@/components/lead-map"
import { ExportButton } from "@/components/export-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, List, Target } from "lucide-react"
import type { Lead } from "@/lib/types"

interface SearchResultsProps {
  searchResults: {
    businessType: string
    location: string
    maxResults?: number
    expansionCount?: number
    leads: Lead[]
  }
}

export function SearchResults({ searchResults }: SearchResultsProps) {
  const { businessType, location, leads, maxResults, expansionCount = 0 } = searchResults

  if (leads.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
          <Target className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-xl text-muted-foreground">No leads found for this search</p>
        <p className="text-sm text-muted-foreground mt-2">Try adjusting your search criteria</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card rounded-xl border-2 border-border shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Search Results</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground text-balance">
            {businessType} in {location}
          </h2>
          {maxResults && leads.length < maxResults && (
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Showing {leads.length} of up to {maxResults}. Google may return fewer exact matches; use selected
              expansions, widen the radius, or loosen filters to find more.
            </p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <div className="px-4 py-2 bg-primary/10 rounded-lg">
              <span className="text-2xl font-bold text-primary">{leads.length}</span>
              <span className="text-sm text-muted-foreground ml-2">leads found</span>
            </div>
            <div className="px-4 py-2 bg-chart-3/10 rounded-lg">
              <span className="text-2xl font-bold text-chart-3">
                {Math.round(leads.reduce((sum, lead) => sum + lead.lead_score, 0) / leads.length)}
              </span>
              <span className="text-sm text-muted-foreground ml-2">avg score</span>
            </div>
            <div className="px-4 py-2 bg-secondary/20 rounded-lg">
              <span className="text-2xl font-bold text-secondary-foreground">
                {(leads.reduce((sum, lead) => sum + lead.rating, 0) / leads.length).toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground ml-2">avg rating</span>
            </div>
            {expansionCount > 0 && (
              <div className="px-4 py-2 bg-accent rounded-lg">
                <span className="text-2xl font-bold text-foreground">{expansionCount}</span>
                <span className="text-sm text-muted-foreground ml-2">expansions</span>
              </div>
            )}
          </div>
        </div>
        <ExportButton leads={leads} businessType={businessType} location={location} />
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1">
          <TabsTrigger value="list" className="text-base">
            <List className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="map" className="text-base">
            <MapPin className="mr-2 h-4 w-4" />
            Map View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <LeadList leads={leads} />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <LeadMap leads={leads} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
