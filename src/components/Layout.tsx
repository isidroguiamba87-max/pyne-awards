import { Link, NavLink, Outlet } from 'react-router-dom'
import { useEvent, useEventPath } from '../events/EventContext'
import { useI18n } from '../i18n'
import { IconCalendar, IconChat, IconChevronL, IconHome, IconImage } from './Icons'

const links = [
  { to: '', key: 'nav.home', Icon: IconHome, end: true },
  { to: '/agenda', key: 'nav.agenda', Icon: IconCalendar, end: false },
  { to: '/galeria', key: 'nav.gallery', Icon: IconImage, end: false },
  { to: '/perguntas', key: 'nav.questions', Icon: IconChat, end: false },
] as const

export function LangSwitch({ light = false }: { light?: boolean }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div
      className={`flex rounded-full border p-0.5 text-xs font-semibold ${light ? 'border-navy/20' : 'border-gold/40'}`}
      role="group"
      aria-label={t('lang.switch')}
    >
      {(['pt', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-3 py-1.5 uppercase transition ${
            lang === l ? (light ? 'bg-navy text-white' : 'bg-gold text-navy') : light ? 'text-ink-soft hover:text-ink' : 'text-white/75 hover:text-white'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

/** Crédito discreto no fundo de todas as páginas */
export function Credit() {
  const { t } = useI18n()
  return (
    <a href="https://www.smartbp.tech/" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 transition hover:text-white/75">
      <img src="/smartbp-logo.png" alt="" width={20} height={20} className="h-5 w-5 opacity-80 group-hover:opacity-100" loading="lazy" />
      <span>
        {t('footer.builtWith')} <span className="text-red/70">♥</span> {t('footer.by')}{' '}
        <span className="font-medium text-white/65 group-hover:text-white/90">SmartBP Tech</span>
      </span>
    </a>
  )
}

function Footer() {
  const { t } = useI18n()
  const ev = useEvent()
  const banner = ev.footer.partnersBanner
  return (
    <footer className={`border-t-2 border-gold/70 pb-24 md:pb-0 ${ev.look === 'light' ? 'bg-navy-deep' : 'bg-[#14253d]'}`}>
      {banner && (
        <>
          <p className="pt-8 text-center text-xs uppercase tracking-[0.2em] text-white/60">{t('home.partners')}</p>
          <img src={banner.src} alt={banner.alt} className="mx-auto aspect-[1400/377] w-full max-w-5xl object-cover md:aspect-[2480/377]" loading="lazy" />
        </>
      )}
      <div className={`flex flex-col items-center gap-1 px-4 pb-6 text-xs text-white/50 ${banner ? '' : 'pt-8'}`}>
        <p>{ev.footer.copyright}</p>
        <Credit />
      </div>
    </footer>
  )
}

/** Logótipo do evento no cabeçalho */
function EventLogo() {
  const ev = useEvent()
  if (ev.look === 'light') {
    return <img src={ev.logo.src} alt={ev.logo.alt} width={ev.logo.width} height={ev.logo.height} className="h-9 w-auto sm:h-11" />
  }
  // Pyne: emblema + nome (como sempre foi)
  return (
    <>
      <img src={ev.logo.src} alt="" className="h-10 w-auto" />
      <span className="font-serif text-lg leading-tight font-semibold">
        Pyne Awards <span className="text-gold">Africa</span>
      </span>
    </>
  )
}

export default function Layout() {
  const { t } = useI18n()
  const ev = useEvent()
  const path = useEventPath()
  const light = ev.look === 'light'

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-navy">
        {t('skip')}
      </a>
      <header className={`sticky top-0 z-40 border-b backdrop-blur ${light ? 'border-paper-line bg-white/95 text-ink' : 'border-navy-line/70 bg-navy/90 text-white'}`}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg py-1.5 pr-2 text-xs font-semibold transition ${light ? 'text-ink-soft hover:text-ink' : 'text-white/60 hover:text-gold'}`}
              aria-label={t('events.all')}
              title={t('events.all')}
            >
              <IconChevronL className="h-4 w-4" />
              <span className="hidden lg:inline">{t('events.all')}</span>
            </Link>
            <Link to={path()} className="flex min-w-0 items-center gap-2.5">
              <EventLogo />
            </Link>
          </div>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {links.map(({ to, key, end }) => (
              <NavLink
                key={to}
                to={path(to)}
                end={end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    light ? (isActive ? 'event-underline text-ink' : 'text-ink-soft hover:text-ink') : isActive ? 'text-gold' : 'text-white/80 hover:text-white'
                  }`
                }
              >
                {t(key)}
              </NavLink>
            ))}
          </nav>
          <LangSwitch light={light} />
        </div>
      </header>

      <main id="main" className="flex-1 bg-paper pb-16 text-ink">
        <Outlet />
      </main>

      <Footer />

      {/* Barra de navegação inferior no telemóvel */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden ${
          light ? 'border-paper-line bg-white/95' : 'border-navy-line bg-navy-deep/95'
        }`}
        aria-label="Principal"
      >
        <div className="grid grid-cols-4">
          {links.map(({ to, key, Icon, end }) => (
            <NavLink
              key={to}
              to={path(to)}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  light ? (isActive ? 'text-gold-deep' : 'text-ink-soft') : isActive ? 'text-gold' : 'text-white/70'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              {t(key)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
