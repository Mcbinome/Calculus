import { useMemo, useState } from 'react'
import { MAX_FOODS } from '../data/defaults'
import { useSchema } from '../context/SchemaContext'
import { calculateDose, formatDose, parseNum } from '../lib/calc'
import type { FoodEntry, MealId } from '../types'

function newFood(): FoodEntry {
  return {
    id: crypto.randomUUID(),
    weight: '',
    carbsPer100: '',
  }
}

export function CalculatorPage() {
  const { schema } = useSchema()
  const [mealId, setMealId] = useState<MealId>(schema.meals[0].id)
  const [glycemia, setGlycemia] = useState('')
  const [foods, setFoods] = useState<FoodEntry[]>([newFood()])

  const meal = schema.meals.find((m) => m.id === mealId) ?? schema.meals[0]
  const glycemiaNum = parseNum(glycemia)

  const result = useMemo(() => {
    if (glycemiaNum === null) return null
    return calculateDose(glycemiaNum, meal, foods, schema.carbBase)
  }, [glycemiaNum, meal, foods, schema.carbBase])

  function updateFood(id: string, field: 'weight' | 'carbsPer100', value: string) {
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    )
  }

  function addFood() {
    if (foods.length >= MAX_FOODS) return
    setFoods((prev) => [...prev, newFood()])
  }

  function removeFood(id: string) {
    setFoods((prev) => (prev.length <= 1 ? prev : prev.filter((f) => f.id !== id)))
  }

  return (
    <div className="page calc-page">
      <section className="panel">
        <h1 className="page-title">Nouveau calcul</h1>
        <p className="page-lead">
          Choisissez le moment, indiquez la glycémie et les aliments du repas.
        </p>

        <label className="field">
          <span className="field-label">Moment de la journée</span>
          <select
            className="input select"
            value={mealId}
            onChange={(e) => setMealId(e.target.value as MealId)}
          >
            {schema.meals.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <div className="param-chips" aria-label="Paramètres du moment">
          <span className="chip">
            Rapport <strong>{formatDose(meal.ratio, 1)} U / 10 g</strong>
          </span>
          <span className="chip">
            Sensibilité <strong>{formatDose(meal.sensitivity, 1)} mmol/L/U</strong>
          </span>
          <span className="chip">
            Cible <strong>{formatDose(meal.target, 1)} mmol/L</strong>
          </span>
        </div>

        <label className="field">
          <span className="field-label">Glycémie actuelle (mmol/L)</span>
          <input
            className="input input-lg"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            placeholder="ex. 8,2"
            value={glycemia}
            onChange={(e) => setGlycemia(e.target.value)}
          />
        </label>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="section-title">Aliments</h2>
          <span className="muted">{foods.length}/{MAX_FOODS}</span>
        </div>

        <div className="food-list">
          {foods.map((food, index) => {
            const w = parseNum(food.weight)
            const c = parseNum(food.carbsPer100)
            const carbs =
              w !== null && c !== null && w > 0 && c >= 0
                ? (w * c) / 100
                : null

            return (
              <article key={food.id} className="food-card">
                <div className="food-card-top">
                  <span className="food-index">Aliment {index + 1}</span>
                  {foods.length > 1 && (
                    <button
                      type="button"
                      className="btn-text danger"
                      onClick={() => removeFood(food.id)}
                    >
                      Retirer
                    </button>
                  )}
                </div>
                <div className="food-grid">
                  <label className="field">
                    <span className="field-label">Poids (g)</span>
                    <input
                      className="input"
                      type="number"
                      inputMode="decimal"
                      step="1"
                      min="0"
                      placeholder="100"
                      value={food.weight}
                      onChange={(e) => updateFood(food.id, 'weight', e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">Glucides / 100 g</span>
                    <input
                      className="input"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      placeholder="ex. 45"
                      value={food.carbsPer100}
                      onChange={(e) =>
                        updateFood(food.id, 'carbsPer100', e.target.value)
                      }
                    />
                  </label>
                </div>
                <p className="food-carbs">
                  Glucides aliment :{' '}
                  <strong>
                    {carbs === null ? '—' : `${formatDose(carbs, 1)} g`}
                  </strong>
                </p>
              </article>
            )
          })}
        </div>

        {foods.length < MAX_FOODS && (
          <button type="button" className="btn btn-secondary full" onClick={addFood}>
            + Ajouter un aliment
          </button>
        )}
      </section>

      <section className={`result-panel ${result ? 'ready' : ''}`}>
        {result ? (
          <>
            <p className="result-label">Dose d’insuline à réaliser</p>
            <p className="result-dose">
              {formatDose(result.totalRounded, 1)}
              <span className="result-unit">U</span>
            </p>
            <p className="result-raw">
              Calcul précis : {formatDose(result.totalRaw, 2)} U · arrondi au 0,5
            </p>
            <dl className="result-breakdown">
              <div>
                <dt>Glucides repas</dt>
                <dd>{formatDose(result.totalCarbs, 1)} g</dd>
              </div>
              <div>
                <dt>Insuline repas</dt>
                <dd>{formatDose(result.mealInsulin, 2)} U</dd>
              </div>
              <div>
                <dt>Écart glycémie</dt>
                <dd>
                  {result.glycemiaDiff >= 0 ? '+' : ''}
                  {formatDose(result.glycemiaDiff, 1)} mmol/L
                </dd>
              </div>
              <div>
                <dt>Compensation</dt>
                <dd>
                  {result.compensation >= 0 ? '+' : ''}
                  {formatDose(result.compensation, 2)} U
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="result-placeholder">
            Entrez la glycémie actuelle pour afficher la dose.
          </p>
        )}
      </section>
    </div>
  )
}
