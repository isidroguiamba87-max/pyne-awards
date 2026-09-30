import { supabase } from './supabase'

export const DOCS_BUCKET = 'biblioteca'

export interface Doc {
  id: string
  created_at: string
  title: string
  file_path: string
  cover_path: string | null
  pages: number | null
  bytes: number | null
  hidden: boolean
}

export function docUrl(path: string) {
  if (!supabase) return ''
  return supabase.storage.from(DOCS_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Nome do ficheiro descarregado = título do documento */
export function downloadName(title: string) {
  const clean = title
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
  return `${clean || 'documento'}.pdf`
}

/** Link que força o download com o nome certo (parâmetro ?download do Supabase Storage) */
export function downloadUrl(d: Doc) {
  return `${docUrl(d.file_path)}?download=${encodeURIComponent(downloadName(d.title))}`
}

export function formatBytes(n: number | null | undefined) {
  if (!n) return ''
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`
}
