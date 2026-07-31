import type { DoseBreakdown, FoodEntry, MealParams, SchemaConfig } from '../types'

export function parseNum(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function carbsForFood(weightG: number, carbsPer100: number): number {
  return (weightG * carbsPer100) / 100
}

/** Arrondi médical type Excel MROUND(..., 0.5) */
export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2
}

export function sumFoodCarbs(foods: FoodEntry[]): number {
  return foods.reduce((sum, food) => {
    const w = parseNum(food.weight)
    const c = parseNum(food.carbsPer100)
    if (w === null || c === null || w <= 0 || c < 0) return sum
    return sum + carbsForFood(w, c)
  }, 0)
}

export function calculateDose(
  glycemia: number,
  meal: MealParams,
  foods: FoodEntry[],
  carbBase: number,
): DoseBreakdown {
  const totalCarbs = sumFoodCarbs(foods)
  const glycemiaDiff = glycemia - meal.target
  const compensation = glycemiaDiff / meal.sensitivity
  const mealInsulin = totalCarbs * (meal.ratio / carbBase)
  const totalRaw = compensation + mealInsulin
  const totalRounded = Math.max(0, roundToHalf(totalRaw))

  return {
    totalCarbs,
    compensation,
    glycemiaDiff,
    mealInsulin,
    totalRaw,
    totalRounded,
    ratio: meal.ratio,
    sensitivity: meal.sensitivity,
    target: meal.target,
  }
}

export function getMeal(schema: SchemaConfig, mealId: string): MealParams | undefined {
  return schema.meals.find((m) => m.id === mealId)
}

export function formatDose(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  const rounded = Math.round(n * 10 ** digits) / 10 ** digits
  return String(rounded).replace('.', ',')
}
