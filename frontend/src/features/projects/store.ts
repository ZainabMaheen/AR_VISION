import { create } from 'zustand'
import { errorMessage } from '../../services/apiClient'
import { projectsApi } from '../../services/endpoints'
import { useAuthStore } from '../auth/store'
import { toProject } from './api'
import type { Project } from './types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface ProjectsState {
  /** The signed-in user's projects (empty for guests). */
  projects: Project[]
  status: Status
  error: string | null
  load: (opts?: { force?: boolean }) => Promise<void>
  /** All changes go to the server and throw an Error with a readable message on failure. */
  create: (name: string, notes?: string) => Promise<Project>
  update: (id: string, changes: { name?: string; notes?: string }) => Promise<void>
  remove: (id: string) => Promise<void>
  addScans: (id: string, scanIds: string[]) => Promise<void>
  removeScan: (id: string, scanId: string) => Promise<void>
  /** Local only: called after a saved visualisation is deleted (the server already unlinked it). */
  detachScanEverywhere: (scanId: string) => void
  /** Local only: forget the loaded list (does not delete anything on the server). */
  clear: () => void
}

let inFlight: Promise<void> | null = null

/** Projects, stored on the server per user (/projects). */
export const useProjectsStore = create<ProjectsState>()((set, get) => {
  const replace = (p: Project) =>
    set((s) => ({ projects: s.projects.some((x) => x.id === p.id) ? s.projects.map((x) => (x.id === p.id ? p : x)) : [p, ...s.projects] }))

  return {
    projects: [],
    status: 'idle',
    error: null,

    load: (opts = {}) => {
      if (!useAuthStore.getState().user) {
        set({ projects: [], status: 'ready', error: null })
        return Promise.resolve()
      }
      if (get().status === 'ready' && !opts.force) return Promise.resolve()
      if (inFlight) return inFlight
      set({ status: 'loading', error: null })
      inFlight = projectsApi
        .list()
        .then((list) => {
          set({ projects: list.map(toProject), status: 'ready' })
        })
        .catch((e: unknown) => {
          set({ status: 'error', error: errorMessage(e, 'Projects could not be loaded.') })
        })
        .finally(() => {
          inFlight = null
        })
      return inFlight
    },

    create: async (name, notes = '') => {
      if (!useAuthStore.getState().user) throw new Error('Please sign in to create projects.')
      const p = toProject(await projectsApi.create({ name: name.trim() || 'Untitled project', notes: notes.trim() }))
      replace(p)
      return p
    },

    update: async (id, changes) => {
      replace(toProject(await projectsApi.update(id, changes)))
    },

    remove: async (id) => {
      await projectsApi.remove(id)
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
    },

    addScans: async (id, scanIds) => {
      replace(toProject(await projectsApi.addScans(id, scanIds.map(Number))))
    },

    removeScan: async (id, scanId) => {
      replace(toProject(await projectsApi.removeScan(id, scanId)))
    },

    detachScanEverywhere: (scanId) =>
      set((s) => ({
        projects: s.projects.map((p) => (p.scanIds.includes(scanId) ? { ...p, scanIds: p.scanIds.filter((x) => x !== scanId) } : p)),
      })),

    clear: () => set({ projects: [], status: 'idle', error: null }),
  }
})

// A different (or no) user signed in: forget the previous user's projects
useAuthStore.subscribe((s, prev) => {
  if (s.user?.id !== prev.user?.id) {
    inFlight = null
    useProjectsStore.setState({ projects: [], status: 'idle', error: null })
  }
})
