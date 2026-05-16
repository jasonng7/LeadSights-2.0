"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2, Search, MapPin, Briefcase } from "lucide-react"
import { SearchResults } from "@/components/search-results"
import { searchLeads } from "@/app/actions/search"
import type { Lead } from "@/lib/types"

export function SearchForm() {
  const [isSearching, setIsSearching] = useState(false)
  const [businessType, setBusinessType] = useState("")
  const [location, setLocation] = useState("")
  const [radiusKm, setRadiusKm] = useState("5")
  const [minRating, setMinRating] = useState("")
  const [maxRating, setMaxRating] = useState("")
  const [minReviews, setMinReviews] = useState("")
  const [missingWebsite, setMissingWebsite] = useState(false)
  const [businessStatus, setBusinessStatus] = useState("OPERATIONAL")
  const [searchResults, setSearchResults] = useState<{
    businessType: string
    location: string
    leads: Lead[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessType || !location) return

    setIsSearching(true)
    setError(null)

    try {
      const leads = await searchLeads({
        business_type: businessType,
        location: location,
        radius: Number(radiusKm || 5) * 1000,
        max_results: 20,
        filters: {
          min_rating: minRating ? Number(minRating) : undefined,
          max_rating: maxRating ? Number(maxRating) : undefined,
          min_reviews: minReviews ? Number(minReviews) : undefined,
          missing_website: missingWebsite,
          business_status: businessStatus,
          max_distance_meters: Number(radiusKm || 5) * 1000,
        },
      })

      setSearchResults({
        businessType,
        location,
        leads,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Search failed. Please try again.")
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <>
      <Card className="mb-8 shadow-lg border-2 hover:border-primary/50 transition-colors animate-scale-in">
        <CardContent className="pt-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="business-type"
                  className="text-base font-semibold text-foreground flex items-center gap-2"
                >
                  <Briefcase className="h-4 w-4 text-primary" />
                  Business Type
                </Label>
                <Input
                  id="business-type"
                  placeholder="e.g., restaurant, cafe, bakery"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  required
                  className="h-12 text-base border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Kuala Lumpur, KLCC"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="h-12 text-base border-2 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-2">
                <Label htmlFor="radius-km">Distance</Label>
                <Input
                  id="radius-km"
                  type="number"
                  min="1"
                  max="50"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-rating">Min Rating</Label>
                <Input
                  id="min-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Any"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-rating">Max Rating</Label>
                <Input
                  id="max-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Any"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-reviews">Min Reviews</Label>
                <Input
                  id="min-reviews"
                  type="number"
                  min="0"
                  placeholder="Any"
                  value={minReviews}
                  onChange={(e) => setMinReviews(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-status">Status</Label>
                <select
                  id="business-status"
                  value={businessStatus}
                  onChange={(e) => setBusinessStatus(e.target.value)}
                  className="h-11 w-full rounded-md border-2 border-input bg-background px-3 text-sm"
                >
                  <option value="ANY">Any</option>
                  <option value="OPERATIONAL">Operational</option>
                  <option value="CLOSED_TEMPORARILY">Closed temporarily</option>
                  <option value="CLOSED_PERMANENTLY">Closed permanently</option>
                </select>
              </div>

              <label
                htmlFor="missing-website"
                className="flex h-11 items-center gap-3 self-end rounded-md border-2 border-input px-3 text-sm font-medium"
              >
                <input
                  id="missing-website"
                  type="checkbox"
                  checked={missingWebsite}
                  onChange={(e) => setMissingWebsite(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                No website
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSearching}
              size="lg"
              className="w-full md:w-auto px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Searching leads...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Find Leads
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {searchResults && <SearchResults searchResults={searchResults} />}
    </>
  )
}
