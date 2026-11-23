import type { Quad } from '../ar/utils/homography'

/** A saved AR visualisation (stored in the browser, IndexedDB). */
export interface SavedScan {
  id: string
  name: string
  materialName: string
  /** Room photo: JPEG data URL (max 1280px), or the remote sample-room URL. */
  photo: string
  /** ~400px JPEG of the finished preview (photo + stone), for lists. */
  thumbnail: string
  /** Surface corners as 0–1 fractions of the photo, clockwise from top-left. */
  corners: Quad
  tilesX: number
  tilesY: number
  /** 0–100 */
  lighting: number
  createdAt: number
}

export type NewScan = Omit<SavedScan, 'id' | 'createdAt'>
