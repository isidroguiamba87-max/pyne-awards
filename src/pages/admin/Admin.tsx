import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useI18n } from '../../i18n'
import { supabase } from '../../lib/supabase'
import PageHeader from '../../components/PageHeader'
import { Offline } from '../Galeria'
import AdminFotos from './AdminFotos'
import AdminPerguntas from './AdminPerguntas'

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

export default function Admin() {
  const { t } = useI18n()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<'photos' | 'questions'>('photos')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <>
    <PageHeader kicker="Pyne Awards Africa 2026" title={t('admin.title')}>
      {session && (
        <div className="flex items-center gap-3 text-sm text-white/75">
          <span className="hidden sm:inline">{session.user.email}</span>
          <button onClick={() => supabase?.auth.signOut()} className="rounded-lg border border-white/30 px-3 py-1.5 text-white hover:border-gold hover:text-gold">
            {t('admin.logout')}
          </button>
        </div>
      )}
    </PageHeader>
    <div className="mx-auto max-w-5xl px-4 pt-2">

      {!supabase ? (
        <div className="mt-6">
          <Offline />
        </div>
      ) : !ready ? null : !session ? (
        <Login />
      ) : (
        <>
          <div className="mt-6 flex gap-2 border-b border-paper-line" role="tablist">
            {(['photos', 'questions'] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`-mb-px border-b-2 px-4 py-3 font-semibold ${tab === k ? 'border-gold text-navy' : 'border-transparent text-ink-soft hover:text-ink'}`}
              >
                {t(k === 'photos' ? 'admin.tab.photos' : 'admin.tab.questions')}
              </button>
            ))}
          </div>
          {/* os dois ficam montados para o moderador não perder uploads em curso */}
          <div hidden={tab !== 'photos'}>
            <AdminFotos />
          </div>
          <div hidden={tab !== 'questions'}>
            <AdminPerguntas active={tab === 'questions'} />
          </div>
        </>
      )}
    </div>
    </>
  )
}
