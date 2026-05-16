"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { buildSafeFilename, downloadBlob } from "@/lib/download"
import type { Lead } from "@/lib/types"

interface ExportButtonProps {
  leads: Lead[]
  businessType: string
  location: string
}

export function ExportButton({ leads, businessType, location }: ExportButtonProps) {
  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Address",
      "Phone",
      "Website",
      "Lead Score",
      "Score Reasons",
      "Rating",
      "Total Reviews",
      "Business Status",
      "Distance Meters",
      "Latitude",
      "Longitude",
      "Google Maps URL",
    ]

    const rows = leads.map((lead) => [
      lead.name,
      lead.address,
      lead.phone_number || "",
      lead.website || "",
      lead.lead_score,
      lead.score_reasons.join("; "),
      lead.rating,
      lead.user_ratings_total,
      lead.business_status,
      lead.distance_meters || "",
      lead.latitude,
      lead.longitude,
      lead.google_maps_url,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell)
            if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    downloadBlob(blob, buildSafeFilename(["leads", businessType, location], "csv"))
  }

  const handleExportJSON = () => {
    const jsonData = {
      search: {
        business_type: businessType,
        location: location,
        total_leads: leads.length,
        exported_at: new Date().toISOString(),
      },
      leads: leads.map((lead) => ({
        place_id: lead.place_id,
        name: lead.name,
        address: lead.address,
        phone_number: lead.phone_number,
        website: lead.website,
        lead_score: lead.lead_score,
        score_reasons: lead.score_reasons,
        rating: lead.rating,
        user_ratings_total: lead.user_ratings_total,
        business_status: lead.business_status,
        distance_meters: lead.distance_meters,
        latitude: lead.latitude,
        longitude: lead.longitude,
        google_maps_url: lead.google_maps_url,
      })),
    }

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" })
    downloadBlob(blob, buildSafeFilename(["leads", businessType, location], "json"))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>Export as JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
