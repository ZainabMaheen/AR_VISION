import type { Material, MaterialCategory } from '../../types/stone'

export type Availability = 'in-stock' | 'made-to-order' | 'out-of-stock'

/** A material as the shop manages it. Extends the customer-facing Material. */
export interface CatalogueMaterial extends Material {
  id: string
  /** Price per square foot, in pounds (£). null when the shop hides prices from customers. */
  price: number | null
  description: string
  availability: Availability
  /** Hidden materials never appear for customers. */
  hidden: boolean
  /** True for materials the shop added (not part of the starting samples). */
  custom: boolean
  updatedAt: number
}

/** What the shop fills in on the add / edit form. */
export interface MaterialInput {
  name: string
  category: MaterialCategory
  finish: string
  tone: string
  price: number
  description: string
  availability: Availability
  /** https:// image link; empty = generated sample texture. */
  image: string
  hidden: boolean
}
