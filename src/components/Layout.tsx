import { Link, NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n'
import { IconCalendar, IconChat, IconHome, IconImage } from './Icons'

const links = [
  { to: '/', key: 'nav.home', Icon: IconHome, end: true },
  { to: '/agenda', key: 'nav.agenda', Icon: IconCalendar, end: false },
  { to: '/galeria', key: 'nav.gallery', Icon: IconImage, end: false },
  { to: '/perguntas', key: 'nav.questions', Icon: IconChat, end: false },
] as const

export function LangSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="flex rounded-full border border-gold/40 p-0.5 text-xs font-semibold" role="group" aria-label={t('lang.switch')}>
      {(['pt', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-3 py-1.5 uppercase transition ${lang === l ? 'bg-gold text-navy' : 'text-white/75 hover:text-white'}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="mt-16 border-t border-navy-line bg-[#14253d] pb-24 md:pb-0">
      <p className="pt-8 text-center text-xs uppercase tracking-[0.2em] text-white/60">{t('home.partners')}</p>
      <img
        src="/partners-banner.png"
        alt="The Pyne Awards Africa · República de Moçambique · Conselho Municipal de Maputo · I Love Maputo · Media Craft Mozambique"
        className="mx-auto aspect-[1400/377] w-full max-w-5xl object-cover md:aspect-[2480/377]"
        loading="lazy"
      />
      <p className="pb-6 text-center text-xs text-white/50">© 2026 The Pyne Hospitality Company · Maputo</p>
    </footer>
  )
}

export default function Layout() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-navy">
        {t('skip')}
      </a>
      <header className="sticky top-0 z-40 border-b border-navy-line/70 bg-navy/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/pyne-emblem-gold.png" alt="" className="h-10 w-auto" />
            <span className="font-serif text-lg leading-tight font-semibold">
              Pyne Awards <span className="text-gold">Africa</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {links.map(({ to, key, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-gold' : 'text-white/80 hover:text-white'}`
                }
              >
                {t(key)}
              </NavLink>
            ))}
          </nav>
          <LangSwitch />
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Barra de navegação inferior no telemóvel */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-line bg-navy-deep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Principal"
      >
        <div className="grid grid-cols-4">
          {links.map(({ to, key, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-gold' : 'text-white/70'}`
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
