import type { ApiProject } from '../../services/endpoints'
import type { Project } from './types'

/** API project -> frontend project. */
export function toProject(p: ApiProject): Project {
  return {
    id: String(p.id),
    name: p.name,
    notes: p.notes,
    scanIds: p.scanIds.map(String),
    createdAt: Date.parse(p.createdAt) || Date.now(),
    updatedAt: Date.parse(p.updatedAt) || Date.now(),
  }
}
