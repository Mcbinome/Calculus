import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadSchema, resetSchema, saveSchema } from '../lib/storage'
import type { SchemaConfig } from '../types'

interface SchemaContextValue {
  schema: SchemaConfig
  updateSchema: (next: SchemaConfig) => void
  restoreDefaults: () => void
}

const SchemaContext = createContext<SchemaContextValue | null>(null)

export function SchemaProvider({ children }: { children: ReactNode }) {
  const [schema, setSchema] = useState<SchemaConfig>(() => loadSchema())

  const updateSchema = useCallback((next: SchemaConfig) => {
    saveSchema(next)
    setSchema(next)
  }, [])

  const restoreDefaults = useCallback(() => {
    setSchema(resetSchema())
  }, [])

  const value = useMemo(
    () => ({ schema, updateSchema, restoreDefaults }),
    [schema, updateSchema, restoreDefaults],
  )

  return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>
}

export function useSchema() {
  const ctx = useContext(SchemaContext)
  if (!ctx) throw new Error('useSchema must be used within SchemaProvider')
  return ctx
}
