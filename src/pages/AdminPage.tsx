import { useEffect, useState } from 'react'
import { DEFAULT_SCHEMA } from '../data/defaults'
import { useSchema } from '../context/SchemaContext'
import { formatDose, parseNum } from '../lib/calc'
import type { MealParams, SchemaConfig } from '../types'

export function AdminPage() {
  const { schema, updateSchema, restoreDefaults } = useSchema()
  const [draft, setDraft] = useState<SchemaConfig>(() => structuredClone(schema))
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setDraft(structuredClone(schema))
  }, [schema])

  function updateMeal(
    id: string,
    field: keyof Pick<MealParams, 'ratio' | 'sensitivity' | 'target'>,
    value: string,
  ) {
    setDraft((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => {
        if (m.id !== id) return m
        const n = parseNum(value)
        return { ...m, [field]: n === null ? m[field] : n }
      }),
    }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    updateSchema(structuredClone(draft))
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1800)
  }

  function handleReset() {
    if (!window.confirm('Réinitialiser les paramètres du schéma médical ?')) return
    restoreDefaults()
    setDraft(structuredClone(DEFAULT_SCHEMA))
  }

  return (
    <div className="page admin-page">
      <section className="panel">
        <h1 className="page-title">Paramètres médecin</h1>
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
                  required
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
                  required
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
                  required
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

        <div className="admin-actions">
          <button type="submit" className="btn btn-primary">
            {savedFlash ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Réinitialiser
          </button>
        </div>
      </form>
    </div>
  )
}
