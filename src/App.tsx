import { lazy, Suspense, useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useI18n } from './i18n'
import Agenda from './pages/Agenda'
import Home from './pages/Home'

// Início e Agenda carregam logo (é o que se abre pelo QR); o resto só quando é preciso
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

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-serif text-6xl font-bold text-gold">404</p>
      <p className="mt-3 text-white/75">{t('notFound')}</p>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-gold px-5 py-3 font-semibold text-navy">
        {t('backHome')}
      </Link>
    </div>
  )
}

const TITLES: Record<string, string> = {
  '/agenda': 'nav.agenda',
  '/galeria': 'nav.gallery',
  '/perguntas': 'nav.questions',
  '/qr': 'qr.title',
  '/admin': 'admin.title',
}

export default function App() {
  const { pathname } = useLocation()
  const { t } = useI18n()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    const k = TITLES[pathname] as Parameters<typeof t>[0] | undefined
    document.title = k ? `${t(k)} · Pyne Awards Africa 2026` : 'Pyne Awards Africa 2026 · Maputo'
  }, [pathname, t])

  return (
    <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/ecra" element={<Ecra />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="galeria" element={<Galeria />} />
        <Route path="perguntas" element={<Perguntas />} />
        <Route path="qr" element={<QR />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
  )
}
