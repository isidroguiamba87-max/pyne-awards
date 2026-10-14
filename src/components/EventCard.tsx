import { Link } from 'react-router-dom'
import { eventPhase, formatDateRange, type EventMeta } from '../events'
import { useI18n } from '../i18n'
import { useNow } from '../lib/time'
import { IconCalendar, IconChevronR, IconPin, IconStar } from './Icons'

export function PhaseBadge({ event }: { event: EventMeta }) {
  const { t } = useI18n()
  const t0 = useNow(60_000)
  const phase = eventPhase(event, t0)
  if (phase === 'today')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow">
        <span className="animate-live h-2 w-2 rounded-full bg-white" aria-hidden />
        {t('events.today')}
      </span>
    )
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ring-1 ${
        phase === 'soon' ? 'bg-white text-navy ring-navy/20' : 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {t(phase === 'soon' ? 'events.soon' : 'events.past')}
    </span>
  )
}

/**
 * Cartão de um evento com as cores do próprio evento (data-event aplica o tema só a este cartão).
 * Usado na página inicial e na escolha de evento do admin.
 */
export default function EventCard({ event, to, recommended = false }: { event: EventMeta; to: string; recommended?: boolean }) {
  const { t, L, lang } = useI18n()
  const light = event.look === 'light'

  return (
    <Link
      to={to}
      data-event={event.slug}
      className={`group relative flex flex-col overflow-hidden rounded-3xl shadow-[0_24px_60px_-24px_rgba(19,38,61,0.45)] ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-24px_rgba(19,38,61,0.55)] ${
        recommended ? 'ring-4 ring-red/70' : light ? 'ring-paper-line' : 'ring-gold/40'
      }`}
    >
      {/* topo com a identidade do evento */}
      {light ? (
        <div className="relative flex aspect-[16/7] items-center justify-center bg-white px-6">
          <img src={event.logo.src} alt={event.logo.alt} className="max-h-[78%] w-full object-contain" />
          <div className="gold-rule absolute inset-x-0 bottom-0 h-1" aria-hidden />
        </div>
      ) : (
        <div className="hero-bg relative isolate flex aspect-[16/7] items-center gap-4 overflow-hidden px-6 text-white">
          {event.heroImage && <img src={event.heroImage} alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30" />}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/90 to-navy/40" aria-hidden />
          <img src={event.logo.src} alt="" className="h-[70%] w-auto shrink-0 drop-shadow-[0_0_20px_rgba(253,201,28,0.45)]" />
          <p className="font-serif text-2xl leading-tight font-bold sm:text-3xl">
            The Pyne Awards
            <br />
            <span className="text-gold-grad">Africa</span> 2026
          </p>
          <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden />
        </div>
      )}

      {/* informação */}
      <div className="flex flex-1 flex-col bg-white p-5 text-ink md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <PhaseBadge event={event} />
          {recommended && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red/10 px-2.5 py-1 text-[11px] font-bold text-red ring-1 ring-red/30">
              <IconStar className="h-3 w-3 fill-red" />
              {t('admin.choose.recommended')}
            </span>
          )}
        </div>
        <h2 className="mt-3 font-serif text-xl leading-snug font-bold text-ink md:text-2xl">{L(event.name)}</h2>
        {event.kicker && <p className="mt-0.5 text-sm font-semibold text-gold-deep">{L(event.kicker)}</p>}
        <div className="mt-3 space-y-1 text-sm text-ink-soft">
          <p className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-gold-deep" />
            {formatDateRange(event, lang)}
          </p>
          <p className="flex items-center gap-2">
            <IconPin className="h-4 w-4 text-gold-deep" />
            {L(event.city)}
          </p>
        </div>
        <span className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-xl bg-navy px-5 py-3 font-semibold text-gold shadow-md transition group-hover:bg-navy-soft">
          {t('events.enter')}
          <IconChevronR className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
