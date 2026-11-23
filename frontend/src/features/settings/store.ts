import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AreaUnit = 'sqft' | 'sqm'

export interface Profile {
  fullName: string
  email: string
  phone: string
}

export interface Workspace {
  name: string
  city: string
}

export interface Preferences {
  units: AreaUnit
  /** Default extra material for cuts and breakages, in %. */
  wastage: number
}

interface SettingsState {
  profile: Profile
  workspace: Workspace
  preferences: Preferences
  saveProfile: (p: Profile) => void
  saveWorkspace: (w: Workspace) => void
  savePreferences: (p: Preferences) => void
}

// Same placeholders the sidebar and top bar showed before settings existed
export const DEFAULT_PROFILE: Profile = { fullName: 'Jordan Davis', email: 'jordan@atelier.co', phone: '' }
export const DEFAULT_WORKSPACE: Workspace = { name: 'Atelier Studio', city: '' }
export const DEFAULT_PREFERENCES: Preferences = { units: 'sqft', wastage: 10 }

/** Saved in this browser only (localStorage). TODO Phase 6B: store per user via the API after login. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      workspace: DEFAULT_WORKSPACE,
      preferences: DEFAULT_PREFERENCES,
      saveProfile: (profile) => set({ profile: { ...profile, fullName: profile.fullName.trim(), email: profile.email.trim(), phone: profile.phone.trim() } }),
      saveWorkspace: (workspace) => set({ workspace: { name: workspace.name.trim(), city: workspace.city.trim() } }),
      savePreferences: (preferences) => set({ preferences }),
    }),
    { name: 'ar-vision-settings' },
  ),
)

/** "Jordan Davis" -> "JD" */
export function initials(name: string, fallback = '?'): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase() || fallback
}

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
