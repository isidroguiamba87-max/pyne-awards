import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { days } from '../lib/programa'
import { EVENT_START, maputoDate, programStatus, slots, useNow, type Slot } from '../lib/time'
import { IconClock, IconPin } from './Icons'
import { venueMapUrl } from '../lib/venues'

export function LiveBadge({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-red px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white ${className}`}>
      <span className="animate-live h-2 w-2 rounded-full bg-white" aria-hidden />
      {t('now.live')}
    </span>
  )
}

export function slotTime(s: Slot) {
  return s.item.end ? `${s.item.start}–${s.item.end}` : s.item.start
}

function SlotLine({ s, showDay, big = false }: { s: Slot; showDay: boolean; big?: boolean }) {
  const { L, t } = useI18n()
  const day = days.find((d) => d.day === s.event.day)
  return (
    <div>
      <p className={`font-serif leading-snug font-semibold text-ink ${big ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>{L(s.item.title)}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <IconClock className="h-4 w-4 text-gold-deep" />
          {showDay && day ? `${L(day.label)} · ` : ''}
          {slotTime(s)}
        </span>
        <a
          href={venueMapUrl(s.event.venue)}
          target="_blank"
          rel="noopener noreferrer"
          title={`${t('agenda.map')}: ${s.event.venue}`}
          className="inline-flex items-center gap-1.5 underline decoration-ink-soft/30 underline-offset-2 hover:text-ink hover:decoration-gold"
        >
          <IconPin className="h-4 w-4 text-gold-deep" />
          {s.event.venue}
        </a>
      </p>
      <p className="mt-1 text-sm font-medium text-gold-deep">{L(s.event.title)}</p>
      {s.item.lead && L(s.item.lead) && <p className="mt-1 text-sm text-ink-soft">{L(s.item.lead)}</p>}
    </div>
  )
}

function Countdown({ t0 }: { t0: number }) {
  const { t } = useI18n()
  const diff = Math.max(0, EVENT_START - t0)
  const parts = [
    { v: Math.floor(diff / 86_400_000), l: t('now.days') },
    { v: Math.floor(diff / 3_600_000) % 24, l: t('now.hours') },
    { v: Math.floor(diff / 60_000) % 60, l: t('now.min') },
    { v: Math.floor(diff / 1000) % 60, l: t('now.sec') },
  ]
  return (
    <div className="grid grid-cols-4 gap-2" role="timer">
      {parts.map((p) => (
        <div key={p.l} className="rounded-xl bg-navy px-2 py-3 text-center shadow-inner">
          <div className="font-serif text-3xl font-bold text-gold tabular-nums md:text-4xl">{String(p.v).padStart(2, '0')}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-white/70">{p.l}</div>
        </div>
      ))}
    </div>
  )
}

export default function NowCard() {
  const { t } = useI18n()
  // 1 s antes do evento (contagem), 30 s durante
  const t0 = useNow(Date.now() < EVENT_START ? 1000 : 30_000)
  const { phase, live, next } = programStatus(t0)
  const today = maputoDate(t0)

  const shell =
    'relative overflow-hidden rounded-3xl bg-white p-5 text-ink shadow-[0_20px_60px_-15px_rgba(19,38,61,0.35)] ring-1 ring-paper-line md:p-8'
  const topBar = <div className="bg-gold-grad absolute inset-x-0 top-0 h-1.5" aria-hidden />

  if (phase === 'before') {
    return (
      <section className={shell} aria-labelledby="now-h">
        {topBar}
        <h2 id="now-h" className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">
          {t('now.startsIn')}
        </h2>
        <Countdown t0={t0} />
        <div className="mt-5 border-t border-paper-line pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">{t('now.firstSession')}</p>
          <SlotLine s={slots[0]} showDay />
        </div>
      </section>
    )
  }

  if (phase === 'after') {
    return (
      <section className={`${shell} text-center`}>
        {topBar}
        <h2 className="font-serif text-3xl font-bold text-ink">{t('now.after.title')}</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{t('now.after.text')}</p>
        <Link to="/galeria" className="mt-5 inline-block rounded-xl bg-navy px-6 py-3 font-semibold text-gold hover:bg-navy-soft">
          {t('now.after.cta')}
        </Link>
      </section>
    )
  }

  return (
    <section className={shell} aria-live="polite">
      {topBar}
      <div className={next && live.length > 0 ? 'grid gap-6 md:grid-cols-[1.4fr_1fr] md:gap-8' : ''}>
        {live.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <LiveBadge />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">{t('now.title')}</h2>
            </div>
            <div className="space-y-4">
              {live.map((s) => (
                <SlotLine key={s.event.id + s.item.start} s={s} showDay={false} big />
              ))}
            </div>
          </div>
        )}
        {next && (
          <div className={live.length > 0 ? 'rounded-2xl bg-paper p-4 ring-1 ring-paper-line md:p-5' : ''}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">{t('now.next')}</h3>
            <SlotLine s={next} showDay={next.event.date !== today} big={live.length === 0} />
          </div>
        )}
      </div>
      <Link to="/agenda" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-deep">
        {t('now.fullAgenda')} →
      </Link>
    </section>
  )
}
