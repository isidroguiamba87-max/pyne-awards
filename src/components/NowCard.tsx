import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { days } from '../lib/programa'
import { EVENT_START, maputoDate, programStatus, slots, useNow, type Slot } from '../lib/time'
import { IconClock, IconPin } from './Icons'

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

function SlotLine({ s, showDay }: { s: Slot; showDay: boolean }) {
  const { L } = useI18n()
  const day = days.find((d) => d.day === s.event.day)
  return (
    <div>
      <p className="font-serif text-xl leading-snug font-semibold text-white md:text-2xl">{L(s.item.title)}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
        <span className="inline-flex items-center gap-1.5">
          <IconClock className="h-4 w-4 text-gold" />
          {showDay && day ? `${L(day.label)} · ` : ''}
          {slotTime(s)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconPin className="h-4 w-4 text-gold" />
          {s.event.venue}
        </span>
      </p>
      <p className="mt-1 text-sm text-gold/90">{L(s.event.title)}</p>
      {s.item.lead && L(s.item.lead) && <p className="mt-1 text-sm text-white/60">{L(s.item.lead)}</p>}
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
        <div key={p.l} className="rounded-xl bg-navy-deep/70 px-2 py-3 text-center">
          <div className="font-serif text-3xl font-bold text-gold tabular-nums md:text-4xl">{String(p.v).padStart(2, '0')}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-white/65">{p.l}</div>
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

  const shell = 'rounded-2xl border border-gold/30 bg-navy-soft/80 p-5 shadow-xl shadow-black/20 md:p-7'

  if (phase === 'before') {
    return (
      <section className={shell} aria-labelledby="now-h">
        <h2 id="now-h" className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          {t('now.startsIn')}
        </h2>
        <Countdown t0={t0} />
        <div className="mt-5 border-t border-navy-line pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">{t('now.firstSession')}</p>
          <SlotLine s={slots[0]} showDay />
        </div>
      </section>
    )
  }

  if (phase === 'after') {
    return (
      <section className={`${shell} text-center`}>
        <h2 className="font-serif text-3xl font-bold text-gold">{t('now.after.title')}</h2>
        <p className="mx-auto mt-3 max-w-md text-white/80">{t('now.after.text')}</p>
        <Link to="/galeria" className="mt-5 inline-block rounded-xl bg-gold px-6 py-3 font-semibold text-navy hover:brightness-105">
          {t('now.after.cta')}
        </Link>
      </section>
    )
  }

  return (
    <section className={shell} aria-live="polite">
      {live.length > 0 ? (
        <>
          <div className="mb-3 flex items-center gap-3">
            <LiveBadge />
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">{t('now.title')}</h2>
          </div>
          <div className="space-y-4">
            {live.map((s) => (
              <SlotLine key={s.event.id + s.item.start} s={s} showDay={false} />
            ))}
          </div>
        </>
      ) : null}
      {next && (
        <div className={live.length > 0 ? 'mt-5 border-t border-navy-line pt-4' : ''}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">{t('now.next')}</h3>
          <SlotLine s={next} showDay={next.event.date !== today} />
        </div>
      )}
      <Link to="/agenda" className="mt-5 inline-block text-sm font-semibold text-gold underline-offset-4 hover:underline">
        {t('now.fullAgenda')} →
      </Link>
    </section>
  )
}
