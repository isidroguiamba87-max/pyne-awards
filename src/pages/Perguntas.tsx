import { useEffect, useState, type FormEvent } from 'react'
import { IconStar, IconThumb } from '../components/Icons'
import { useToast } from '../components/Toast'
import { useI18n } from '../i18n'
import { eventById, events } from '../lib/programa'
import { sortQuestions, useQuestions } from '../lib/questions'
import { getItem, getJSON, setItem, setJSON } from '../lib/storage'
import { supabase } from '../lib/supabase'
import { defaultEventId } from '../lib/time'
import { Offline } from './Galeria'

const MAX = 400
const COOLDOWN = 30_000
const LAST_KEY = 'pyne.q.last'
const VOTES_KEY = 'pyne.q.votes'

function AskForm() {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const [name, setName] = useState('')
  const [session, setSession] = useState(defaultEventId)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || sending) return
    const text = body.trim()
    if (text.length < 3) return toast(t('q.tooShort'), 'error')
    const last = Number(getItem(LAST_KEY) || 0)
    const wait = COOLDOWN - (Date.now() - last)
    if (wait > 0) return toast(t('q.wait', { s: Math.ceil(wait / 1000) }), 'error')

    setSending(true)
    // sem .select(): o público não pode ler perguntas pendentes (RLS)
    const { error } = await supabase.from('questions').insert({
      author_name: name.trim().slice(0, 60) || null,
      body: text.slice(0, MAX),
      event_id: session || null,
      lang,
    })
    setSending(false)
    if (error) return toast(t('q.error'), 'error')
    setItem(LAST_KEY, String(Date.now()))
    setBody('')
    setSent(true)
    toast(t('q.thanks'), 'success')
  }

  useEffect(() => {
    if (!sent) return
    const id = window.setTimeout(() => setSent(false), 8000)
    return () => window.clearTimeout(id)
  }, [sent])

  const field = 'mt-1.5 w-full rounded-xl border border-navy-line bg-navy-deep px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-gold focus:outline-none'

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gold/30 bg-navy-soft/70 p-5 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-white/85">
          {t('q.name')}
          <input className={field} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder={t('q.name.ph')} autoComplete="name" />
        </label>
        <label className="block text-sm font-medium text-white/85">
          {t('q.session')}
          <select className={field} value={session} onChange={(e) => setSession(e.target.value)}>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {L(ev.title)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium text-white/85">
        {t('q.body')}
        <textarea
          className={`${field} min-h-32 resize-y`}
          value={body}
          maxLength={MAX}
          required
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('q.body.ph')}
        />
      </label>
      <div className="mt-1 text-right text-xs text-white/55 tabular-nums">
        {body.length}/{MAX}
      </div>
      {sent && <p className="animate-pop-in mt-2 rounded-lg bg-gold/15 px-4 py-3 text-sm text-gold">{t('q.thanks')}</p>}
      <button
        type="submit"
        disabled={sending}
        className="mt-4 w-full rounded-xl bg-gold px-5 py-3.5 text-lg font-semibold text-navy hover:brightness-105 disabled:opacity-60"
      >
        {sending ? t('q.sending') : t('q.send')}
      </button>
    </form>
  )
}

export default function Perguntas() {
  const { t, L } = useI18n()
  const toast = useToast()
  const { items, setItems, loading, error, refresh } = useQuestions(['approved', 'answered'], 'questions-public')
  const [voted, setVoted] = useState<string[]>(() => getJSON<string[]>(VOTES_KEY, []))
  const [filter, setFilter] = useState('')

  async function vote(id: string) {
    if (!supabase || voted.includes(id)) return
    const next = [...voted, id]
    setVoted(next)
    setJSON(VOTES_KEY, next)
    setItems((xs) => sortQuestions(xs.map((q) => (q.id === id ? { ...q, votes: q.votes + 1 } : q))))
    const { error } = await supabase.rpc('upvote_question', { q_id: id })
    if (error) {
      toast(t('q.error'), 'error')
      refresh()
    }
  }

  const shown = filter ? items.filter((q) => q.event_id === filter) : items

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <h1 className="font-serif text-4xl font-bold">{t('q.title')}</h1>
      <p className="mt-1 mb-6 text-white/70">{t('q.sub')}</p>

      {!supabase ? (
        <Offline />
      ) : (
        <>
          <AskForm />

          <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold">{t('q.list')}</h2>
            <select
              aria-label={t('q.session')}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-full rounded-lg border border-navy-line bg-navy-deep px-3 py-2 text-sm text-white"
            >
              <option value="">{t('q.allSessions')}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {L(ev.title)}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="mt-4 text-white/70">{t('loadError')}</p>}
          {!loading && !error && shown.length === 0 && <p className="mt-6 text-white/60">{t('q.empty')}</p>}

          <ul className="mt-4 space-y-3">
            {shown.map((q) => {
              const ev = eventById(q.event_id)
              const hasVoted = voted.includes(q.id)
              const answered = q.status === 'answered'
              return (
                <li
                  key={q.id}
                  className={`flex gap-4 rounded-2xl border p-4 ${
                    q.pinned ? 'border-gold bg-gold/10' : 'border-navy-line bg-navy-soft/60'
                  } ${answered ? 'opacity-70' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {q.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-navy">
                          <IconStar className="h-3 w-3 fill-navy" /> {t('q.pinned')}
                        </span>
                      )}
                      {answered && <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">{t('q.answered')}</span>}
                    </div>
                    <p className="mt-1 text-lg leading-snug break-words text-white">{q.body}</p>
                    <p className="mt-1.5 text-sm text-white/55">
                      {q.author_name || t('q.anon')}
                      {ev && <> · <span className="text-gold/80">{L(ev.title)}</span></>}
                    </p>
                  </div>
                  <button
                    onClick={() => vote(q.id)}
                    disabled={hasVoted || answered}
                    aria-label={hasVoted ? t('q.voted') : t('q.vote')}
                    aria-pressed={hasVoted}
                    className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition ${
                      hasVoted ? 'border-gold bg-gold text-navy' : 'border-navy-line text-white hover:border-gold disabled:opacity-50'
                    }`}
                  >
                    <IconThumb className="h-5 w-5" />
                    {q.votes}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
