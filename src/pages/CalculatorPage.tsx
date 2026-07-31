import { useMemo, useState } from 'react'
import { FoodPictogram } from '../components/FoodPictogram'
import { MAX_FOODS } from '../data/defaults'
import { useFoods } from '../context/FoodsContext'
import { useSchema } from '../context/SchemaContext'
import { calculateDose, formatDose, parseNum } from '../lib/calc'
import { matchesSearch } from '../lib/search'
import type { CatalogFood, FoodEntry, MealId } from '../types'

function newFood(): FoodEntry {
  return {
    id: crypto.randomUUID(),
    weight: '',
    carbsPer100: '',
  }
}

function fromCatalog(food: CatalogFood): FoodEntry {
  return {
    id: crypto.randomUUID(),
    weight: '',
    carbsPer100: String(food.carbsPer100).replace('.', ','),
    catalogId: food.id,
    name: food.name,
    icon: food.icon,
  }
}

function foodCarbs(food: FoodEntry): number | null {
  const w = parseNum(food.weight)
  const c = parseNum(food.carbsPer100)
  if (w === null || c === null || w <= 0 || c < 0) return null
  return (w * c) / 100
}

export function CalculatorPage() {
  const { schema } = useSchema()
  const { favorites, ready: catalogReady } = useFoods()
  const [mealId, setMealId] = useState<MealId>(schema.meals[0].id)
  const [glycemia, setGlycemia] = useState('')
  const [foods, setFoods] = useState<FoodEntry[]>([newFood()])
  const [useCatalog, setUseCatalog] = useState(false)
  const [favQuery, setFavQuery] = useState('')
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)

  const meal = schema.meals.find((m) => m.id === mealId) ?? schema.meals[0]
  const glycemiaNum = parseNum(glycemia)

  const result = useMemo(() => {
    if (glycemiaNum === null) return null
    return calculateDose(glycemiaNum, meal, foods, schema.carbBase)
  }, [glycemiaNum, meal, foods, schema.carbBase])

  const visibleFavorites = useMemo(() => {
    const inMeal = new Set(foods.map((f) => f.catalogId).filter(Boolean))
    return favorites
      .filter((food) => !inMeal.has(food.id))
      .filter(
        (food) =>
          matchesSearch(food.name, favQuery) ||
          matchesSearch(food.fullName, favQuery),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [favorites, favQuery, foods])

  function updateFood(id: string, field: 'weight' | 'carbsPer100', value: string) {
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    )
  }

  function addFood() {
    if (foods.length >= MAX_FOODS) return
    const entry = newFood()
    setLastAddedId(entry.id)
    setFoods((prev) => {
      const cleaned = prev.filter((f) => f.catalogId || f.weight || f.carbsPer100)
      return [...cleaned, entry]
    })
  }

  function removeFood(id: string) {
    setFoods((prev) => {
      const next = prev.filter((f) => f.id !== id)
      if (next.length > 0) return next
      return useCatalog ? [] : [newFood()]
    })
  }

  function addFromFavorite(food: CatalogFood) {
    if (foods.length >= MAX_FOODS) return
    const entry = fromCatalog(food)
    setLastAddedId(entry.id)
    setFoods((prev) => {
      const cleaned = prev.filter((f) => f.catalogId || f.weight || f.carbsPer100)
      return [...cleaned, entry]
    })
  }

  function switchMode(next: boolean) {
    setUseCatalog(next)
    setFavQuery('')
    setLastAddedId(null)
    if (!next) {
      setFoods((prev) => (prev.length === 0 ? [newFood()] : prev))
    }
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
        <div className="panel-head foods-head">
          <h2 className="section-title">Aliments</h2>
          <div className="foods-head-right">
            <span className="muted">
              {foods.length}/{MAX_FOODS}
            </span>
            <label className="switch-row" title="Afficher les favoris du catalogue">
              <span className="switch-label">Catalogue</span>
              <button
                type="button"
                className={`switch ${useCatalog ? 'on' : ''}`}
                role="switch"
                aria-checked={useCatalog}
                onClick={() => switchMode(!useCatalog)}
              >
                <span className="switch-thumb" />
              </button>
            </label>
          </div>
        </div>

        <div className={useCatalog ? 'meal-list' : 'food-list'}>
          {foods.length === 0 ? (
            <p className="meal-empty muted">
              {useCatalog
                ? 'Touchez un favori ci-dessous, ou ajoutez un aliment à la main.'
                : 'Ajoutez un aliment au repas.'}
            </p>
          ) : (
            foods.map((food, index) => {
              const carbs = foodCarbs(food)
              const label = food.name ?? `Aliment ${index + 1}`
              const title = (
                <span className="food-index">
                  <span className="food-index-num">{index + 1}.</span>
                  {food.catalogId && food.icon && (
                    <FoodPictogram icon={food.icon} className="meal-catalog-picto" />
                  )}
                  <span className="food-index-label">{label}</span>
                  {food.catalogId && (
                    <span className="catalog-origin-badge" title="Issu du catalogue CIQUAL">
                      catalogue
                    </span>
                  )}
                </span>
              )

              if (useCatalog && food.catalogId) {
                return (
                  <article key={food.id} className="food-card meal-card">
                    <div className="food-card-top">
                      {title}
                      <button
                        type="button"
                        className="btn-text danger"
                        onClick={() => removeFood(food.id)}
                      >
                        Retirer
                      </button>
                    </div>
                    <label className="field">
                      <span className="field-label">Quantité (g)</span>
                      <input
                        className="input input-lg"
                        type="number"
                        inputMode="decimal"
                        step="1"
                        min="0"
                        placeholder="ex. 120"
                        value={food.weight}
                        onChange={(e) => updateFood(food.id, 'weight', e.target.value)}
                        autoFocus={food.id === lastAddedId}
                      />
                    </label>
                    <p className="food-carbs">
                      Glucides :{' '}
                      <strong>
                        {carbs === null ? '—' : `${formatDose(carbs, 1)} g`}
                      </strong>
                      <span className="muted">
                        {' '}
                        · {food.carbsPer100} g / 100 g
                      </span>
                    </p>
                  </article>
                )
              }

              return (
                <article key={food.id} className="food-card meal-card">
                  <div className="food-card-top">
                    {title}
                    {(foods.length > 1 || useCatalog) && (
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
                        autoFocus={food.id === lastAddedId}
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
            })
          )}
        </div>

        {foods.length < MAX_FOODS && (
          <button type="button" className="btn btn-secondary full" onClick={addFood}>
            + Ajouter à la main
          </button>
        )}

        {useCatalog && (
          <div className="favorites-picker">
            <div className="favorites-picker-head">
              <h3 className="section-title">Favoris</h3>
              {favorites.length > 4 && (
                <input
                  className="input fav-search"
                  type="search"
                  placeholder="Filtrer…"
                  value={favQuery}
                  onChange={(e) => setFavQuery(e.target.value)}
                  aria-label="Filtrer les favoris"
                />
              )}
            </div>

            {!catalogReady ? (
              <p className="muted">Chargement…</p>
            ) : favorites.length === 0 ? (
              <p className="muted">
                Aucun favori. Ajoutez-en dans l’onglet Aliments (★).
              </p>
            ) : visibleFavorites.length === 0 ? (
              <p className="muted">
                {foods.some((f) => f.catalogId)
                  ? 'Tous vos favoris sont déjà dans le repas.'
                  : 'Aucun favori ne correspond.'}
              </p>
            ) : (
              <div className="fav-chip-list" role="list">
                {visibleFavorites.map((food) => {
                  const full = foods.length >= MAX_FOODS
                  return (
                    <button
                      key={food.id}
                      type="button"
                      className="fav-add-chip"
                      disabled={full}
                      onClick={() => addFromFavorite(food)}
                      title={
                        full
                          ? 'Maximum d’aliments atteint'
                          : `Ajouter ${food.name}`
                      }
                    >
                      <FoodPictogram icon={food.icon} />
                      <span className="fav-add-text">
                        <span className="fav-add-name">{food.name}</span>
                        <span className="fav-add-meta">
                          {formatDose(food.carbsPer100, 1)} g/100 g · +
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
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
