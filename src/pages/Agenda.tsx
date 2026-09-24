import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconArrowUp, IconCheck, IconClock, IconPin, IconShirt, IconStar, IconUsers } from '../components/Icons'
import { LiveBadge } from '../components/NowCard'
import { useI18n } from '../i18n'
import { days, events, type Lang, type ProgramEvent } from '../lib/programa'
import { currentDay, isDone, isLive, slots, useNow, type Slot } from '../lib/time'

// ---------- utilitários ----------

function dateParts(date: string, lang: Lang) {
  const d = Date.parse(`${date}T12:00:00Z`)
  const loc = lang === 'pt' ? 'pt-PT' : 'en-GB'
  const clean = (s: string) => s.replace('.', '').toUpperCase()
  return {
    num: date.slice(8, 10),
    weekday: clean(new Intl.DateTimeFormat(loc, { weekday: 'short', timeZone: 'UTC' }).format(d)),
    month: clean(new Intl.DateTimeFormat(loc, { month: 'short', timeZone: 'UTC' }).format(d)),
  }
}

/** "S. Ex.ª Rasaque Manhique — Presidente do CMM" → pessoa com cargo */
function parseLead(lead: string) {
  const [name, ...rest] = lead.split(' — ')
  return rest.length ? { name, role: rest.join(' — ') } : null
}

function initials(name: string) {
  const words = name
    .replace(/^(S\. Ex\.ª|H\.E\.|Sra\.|Sr\.|Ms|Mr|Dr\.?)\s+/i, '')
    .split(/\s+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
  if (!words.length) return '·'
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase()
}

const KIND_STYLE: Record<string, string> = {
  speech: 'bg-amber-50 text-amber-800 ring-amber-200',
  panel: 'bg-sky-50 text-sky-800 ring-sky-200',
  networking: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  culture: 'bg-rose-50 text-rose-800 ring-rose-200',
  awards: 'bg-gold-grad text-navy ring-gold',
  logistics: 'bg-slate-100 text-slate-600 ring-slate-200',
  excursion: 'bg-teal-50 text-teal-800 ring-teal-200',
}

// ---------- componentes ----------

function Person({ name, role, small = false }: { name: string; role: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-navy font-bold text-gold ring-2 ring-gold/40 ${
          small ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs'
        }`}
        aria-hidden
      >
        {initials(name)}
      </span>
      <div className="min-w-0">
        <p className="text-sm leading-tight font-semibold text-ink">{name}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{role}</p>
      </div>
    </div>
  )
}

function Chip({ Icon, dark = false, children }: { Icon: typeof IconPin; dark?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] ring-1 ${
        dark ? 'bg-white/10 text-white ring-white/15' : 'bg-paper text-ink ring-paper-line'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${dark ? 'text-gold' : 'text-gold-deep'}`} />
      {children}
    </span>
  )
}

