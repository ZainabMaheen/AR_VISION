export type MaterialCategory = 'marble' | 'granite' | 'tiles'
export type CategoryFilter = 'all' | MaterialCategory

export interface Material {
  name: string
  category: MaterialCategory
  tone: string
  finish: string
  image: string // 700px detail image
  thumb: string // 150px swatch
}