import { useEffect } from 'react'
import EventCard from '../components/EventCard'
import { Credit, LangSwitch } from '../components/Layout'
import { EVENTS } from '../events'
import { useEventTheme } from '../events/EventContext'
import { useI18n } from '../i18n'

/** Página inicial: escolha do evento (Pyne primeiro, depois o Citizen Connect) */
export default function EventChooser() {
  const { t } = useI18n()
  useEventTheme(null)

  useEffect(() => {
    document.title = `${t('events.title')} · galeria.mediacraft.co.mz`
  }, [t])

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-gold/40 bg-navy-deep">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <img src="/mediacraft-logo.png" alt="Media Craft Mozambique" width={979} height={285} className="h-8 w-auto" />
          <LangSwitch />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-10 pb-16 md:pt-16">
        <h1 className="font-serif text-4xl font-bold text-ink md:text-5xl">{t('events.title')}</h1>
        <p className="mt-2 text-ink-soft">{t('events.sub')}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {EVENTS.map((e) => (
            <EventCard key={e.slug} event={e} to={`/${e.slug}`} />
          ))}
        </div>
      </main>

      <footer className="bg-navy-deep px-4 py-6 text-center text-xs text-white/50">
        <Credit />
      </footer>
    </div>
  )
}