function ItemRow({ s, t0, last }: { s: Slot; t0: number; last: boolean }) {
  const { t, L } = useI18n()
  const live = isLive(s, t0)
  const done = isDone(s, t0)
  const lead = s.item.lead ? L(s.item.lead) : ''
  const person = lead ? parseLead(lead) : null
  const kind = s.item.kind
  const pct = live && s.end ? Math.min(100, Math.max(0, ((t0 - s.start) / (s.end - s.start)) * 100)) : 0

  return (
    <li id={live ? 'agora' : undefined} className="grid scroll-mt-40 grid-cols-[3.4rem_1.25rem_1fr] gap-x-2 sm:grid-cols-[4.5rem_1.5rem_1fr] sm:gap-x-3">
      {/* hora */}
      <div className={`pt-3 text-right tabular-nums ${done ? 'opacity-50' : ''}`}>
        <p className={`text-[15px] leading-none font-bold ${live ? 'text-red' : 'text-navy'}`}>{s.item.start}</p>
        {s.item.end && <p className="mt-1 text-xs text-ink-soft">{s.item.end}</p>}
      </div>

      {/* linha do tempo */}
      <div className="relative flex justify-center">
        <span className={`absolute top-0 w-px ${last ? 'h-4' : 'bottom-0'} ${done ? 'bg-paper-line' : 'bg-gradient-to-b from-gold to-gold/30'}`} aria-hidden />
        <span
          className={`relative z-10 mt-3 flex h-4 w-4 items-center justify-center rounded-full ${
            live
              ? 'bg-red ring-4 ring-red/20'
              : done
                ? 'bg-paper-line text-ink-soft'
                : kind === 'awards'
                  ? 'bg-gold-grad ring-4 ring-gold/25'
                  : 'border-2 border-gold bg-white'
          }`}
        >
          {live && <span className="animate-live h-1.5 w-1.5 rounded-full bg-white" />}
          {done && <IconCheck className="h-2.5 w-2.5" strokeWidth={3.5} />}
        </span>
      </div>

      {/* conteúdo */}
      <div className="min-w-0 pb-3">
        <div
          className={`rounded-xl px-3.5 py-3 transition ${
            live
              ? 'bg-red/[0.06] ring-1 ring-red/40'
              : kind === 'awards'
                ? 'bg-gold/10 ring-1 ring-gold/50'
                : 'hover:bg-paper'
          } ${done ? 'opacity-55' : ''}`}
          aria-current={live ? 'true' : undefined}
        >
          {(live || kind) && (
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              {live && <LiveBadge />}
              {kind && KIND_STYLE[kind] && (
                <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold tracking-wider uppercase ring-1 ring-inset ${KIND_STYLE[kind]}`}>
                  {t(`kind.${kind}` as Parameters<typeof t>[0])}
                </span>
              )}
            </div>
          )}
          <p className={`leading-snug font-semibold text-ink ${kind === 'awards' ? 'font-serif text-lg' : 'text-[15px]'}`}>{L(s.item.title)}</p>
          {done && <span className="sr-only">({t('agenda.done')})</span>}

          {person ? (
            <div className="mt-2.5">
              <Person name={person.name} role={person.role} small />
            </div>
          ) : (
            lead && <p className="mt-1 text-[13px] text-ink-soft">{lead}</p>
          )}

          {s.item.speakers && s.item.speakers.length > 0 && (
            <div className="mt-3 grid gap-2.5 border-t border-paper-line pt-3 sm:grid-cols-2">
              {s.item.speakers.map((sp) => (
                <Person key={sp.name} name={sp.name} role={L(sp.role)} />
              ))}
            </div>
          )}

          {live && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-line" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-red to-gold" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

function EventCard({ ev, t0 }: { ev: ProgramEvent; t0: number }) {
  const { t, L } = useI18n()
  const own = slots.filter((s) => s.event.id === ev.id)
  const gala = !!ev.highlight

  return (
    <article
      id={ev.id}
      className={`relative scroll-mt-36 overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_-20px_rgba(19,38,61,0.3)] ${
        gala ? 'ring-2 ring-gold' : 'ring-1 ring-paper-line'
      }`}
    >
      {/* A Gala tem cabeçalho escuro para se destacar; os restantes são claros */}
      <header className={`relative isolate overflow-hidden p-5 md:p-7 ${gala ? 'hero-bg text-white' : ''}`}>
        <div
          className={`pattern-diamonds absolute inset-0 -z-10 ${gala ? 'opacity-[0.1]' : 'opacity-[0.09]'} [mask-image:linear-gradient(120deg,black,transparent_70%)]`}
          aria-hidden
        />
        {gala && <div className="absolute -top-24 -right-16 -z-10 h-64 w-64 rounded-full bg-gold/25 blur-3xl" aria-hidden />}
        <div className="bg-gold-grad absolute inset-y-0 left-0 w-1.5" aria-hidden />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {ev.subtitle && (
              <p className={`flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase ${gala ? 'text-gold' : 'text-gold-deep'}`}>
                {gala && <IconStar className="h-3.5 w-3.5 fill-gold" />}
                {L(ev.subtitle)}
              </p>
            )}
            <h2 className={`mt-2 font-serif leading-[1.1] font-bold ${gala ? 'text-gold-grad text-[1.9rem] md:text-4xl' : 'text-2xl text-ink md:text-3xl'}`}>
              {L(ev.title)}
            </h2>
          </div>
          {gala && (
            <span className="bg-gold-grad hidden shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider text-navy uppercase shadow-md sm:inline-block">
              {t('agenda.main')}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip Icon={IconClock} dark={gala}>
            <span className="font-semibold tabular-nums">{ev.time.replace('–', ' – ')}</span>
          </Chip>
          <Chip Icon={IconPin} dark={gala}>
            {ev.venue}
          </Chip>
          {ev.dressCode && (
            <Chip Icon={IconShirt} dark={gala}>
              <span className={gala ? 'text-white/65' : 'text-ink-soft'}>{t('agenda.dress')}:</span> <span className="font-semibold">{L(ev.dressCode)}</span>
            </Chip>
          )}
        </div>
        {ev.audience && (
          <p className={`mt-3 flex gap-2 text-[13px] leading-relaxed ${gala ? 'text-white/70' : 'text-ink-soft'}`}>
            <IconUsers className={`mt-0.5 h-4 w-4 shrink-0 ${gala ? 'text-gold' : 'text-gold-deep'}`} />
            <span>
              <span className={`font-semibold ${gala ? 'text-white' : 'text-ink'}`}>{t('agenda.audience')}:</span> {L(ev.audience)}
            </span>
          </p>
        )}
      </header>

      <div className={gala ? 'bg-gold-grad h-1' : 'h-px bg-paper-line'} aria-hidden />

      <ol className="px-3 pt-4 pb-2 sm:px-5 md:px-6">
        {own.map((s, i) => (
          <ItemRow key={i} s={s} t0={t0} last={i === own.length - 1} />
        ))}
      </ol>
    </article>
  )
}

// ---------- página ----------

export default function Agenda() {
  const { t, L, lang } = useI18n()
  const t0 = useNow(30_000)
  const [params, setParams] = useSearchParams()
  const fromUrl = Number(params.get('dia'))
  const [day, setDay] = useState<number>(() => (fromUrl >= 1 && fromUrl <= 3 ? fromUrl : (currentDay() ?? 1)))
  const today = currentDay(t0)
  const info = days.find((d) => d.day === day)!
  const dayEvents = events.filter((e) => e.day === day)
  const liveHere = slots.some((s) => s.event.day === day && isLive(s, t0))
  const venues = [...new Set(dayEvents.map((e) => e.venue))]
  const moments = slots.filter((s) => s.event.day === day).length

  function choose(d: number) {
    setDay(d)
    setParams({ dia: String(d) }, { replace: true })
  }

  return (
    <>
      {/* cabeçalho da página */}
      <section className="hero-bg relative isolate overflow-hidden text-white">
        <div className="pattern-diamonds absolute inset-0 -z-10 opacity-[0.06] [mask-image:radial-gradient(80%_100%_at_85%_0%,black,transparent)]" aria-hidden />
        <div className="mx-auto max-w-3xl px-4 pt-9 pb-8 md:pt-14 md:pb-10">
          <p className="text-[11px] font-bold tracking-[0.25em] text-gold uppercase md:text-xs">{t('agenda.kicker')}</p>
          <h1 className="mt-2 font-serif text-5xl font-bold md:text-6xl">{t('agenda.title')}</h1>
          <p className="mt-2 text-white/70">{t('agenda.range')}</p>
        </div>
        <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden />
      </section>

      <div className="mx-auto max-w-3xl px-4">
        {/* selector de dias */}
        <div
          role="tablist"
          aria-label={t('agenda.title')}
          className="sticky top-16 z-30 -mx-4 grid grid-cols-3 gap-2 border-b border-paper-line/70 bg-paper/90 px-4 py-3 backdrop-blur-md"
        >
          {days.map((d) => {
            const p = dateParts(d.date, lang)
            const active = day === d.day
            return (
              <button
                key={d.day}
                role="tab"
                aria-selected={active}
                aria-label={L(d.label)}
                onClick={() => choose(d.day)}
                className={`relative flex items-center justify-center gap-2.5 rounded-2xl px-2 py-2 text-left transition sm:justify-start sm:px-4 sm:py-3 ${
                  active
                    ? 'bg-navy text-white shadow-lg shadow-navy/25 ring-2 ring-gold'
                    : 'bg-white text-ink shadow-sm ring-1 ring-paper-line hover:ring-gold'
                }`}
              >
                <span className={`font-serif text-3xl leading-none font-bold tabular-nums sm:text-4xl ${active ? 'text-gold' : ''}`}>{p.num}</span>
                <span className="leading-tight">
                  <span className={`block text-[11px] font-bold tracking-wider ${active ? 'text-gold/90' : 'text-gold-deep'}`}>{p.weekday}</span>
                  <span className={`block text-xs font-semibold ${active ? 'text-white/80' : 'text-ink-soft'}`}>{p.month}</span>
                </span>
                <span className={`ml-auto hidden max-w-[8.5rem] text-[11px] leading-tight md:line-clamp-2 ${active ? 'text-white/70' : 'text-ink-soft'}`}>{L(d.theme)}</span>
                {today === d.day && (
                  <span className="absolute -top-2 right-1.5 rounded-full bg-red px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase shadow sm:right-3">
                    {t('agenda.today')}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* resumo do dia */}
        <div className="mt-5 mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wider text-gold-deep uppercase">{L(info.label)}</p>
            <h2 className="font-serif text-2xl font-bold text-ink md:text-3xl">{L(info.theme)}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {t('agenda.sessions', { n: moments })} · {venues.join(' · ')}
            </p>
          </div>
          {liveHere && (
            <a
              href="#agora"
              className="inline-flex items-center gap-2 rounded-full bg-red px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red/25 hover:brightness-110"
            >
              <IconArrowUp className="h-4 w-4 rotate-180" />
              {t('agenda.goNow')}
            </a>
          )}
        </div>

        <div role="tabpanel" className="space-y-7">
          {dayEvents.map((ev) => (
            <EventCard key={ev.id} ev={ev} t0={t0} />
          ))}
        </div>
      </div>
    </>
  )
}
