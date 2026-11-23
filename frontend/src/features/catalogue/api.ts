import { assetUrl } from '../../services/apiClient'
import type { ApiAvailability, ApiMaterial, ApiMaterialBody } from '../../services/endpoints'
import { getStoneTextureUrl } from '../ar/utils/stoneTexture'
import type { Availability, CatalogueMaterial, MaterialInput } from './types'

/**
 * THE one availability mapping between backend and frontend:
 * in_stock <-> in-stock, made_to_order <-> made-to-order, out_of_stock <-> out-of-stock.
 */
export function mapAvailability(value: ApiAvailability): Availability
export function mapAvailability(value: Availability): ApiAvailability
export function mapAvailability(value: ApiAvailability | Availability): Availability | ApiAvailability {
  return (value.includes('_') ? value.replace(/_/g, '-') : value.replace(/-/g, '_')) as Availability | ApiAvailability
}

/** API material -> frontend material. */
export function toCatalogueMaterial(m: ApiMaterial): CatalogueMaterial {
  // No image: fall back to the generated sample texture so cards never show a broken image
  const image = assetUrl(m.imageUrl) || getStoneTextureUrl(m.name) || ''
  return {
    id: String(m.id),
    name: m.name,
    category: m.category,
    tone: m.tone || '—',
    finish: m.finish || 'Natural',
    image,
    thumb: image,
    price: m.pricePerSqFt,
    description: m.description,
    availability: mapAvailability(m.availability),
    hidden: !m.visible,
    custom: false,
    updatedAt: Date.parse(m.updatedAt) || Date.now(),
  }
}

/** Only real links are sent; generated textures (data: URLs) stay on this device. */
const sendableImage = (image: string) => (/^https?:\/\//i.test(image) || image.startsWith('/api/uploads/') ? image : '')

/** Frontend form input -> API body (full or partial). */
export function toApiMaterialBody(input: Partial<MaterialInput>): Partial<ApiMaterialBody> {
  const body: Partial<ApiMaterialBody> = {}
  if (input.name !== undefined) body.name = input.name
  if (input.category !== undefined) body.category = input.category
  if (input.price !== undefined) body.pricePerSqFt = input.price
  if (input.availability !== undefined) body.availability = mapAvailability(input.availability)
  if (input.finish !== undefined) body.finish = input.finish
  if (input.tone !== undefined) body.tone = input.tone
  if (input.description !== undefined) body.description = input.description
  if (input.image !== undefined) body.imageUrl = sendableImage(input.image.trim())
  if (input.hidden !== undefined) body.visible = !input.hidden
  return body
}
