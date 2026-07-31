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
  catalogId?: string
  name?: string
  icon?: FoodIcon
}

export type FoodIcon =
  | 'bread'
  | 'pastry'
  | 'cereal'
  | 'rice'
  | 'pasta'
  | 'potato'
  | 'fruit'
  | 'veg'
  | 'dairy'
  | 'egg'
  | 'meat'
  | 'ham'
  | 'poultry'
  | 'fish'
  | 'sweet'
  | 'drink'
  | 'meal'
  | 'legume'

export interface CatalogFood {
  id: string
  name: string
  fullName: string
  group: string
  subgroup: string
  carbsPer100: number
  sugarsPer100: number | null
  icon: FoodIcon
  source: string
  ciqualCode: string
  favorite: boolean
  /** Noyau courant ou extension (~250 aliments) */
  tier: 'core' | 'extended'
}

export interface FoodCatalogFile {
  source: string
  sourceShort: string
  sourceUrl: string
  license: string
  note: string
  foods: CatalogFood[]
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
