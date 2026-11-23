/**
 * Tiny IndexedDB wrapper (no dependency) for saved visualisations.
 * Photos are too big for localStorage (≈5 MB limit), IndexedDB allows far more.
 */
import type { SavedScan } from './types'

const DB_NAME = 'ar-vision'
const DB_VERSION = 1
const STORE = 'scans'

export class StorageFullError extends Error {
  constructor() {
    super('Your browser storage is full. Delete some saved visualisations and try again.')
    this.name = 'StorageFullError'
  }
}

export const isIndexedDbAvailable = () => typeof indexedDB !== 'undefined'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => {
      const db = req.result
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
    req.onerror = () => reject(req.error ?? new Error('Could not open the database'))
    req.onblocked = () => reject(new Error('The database is blocked by another tab'))
  })
  dbPromise.catch(() => {
    dbPromise = null // allow a retry later
  })
  return dbPromise
}

const isQuotaError = (e: unknown) =>
  e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')

/** Run one transaction and resolve when it has fully committed. */
async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDb()
  return new Promise<T | undefined>((resolve, reject) => {
    let result: T | undefined
    let tx: IDBTransaction
    try {
      tx = db.transaction(STORE, mode)
    } catch (e) {
      reject(e)
      return
    }
    const fail = (err: unknown) => reject(isQuotaError(err) ? new StorageFullError() : err)
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => fail(tx.error)
    tx.onabort = () => fail(tx.error)
    try {
      const req = work(tx.objectStore(STORE))
      if (req) req.onsuccess = () => (result = req.result)
    } catch (e) {
      fail(e)
    }
  })
}

export async function getAllScans(): Promise<SavedScan[]> {
  const all = await run<SavedScan[]>('readonly', (s) => s.getAll() as IDBRequest<SavedScan[]>)
  return (all ?? []).sort((a, b) => b.createdAt - a.createdAt)
}

export async function putScan(scan: SavedScan): Promise<void> {
  await run('readwrite', (s) => {
    s.put(scan)
  })
}

export async function deleteScan(id: string): Promise<void> {
  await run('readwrite', (s) => {
    s.delete(id)
  })
}

export async function clearScans(): Promise<void> {
  await run('readwrite', (s) => {
    s.clear()
  })
}
