import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null enquanto o Supabase não estiver configurado (a agenda funciona na mesma) */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export const BUCKET = 'galeria'

export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin).replace(
  /\/+$/,
  '',
)

export interface Photo {
  id: string
  created_at: string
  day: number | null
  event_id: string | null
  path: string
  thumb_path: string
  caption: string | null
  width: number | null
  height: number | null
  hidden: boolean
}

export type QuestionStatus = 'pending' | 'approved' | 'answered' | 'rejected'

export interface Question {
  id: string
  created_at: string
  event_id: string | null
  author_name: string | null
  body: string
  lang: string | null
  status: QuestionStatus
  votes: number
  pinned: boolean
}

export function publicUrl(path: string) {
  if (!supabase) return ''
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
