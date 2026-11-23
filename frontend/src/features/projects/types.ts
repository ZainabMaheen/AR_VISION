/** A customer's project: a named group of saved visualisations (e.g. "Kitchen"). */
export interface Project {
  id: string
  name: string
  notes: string
  /** Saved visualisation ids, newest added first. */
  scanIds: string[]
  createdAt: number
  updatedAt: number
}
