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
  ensureDbReady,
  setAdminPassword,
  verifyAdminPassword,
} from '../db/database'

const SESSION_KEY = 'calcul-insuline-unlocked'

interface AuthContextValue {
  ready: boolean
  unlocked: boolean
  unlock: (password: string) => Promise<boolean>
  lock: () => void
  changePassword: (current: string, next: string) => Promise<'ok' | 'bad-current' | 'weak'>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1',
  )

  useEffect(() => {
    void ensureDbReady().then(() => setReady(true))
  }, [])

  const unlock = useCallback(async (password: string) => {
    const ok = await verifyAdminPassword(password)
    if (!ok) return false
    sessionStorage.setItem(SESSION_KEY, '1')
    setUnlocked(true)
    return true
  }, [])

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUnlocked(false)
  }, [])

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (next.trim().length < 4) return 'weak' as const
      const ok = await verifyAdminPassword(current)
      if (!ok) return 'bad-current' as const
      await setAdminPassword(next.trim())
      return 'ok' as const
    },
    [],
  )

  const value = useMemo(
    () => ({ ready, unlocked, unlock, lock, changePassword }),
    [ready, unlocked, unlock, lock, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
