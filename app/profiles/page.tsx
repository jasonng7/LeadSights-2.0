import { ProfileManager } from "@/components/profile-manager"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Radar } from "lucide-react"
import Link from "next/link"

export default function ProfilesPage() {
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
                <p className="text-muted-foreground mt-0.5">Profile Management</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <ProfileManager />
      </div>
    </div>
  )
}
