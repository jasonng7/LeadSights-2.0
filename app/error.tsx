"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application render error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-lg border border-destructive/30 bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-6 w-6" />
          <h1 className="text-xl font-semibold">LeadSights could not load this page</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Check the Vercel environment variables for Supabase, OpenAI, and Google Maps, then try again.
        </p>
        {error.digest && (
          <p className="mt-3 rounded-md bg-muted p-3 text-xs text-muted-foreground">Error digest: {error.digest}</p>
        )}
        <Button type="button" onClick={reset} className="mt-5">
          Retry
        </Button>
      </div>
    </div>
  )
}
