import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { MealSlot } from '../domain/models'
import type { DayKey } from '../lib/dates'
import { FoodSheet } from '../features/food/FoodSheet'
import { WeightSheet } from '../features/today/WeightSheet'
import { CardioSheet } from '../features/workout/CardioSheet'
import { BodyweightSheet } from '../features/workout/BodyweightSheet'
import { MeasurementSheet } from '../features/progress/MeasurementSheet'
import PhotoSheet from '../features/photos/PhotoSheet'

/** Logging surfaces that can be opened from anywhere (quick actions, screens). */
export type SheetSpec =
  | { type: 'food'; date: DayKey; meal?: MealSlot }
  | { type: 'weight'; date?: DayKey }
  | { type: 'cardio'; date: DayKey }
  | { type: 'bodyweight'; exerciseId?: string; date: DayKey }
  | { type: 'measure' }
  | { type: 'photo' }

interface SheetsApi {
  open: (s: SheetSpec) => void
  close: () => void
}

const Ctx = createContext<SheetsApi | null>(null)

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [spec, setSpec] = useState<SheetSpec | null>(null)
  // Keep the last spec while the closing animation runs.
  const [last, setLast] = useState<SheetSpec | null>(null)
  const open = useCallback((s: SheetSpec) => {
    setSpec(s)
    setLast(s)
  }, [])
  const close = useCallback(() => setSpec(null), [])
  const is = <T extends SheetSpec['type']>(t: T) => spec?.type === t
  const props = <T extends SheetSpec['type']>(t: T) =>
    (last?.type === t ? last : null) as Extract<SheetSpec, { type: T }> | null

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {props('food') && <FoodSheet open={is('food')} onClose={close} {...props('food')!} />}
      {props('weight') && <WeightSheet open={is('weight')} onClose={close} date={props('weight')!.date} />}
      {props('cardio') && <CardioSheet open={is('cardio')} onClose={close} date={props('cardio')!.date} />}
      {props('bodyweight') && <BodyweightSheet open={is('bodyweight')} onClose={close} {...props('bodyweight')!} />}
      {props('measure') && <MeasurementSheet open={is('measure')} onClose={close} />}
      {props('photo') && <PhotoSheet open={is('photo')} onClose={close} />}
    </Ctx.Provider>
  )
}

export function useSheets(): SheetsApi {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSheets outside SheetsProvider')
  return c
}
