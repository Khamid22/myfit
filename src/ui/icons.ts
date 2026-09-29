import {
  Apple,
  Bike,
  Check,
  Coffee,
  CupSoda,
  Droplets,
  Dumbbell,
  Footprints,
  Hamburger,
  Heart,
  Moon,
  Salad,
  Sparkles,
  Sun,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** Icons selectable for habits. Stored by key so data stays independent of the icon library. */
export const HABIT_ICONS: Record<string, LucideIcon> = {
  hamburger: Hamburger,
  'cup-soda': CupSoda,
  zap: Zap,
  dumbbell: Dumbbell,
  footprints: Footprints,
  droplets: Droplets,
  coffee: Coffee,
  apple: Apple,
  salad: Salad,
  moon: Moon,
  sun: Sun,
  heart: Heart,
  bike: Bike,
  utensils: Utensils,
  sparkles: Sparkles,
  check: Check,
}

export const habitIcon = (key: string): LucideIcon => HABIT_ICONS[key] ?? Check
