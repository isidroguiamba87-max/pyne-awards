import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { DEFAULT_EVENT_SLUG, eventBySlug } from './events'
import { EventNotFound, EventRoute, useEvent } from './events/EventContext'
import { useI18n } from './i18n'
import Agenda from './pages/Agenda'
import EventChooser from './pages/EventChooser'
import EventHome from './pages/EventHome'

// Escolha do evento, início e agenda carregam logo (é o que se abre pelo QR); o resto só quando é preciso
const Admin = lazy(() => import('./pages/admin/Admin'))
const Ecra = lazy(() => import('./pages/Ecra'))
const Galeria = lazy(() => import('./pages/Galeria'))
const Perguntas = lazy(() => import('./pages/Perguntas'))
const QR = lazy(() => import('./pages/QR'))

function Loading() {
  return (
    <div className="flex justify-center py-24" role="status" aria-label="…">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
    </div>
  )
}

/**
 * Links antigos (QR Codes do Pyne já impressos): /agenda, /galeria, /perguntas, /ecra, /qr…
 * → /pyne-awards-2026/…, mantendo ?now=, ?ver=, ?sessao=, etc.
 */
function LegacyRedirect({ to, params = {} }: { to: string; params?: Record<string, string> }) {
  const { search, hash } = useLocation()
  const q = new URLSearchParams(search)
  for (const [k, v] of Object.entries(params)) if (!q.has(k)) q.set(k, v)
  const qs = q.toString()
  return <Navigate to={`/${DEFAULT_EVENT_SLUG}${to}${qs ? `?${qs}` : ''}${hash}`} replace />
}

/** Perguntas e /ecra só existem em eventos com Q&A; senão vai para o início do evento */
function WithQuestions({ children }: { children: ReactNode }) {
  const ev = useEvent()
  return ev.questions ? <>{children}</> : <Navigate to={`/${ev.slug}`} replace />
}

const TITLES: Record<string, string> = {
  agenda: 'nav.agenda',
  galeria: 'nav.gallery',
  perguntas: 'nav.questions',
  qr: 'qr.title',
}

export default function App() {
  const { pathname } = useLocation()
  const { t, L } = useI18n()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // título do separador: "<Página> · <evento>"
  useEffect(() => {
    const [, first, second] = pathname.split('/')
    const ev = eventBySlug(first === 'admin' ? second : first)
    if (first === 'admin') document.title = `${t('admin.title')}${ev ? ` · ${ev.shortName}` : ''}`
    else if (ev) {
      const k = TITLES[second ?? ''] as Parameters<typeof t>[0] | undefined
      document.title = k ? `${t(k)} · ${ev.shortName}` : `${L(ev.name)} · ${L(ev.city).split(',')[0]}`
    }
  }, [pathname, t, L])

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route index element={<EventChooser />} />

        {/* links antigos do Pyne */}
        <Route path="agenda" element={<LegacyRedirect to="/agenda" />} />
        <Route path="galeria" element={<LegacyRedirect to="/galeria" />} />
        <Route path="perguntas" element={<LegacyRedirect to="/perguntas" />} />
        <Route path="ecra" element={<LegacyRedirect to="/ecra" />} />
        <Route path="qr" element={<LegacyRedirect to="/qr" />} />
        <Route path="videos" element={<LegacyRedirect to="/galeria" params={{ ver: 'videos' }} />} />
        <Route path="biblioteca" element={<LegacyRedirect to="/galeria" params={{ ver: 'relatorio' }} />} />

        {/* admin: login → escolha do evento → admin do evento */}
        <Route path="admin" element={<Admin />} />
        <Route path="admin/:eventSlug" element={<Admin />} />

        {/* cada evento com o seu "mundo" */}
        <Route path=":eventSlug" element={<EventRoute />}>
          <Route path="ecra" element={<WithQuestions><Ecra /></WithQuestions>} />
          <Route element={<Layout />}>
            <Route index element={<EventHome />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="galeria" element={<Galeria />} />
            <Route path="perguntas" element={<WithQuestions><Perguntas /></WithQuestions>} />
            <Route path="qr" element={<QR />} />
            <Route path="*" element={<EventNotFound />} />
          </Route>
        </Route>
        <Route path="*" element={<EventNotFound />} />
      </Routes>
    </Suspense>
  )
}
