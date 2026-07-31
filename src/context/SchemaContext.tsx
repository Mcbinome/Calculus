import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_SCHEMA } from '../data/defaults'
import {
  loadSchemaFromDb,
  resetSchemaInDb,
  saveSchemaToDb,
} from '../db/database'
import type { SchemaConfig } from '../types'

interface SchemaContextValue {
  ready: boolean
  schema: SchemaConfig
  updateSchema: (next: SchemaConfig) => Promise<void>
  restoreDefaults: () => Promise<void>
}

const SchemaContext = createContext<SchemaContextValue | null>(null)

export function SchemaProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [schema, setSchema] = useState<SchemaConfig>(() =>
    structuredClone(DEFAULT_SCHEMA),
  )

  useEffect(() => {
    void loadSchemaFromDb().then((loaded) => {
      setSchema(loaded)
      setReady(true)
    })
  }, [])

  const updateSchema = useCallback(async (next: SchemaConfig) => {
    await saveSchemaToDb(next)
    setSchema(next)
  }, [])

  const restoreDefaults = useCallback(async () => {
    const fresh = await resetSchemaInDb()
    setSchema(fresh)
  }, [])

  const value = useMemo(
    () => ({ ready, schema, updateSchema, restoreDefaults }),
    [ready, schema, updateSchema, restoreDefaults],
  )

  return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>
}

export function useSchema() {
  const ctx = useContext(SchemaContext)
  if (!ctx) throw new Error('useSchema must be used within SchemaProvider')
  return ctx
}
