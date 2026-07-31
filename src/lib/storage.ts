import { DEFAULT_SCHEMA, STORAGE_KEY } from '../data/defaults'
import type { SchemaConfig } from '../types'

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

export function loadSchema(): SchemaConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_SCHEMA)
    const parsed: unknown = JSON.parse(raw)
    if (!isValidSchema(parsed)) return structuredClone(DEFAULT_SCHEMA)
    return parsed
  } catch {
    return structuredClone(DEFAULT_SCHEMA)
  }
}

export function saveSchema(schema: SchemaConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schema))
}

export function resetSchema(): SchemaConfig {
  const fresh = structuredClone(DEFAULT_SCHEMA)
  saveSchema(fresh)
  return fresh
}
