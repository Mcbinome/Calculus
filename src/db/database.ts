import { DEFAULT_SCHEMA, STORAGE_KEY } from '../data/defaults'
import type { CatalogFood, SchemaConfig } from '../types'
import catalogFile from '../data/foodCatalog.json'

const DB_NAME = 'calcul-insuline'
const DB_VERSION = 2

export const DEFAULT_ADMIN_PASSWORD = 'Trombose2026'
const PASSWORD_VERSION = 2
const FOODS_SEED_VERSION = 4

export interface AppSettings {
  adminPasswordHash: string
  passwordVersion?: number
  foodsSeedVersion?: number
  /** Afficher le catalogue étendu (~250 aliments CIQUAL) */
  catalogExtended?: boolean
}

type StoreName = 'settings' | 'schema' | 'kv' | 'foods'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings')
      }
      if (!db.objectStoreNames.contains('schema')) {
        db.createObjectStore('schema')
      }
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv')
      }
      if (!db.objectStoreNames.contains('foods')) {
        db.createObjectStore('foods', { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb()
  try {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const maybeReq = fn(store)
    const result =
      maybeReq instanceof IDBRequest ? await idbRequest(maybeReq) : undefined
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
    })
    return result
  } finally {
    db.close()
  }
}

export async function dbGet<T>(storeName: StoreName, key: string): Promise<T | undefined> {
  return (await withStore<T>(storeName, 'readonly', (store) => store.get(key))) as
    | T
    | undefined
}

export async function dbSet<T>(storeName: StoreName, key: string, value: T): Promise<void> {
  await withStore(storeName, 'readwrite', (store) => store.put(value, key))
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function isValidSchema(value: unknown): value is SchemaConfig {
  if (!value || typeof value !== 'object') return false
  const v = value as SchemaConfig
  return (
    typeof v.carbBase === 'number' &&
    Array.isArray(v.meals) &&
    v.meals.length > 0 &&
    v.meals.every(
      (m) =>
        typeof m.id === 'string' &&
        typeof m.label === 'string' &&
        typeof m.ratio === 'number' &&
        typeof m.sensitivity === 'number' &&
        typeof m.target === 'number',
    )
  )
}

function loadLegacySchema(): SchemaConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidSchema(parsed) ? parsed : null
  } catch {
    return null
  }
}

async function seedFoodsIfNeeded(): Promise<void> {
  const settings = (await dbGet<AppSettings>('settings', 'app')) ?? {
    adminPasswordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
    passwordVersion: PASSWORD_VERSION,
  }

  if ((settings.foodsSeedVersion ?? 0) >= FOODS_SEED_VERSION) {
    const count = await withStore<number>('foods', 'readonly', (store) => store.count())
    if ((count ?? 0) > 0) return
  }

  const existingFavorites = new Map<string, boolean>()
  const all = await withStore<CatalogFood[]>('foods', 'readonly', (store) => store.getAll())
  for (const food of all ?? []) {
    existingFavorites.set(food.id, food.favorite)
  }

  const seeded: CatalogFood[] = catalogFile.foods.map((food) => {
    const base = food as CatalogFood
    return {
      ...base,
      tier: base.tier ?? 'core',
      favorite: existingFavorites.get(base.id) ?? base.favorite,
    }
  })

  const db = await openDb()
  try {
    const tx = db.transaction('foods', 'readwrite')
    const store = tx.objectStore('foods')
    store.clear()
    for (const food of seeded) {
      store.put(food)
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Food seed failed'))
    })
  } finally {
    db.close()
  }

  await dbSet<AppSettings>('settings', 'app', {
    ...settings,
    foodsSeedVersion: FOODS_SEED_VERSION,
  })
}

let readyPromise: Promise<void> | null = null

/** Initialise la DB, migre l’ancien localStorage si besoin, pose le MDP par défaut. */
export function ensureDbReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const settings = await dbGet<AppSettings>('settings', 'app')
      if (
        !settings?.adminPasswordHash ||
        (settings.passwordVersion ?? 0) < PASSWORD_VERSION
      ) {
        await dbSet<AppSettings>('settings', 'app', {
          adminPasswordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
          passwordVersion: PASSWORD_VERSION,
          foodsSeedVersion: settings?.foodsSeedVersion,
        })
      }

      const existing = await dbGet<SchemaConfig>('schema', 'current')
      if (!existing) {
        const legacy = loadLegacySchema()
        await dbSet('schema', 'current', legacy ?? structuredClone(DEFAULT_SCHEMA))
        if (legacy) localStorage.removeItem(STORAGE_KEY)
      }

      await seedFoodsIfNeeded()
    })()
  }
  return readyPromise
}

export async function loadSchemaFromDb(): Promise<SchemaConfig> {
  await ensureDbReady()
  const schema = await dbGet<SchemaConfig>('schema', 'current')
  return schema ? structuredClone(schema) : structuredClone(DEFAULT_SCHEMA)
}

export async function saveSchemaToDb(schema: SchemaConfig): Promise<void> {
  await ensureDbReady()
  await dbSet('schema', 'current', schema)
}

export async function resetSchemaInDb(): Promise<SchemaConfig> {
  const fresh = structuredClone(DEFAULT_SCHEMA)
  await saveSchemaToDb(fresh)
  return fresh
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  await ensureDbReady()
  const settings = await dbGet<AppSettings>('settings', 'app')
  if (!settings?.adminPasswordHash) return false
  const hash = await hashPassword(password)
  return hash === settings.adminPasswordHash
}

export async function setAdminPassword(password: string): Promise<void> {
  await ensureDbReady()
  const settings = await dbGet<AppSettings>('settings', 'app')
  await dbSet<AppSettings>('settings', 'app', {
    adminPasswordHash: await hashPassword(password),
    passwordVersion: PASSWORD_VERSION,
    foodsSeedVersion: settings?.foodsSeedVersion,
  })
}

export async function loadFoodsFromDb(): Promise<CatalogFood[]> {
  await ensureDbReady()
  const foods =
    (await withStore<CatalogFood[]>('foods', 'readonly', (store) => store.getAll())) ?? []
  return foods
    .slice()
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, 'fr'))
}

export async function saveFoodToDb(food: CatalogFood): Promise<void> {
  await ensureDbReady()
  await withStore('foods', 'readwrite', (store) => store.put(food))
}

export async function toggleFoodFavorite(id: string): Promise<CatalogFood | null> {
  await ensureDbReady()
  const food = await dbGet<CatalogFood>('foods', id)
  if (!food) return null
  const next = { ...food, favorite: !food.favorite }
  await saveFoodToDb(next)
  return next
}

export async function getCatalogExtended(): Promise<boolean> {
  await ensureDbReady()
  const settings = await dbGet<AppSettings>('settings', 'app')
  return Boolean(settings?.catalogExtended)
}

export async function setCatalogExtended(enabled: boolean): Promise<void> {
  await ensureDbReady()
  const settings = await dbGet<AppSettings>('settings', 'app')
  if (!settings) return
  await dbSet<AppSettings>('settings', 'app', {
    ...settings,
    catalogExtended: enabled,
  })
}

/** Store générique pour évolutions futures */
export async function kvGet<T>(key: string): Promise<T | undefined> {
  await ensureDbReady()
  return dbGet<T>('kv', key)
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  await ensureDbReady()
  await dbSet('kv', key, value)
}

export const FOOD_CATALOG_META = {
  source: catalogFile.source,
  sourceShort: catalogFile.sourceShort,
  sourceUrl: catalogFile.sourceUrl,
  license: catalogFile.license,
  note: catalogFile.note,
}
