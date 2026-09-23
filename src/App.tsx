import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useI18n } from './i18n'
import Admin from './pages/admin/Admin'
import Agenda from './pages/Agenda'
import Ecra from './pages/Ecra'
import Galeria from './pages/Galeria'
import Home from './pages/Home'
import Perguntas from './pages/Perguntas'
import QR from './pages/QR'

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
  )
}
