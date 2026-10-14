import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { eventBySlug, type EventMeta } from './index'

const Ctx = createContext<EventMeta | null>(null)

/** Aplica o tema do evento (variáveis CSS em index.css: html[data-event="<slug>"]) */
export function useEventTheme(slug: string | null) {
  useEffect(() => {
    const root = document.documentElement
    if (slug) root.dataset.event = slug
    else delete root.dataset.event
    return () => {
      delete root.dataset.event
    }
  }, [slug])
}

export function EventProvider({ event, children }: { event: EventMeta; children: ReactNode }) {
  useEventTheme(event.slug)
  return <Ctx.Provider value={event}>{children}</Ctx.Provider>
}

/** Evento activo (dentro de /<slug>/... ou /admin/<slug>) */
export function useEvent(): EventMeta {
  const v = useContext(Ctx)
  if (!v) throw new Error('useEvent fora de um EventProvider')
  return v
}

/** Caminho dentro do evento activo: eventPath('/agenda') → '/citizen-connect-2026/agenda' */
export function useEventPath() {
  const e = useEvent()
  return (p = '') => `/${e.slug}${p}`
}

export function EventNotFound() {
  const { t } = useI18n()
  useEventTheme(null)
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 text-center text-ink">
      <div>
        <p className="font-serif text-6xl font-bold text-gold-deep">404</p>
        <p className="mt-3 text-ink-soft">{t('notFound')}</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-navy px-5 py-3 font-semibold text-gold">
          {t('events.all')}
        </Link>
      </div>
    </div>
  )
}

/** Rota /:eventSlug — valida o slug e fornece o evento às páginas filhas */
export function EventRoute() {
  const { eventSlug } = useParams()
  const event = eventBySlug(eventSlug)
  if (!event) return <EventNotFound />
  return (
    <EventProvider event={event}>
      <Outlet />
    </EventProvider>
  )
}
