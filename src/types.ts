export type MealId =
  | 'petit-dejeuner'
  | 'collation-matin'
  | 'diner'
  | 'collation-apres-midi'
  | 'souper'
  | 'collation-soir'

export interface MealParams {
  id: MealId
  label: string
  /** Rapport insuline / glucides (UI pour 10 g) */
  ratio: number
  /** Sensibilité à l'insuline (mmol/L par U) */
  sensitivity: number
  /** Glycémie cible (mmol/L) */
  target: number
}

export interface FoodEntry {
  id: string
  weight: string
  carbsPer100: string
}

export interface SchemaConfig {
  meals: MealParams[]
  /** Grammes de glucides de base pour le rapport (toujours 10 dans le schéma) */
  carbBase: number
}

export interface DoseBreakdown {
  totalCarbs: number
  compensation: number
  glycemiaDiff: number
  mealInsulin: number
  totalRaw: number
  totalRounded: number
  ratio: number
  sensitivity: number
  target: number
}
