import type { Material } from '../types/stone'

const u = (id: string, w: number, q: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`

const mat = (
  name: string,
  category: Material['category'],
  tone: string,
  finish: string,
  id: string,
): Material => ({ name, category, tone, finish, image: u(id, 700, 80), thumb: u(id, 150, 75) })

export const MATERIALS: Material[] = [
  mat('Carrara Vein', 'marble', 'Ivory tone', 'Honed', '1600210492486-724fe5c67fb0'),
  mat('Nero Marquina', 'marble', 'Charcoal tone', 'Polished', '1618221195710-dd6b41faaea6'),
  mat('Alpine Mist', 'granite', 'Grey tone', 'Leathered', '1600607687920-4e2a09cf159d'),
  mat('Sandstone Beige', 'tiles', 'Sand tone', 'Matte', '1600607687939-ce8a6c25118c'),
  mat('Warm Travertine', 'tiles', 'Warm beige', 'Natural', '1600566753086-00f18fb6b3ea'),
  mat('Silver Cloud', 'granite', 'Silver grey', 'Polished', '1600607687920-4e2a09cf159d'),
]

export const ROOM_IMAGE = u('1600210492486-724fe5c67fb0', 1400, 85)
export const HERO_IMAGE = u('1600210492486-724fe5c67fb0', 1800, 85)

export const PALETTE = [
  { value: '#e4d8c5', label: 'Ivory' },
  { value: '#aaa69e', label: 'Grey' },
  { value: '#494641', label: 'Charcoal' },
  { value: '#c4a77f', label: 'Sand' },
]

export const PROJECTS = [
  { img: u('1600607687939-ce8a6c25118c', 900, 85), alt: 'Kitchen renovation', tag: 'CARRARA VEIN', title: 'Kitchen Renovation', updated: 'Updated 2 hours ago' },
  { img: u('1600210491892-03d54c0aaf87', 900, 85), alt: 'Living room project', tag: 'NERO MARQUINA', title: 'Living Room', updated: 'Updated yesterday' },
  { img: u('1600607687920-4e2a09cf159d', 900, 85), alt: 'Bathroom renovation', tag: 'ALPINE MIST', title: 'Primary Bath', updated: 'Updated 3 days ago' },
]

export const ACTIVITY = [
  { icon: 'camera', title: 'Room scan completed', meta: 'Kitchen · 2 hours ago' },
  { icon: 'heart', title: 'Material added to favourites', meta: 'Carrara Vein · Yesterday' },
  { icon: 'layers', title: 'Comparison created', meta: '3 materials · Yesterday', id: 'compare' },
  { icon: 'layout-grid', title: 'Project updated', meta: 'Living Room · 2 days ago' },
] as const