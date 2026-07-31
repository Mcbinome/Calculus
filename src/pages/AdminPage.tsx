import { useEffect, useState } from 'react'
import { DEFAULT_SCHEMA } from '../data/defaults'
import { useAuth } from '../context/AuthContext'
import { useSchema } from '../context/SchemaContext'
import { formatDose, parseNum } from '../lib/calc'
import type { MealParams, SchemaConfig } from '../types'

function LockGlyph({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      {open ? (
        <path
          fill="currentColor"
          d="M17 8h-1V6.2A3.7 3.7 0 0 0 8.5 5l1.1.7A2.2 2.2 0 0 1 14 6.2V8H7a2 2 0 0 0-2 2v9c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm0 11H7v-9h10v9Zm-5-2.3a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7Z"
        />
      ) : (
        <path
          fill="currentColor"
          d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2ZM10 6a2 2 0 1 1 4 0v2h-4V6Zm7 13H7v-9h10v9Zm-5-2.3a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7Z"
        />
      )}
    </svg>
  )
}

export function AdminPage() {
  const { ready: authReady, unlocked, unlock, lock, changePassword } = useAuth()
  const { schema, updateSchema, restoreDefaults } = useSchema()
  const [draft, setDraft] = useState<SchemaConfig>(() => structuredClone(schema))
  const [savedFlash, setSavedFlash] = useState(false)
  const [password, setPassword] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [unlocking, setUnlocking] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [nextPwd, setNextPwd] = useState('')
  const [nextPwd2, setNextPwd2] = useState('')
  const [pwdMessage, setPwdMessage] = useState('')

  useEffect(() => {
    setDraft(structuredClone(schema))
  }, [schema])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setUnlockError('')
    setUnlocking(true)
    try {
      const ok = await unlock(password)
      if (!ok) setUnlockError('Mot de passe incorrect.')
      else setPassword('')
    } finally {
      setUnlocking(false)
    }
  }

  function updateMeal(
    id: string,
    field: keyof Pick<MealParams, 'ratio' | 'sensitivity' | 'target'>,
    value: string,
  ) {
    if (!unlocked) return
    setDraft((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => {
        if (m.id !== id) return m
        const n = parseNum(value)
        return { ...m, [field]: n === null ? m[field] : n }
      }),
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!unlocked) return
    await updateSchema(structuredClone(draft))
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1800)
  }

  async function handleReset() {
    if (!unlocked) return
    if (!window.confirm('Réinitialiser les paramètres du schéma médical ?')) return
    await restoreDefaults()
    setDraft(structuredClone(DEFAULT_SCHEMA))
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdMessage('')
    if (nextPwd !== nextPwd2) {
      setPwdMessage('Les nouveaux mots de passe ne correspondent pas.')
      return
    }
    const result = await changePassword(currentPwd, nextPwd)
    if (result === 'bad-current') {
      setPwdMessage('Mot de passe actuel incorrect.')
      return
    }
    if (result === 'weak') {
      setPwdMessage('Le nouveau mot de passe doit faire au moins 4 caractères.')
      return
    }
    setPwdMessage('Mot de passe mis à jour.')
    setCurrentPwd('')
    setNextPwd('')
    setNextPwd2('')
  }

  if (!authReady) {
    return (
      <div className="page">
        <section className="panel">
          <p className="page-lead">Chargement…</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page admin-page">
      <section className="panel">
        <div className="panel-head">
          <h1 className="page-title">Paramètres médecin</h1>
        </div>
        <p className="page-lead">
          Rapport insuline/glucides et sensibilité par moment de la journée,
          issus du schéma d’adaptation.
        </p>
      </section>

      <form className="admin-form" onSubmit={handleSave}>
        {draft.meals.map((meal) => (
          <article key={meal.id} className="panel meal-admin">
            <h2 className="section-title">{meal.label}</h2>
            <div className="admin-grid">
              <label className="field">
                <span className="field-label">Rapport (U / 10 g)</span>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={meal.ratio}
                  onChange={(e) => updateMeal(meal.id, 'ratio', e.target.value)}
                  readOnly={!unlocked}
                  disabled={!unlocked}
                  required={unlocked}
                />
              </label>
              <label className="field">
                <span className="field-label">Sensibilité (mmol/L / U)</span>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0.1"
                  value={meal.sensitivity}
                  onChange={(e) =>
                    updateMeal(meal.id, 'sensitivity', e.target.value)
                  }
                  readOnly={!unlocked}
                  disabled={!unlocked}
                  required={unlocked}
                />
              </label>
              <label className="field">
                <span className="field-label">Glycémie cible (mmol/L)</span>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={meal.target}
                  onChange={(e) => updateMeal(meal.id, 'target', e.target.value)}
                  readOnly={!unlocked}
                  disabled={!unlocked}
                  required={unlocked}
                />
              </label>
            </div>
            <p className="muted tiny">
              Exemple : {formatDose(meal.ratio, 1)} U pour 10 g · 1 U baisse
              d’environ {formatDose(meal.sensitivity, 1)} mmol/L · cible{' '}
              {formatDose(meal.target, 1)}
            </p>
          </article>
        ))}

        {unlocked && (
          <div className="admin-actions">
            <button type="submit" className="btn btn-primary">
              {savedFlash ? 'Enregistré ✓' : 'Enregistrer'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Réinitialiser
            </button>
          </div>
        )}
      </form>

      {unlocked && (
        <section className="panel">
          <h2 className="section-title">Changer le mot de passe</h2>
          <form className="password-form" onSubmit={handleChangePassword}>
            <label className="field">
              <span className="field-label">Mot de passe actuel</span>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Nouveau mot de passe</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={nextPwd}
                onChange={(e) => setNextPwd(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Confirmer</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={nextPwd2}
                onChange={(e) => setNextPwd2(e.target.value)}
                required
              />
            </label>
            {pwdMessage && (
              <p className={pwdMessage.includes('mis à jour') ? 'form-ok' : 'form-error'}>
                {pwdMessage}
              </p>
            )}
            <button type="submit" className="btn btn-secondary">
              Mettre à jour le mot de passe
            </button>
          </form>
        </section>
      )}

      <section className="panel auth-panel">
        <div className="auth-row">
          {unlocked ? (
            <>
              <p className="auth-hint">Édition déverrouillée</p>
              <button
                type="button"
                className="pwd-lock-btn open"
                onClick={lock}
                aria-label="Verrouiller l’édition"
                title="Verrouiller"
              >
                <LockGlyph open />
              </button>
            </>
          ) : (
            <form className="unlock-inline" onSubmit={handleUnlock}>
              <input
                className="input unlock-input"
                type="password"
                autoComplete="current-password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (unlockError) setUnlockError('')
                }}
                aria-label="Mot de passe pour éditer"
                required
              />
              <button
                type="submit"
                className="pwd-lock-btn"
                disabled={unlocking || !password}
                aria-label="Déverrouiller l’édition"
                title="Déverrouiller"
              >
                <LockGlyph open={false} />
              </button>
            </form>
          )}
          {unlockError && <p className="form-error auth-error">{unlockError}</p>}
        </div>
      </section>
    </div>
  )
}
