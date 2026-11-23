import { assetUrl } from '../../services/apiClient'
import { scansApi, type ApiScan } from '../../services/endpoints'
import type { Quad } from '../ar/utils/homography'
import { deleteScan as deleteLocalScan, getAllScans as getLocalScans, isIndexedDbAvailable } from './db'
import type { NewScan, SavedScan } from './types'

/** API scan -> frontend saved visualisation. */
export function toSavedScan(s: ApiScan): SavedScan {
  return {
    id: String(s.id),
    name: s.name,
    materialName: s.materialName,
    photo: assetUrl(s.roomImageUrl),
    thumbnail: assetUrl(s.thumbnailUrl),
    corners: s.corners as Quad,
    tilesX: s.tilesX,
    tilesY: s.tilesY,
    lighting: s.light,
    createdAt: Date.parse(s.createdAt) || Date.now(),
  }
}

async function toBlob(src: string): Promise<Blob> {
  // data: URLs (our own photos) and https images that allow CORS (the sample room)
  const res = await fetch(src)
  if (!res.ok) throw new Error('image not available')
  return res.blob()
}

/** Upload a visualisation for the signed-in user (POST /scans). Throws an Error with a readable message. */
export async function uploadScan(input: NewScan): Promise<SavedScan> {
  let room: Blob
  let thumb: Blob
  try {
    ;[room, thumb] = await Promise.all([toBlob(input.photo), toBlob(input.thumbnail)])
  } catch {
    throw new Error('The room photo could not be read. Please add the photo again and try once more.')
  }
  const form = new FormData()
  form.append('room', room, 'room.jpg')
  form.append('thumbnail', thumb, 'thumbnail.jpg')
  form.append('name', input.name)
  form.append('materialName', input.materialName)
  form.append('corners', JSON.stringify(input.corners))
  form.append('tilesX', String(input.tilesX))
  form.append('tilesY', String(input.tilesY))
  form.append('light', String(input.lighting))
  return toSavedScan(await scansApi.upload(form))
}

/* ---------- one-time import of visualisations saved in this browser before accounts ---------- */

/** How many visualisations are still stored only in this browser (IndexedDB). */
export async function countLocalScans(): Promise<number> {
  if (!isIndexedDbAvailable()) return 0
  try {
    return (await getLocalScans()).length
  } catch {
    return 0
  }
}

/** Upload every local visualisation to the account; each one is removed locally once uploaded. */
export async function importLocalScans(onProgress?: (done: number, total: number) => void) {
  const local = await getLocalScans()
  let imported = 0
  const failed: string[] = []
  for (let i = 0; i < local.length; i++) {
    onProgress?.(i, local.length)
    const s = local[i]
    try {
      await uploadScan(s)
      await deleteLocalScan(s.id)
      imported++
    } catch {
      failed.push(s.name)
    }
  }
  onProgress?.(local.length, local.length)
  return { imported, failed }
}
