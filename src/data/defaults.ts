import type { SchemaConfig } from '../types'

/** Paramètres issus de la feuille Schéma (Juillet 2026) */
export const DEFAULT_SCHEMA: SchemaConfig = {
  carbBase: 10,
  meals: [
    {
      id: 'petit-dejeuner',
      label: 'Petit-déjeuner',
      ratio: 0.9,
      sensitivity: 8,
      target: 7,
    },
    {
      id: 'collation-matin',
      label: 'Collation matin',
      ratio: 0.5,
      sensitivity: 8,
      target: 7,
    },
    {
      id: 'diner',
      label: 'Dîner',
      ratio: 0.6,
      sensitivity: 8,
      target: 7,
    },
    {
      id: 'collation-apres-midi',
      label: 'Collation après-midi',
      ratio: 0.6,
      sensitivity: 8,
      target: 7,
    },
    {
      id: 'souper',
      label: 'Souper',
      ratio: 0.6,
      sensitivity: 8,
      target: 7,
    },
    {
      id: 'collation-soir',
      label: 'Collation soir',
      ratio: 0.3,
      sensitivity: 8,
      target: 7,
    },
  ],
}

export const MAX_FOODS = 6
export const STORAGE_KEY = 'calcul-insuline-schema-v1'
