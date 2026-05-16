"use server"

import { createSupabaseAdminClient } from "@/lib/supabase"

export interface Profile {
  id: number
  name: string
  knowledge_base: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getProfiles(): Promise<Profile[]> {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("profiles")
      .select("*")
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Profile[]
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return []
  }
}

export async function getActiveProfile(): Promise<Profile | null> {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data as Profile | null
  } catch (error) {
    console.error("Error fetching active profile:", error)
    return null
  }
}

export async function createProfile(name: string, knowledge_base: string): Promise<Profile> {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("profiles")
      .insert({ name, knowledge_base, is_active: false })
      .select("*")
      .single()

    if (error) throw error
    return data as Profile
  } catch (error) {
    console.error("Error creating profile:", error)
    throw new Error("Failed to create profile")
  }
}

export async function updateProfile(id: number, name: string, knowledge_base: string): Promise<Profile> {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("profiles")
      .update({ name, knowledge_base, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error
    return data as Profile
  } catch (error) {
    console.error("Error updating profile:", error)
    throw new Error("Failed to update profile")
  }
}

export async function deleteProfile(id: number): Promise<void> {
  try {
    const { error } = await createSupabaseAdminClient().from("profiles").delete().eq("id", id)
    if (error) throw error
  } catch (error) {
    console.error("Error deleting profile:", error)
    throw new Error("Failed to delete profile")
  }
}

export async function setActiveProfile(id: number): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient()
    const deactivate = await supabase.from("profiles").update({ is_active: false }).neq("id", -1)

    if (deactivate.error) throw deactivate.error

    const activate = await supabase.from("profiles").update({ is_active: true }).eq("id", id)
    if (activate.error) throw activate.error
  } catch (error) {
    console.error("Error setting active profile:", error)
    throw new Error("Failed to set active profile")
  }
}
