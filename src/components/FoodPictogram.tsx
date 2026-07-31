import {
  Apple,
  Bean,
  Beef,
  CakeSlice,
  Carrot,
  CookingPot,
  Croissant,
  CupSoda,
  Drumstick,
  Egg,
  Fish,
  Ham,
  Milk,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import type { FoodIcon as FoodIconId } from '../types'

/** Icônes Lucide — une silhouette claire par famille. */
const ICONS: Record<FoodIconId, LucideIcon> = {
  bread: Sandwich,
  pastry: Croissant,
  cereal: Wheat,
  rice: CookingPot,
  pasta: Soup,
  potato: Carrot,
  fruit: Apple,
  veg: Salad,
  dairy: Milk,
  egg: Egg,
  meat: Beef,
  ham: Ham,
  poultry: Drumstick,
  fish: Fish,
  sweet: CakeSlice,
  drink: CupSoda,
  meal: UtensilsCrossed,
  legume: Bean,
}

export function FoodPictogram({
  icon,
  className = '',
}: {
  icon: FoodIconId
  className?: string
}) {
  const Icon = ICONS[icon] ?? UtensilsCrossed

  return (
    <span
      className={`food-picto food-picto--${icon} ${className}`}
      data-icon={icon}
      aria-hidden="true"
    >
      <Icon size={18} strokeWidth={2.1} />
    </span>
  )
}
