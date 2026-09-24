import { Link } from 'react-router-dom'
import NowCard from '../components/NowCard'
import { IconCalendar, IconChat, IconChevronR, IconImage, IconPin } from '../components/Icons'
import { useI18n } from '../i18n'
import { days, events } from '../lib/programa'

const venues = new Set(events.map((e) => e.venue.split(',')[0].trim())).size

export default function Home() {
  const { t } = useI18n()
  const shortcuts = [
    { to: '/agenda', title: t('nav.agenda'), sub: t('home.agenda.sub'), Icon: IconCalendar },
    { to: '/galeria', title: t('nav.gallery'), sub: t('home.gallery.sub'), Icon: IconImage },
    { to: '/perguntas', title: t('nav.questions'), sub: t('home.questions.sub'), Icon: IconChat },
  ]
  const stats = [
    { n: days.length, l: t('home.stat.days') },
    { n: events.length, l: t('home.stat.events') },
    { n: venues, l: t('home.stat.venues') },
  ]

  return (
    <>
      <section className="hero-bg relative isolate overflow-hidden text-white">
        {/* foto de fundo (ELEVATE, Polana Serena) com véu azul-marinho para o texto ler bem */}
        <img
          src="/hero-elevate.webp"
          alt=""
          aria-hidden
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_45%]"
        />
        <div
          className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(12,26,43,0.38)_0%,rgba(12,26,43,0.5)_100%)] md:bg-[linear-gradient(90deg,rgba(10,23,40,0.62)_0%,rgba(19,38,61,0.42)_42%,rgba(19,38,61,0.1)_72%,rgba(19,38,61,0)_100%)]"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 -z-20 h-1/4 bg-gradient-to-t from-[#0c1a2b]/45 to-transparent" aria-hidden />
        {/* sombra localizada por trás do bloco de texto */}
        <div
          className="absolute inset-0 -z-20 bg-[radial-gradient(60%_55%_at_40%_45%,rgba(10,23,40,0.55),transparent_75%)] md:bg-[radial-gradient(45%_60%_at_42%_48%,rgba(10,23,40,0.6),transparent_80%)]"
          aria-hidden
        />
        {/* camadas decorativas */}
        <div
          className="pattern-diamonds absolute inset-0 -z-10 opacity-[0.03] [mask-image:radial-gradient(70%_80%_at_20%_40%,black,transparent)]"
          aria-hidden
        />
        <div className="animate-glow absolute top-[8%] left-[-10%] -z-10 h-80 w-80 rounded-full bg-[#f59e0b]/10 blur-3xl md:left-[2%] md:h-[28rem] md:w-[28rem]" aria-hidden />
        <div className="absolute right-[-15%] bottom-[-30%] -z-10 h-80 w-80 rounded-full bg-red/25 blur-3xl" aria-hidden />

        <div className="mx-auto max-w-5xl px-4 pt-10 pb-20 md:pt-16 md:pb-28">
          <div className="flex items-center gap-5 md:gap-12">
            <img
              src="/pyne-emblem-gold.png"
              alt="Emblema Pyne Awards"
              className="animate-fade-up h-40 w-auto shrink-0 drop-shadow-[0_0_28px_rgba(253,201,28,0.45)] md:h-72"
            />
            <div className="animate-fade-up [animation-delay:120ms] [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
              <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold md:text-xs">
                {t('home.edition')}
              </p>
              <h1 className="mt-3 font-serif text-[2.15rem] leading-[1.02] font-bold md:text-7xl">
                The Pyne Awards
                <br />
                <span className="text-gold-grad">Africa</span> <span className="text-white/95">2026</span>
              </h1>
              <div className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_2px_14px_rgba(0,0,0,0.75)] md:flex-row md:gap-5 md:text-lg">
                <span className="inline-flex items-center gap-2 font-medium">
                  <IconCalendar className="h-4 w-4 text-gold md:h-5 md:w-5" />
                  {t('home.dates')}
                </span>
                <span className="inline-flex items-center gap-2 text-white">
                  <IconPin className="h-4 w-4 text-gold md:h-5 md:w-5" />
                  {t('home.city')}
                </span>
              </div>
            </div>
          </div>

          <div className="animate-fade-up mt-8 [animation-delay:240ms] [text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_2px_14px_rgba(0,0,0,0.75)] md:mt-10">
            <dl className="flex justify-around gap-6 sm:justify-start sm:gap-12">
              {stats.map((s) => (
                <div key={s.l} className="text-center sm:text-left">
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="font-serif text-4xl font-bold text-gold-grad [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.9))_drop-shadow(0_2px_10px_rgba(0,0,0,0.6))]">{s.n}</dd>
                  <dd className="text-xs font-bold uppercase tracking-wider text-white">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden />
      </section>

      <div className="relative mx-auto -mt-12 max-w-5xl px-4">
        <NowCard />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {shortcuts.map(({ to, title, sub, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-white p-5 text-ink shadow-sm ring-1 ring-paper-line transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy/10 hover:ring-gold"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-gold shadow-md shadow-navy/20 transition group-hover:bg-gold group-hover:text-navy">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-xl font-semibold">{title}</span>
                <span className="block text-sm text-ink-soft">{sub}</span>
              </span>
              <IconChevronR className="h-5 w-5 shrink-0 text-ink/25 transition group-hover:translate-x-1 group-hover:text-gold-deep" />
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
