import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, type Question, type QuestionStatus } from './supabase'

export function sortQuestions(xs: Question[]) {
  return [...xs].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.votes - a.votes || b.created_at.localeCompare(a.created_at),
  )
}

/**
 * Lista de perguntas com Realtime. A cada alteração volta a pedir a lista
 * (simples e robusto com RLS: o público só "vê" o que pode ler).
 */
export function useQuestions(statuses: QuestionStatus[], channel: string) {
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
      .in('status', key.split(','))
      .order('created_at', { ascending: false })
      .limit(500)
    setLoading(false)
    setError(!!error)
    if (!error) setItems(sortQuestions((data ?? []) as Question[]))
  }, [key])

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    refresh()
    const ch = sb
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(refresh, 250)
      })
      .subscribe()
    // rede de segurança caso o websocket caia
    const poll = window.setInterval(refresh, 60_000)
    return () => {
      window.clearInterval(poll)
      window.clearTimeout(timer.current)
      sb.removeChannel(ch)
    }
  }, [refresh, channel])

  return { items, setItems, loading, error, refresh }
}
