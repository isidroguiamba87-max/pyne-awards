import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconClock, IconPin, IconShirt, IconStar, IconUsers } from '../components/Icons'
import { LiveBadge } from '../components/NowCard'
import { useI18n } from '../i18n'
import { days, events, type ProgramEvent } from '../lib/programa'
import { currentDay, isDone, isLive, slots, useNow } from '../lib/time'

function Meta({ Icon, label, value }: { Icon: typeof IconPin; label: string; value: string }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/55">{label}</dt>
        <dd className="text-sm text-white/90">{value}</dd>
      </div>
    </div>
  )
}

function EventCard({ ev, t0 }: { ev: ProgramEvent; t0: number }) {
  const { t, L } = useI18n()
  const own = slots.filter((s) => s.event.id === ev.id)
  const gala = !!ev.highlight

  return (
    <article
      id={ev.id}
      className={`scroll-mt-20 overflow-hidden rounded-2xl border ${
        gala ? 'border-gold bg-gradient-to-b from-gold/15 to-navy-soft/60 shadow-lg shadow-gold/10' : 'border-navy-line bg-navy-soft/60'
      }`}
    >
      <header className={`p-5 md:p-6 ${gala ? 'border-b border-gold/40' : 'border-b border-navy-line'}`}>
        {ev.subtitle && (
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            {gala && <IconStar className="h-4 w-4 fill-gold" />}
            {L(ev.subtitle)}
          </p>
        )}
        <h2 className={`mt-1.5 font-serif font-bold leading-tight ${gala ? 'text-3xl text-gold' : 'text-2xl'}`}>{L(ev.title)}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Meta Icon={IconPin} label={t('agenda.venue')} value={ev.venue} />
          <Meta Icon={IconClock} label={t('agenda.time')} value={ev.time} />
          {ev.dressCode && <Meta Icon={IconShirt} label={t('agenda.dress')} value={L(ev.dressCode)} />}
          {ev.audience && <Meta Icon={IconUsers} label={t('agenda.audience')} value={L(ev.audience)} />}
        </dl>
      </header>

      <ol className="relative px-5 py-4 md:px-6">
        {own.map((s, i) => {
          const live = isLive(s, t0)
          const done = isDone(s, t0)
          const lead = s.item.lead ? L(s.item.lead) : ''
          return (
            <li key={i} className={`relative flex gap-4 pb-5 last:pb-1 ${done ? 'opacity-50' : ''}`} aria-current={live ? 'true' : undefined}>
              {/* linha do tempo */}
              <div className="relative flex w-3 shrink-0 justify-center">
                <span
                  className={`relative z-10 mt-1.5 h-3 w-3 rounded-full border-2 ${
                    live ? 'border-red bg-red ring-4 ring-red/30' : done ? 'border-white/40 bg-white/40' : 'border-gold bg-navy'
                  }`}
                />
                {i < own.length - 1 && <span className="absolute top-4 bottom-[-0.35rem] w-px bg-gold/35" aria-hidden />}
              </div>
              <div className={`min-w-0 flex-1 ${live ? '-mx-2 -my-1 rounded-xl bg-red/10 px-2 py-1 ring-1 ring-red/50' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gold tabular-nums">{s.item.end ? `${s.item.start} – ${s.item.end}` : s.item.start}</span>
                  {live && <LiveBadge />}
                  {done && <span className="sr-only">({t('agenda.done')})</span>}
                </div>
                <p className="mt-0.5 font-medium leading-snug text-white">{L(s.item.title)}</p>
                {lead && <p className="mt-0.5 text-sm text-white/65">{lead}</p>}
                {s.item.speakers && s.item.speakers.length > 0 && (
                  <ul className="mt-2 space-y-1.5 border-l-2 border-gold/40 pl-3">
                    {s.item.speakers.map((sp) => (
                      <li key={sp.name} className="text-sm">
                        <span className="font-semibold text-white">{sp.name}</span>
                        <span className="block text-white/60">{L(sp.role)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </article>
  )
}

export default function Agenda() {
  const { t, L } = useI18n()
  const t0 = useNow(30_000)
  const [params, setParams] = useSearchParams()
  const fromUrl = Number(params.get('dia'))
  const [day, setDay] = useState<number>(() => (fromUrl >= 1 && fromUrl <= 3 ? fromUrl : (currentDay() ?? 1)))
  const today = currentDay(t0)
  const info = days.find((d) => d.day === day)!

  function choose(d: number) {
    setDay(d)
    setParams({ dia: String(d) }, { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <h1 className="font-serif text-4xl font-bold">{t('agenda.title')}</h1>

      <div role="tablist" aria-label={t('agenda.title')} className="sticky top-16 z-30 -mx-4 mt-5 flex gap-2 overflow-x-auto bg-navy/95 px-4 py-3 backdrop-blur">
        {days.map((d) => (
          <button
            key={d.day}
            role="tab"
            aria-selected={day === d.day}
            onClick={() => choose(d.day)}
            className={`relative flex-1 shrink-0 rounded-xl border px-2 py-2.5 text-[13px] font-semibold whitespace-nowrap transition sm:px-3 sm:text-sm ${
              day === d.day ? 'border-gold bg-gold text-navy' : 'border-navy-line text-white/80 hover:border-gold/50'
            }`}
          >
            {L(d.label)}
            {today === d.day && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-navy bg-red" aria-hidden />
            )}
          </button>
        ))}
      </div>

      <p className="mt-2 mb-5 text-white/70">{L(info.theme)}</p>

      <div role="tabpanel" className="space-y-6">
        {events
          .filter((e) => e.day === day)
          .map((ev) => (
            <EventCard key={ev.id} ev={ev} t0={t0} />
          ))}
      </div>
    </div>
  )
}
