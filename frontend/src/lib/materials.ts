import { findVisibleMaterial } from '../features/catalogue/store'
import type { Material } from '../types/stone'

export const findMaterial = (name: string | null | undefined): Material | undefined =>
  name ? findVisibleMaterial(name) : undefined

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)