/**
 * Tiny typed fetch wrapper for the Flask API.
 * Success responses look like {"data": ...}; failures like {"error": "message"}.
 * The signed-in user's token is sent on every call; a 401 signs them out.
 */
import { useAuthStore } from '../features/auth/store'

export const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api').replace(/\/+$/, '')

const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin
  } catch {
    return ''
  }
})()

export const NETWORK_ERROR = "Can't reach the server. Is the backend running?"

export class ApiError extends Error {
  readonly status: number
  /** True when the server could not be reached at all. */
  readonly network: boolean

  constructor(message: string, status: number, network = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.network = network
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Sent as JSON. */
  json?: unknown
  /** Sent as multipart/form-data. */
  form?: FormData
  query?: Query
  signal?: AbortSignal
  /** Do not send the token (sign-in / register). */
  skipAuth?: boolean
}

export const SESSION_EXPIRED = 'Your session has expired. Please sign in again.'

/** Sign out and go to the login page, coming back here afterwards. */
function handleUnauthorized(message: string) {
  useAuthStore.getState().signOut(message || SESSION_EXPIRED)
  const { pathname, search } = window.location
  if (pathname !== '/login') {
    window.location.assign(`/login?next=${encodeURIComponent(pathname + search)}`)
  }
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

/** Call the API and return the unwrapped `data`. Throws ApiError with a readable message. */
export async function apiRequest<T>(path: string, { method = 'GET', json, form, query, signal, skipAuth = false }: RequestOptions = {}): Promise<T> {
  const token = skipAuth ? null : useAuthStore.getState().token
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (json !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers,
      body: json !== undefined ? JSON.stringify(json) : form,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError(NETWORK_ERROR, 0, true)
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    const message =
      isRecord(body) && typeof body.error === 'string'
        ? body.error
        : res.status >= 500
          ? 'The server had a problem. Please try again.'
          : `Request failed (${res.status}).`
    // The token was refused (expired, or the account is gone): sign out and ask to sign in again
    if (res.status === 401 && token) handleUnauthorized(message)
    throw new ApiError(message, res.status)
  }
  if (!isRecord(body) || !('data' in body)) {
    throw new ApiError('The server sent an unexpected response.', res.status)
  }
  return body.data as T
}

/** Readable message from anything thrown by apiRequest (or other code). */
export const errorMessage = (e: unknown, fallback = 'Something went wrong. Please try again.') =>
  e instanceof Error && e.message ? e.message : fallback

/** Uploaded files come back as "/api/uploads/..."; make them absolute for <img src>. */
export const assetUrl = (url: string | null | undefined): string => {
  if (!url) return ''
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url
}
