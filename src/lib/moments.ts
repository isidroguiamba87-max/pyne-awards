import { events, type ProgramEvent } from './programa'
import { eventRange, slots, type Slot } from './time'

// Liga uma hora (ex.: da foto) ao item da agenda que estava a decorrer.
// Margem: 60 min antes do bloco (chegadas) e 90 min depois (fotos de grupo, networking).
const BEFORE = 60 * 60_000
const AFTER = 90 * 60_000

const windows = events.map((e) => {
  const r = eventRange(e)
  return { event: e, from: r.start - BEFORE, to: r.end + AFTER, slots: slots.filter((s) => s.event.id === e.id) }
})

/** Se `eventId` for dado, só procura dentro desse bloco (evita pôr uma foto noutro evento) */
export function momentAt(t: number, eventId?: string | null): { event: ProgramEvent; slot: Slot } | null {
  const w = windows.find((x) => (!eventId || x.event.id === eventId) && x.from <= t && t <= x.to)
  if (!w) return null
  // último item que já tinha começado; antes do primeiro, conta como o primeiro
  let slot = w.slots[0]
  for (const s of w.slots) if (s.start <= t) slot = s
  return { event: w.event, slot }
}

export interface MomentGroup<T> {
  key: string
  event: ProgramEvent | null
  slot: Slot | null
  day: number | null
  items: T[]
  sortTime: number
}

/**
 * Agrupa por momento da agenda. `when` dá a hora de cada item; `fallback` indica a sessão/dia
 * escolhidos no upload e se a hora é exacta (EXIF). Fotos sem momento ficam em "Outros momentos" desse bloco/dia.
 * Grupos e itens vêm do mais recente para o mais antigo.
 */
export function groupByMoment<T>(
  list: T[],
  when: (x: T) => number,
  fallback: (x: T) => { eventId: string | null; day: number | null; exact: boolean },
): MomentGroup<T>[] {
  const map = new Map<string, MomentGroup<T>>()
  for (const x of list) {
    const t = when(x)
    const f = fallback(x)
    // hora exacta (câmara): decide sozinha; hora aproximada (upload): fica presa à sessão escolhida
    const m = momentAt(t, f.exact ? null : f.eventId)
    let key: string
    let g: Omit<MomentGroup<T>, 'items' | 'sortTime'>
    if (m) {
      key = `${m.event.id}|${m.slot.item.start}`
      g = { key, event: m.event, slot: m.slot, day: m.event.day }
    } else {
      const ev = events.find((e) => e.id === f.eventId) ?? null
      key = `outros|${ev?.id ?? ''}|${f.day ?? ''}`
      g = { key, event: ev, slot: null, day: ev?.day ?? f.day }
    }
    const cur = map.get(key)
    if (cur) {
      cur.items.push(x)
      cur.sortTime = Math.max(cur.sortTime, t)
    } else map.set(key, { ...g, items: [x], sortTime: m ? m.slot.start : t })
  }
  const groups = [...map.values()]
  for (const g of groups) g.items.sort((a, b) => when(b) - when(a))
  // ordem: evento mais recente primeiro → momentos do mais recente → "Outros momentos" no fim do evento
  const evStart = (g: MomentGroup<T>) => (g.event ? eventRange(g.event).start : g.sortTime)
  return groups.sort((a, b) => evStart(b) - evStart(a) || (b.slot ? b.slot.start : -Infinity) - (a.slot ? a.slot.start : -Infinity))
}
