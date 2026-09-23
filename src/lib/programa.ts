import data from '../../data/programa.json'

export type Lang = 'pt' | 'en'
export type Localized = Record<Lang, string>

export interface Speaker {
  name: string
  role: Localized
}

export interface Item {
  start: string
  end: string | null
  title: Localized
  lead?: Localized
  kind?: string
  speakers?: Speaker[]
}

export interface ProgramEvent {
  id: string
  day: number
  date: string
  title: Localized
  subtitle?: Localized
  venue: string
  time: string
  dressCode: Localized | null
  audience: Localized | null
  highlight?: boolean
  items: Item[]
}

export interface Day {
  day: number
  date: string
  label: Localized
  theme: Localized
}

export const programa = data as unknown as {
  event: {
    name: string
    city: string
    dates: { start: string; end: string }
    timezone: string
  }
  days: Day[]
  events: ProgramEvent[]
}

export const days = programa.days
export const events = programa.events

export function eventById(id: string | null | undefined) {
  return events.find((e) => e.id === id)
}
