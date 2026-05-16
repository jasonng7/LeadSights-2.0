import { SearchForm } from "@/components/search-form"
import { ProfileSelector } from "@/components/profile-selector"
import { Radar, TrendingUp, Zap, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <header className="border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Radar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground text-balance">LeadSights 2.0</h1>
                <p className="text-muted-foreground mt-0.5">AI-powered local lead intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProfileSelector />
              <Link href="/profiles">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Profiles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Find, Score, and Prioritize Local Leads
          </h2>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Search Google Maps, filter fit, score opportunity, and generate OpenAI-powered sales battle cards
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-3">
                <Radar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Filtered Search</h3>
              <p className="text-sm text-muted-foreground">Find businesses by distance, rating, reviews, and status</p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-secondary/20 mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Lead Scoring</h3>
              <p className="text-sm text-muted-foreground">Rank prospects using fit, urgency, and contact signals</p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-3/10 mx-auto mb-3">
                <Zap className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Battle Cards</h3>
              <p className="text-sm text-muted-foreground">Generate OpenAI-powered sales angles and objections</p>
            </div>
          </div>
        </div>

        <main className="animate-fade-in">
          <SearchForm />
        </main>
      </div>
    </div>
  )
}
