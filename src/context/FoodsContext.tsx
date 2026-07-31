import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getCatalogExtended,
  loadFoodsFromDb,
  setCatalogExtended,
  toggleFoodFavorite,
} from '../db/database'
import type { CatalogFood } from '../types'

interface FoodsContextValue {
  ready: boolean
  foods: CatalogFood[]
  /** Aliments visibles selon l’option « étendre » (favoris toujours inclus) */
  visibleFoods: CatalogFood[]
  favorites: CatalogFood[]
  catalogExtended: boolean
  setExtended: (enabled: boolean) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  coreCount: number
  extendedCount: number
}

const FoodsContext = createContext<FoodsContextValue | null>(null)

export function FoodsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [foods, setFoods] = useState<CatalogFood[]>([])
  const [catalogExtended, setCatalogExtendedState] = useState(false)

  useEffect(() => {
    void (async () => {
      const [loaded, extended] = await Promise.all([
        loadFoodsFromDb(),
        getCatalogExtended(),
      ])
      setFoods(loaded)
      setCatalogExtendedState(extended)
      setReady(true)
    })()
  }, [])

  const toggleFavorite = useCallback(async (id: string) => {
    const updated = await toggleFoodFavorite(id)
    if (!updated) return
    setFoods((prev) =>
      prev
        .map((f) => (f.id === id ? updated : f))
        .sort(
          (a, b) =>
            Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, 'fr'),
        ),
    )
  }, [])

  const setExtended = useCallback(async (enabled: boolean) => {
    await setCatalogExtended(enabled)
    setCatalogExtendedState(enabled)
  }, [])

  const favorites = useMemo(() => foods.filter((f) => f.favorite), [foods])

  const visibleFoods = useMemo(() => {
    if (catalogExtended) return foods
    return foods.filter((f) => f.tier === 'core' || f.favorite)
  }, [foods, catalogExtended])

  const coreCount = useMemo(
    () => foods.filter((f) => f.tier === 'core').length,
    [foods],
  )
  const extendedCount = useMemo(
    () => foods.filter((f) => f.tier === 'extended').length,
    [foods],
  )

  const value = useMemo(
    () => ({
      ready,
      foods,
      visibleFoods,
      favorites,
      catalogExtended,
      setExtended,
      toggleFavorite,
      coreCount,
      extendedCount,
    }),
    [
      ready,
      foods,
      visibleFoods,
      favorites,
      catalogExtended,
      setExtended,
      toggleFavorite,
      coreCount,
      extendedCount,
    ],
  )

  return <FoodsContext.Provider value={value}>{children}</FoodsContext.Provider>
}

export function useFoods() {
  const ctx = useContext(FoodsContext)
  if (!ctx) throw new Error('useFoods must be used within FoodsProvider')
  return ctx
}
