import { useEffect, useState } from 'react'
import { days, events, type Item, type ProgramEvent } from './programa'

// Maputo = UTC+2 todo o ano (sem horário de Verão). Todas as horas do programa
// são convertidas para instantes absolutos com este offset, por isso o "agora"
// é correcto independentemente do fuso do dispositivo.
const MAPUTO_OFFSET = '+02:00'
export const TZ = 'Africa/Maputo'

// Para testar: ?now=2026-09-24T09:05 (hora de Maputo). O relógio continua a andar.
let offsetMs = 0
try {
  const fake = new URLSearchParams(window.location.search).get('now')
  if (fake) {
    const t = Date.parse(fake.length <= 16 ? `${fake}:00${MAPUTO_OFFSET}` : fake)
    if (!Number.isNaN(t)) offsetMs = t - Date.now()
  }
} catch {
  /* ignorar */
}

export function now() {
  return Date.now() + offsetMs
}

export function at(date: string, hhmm: string) {
  return Date.parse(`${date}T${hhmm}:00${MAPUTO_OFFSET}`)
}

/** Data actual em Maputo no formato YYYY-MM-DD */
export function maputoDate(ms = now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ms)
}

export function maputoTime(ms = now()) {
  return new Intl.DateTimeFormat('pt-PT', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(ms)
}

export interface Slot {
  event: ProgramEvent
  item: Item
  start: number
  end: number | null
}

export const slots: Slot[] = events
  .flatMap((event) =>
    event.items.map((item) => ({
      event,
      item,
      start: at(event.date, item.start),
      end: item.end ? at(event.date, item.end) : null,
    })),
  )
  .sort((a, b) => a.start - b.start)

export const EVENT_START = slots[0].start
const last = slots[slots.length - 1]
export const EVENT_END = last.end ?? last.start

export function isLive(s: Slot, t = now()) {
  return s.end !== null && s.start <= t && t < s.end
}

export function isDone(s: Slot, t = now()) {
  return (s.end ?? s.start) <= t && !isLive(s, t)
}

export function eventRange(e: ProgramEvent) {
  const own = slots.filter((s) => s.event.id === e.id)
  const l = own[own.length - 1]
  return { start: own[0].start, end: l.end ?? l.start }
}

export function programStatus(t = now()) {
  const live = slots.filter((s) => isLive(s, t))
  const next = slots.find((s) => s.start > t) ?? null
  const phase: 'before' | 'during' | 'after' = t < EVENT_START ? 'before' : t >= EVENT_END ? 'after' : 'during'
  return { phase, live, next }
}

/** Número do dia do evento (1–3) se hoje for dia de evento em Maputo */
export function currentDay(t = now()): number | null {
  const d = maputoDate(t)
  return days.find((x) => x.date === d)?.day ?? null
}

/** Bloco (evento) por defeito: o que está a decorrer, senão o próximo, senão o último */
export function defaultEventId(t = now()): string {
  const running = events.find((e) => {
    const r = eventRange(e)
    return r.start <= t && t < r.end
  })
  if (running) return running.id
  const upcoming = events.find((e) => eventRange(e).start > t)
  return (upcoming ?? events[events.length - 1]).id
}

/** Re-renderiza o componente a cada `intervalMs` e devolve o instante actual */
export function useNow(intervalMs = 30_000) {
  const [t, setT] = useState(now)
  useEffect(() => {
    const id = window.setInterval(() => setT(now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return t
}
