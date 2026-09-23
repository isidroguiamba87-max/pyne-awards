import { Link } from 'react-router-dom'
import NowCard from '../components/NowCard'
import { IconCalendar, IconChat, IconImage } from '../components/Icons'
import { useI18n } from '../i18n'

export default function Home() {
  const { t } = useI18n()
  const shortcuts = [
    { to: '/agenda', title: t('nav.agenda'), sub: t('home.agenda.sub'), Icon: IconCalendar },
    { to: '/galeria', title: t('nav.gallery'), sub: t('home.gallery.sub'), Icon: IconImage },
    { to: '/perguntas', title: t('nav.questions'), sub: t('home.questions.sub'), Icon: IconChat },
  ]

  return (
    <>
      <section className="hero-bg border-b border-navy-line/60">
        <div className="mx-auto flex max-w-5xl items-center gap-5 px-4 pt-10 pb-12 md:gap-10 md:pt-16 md:pb-20">
          <img src="/pyne-emblem-gold.png" alt="Emblema Pyne Awards" className="h-40 w-auto shrink-0 md:h-64" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold md:text-sm">{t('home.edition')}</p>
            <h1 className="mt-2 font-serif text-[2.1rem] leading-[1.05] font-bold md:text-6xl">
              The Pyne Awards
              <br />
              <span className="text-gold">Africa</span> 2026
            </h1>
            <p className="mt-4 text-base font-medium text-white md:text-xl">{t('home.dates')}</p>
            <p className="text-sm text-white/70 md:text-base">{t('home.city')}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-6 max-w-5xl px-4">
        <NowCard />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {shortcuts.map(({ to, title, sub, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-2xl border border-navy-line bg-navy-soft/60 p-5 transition hover:border-gold/60 hover:bg-navy-soft sm:flex-col sm:items-start"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-navy">
                <Icon className="h-6 w-6" />
              </span>
              <span>
                <span className="block font-serif text-xl font-semibold group-hover:text-gold">{title}</span>
                <span className="block text-sm text-white/70">{sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
