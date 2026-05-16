"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileText, Plus, Edit, Trash2, CheckCircle, Loader2, User, Wand2 } from "lucide-react"
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  setActiveProfile,
  type Profile,
} from "@/app/actions/profiles"
import { digestKnowledgeBase } from "@/app/actions/knowledge-base"
import { useToast } from "@/hooks/use-toast"

export function ProfileManager() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({ name: "", knowledge_base: "" })
  const [submitting, setSubmitting] = useState(false)
  const [digesting, setDigesting] = useState(false)
  const [sourceFiles, setSourceFiles] = useState<File[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadProfiles = async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const data = await getProfiles()
      setProfiles(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load profiles")
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const handleOpenDialog = (profile?: Profile) => {
    if (profile) {
      setEditingProfile(profile)
      setFormData({ name: profile.name, knowledge_base: profile.knowledge_base })
    } else {
      setEditingProfile(null)
      setFormData({ name: "", knowledge_base: "" })
    }
    setSourceFiles([])
    setDialogOpen(true)
  }

  const handleDigestKnowledgeBase = async () => {
    if (!formData.knowledge_base.trim() && sourceFiles.length === 0) {
      toast({
        title: "Add source material first",
        description: "Paste notes or upload PDF, DOCX, Markdown, or TXT files.",
        variant: "destructive",
      })
      return
    }

    setDigesting(true)

    try {
      const digestFormData = new FormData()
      digestFormData.append("notes", formData.knowledge_base)
      sourceFiles.forEach((file) => digestFormData.append("files", file))

      const digest = await digestKnowledgeBase(digestFormData)
      setFormData((current) => ({ ...current, knowledge_base: digest }))
      toast({ title: "Knowledge base digested into Markdown" })
    } catch (error) {
      toast({
        title: "Digest failed",
        description: error instanceof Error ? error.message : "Failed to digest source material",
        variant: "destructive",
      })
    } finally {
      setDigesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingProfile) {
        await updateProfile(editingProfile.id, formData.name, formData.knowledge_base)
        toast({ title: "Profile updated successfully" })
      } else {
        await createProfile(formData.name, formData.knowledge_base)
        toast({ title: "Profile created successfully" })
      }
      await loadProfiles()
      setDialogOpen(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this profile?")) return

    try {
      await deleteProfile(id)
      toast({ title: "Profile deleted successfully" })
      await loadProfiles()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete profile", variant: "destructive" })
    }
  }

  const handleSetActive = async (id: number) => {
    try {
      await setActiveProfile(id)
      toast({ title: "Active profile updated" })
      await loadProfiles()
    } catch (error) {
      toast({ title: "Error", description: "Failed to set active profile", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Profile Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage company profiles for battle card generation
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Profile
        </Button>
      </div>

      <div className="grid gap-4">
        {loadError && (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="flex items-start gap-3 py-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{loadError}. Check your Supabase URL, service role key, and profiles table.</span>
            </CardContent>
          </Card>
        )}

        {profiles.map((profile) => (
          <Card
            key={profile.id}
            className={`transition-all ${profile.is_active ? "border-primary border-2 shadow-lg" : ""}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {profile.name}
                    {profile.is_active && (
                      <Badge variant="default" className="ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Updated {new Date(profile.updated_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!profile.is_active && (
                    <Button variant="outline" size="sm" onClick={() => handleSetActive(profile.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(profile)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(profile.id)}
                    disabled={profile.is_active}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{profile.knowledge_base}</p>
            </CardContent>
          </Card>
        ))}

        {profiles.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No profiles yet. Create your first profile to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProfile ? "Edit Profile" : "Create New Profile"}</DialogTitle>
            <DialogDescription>
              Add your company information to generate tailored battle cards based on your specific offerings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name</Label>
              <Input
                id="name"
                placeholder="e.g., My Company, Product Line A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="knowledge_base">Company Knowledge Base</Label>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <Label htmlFor="knowledge-files" className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-primary" />
                  Upload Sources
                </Label>
                <Input
                  id="knowledge-files"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.md,.txt,text/markdown,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setSourceFiles(Array.from(event.target.files || []))}
                  className="mt-3 h-auto py-2"
                />
                {sourceFiles.length > 0 && (
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {sourceFiles.map((file) => (
                      <div key={`${file.name}-${file.size}`}>{file.name}</div>
                    ))}
                  </div>
                )}
              </div>
              <Textarea
                id="knowledge_base"
                placeholder="Paste notes or existing Markdown here. You can also upload PDF, DOCX, Markdown, or TXT files, then click Digest to Markdown."
                value={formData.knowledge_base}
                onChange={(e) => setFormData({ ...formData, knowledge_base: e.target.value })}
                required
                rows={12}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                The digest turns uploaded files and notes into a compact Markdown profile used by battle-card AI.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleDigestKnowledgeBase}
                disabled={digesting || submitting}
              >
                {digesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Digesting...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Digest to Markdown
                  </>
                )}
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingProfile ? (
                  "Update Profile"
                ) : (
                  "Create Profile"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
