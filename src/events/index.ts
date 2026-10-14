// Registo de eventos do site. Um evento novo = uma entrada nova aqui
// + o seu programa em data/events/<slug>.json + (opcional) tema em index.css.
import citizenConnect from '../../data/events/citizen-connect-2026.json'
import pyneAwards from '../../data/events/pyne-awards-2026.json'
import type { Lang, Localized, ProgramData } from '../lib/programa'
import { maputoDate, now } from '../lib/time'
import { buildProgram, type Program } from './program'

const ALBUM_BASE = 'https://fotos.mediacraft.co.mz'

export interface EventMeta {
  slug: string
  order: number
  name: Localized
  /** nome curto para faixas e títulos */
  shortName: string
  /** linha por cima do título no início do evento (ex.: "6.ª edição") */
  kicker?: Localized
  city: Localized
  dates: { start: string; end: string }
  program: Program
  /** aparência: 'dark' = cabeçalho escuro (Pyne); 'light' = cabeçalho claro (Citizen Connect) */
  look: 'dark' | 'light'
  /** logótipo no cabeçalho e no cartão de escolha */
  logo: { src: string; alt: string; width: number; height: number }
  /** imagem pequena no centro do QR e ícone do separador */
  qrCenter: { src: string; width: number; height: number }
  /** faixa oficial no topo do início do evento (Citizen Connect) */
  banner?: { src: string; alt: string; width: number; height: number }
  /** foto de fundo do topo do início (Pyne) */
  heroImage?: string
  /** "Ver mais fotos": álbum oficial deste evento */
  albumUrl: string
  /** vídeos guardados no projecto do álbum (só o Pyne tem) */
  albumVideos: boolean
  footer: { copyright: string; partnersBanner?: { src: string; alt: string } }
  /** links de mapa por nome de local (campo "venue" dos blocos) */
  venueMaps?: Record<string, string>
}

export const EVENTS: EventMeta[] = [
  {
    slug: 'pyne-awards-2026',
    order: 1,
    name: { pt: 'The Pyne Awards Africa 2026', en: 'The Pyne Awards Africa 2026' },
    shortName: 'Pyne Awards Africa 2026',
    kicker: { pt: '6.ª edição', en: '6th edition' },
    city: { pt: 'Maputo, Moçambique', en: 'Maputo, Mozambique' },
    dates: { start: '2026-09-24', end: '2026-09-26' },
    program: buildProgram(pyneAwards as unknown as ProgramData),
    look: 'dark',
    logo: { src: '/pyne-emblem-gold.png', alt: 'Pyne Awards Africa', width: 182, height: 437 },
    qrCenter: { src: '/pyne-emblem.png', width: 182, height: 437 },
    heroImage: '/hero-elevate.webp',
    albumUrl: `${ALBUM_BASE}/pyne-awards-2026`,
    albumVideos: true,
    footer: {
      copyright: '© 2026 The Pyne Hospitality Company · Maputo',
      partnersBanner: {
        src: '/partners-banner.png',
        alt: 'The Pyne Awards Africa · República de Moçambique · Conselho Municipal de Maputo · I Love Maputo · Media Craft Mozambique',
      },
    },
    venueMaps: {
      'Polana Serena Hotel': 'https://maps.app.goo.gl/bb5DqXSrK19mZ2W28',
      'Hotel Cardoso':
        'https://www.google.com/maps/place/Hotel+Cardoso+Maputo/@-25.9781775,32.5859374,17z/data=!4m9!3m8!1s0x1ee69ba1079afda7:0x1446007a51f5f550!5m2!4m1!1i2!8m2!3d-25.9781775!4d32.5859374!16s%2Fg%2F1xc60jv_!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDkyMS4wIKXMDSoASAFQAw%3D%3D',
    },
  },
  {
    slug: 'citizen-connect-2026',
    order: 2,
    name: { pt: 'Citizen Connect Africa – Moçambique', en: 'Citizen Connect Africa – Mozambique' },
    shortName: 'Citizen Connect Africa',
    kicker: { pt: 'Ideate · Innovate · Interact', en: 'Ideate · Innovate · Interact' },
    city: { pt: 'Maputo, Moçambique', en: 'Maputo, Mozambique' },
    dates: { start: '2026-10-14', end: '2026-10-14' },
    program: buildProgram(citizenConnect as unknown as ProgramData),
    look: 'light',
    logo: { src: '/events/citizen-connect-2026/header.png', alt: 'Citizen Connect Africa', width: 2109, height: 484 },
    qrCenter: { src: '/events/citizen-connect-2026/ring.png', width: 248, height: 320 },
    banner: { src: '/events/citizen-connect-2026/header.png', alt: 'República de Moçambique · Citizen Connect Africa · VFS Global · CiX', width: 2109, height: 484 },
    albumUrl: `${ALBUM_BASE}/citizen-connect-2026`,
    albumVideos: false,
    footer: { copyright: '© 2026 VFS Global · CiX' },
  },
].sort((a, b) => a.order - b.order) as EventMeta[]

export const DEFAULT_EVENT_SLUG = 'pyne-awards-2026'

export function eventBySlug(slug: string | null | undefined) {
  return EVENTS.find((e) => e.slug === slug)
}

/** Estado do evento pela data de Maputo */
export function eventPhase(e: EventMeta, t = now()): 'today' | 'soon' | 'past' {
  const d = maputoDate(t)
  if (d < e.dates.start) return 'soon'
  if (d > e.dates.end) return 'past'
  return 'today'
}

/** "24 – 26 Setembro 2026" / "14 Outubro 2026" (PT) · "24 – 26 September 2026" (EN) */
export function formatDateRange(e: EventMeta, lang: Lang) {
  const loc = lang === 'pt' ? 'pt-PT' : 'en-GB'
  const d = (s: string) => new Date(`${s}T12:00:00Z`)
  const part = (s: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: 'UTC', ...o }).format(d(s))
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const { start, end } = e.dates
  const month = cap(part(end, { month: 'long' }))
  const year = part(end, { year: 'numeric' })
  if (start === end) return `${part(start, { day: 'numeric' })} ${month} ${year}`
  if (start.slice(0, 7) === end.slice(0, 7)) return `${part(start, { day: 'numeric' })} – ${part(end, { day: 'numeric' })} ${month} ${year}`
  return `${part(start, { day: 'numeric' })} ${cap(part(start, { month: 'long' }))} – ${part(end, { day: 'numeric' })} ${month} ${year}`
}
