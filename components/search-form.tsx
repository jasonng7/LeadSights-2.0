"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, Brain, Loader2, Search, MapPin, Briefcase } from "lucide-react"
import { SearchResults } from "@/components/search-results"
import { searchLeads } from "@/app/actions/search"
import {
  generateSearchExpansionPlan,
  type AreaTagExpansion,
  type BusinessCategoryExpansion,
  type SearchExpansionPlan,
} from "@/app/actions/search-expansion"
import { getLocationCandidates, type LocationCandidate } from "@/app/actions/locations"
import type { Lead, SearchExpansionSelection } from "@/lib/types"

const ratingOptions = ["0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"]
const searchDepthOptions = [
  { value: "20", label: "Fast 20", warning: "Lowest cost" },
  { value: "40", label: "More 40", warning: "May use page 2" },
  { value: "60", label: "Deep 60", warning: "Highest cost" },
]

export function SearchForm() {
  const [isSearching, setIsSearching] = useState(false)
  const [isGeneratingExpansions, setIsGeneratingExpansions] = useState(false)
  const [businessType, setBusinessType] = useState("")
  const [location, setLocation] = useState("")
  const [confirmedLocation, setConfirmedLocation] = useState("")
  const [locationCandidates, setLocationCandidates] = useState<LocationCandidate[]>([])
  const [choosePlaceOpen, setChoosePlaceOpen] = useState(false)
  const [chooseExpansionOpen, setChooseExpansionOpen] = useState(false)
  const [expansionPlan, setExpansionPlan] = useState<SearchExpansionPlan | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([])
  const [resolvingLocation, setResolvingLocation] = useState(false)
  const [searchDepth, setSearchDepth] = useState("20")
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

  const selectedCategories =
    expansionPlan?.business_categories.filter((category) => selectedCategoryIds.includes(category.id)) || []
  const selectedAreas = expansionPlan?.area_tags.filter((area) => selectedAreaIds.includes(area.id)) || []
  const selectedVariantEstimate = 1 + selectedCategories.length * Math.max(1, selectedAreas.length)
  const maxSearchVariants = Math.min(selectedVariantEstimate, 6)
  const estimatedTextSearchCalls = maxSearchVariants * Math.ceil(Number(searchDepth) / 20)

  const performSearch = async (searchLocation: string, expansions?: SearchExpansionSelection) => {
    if (!businessType || !searchLocation) return

    setIsSearching(true)
    setError(null)

    try {
      const leads = await searchLeads({
        business_type: businessType,
        location: searchLocation,
        radius: Number(radiusKm || 5) * 1000,
        max_results: Number(searchDepth),
        expansions,
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
        location: searchLocation,
        leads,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Search failed. Please try again.")
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  const prepareExpansionChoices = async (searchLocation: string) => {
    setIsGeneratingExpansions(true)
    setError(null)

    try {
      const plan = await generateSearchExpansionPlan(businessType, searchLocation)
      setExpansionPlan(plan)
      setSelectedCategoryIds([])
      setSelectedAreaIds([])
      setChooseExpansionOpen(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to expand the search.")
    } finally {
      setIsGeneratingExpansions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessType || !location) return

    if (confirmedLocation !== location) {
      setResolvingLocation(true)
      setError(null)

      try {
        const candidates = await getLocationCandidates(location)
        setLocationCandidates(candidates)

        if (candidates.length === 0) {
          setError("No matching Google places found. Try a more specific location.")
          return
        }

        setChoosePlaceOpen(true)
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to confirm location.")
      } finally {
        setResolvingLocation(false)
      }

      return
    }

    await prepareExpansionChoices(location)
  }

  const handleChoosePlace = async (candidate: LocationCandidate) => {
    setLocation(candidate.address)
    setConfirmedLocation(candidate.address)
    setChoosePlaceOpen(false)
    await prepareExpansionChoices(candidate.address)
  }

  const toggleCategory = (category: BusinessCategoryExpansion) => {
    setSelectedCategoryIds((current) =>
      current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id],
    )
  }

  const toggleArea = (area: AreaTagExpansion) => {
    setSelectedAreaIds((current) =>
      current.includes(area.id) ? current.filter((id) => id !== area.id) : [...current, area.id],
    )
  }

  const handleSearchWithExpansions = async () => {
    if (!confirmedLocation && !location) return

    setChooseExpansionOpen(false)
    await performSearch(confirmedLocation || location, {
      business_categories: selectedCategories.map((category) => ({
        label: category.label,
        search_term: category.search_term,
        google_place_type: category.google_place_type,
      })),
      area_tags: selectedAreas.map((area) => ({
        label: area.label,
        search_term: area.search_term,
      })),
    })
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
                  placeholder="e.g., KLCC, Kuala Lumpur"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    setConfirmedLocation("")
                  }}
                  required
                  className="h-12 text-base border-2 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  {confirmedLocation ? `Using Google location: ${confirmedLocation}` : "We will confirm the best Google match before searching."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="search-depth">Search Depth</Label>
                <div id="search-depth" className="grid grid-cols-3 gap-2">
                  {searchDepthOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSearchDepth(option.value)}
                      className={`rounded-md border-2 px-3 py-2 text-left text-sm transition-colors ${
                        searchDepth === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:border-primary/60"
                      }`}
                    >
                      <span className="block font-semibold">{option.label}</span>
                      <span className="block text-xs opacity-80">{option.warning}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher depth can call extra Google result pages and up to {searchDepth} Place Details.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius-km">Search Radius (km)</Label>
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
                <select
                  id="min-rating"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="h-11 w-full rounded-md border-2 border-input bg-background px-3 text-sm"
                >
                  <option value="">Any</option>
                  {ratingOptions.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-rating">Max Rating</Label>
                <select
                  id="max-rating"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  className="h-11 w-full rounded-md border-2 border-input bg-background px-3 text-sm"
                >
                  <option value="">Any</option>
                  {ratingOptions.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
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
              disabled={isSearching || resolvingLocation || isGeneratingExpansions}
              size="lg"
              className="w-full md:w-auto px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {isSearching || resolvingLocation || isGeneratingExpansions ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {resolvingLocation
                    ? "Confirming location..."
                    : isGeneratingExpansions
                      ? "Preparing expansion..."
                      : "Searching leads..."}
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

      <Dialog open={choosePlaceOpen} onOpenChange={setChoosePlaceOpen}>
        <DialogContent className="max-w-3xl gap-0 p-0">
          <DialogHeader className="border-b border-border p-6">
            <DialogTitle className="text-3xl">Choose Place</DialogTitle>
            <DialogDescription className="text-lg">{location}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto">
            {locationCandidates.map((candidate) => (
              <button
                key={candidate.place_id}
                type="button"
                onClick={() => handleChoosePlace(candidate)}
                className="block w-full border-b border-border p-6 text-left transition-colors hover:bg-accent/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-foreground">{candidate.name}</div>
                    <p className="text-lg leading-relaxed text-muted-foreground">{candidate.address}</p>
                    <div className="font-semibold text-primary">✓ Select this match</div>
                  </div>
                  <div className="rounded-lg bg-primary px-4 py-2 text-lg font-bold text-primary-foreground">
                    {candidate.confidence}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={chooseExpansionOpen} onOpenChange={setChooseExpansionOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Brain className="h-6 w-6 text-primary" />
              Expand Search
            </DialogTitle>
            <DialogDescription>
              Base search stays included: {businessType} in {confirmedLocation || location}
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[60vh] gap-6 overflow-y-auto md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground">Business Categories</h3>
                <p className="text-sm text-muted-foreground">Google Places tags selected by AI</p>
              </div>

              <div className="space-y-2">
                {expansionPlan?.business_categories.map((category) => (
                  <label
                    key={category.id}
                    htmlFor={category.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-accent/60"
                  >
                    <input
                      id={category.id}
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{category.label}</span>
                      <span className="block text-xs text-primary">{category.google_place_type}</span>
                      <span className="block text-sm text-muted-foreground">{category.rationale}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground">Nearby Areas</h3>
                <p className="text-sm text-muted-foreground">Optional location tags to diversify results</p>
              </div>

              <div className="space-y-2">
                {expansionPlan?.area_tags.map((area) => (
                  <label
                    key={area.id}
                    htmlFor={area.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-accent/60"
                  >
                    <input
                      id={area.id}
                      type="checkbox"
                      checked={selectedAreaIds.includes(area.id)}
                      onChange={() => toggleArea(area)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{area.label}</span>
                      <span className="block text-sm text-muted-foreground">{area.rationale}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Estimate: up to {estimatedTextSearchCalls} Google Text Search call
            {estimatedTextSearchCalls === 1 ? "" : "s"} plus up to {searchDepth} Place Details calls.
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setChooseExpansionOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSearchWithExpansions} disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Selected
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
