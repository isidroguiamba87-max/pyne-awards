import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconStar, IconThumb } from '../../components/Icons'
import { useToast } from '../../components/Toast'
import { useI18n } from '../../i18n'
import { eventById } from '../../lib/programa'
import { useQuestions } from '../../lib/questions'
import { supabase, type Question, type QuestionStatus } from '../../lib/supabase'

const TABS: QuestionStatus[] = ['pending', 'approved', 'answered', 'rejected']

export default function AdminPerguntas({ active }: { active: boolean }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const { items, setItems, loading, refresh } = useQuestions(TABS, 'questions-admin')
  const [tab, setTab] = useState<QuestionStatus>('pending')
  const [newCount, setNewCount] = useState(0)
  const seen = useRef<Set<string> | null>(null)

  // contar novas pendentes que chegam sem recarregar
  useEffect(() => {
    const pending = items.filter((q) => q.status === 'pending').map((q) => q.id)
    if (seen.current === null) {
      if (!loading) seen.current = new Set(pending)
      return
    }
    const fresh = pending.filter((id) => !seen.current!.has(id))
    if (fresh.length) {
      fresh.forEach((id) => seen.current!.add(id))
      if (!(active && tab === 'pending')) setNewCount((n) => n + fresh.length)
      toast(t('admin.q.newPending', { n: fresh.length }), 'info')
    }
  }, [items, loading, active, tab, t, toast])

  useEffect(() => {
    if (active && tab === 'pending') setNewCount(0)
  }, [active, tab])

  async function patch(q: Question, p: Partial<Question>) {
    if (!supabase) return
    // optimista
    setItems((xs) => xs.map((x) => (x.id === q.id ? { ...x, ...p } : p.pinned ? { ...x, pinned: false } : x)))
    if (p.pinned) {
      // só uma pergunta fixada de cada vez
      await supabase.from('questions').update({ pinned: false }).eq('pinned', true).neq('id', q.id)
    }
    const { error } = await supabase.from('questions').update(p).eq('id', q.id)
    if (error) toast(error.message, 'error')
    refresh()
  }

  const counts = Object.fromEntries(TABS.map((s) => [s, items.filter((q) => q.status === s).length])) as Record<QuestionStatus, number>
  const list = items.filter((q) => q.status === tab)

  const btn = 'rounded-lg px-3 py-2 text-sm font-semibold transition'

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto" role="tablist">
          {TABS.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={tab === s}
              onClick={() => setTab(s)}
              className={`relative shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                tab === s ? 'border-gold bg-gold text-navy' : 'border-navy-line text-white/80'
              }`}
            >
              {t(`admin.q.${s}`)} <span className="tabular-nums opacity-70">({counts[s]})</span>
              {s === 'pending' && newCount > 0 && (
                <span className="animate-pop-in absolute -top-2 -right-2 rounded-full bg-red px-1.5 text-xs font-bold text-white">+{newCount}</span>
              )}
            </button>
          ))}
        </div>
        <Link to="/ecra" target="_blank" className="text-sm font-semibold text-gold underline-offset-4 hover:underline">
          {t('admin.q.screen')} ↗
        </Link>
      </div>

      {list.length === 0 && <p className="mt-8 text-center text-white/60">{t('admin.q.empty')}</p>}

      <ul className="mt-4 space-y-3">
        {list.map((q) => {
          const ev = eventById(q.event_id)
          return (
            <li key={q.id} className={`rounded-2xl border p-4 ${q.pinned ? 'border-gold bg-gold/10' : 'border-navy-line bg-navy-soft/60'}`}>
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-lg leading-snug break-words">{q.body}</p>
                  <p className="mt-1 text-sm text-white/55">
                    {q.author_name || t('q.anon')} · {new Date(q.created_at).toLocaleTimeString('pt-PT', { timeZone: 'Africa/Maputo', hour: '2-digit', minute: '2-digit' })}
                    {ev && <> · <span className="text-gold/80">{L(ev.title)}</span></>}
                    {q.lang && <> · {q.lang.toUpperCase()}</>}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-center text-sm font-bold text-gold tabular-nums" title={t('admin.q.votes')}>
                  <IconThumb className="h-5 w-5" />
                  {q.votes}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.status !== 'approved' && (
                  <button onClick={() => patch(q, { status: 'approved' })} className={`${btn} bg-gold text-navy hover:brightness-105`}>
                    {t('admin.q.approve')}
                  </button>
                )}
                {q.status !== 'answered' && q.status !== 'rejected' && (
                  <button onClick={() => patch(q, { status: 'answered', pinned: false })} className={`${btn} border border-white/30 hover:bg-white/10`}>
                    {t('admin.q.answer')}
                  </button>
                )}
                {(q.status === 'approved' || q.pinned) && (
                  <button
                    onClick={() => patch(q, { pinned: !q.pinned })}
                    className={`${btn} inline-flex items-center gap-1.5 border border-gold text-gold hover:bg-gold/10`}
                  >
                    <IconStar className={`h-4 w-4 ${q.pinned ? 'fill-gold' : ''}`} />
                    {q.pinned ? t('admin.q.unpin') : t('admin.q.pin')}
                  </button>
                )}
                {q.status !== 'rejected' && (
                  <button onClick={() => patch(q, { status: 'rejected', pinned: false })} className={`${btn} border border-red/70 hover:bg-red`}>
                    {t('admin.q.reject')}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
