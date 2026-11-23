import { useEffect, useMemo } from 'react'
import { useProjectsStore } from '../store'
import { useAuthStore } from '../../auth/store'
import { useScans } from '../../scans/hooks/useScans'
import type { SavedScan } from '../../scans/types'
import type { Project } from '../types'

/** Load the signed-in user's projects (again after signing in or out). */
function useLoadProjects() {
  const userId = useAuthStore((s) => s.user?.id)
  useEffect(() => {
    void useProjectsStore.getState().load()
  }, [userId])
}

/** All projects, most recently updated first. */
export function useProjects(): Project[] {
  useLoadProjects()
  const projects = useProjectsStore((s) => s.projects)
  return useMemo(() => [...projects].sort((a, b) => b.updatedAt - a.updatedAt), [projects])
}

/** One project plus its saved visualisations (ids that no longer exist are skipped). */
export function useProject(id: string | undefined) {
  useLoadProjects()
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === id))
  const projectsLoading = useProjectsStore((s) => s.status === 'idle' || s.status === 'loading')
  const { scans, loading: scansLoading } = useScans()
  const loading = scansLoading || projectsLoading

  const projectScans = useMemo(() => {
    if (!project) return []
    const byId = new Map(scans.map((s) => [s.id, s]))
    return project.scanIds.map((sid) => byId.get(sid)).filter((s): s is SavedScan => s !== undefined)
  }, [project, scans])

  return { project, scans: projectScans, allScans: scans, loading }
}
