import { useMemo, useState } from 'react'
import { FoodPictogram } from '../components/FoodPictogram'
import { useFoods } from '../context/FoodsContext'
import { FOOD_CATALOG_META } from '../db/database'
import { formatDose } from '../lib/calc'
import { matchesSearch } from '../lib/search'

export function FoodsPage() {
  const {
    ready,
    visibleFoods,
    favorites,
    toggleFavorite,
    catalogExtended,
    setExtended,
    coreCount,
    extendedCount,
  } = useFoods()
  const [query, setQuery] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const filtered = useMemo(() => {
    const list = visibleFoods.filter((food) => {
      if (favoritesOnly && !food.favorite) return false
      if (!query.trim()) return true
      return (
        matchesSearch(food.name, query) ||
        matchesSearch(food.fullName, query) ||
        matchesSearch(food.group, query)
      )
    })
    return list.sort(
      (a, b) =>
        Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, 'fr'),
    )
  }, [visibleFoods, query, favoritesOnly])

  if (!ready) {
    return (
      <div className="page">
        <section className="panel">
          <p className="page-lead">Chargement du catalogue…</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page foods-page">
      <section className="panel">
        <div className="panel-head foods-head">
          <h1 className="page-title">Aliments</h1>
          <label className="switch-row" title="Afficher ~250 aliments CIQUAL">
            <span className="switch-label">Étendre</span>
            <button
              type="button"
              className={`switch ${catalogExtended ? 'on' : ''}`}
              role="switch"
              aria-checked={catalogExtended}
              onClick={() => void setExtended(!catalogExtended)}
            >
              <span className="switch-thumb" />
            </button>
          </label>
        </div>
        <p className="page-lead">
          Catalogue basé sur{' '}
          <a href={FOOD_CATALOG_META.sourceUrl} target="_blank" rel="noreferrer">
            {FOOD_CATALOG_META.sourceShort}
          </a>
          . {catalogExtended
            ? `${coreCount + extendedCount} aliments (noyau + extension).`
            : `${coreCount} aliments courants — activez Étendre pour +${extendedCount}.`}
        </p>

        <div className="foods-toolbar">
          <input
            className="input"
            type="search"
            placeholder="Rechercher un aliment…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un aliment"
          />
          <button
            type="button"
            className={`filter-chip ${favoritesOnly ? 'active' : ''}`}
            onClick={() => setFavoritesOnly((v) => !v)}
          >
            ★ Favoris ({favorites.length})
          </button>
        </div>
      </section>

      <section className="food-catalog" aria-label="Catalogue d’aliments">
        {filtered.length === 0 ? (
          <div className="panel">
            <p className="muted">Aucun aliment ne correspond.</p>
          </div>
        ) : (
          filtered.map((food) => (
            <article key={food.id} className={`food-item ${food.favorite ? 'is-fav' : ''}`}>
              <FoodPictogram icon={food.icon} />
              <div className="food-item-body">
                <h2 className="food-item-name">
                  {food.name}
                  {food.tier === 'extended' && (
                    <span className="tier-badge">ext.</span>
                  )}
                </h2>
                <p className="food-item-meta">
                  {formatDose(food.carbsPer100, 1)} g glucides / 100 g
                  {food.sugarsPer100 != null && (
                    <> · dont {formatDose(food.sugarsPer100, 1)} g sucres</>
                  )}
                </p>
              </div>
              <button
                type="button"
                className={`fav-btn ${food.favorite ? 'on' : ''}`}
                onClick={() => void toggleFavorite(food.id)}
                aria-label={
                  food.favorite
                    ? `Retirer ${food.name} des favoris`
                    : `Ajouter ${food.name} aux favoris`
                }
                title={food.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                {food.favorite ? '★' : '☆'}
              </button>
            </article>
          ))
        )}
      </section>

      <p className="catalog-source muted tiny">
        Source : {FOOD_CATALOG_META.source} — licence {FOOD_CATALOG_META.license}.
      </p>
    </div>
  )
}
