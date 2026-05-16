"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, CheckCircle, ChevronDown } from "lucide-react"
import { getProfiles, setActiveProfile, type Profile } from "@/app/actions/profiles"
import { useToast } from "@/hooks/use-toast"

export function ProfileSelector() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null)
  const { toast } = useToast()

  const loadProfiles = async () => {
    const data = await getProfiles()
    setProfiles(data)
    const active = data.find((p) => p.is_active) || null
    setActiveProfileState(active)
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const handleSelectProfile = async (id: number) => {
    try {
      await setActiveProfile(id)
      await loadProfiles()
      toast({ title: "Profile switched successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to switch profile", variant: "destructive" })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <User className="h-4 w-4" />
          {activeProfile ? activeProfile.name : "No Profile"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Active Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => (
          <DropdownMenuItem key={profile.id} onClick={() => handleSelectProfile(profile.id)} className="cursor-pointer">
            <div className="flex items-center justify-between w-full">
              <span>{profile.name}</span>
              {profile.is_active && <CheckCircle className="h-4 w-4 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
        {profiles.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No profiles available</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
