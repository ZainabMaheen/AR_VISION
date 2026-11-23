/**
 * Every backend endpoint the frontend uses, with the API's own (camelCase) shapes.
 * Conversion to frontend types happens in each feature's api.ts.
 */
import { apiRequest } from './apiClient'

/* ---------- API shapes ---------- */

export type ApiAvailability = 'in_stock' | 'made_to_order' | 'out_of_stock'
export type ApiCategory = 'marble' | 'granite' | 'tiles'

export interface ApiMaterial {
  id: number
  name: string
  category: ApiCategory
  /** null when the shop hides prices from customers */
  pricePerSqFt: number | null
  availability: ApiAvailability
  finish: string
  tone: string
  description: string
  imageUrl: string
  visible: boolean
  createdAt: string
  updatedAt: string
}

export type ApiMaterialBody = Omit<ApiMaterial, 'id' | 'createdAt' | 'updatedAt'>

export interface ApiShop {
  shopName: string
  logoUrl: string
  email: string
  phone: string
  address: string
  showPrices: boolean
  updatedAt?: string
}

export type ApiEnquiryStatus = 'new' | 'quoted' | 'confirmed' | 'delivered'

export interface ApiScan {
  id: number
  name: string
  materialId: number | null
  materialName: string
  corners: { x: number; y: number }[]
  tilesX: number
  tilesY: number
  light: number
  roomImageUrl: string
  thumbnailUrl: string
  createdAt: string
  updatedAt: string
}

export interface ApiProject {
  id: number
  name: string
  notes: string
  scanIds: number[]
  scanCount: number
  coverUrl: string | null
  /** Only on the single-project endpoints */
  scans?: ApiScan[]
  createdAt: string
  updatedAt: string
}

export interface ApiEnquiryItem {
  id: number
  materialName: string
  areaSqFt: number
  wastagePct: number
  orderSqFt: number
  pricePerSqFtAtRequest: number | null
}

export interface ApiEnquiry {
  id: number
  reference: string
  status: ApiEnquiryStatus
  customer: { name: string; email: string; phone: string; address: string; postcode: string }
  notes: string
  /** Not sent back to customers */
  staffNote?: string
  items: ApiEnquiryItem[]
  scanIds: number[]
  /** Only on the single-enquiry endpoint */
  scans?: ApiScan[]
  createdAt: string
  updatedAt: string
}

export interface ApiEnquiryBody {
  customer: { name: string; email: string; phone: string; address: string; postcode: string }
  notes: string
  items: { materialName: string; areaSqFt: number; wastagePct: number }[]
  scanIds: number[]
}

/* ---------- endpoints ---------- */

export const healthApi = {
  check: () => apiRequest<{ status: string; database: string }>('/health'),
}

export const materialsApi = {
  /** includeHidden = staff view (also always returns prices); needs a business account. */
  list: (includeHidden: boolean) => apiRequest<ApiMaterial[]>('/materials', { query: { include_hidden: includeHidden || undefined } }),
  create: (body: ApiMaterialBody) => apiRequest<ApiMaterial>('/materials', { method: 'POST', json: body }),
  update: (id: string | number, body: Partial<ApiMaterialBody>) =>
    apiRequest<ApiMaterial>(`/materials/${id}`, { method: 'PATCH', json: body }),
  remove: (id: string | number) => apiRequest<{ id: number; deleted: boolean }>(`/materials/${id}`, { method: 'DELETE' }),
  restoreSamples: () => apiRequest<{ added: number; total: number }>('/materials/restore-samples', { method: 'POST' }),
}

export const shopApi = {
  get: () => apiRequest<ApiShop>('/shop'),
  update: (body: Omit<ApiShop, 'updatedAt'>) => apiRequest<ApiShop>('/shop', { method: 'PUT', json: body }),
}

/** Saved visualisations of the signed-in user. */
export const scansApi = {
  list: () => apiRequest<ApiScan[]>('/scans'),
  get: (id: string | number) => apiRequest<ApiScan>(`/scans/${id}`),
  /** multipart: room, thumbnail, name, materialName, corners (JSON), tilesX, tilesY, light */
  upload: (form: FormData) => apiRequest<ApiScan>('/scans', { method: 'POST', form }),
  rename: (id: string | number, name: string) => apiRequest<ApiScan>(`/scans/${id}`, { method: 'PATCH', json: { name } }),
  remove: (id: string | number) => apiRequest<{ id: number; deleted: boolean }>(`/scans/${id}`, { method: 'DELETE' }),
}

/** Projects of the signed-in user. */
export const projectsApi = {
  list: () => apiRequest<ApiProject[]>('/projects'),
  create: (body: { name: string; notes: string }) => apiRequest<ApiProject>('/projects', { method: 'POST', json: body }),
  update: (id: string | number, body: { name?: string; notes?: string }) =>
    apiRequest<ApiProject>(`/projects/${id}`, { method: 'PATCH', json: body }),
  remove: (id: string | number) => apiRequest<{ id: number; deleted: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  addScans: (id: string | number, scanIds: number[]) =>
    apiRequest<ApiProject>(`/projects/${id}/scans`, { method: 'POST', json: { scanIds } }),
  removeScan: (id: string | number, scanId: string | number) =>
    apiRequest<ApiProject>(`/projects/${id}/scans/${scanId}`, { method: 'DELETE' }),
}

export const enquiriesApi = {
  create: (body: ApiEnquiryBody) => apiRequest<ApiEnquiry>('/enquiries', { method: 'POST', json: body }),
  list: (params: { status?: ApiEnquiryStatus; q?: string } = {}) => apiRequest<ApiEnquiry[]>('/enquiries', { query: params }),
  get: (id: string | number) => apiRequest<ApiEnquiry>(`/enquiries/${id}`),
  update: (id: string | number, body: { status?: ApiEnquiryStatus; staffNote?: string }) =>
    apiRequest<ApiEnquiry>(`/enquiries/${id}`, { method: 'PATCH', json: body }),
}
