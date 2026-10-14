import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, type Question, type QuestionStatus } from './supabase'

export function sortQuestions(xs: Question[]) {
  return [...xs].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.votes - a.votes || b.created_at.localeCompare(a.created_at),
  )
}

/**
 * Perguntas de UM evento, com Realtime. A cada alteração volta a pedir a lista
 * (simples e robusto com RLS: o público só "vê" o que pode ler).
 * A subscrição é filtrada por event_slug; os DELETE não são filtráveis no Supabase,
 * por isso chegam à parte e só provocam um refresh desta lista.
 */
export function useQuestions(statuses: QuestionStatus[], channel: string, eventSlug: string) {
  const [items, setItems] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const key = statuses.join(',')
  const timer = useRef<number | undefined>(undefined)

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('event_slug', eventSlug)
      .in('status', key.split(','))
      .order('created_at', { ascending: false })
      .limit(500)
    setLoading(false)
    setError(!!error)
    if (!error) setItems(sortQuestions((data ?? []) as Question[]))
  }, [key, eventSlug])

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    refresh()
    const later = () => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(refresh, 250)
    }
    const ch = sb
      .channel(`${channel}-${eventSlug}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'questions', filter: `event_slug=eq.${eventSlug}` }, later)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'questions', filter: `event_slug=eq.${eventSlug}` }, later)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'questions' }, later)
      .subscribe()
    // rede de segurança caso o websocket caia
    const poll = window.setInterval(refresh, 60_000)
    return () => {
      window.clearInterval(poll)
      window.clearTimeout(timer.current)
      sb.removeChannel(ch)
    }
  }, [refresh, channel, eventSlug])

  return { items, setItems, loading, error, refresh }
}
