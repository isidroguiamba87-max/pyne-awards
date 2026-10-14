import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import EventCard from '../../components/EventCard'
import { IconChevronL } from '../../components/Icons'
import { Credit, LangSwitch } from '../../components/Layout'
import { EVENTS, eventBySlug, eventPhase, formatDateRange } from '../../events'
import { EventNotFound, EventProvider, useEvent, useEventTheme } from '../../events/EventContext'
import { useI18n } from '../../i18n'
import { supabase } from '../../lib/supabase'
import { Offline } from '../Galeria'
import AdminFotos from './AdminFotos'
import AdminPerguntas from './AdminPerguntas'
import AdminVideos from './AdminVideos'
import AdminBiblioteca from './AdminBiblioteca'

function Login() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setErr(false)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setErr(true)
  }

  const field = 'mt-1.5 w-full rounded-xl border border-paper-line bg-paper px-4 py-3 text-ink focus:border-gold focus:outline-none'
  return (
    <form onSubmit={submit} className="relative mx-auto mt-6 max-w-sm space-y-4 overflow-hidden rounded-3xl bg-white p-6 shadow-[0_20px_60px_-20px_rgba(19,38,61,0.35)] ring-1 ring-paper-line">
      <label className="block text-sm font-medium">
        {t('admin.email')}
        <input type="email" required autoComplete="username" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">
        {t('admin.password')}
        <input type="password" required autoComplete="current-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {err && <p className="rounded-lg bg-red/10 px-3 py-2 text-sm font-medium text-red ring-1 ring-red/30">{t('admin.loginError')}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-navy py-3 font-semibold text-gold shadow-md hover:bg-navy-soft disabled:opacity-60">
        {t('admin.login')}
      </button>
    </form>
  )
}

type Tab = 'photos' | 'questions' | 'videos' | 'library'

/** Cabeçalho do admin (fora dos eventos): título, email, sair */
function AdminHeader({ session }: { session: Session | null }) {
  const { t } = useI18n()
  return (
    <header className="hero-bg relative text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <div>
          <p className="text-[11px] font-bold tracking-[0.25em] text-gold uppercase">galeria.mediacraft.co.mz</p>
          <h1 className="font-serif text-3xl font-bold">{t('admin.title')}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/75">
          {session && <span className="hidden sm:inline">{session.user.email}</span>}
          {session && (
            <button onClick={() => supabase?.auth.signOut()} className="rounded-lg border border-white/30 px-3 py-1.5 text-white hover:border-gold hover:text-gold">
              {t('admin.logout')}
            </button>
          )}
          <LangSwitch />
        </div>
      </div>
      <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden />
    </header>
  )
}

/** 1.º ecrã depois do login: escolher o evento (o de hoje fica sugerido, nunca abre sozinho) */
function AdminChooser() {
  const { t } = useI18n()
  return (
    <div className="pt-8">
      <h2 className="font-serif text-3xl font-bold text-ink">{t('events.title')}</h2>
      <p className="mt-1 text-ink-soft">{t('admin.choose.sub')}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {EVENTS.map((e) => (
          <EventCard key={e.slug} event={e} to={`/admin/${e.slug}`} recommended={eventPhase(e) === 'today'} />
        ))}
      </div>
    </div>
  )
}

/** Faixa fixa: em que evento se está a publicar */
function AdminEventBar() {
  const { t, L, lang } = useI18n()
  const ev = useEvent()
  return (
    <div className="sticky top-0 z-40 border-b-2 border-gold bg-navy text-white shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
        <p className="min-w-0 text-sm">
          <span className="text-white/70">{t('admin.publishingIn')}</span>{' '}
          <strong className="font-bold text-gold">
            {L(ev.name)} – {formatDateRange(ev, lang)}
          </strong>
        </p>
        <Link
          to="/admin"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20"
        >
          <IconChevronL className="h-4 w-4" />
          {t('admin.switchEvent')}
        </Link>
      </div>
    </div>
  )
}

/** Admin de um evento: separadores Fotos · Perguntas · Vídeos · Relatório */
function EventAdmin() {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('photos')
  return (
    <>
      <AdminEventBar />
      <div className="mx-auto max-w-5xl px-4">
        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-paper-line" role="tablist">
          {(['photos', 'questions', 'videos', 'library'] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-3 font-semibold ${tab === k ? 'border-gold text-navy' : 'border-transparent text-ink-soft hover:text-ink'}`}
            >
              {t(k === 'photos' ? 'admin.tab.photos' : k === 'questions' ? 'admin.tab.questions' : k === 'videos' ? 'admin.tab.videos' : 'admin.tab.library')}
            </button>
          ))}
        </div>
        {/* fotos e perguntas ficam montados para não perder uploads em curso */}
        <div hidden={tab !== 'photos'}>
          <AdminFotos />
        </div>
        <div hidden={tab !== 'questions'}>
          <AdminPerguntas active={tab === 'questions'} />
        </div>
        {tab === 'videos' && <AdminVideos />}
        {tab === 'library' && <AdminBiblioteca />}
      </div>
    </>
  )
}

export default function Admin() {
  const { eventSlug } = useParams()
  const event = eventSlug ? eventBySlug(eventSlug) : undefined
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  useEventTheme(event?.slug ?? null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (eventSlug && !event) return <EventNotFound />

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <AdminHeader session={session} />
      <main className="flex-1 pb-16">
        {!supabase ? (
          <div className="mx-auto mt-6 max-w-5xl px-4">
            <Offline />
          </div>
        ) : !ready ? null : !session ? (
          <div className="mx-auto max-w-5xl px-4 pt-2">
            <Login />
          </div>
        ) : event ? (
          <EventProvider event={event}>
            <EventAdmin />
          </EventProvider>
        ) : (
          <div className="mx-auto max-w-5xl px-4">
            <AdminChooser />
          </div>
        )}
      </main>
      <footer className="bg-navy-deep px-4 py-5 text-center text-xs text-white/50">
        <Credit />
      </footer>
    </div>
  )
}
