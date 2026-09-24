import { useCallback, useEffect, useRef, useState } from 'react'
import { IconArrowUp, IconExternal, IconImage } from '../components/Icons'
import Lightbox from '../components/Lightbox'
import PageHeader from '../components/PageHeader'
import { useI18n } from '../i18n'
import { days } from '../lib/programa'
import { publicUrl, supabase, type Photo } from '../lib/supabase'

const PAGE = 40
// Álbum completo do evento (fotógrafo oficial)
const ALBUM_URL = 'https://olhosfotografia.pic-time.com/Xe1zz38WBDDzH'

function AlbumLink({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  return (
    <a
      href={ALBUM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-gold-grad inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-navy shadow-lg shadow-black/20 transition hover:brightness-105 ${className}`}
    >
      <IconImage className="h-5 w-5" />
      {t('gallery.album')}
      <IconExternal className="h-4 w-4" />
    </a>
  )
}

export function Offline() {
  const { t } = useI18n()
  return <p className="rounded-2xl bg-white p-5 text-ink-soft shadow-sm ring-1 ring-paper-line">{t('offline')}</p>
}

export default function Galeria() {
  const { t, L } = useI18n()
  const [day, setDay] = useState<number | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const [newCount, setNewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [open, setOpen] = useState<number | null>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const dayRef = useRef(day)
  dayRef.current = day
  const openRef = useRef(open)
  openRef.current = open

  const load = useCallback(async (from: number, d: number | null) => {
    if (!supabase) return
    setLoading(true)
    setError(false)
    let q = supabase.from('photos').select('*').eq('hidden', false).order('created_at', { ascending: false }).range(from, from + PAGE - 1)
    if (d) q = q.eq('day', d)
    const { data, error } = await q
    if (dayRef.current !== d) return // filtro mudou entretanto
    setLoading(false)
    if (error) return setError(true)
    const rows = (data ?? []) as Photo[]
    setPhotos((xs) => {
      const seen = new Set(xs.map((x) => x.id))
      return from === 0 ? rows : [...xs, ...rows.filter((r) => !seen.has(r.id))]
    })
    setHasMore(rows.length === PAGE)
  }, [])

  // (re)carregar ao mudar de filtro
  useEffect(() => {
    setPhotos([])
    setHasMore(true)
    load(0, day)
  }, [day, load])

  // Realtime
  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    const matches = (p: Photo) => !p.hidden && (dayRef.current === null || p.day === dayRef.current)
    const ch = sb
      .channel('photos-public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as Photo
          if (!matches(p)) return
          setPhotos((xs) => (xs.some((x) => x.id === p.id) ? xs : [p, ...xs]))
          if (openRef.current !== null) setOpen((i) => (i === null ? i : i + 1))
          setFresh((s) => new Set(s).add(p.id))
          setNewCount((n) => n + 1)
        } else if (payload.eventType === 'UPDATE') {
          const p = payload.new as Photo
          setPhotos((xs) => {
            const without = xs.filter((x) => x.id !== p.id)
            if (!matches(p)) return without
            if (without.length !== xs.length) return xs.map((x) => (x.id === p.id ? p : x))
            return [...xs, p].sort((a, b) => b.created_at.localeCompare(a.created_at))
          })
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id?: string }).id
          if (id) setPhotos((xs) => xs.filter((x) => x.id !== id))
        }
      })
      .subscribe()
    return () => {
      sb.removeChannel(ch)
    }
  }, [])

  // limpar o aviso quando o utilizador já está no topo
  useEffect(() => {
    if (!newCount) return
    const id = window.setTimeout(() => {
      if (window.scrollY < 200) setNewCount(0)
    }, 6000)
    return () => window.clearTimeout(id)
  }, [newCount])

  // infinite scroll
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore && photos.length > 0) load(photos.length, day)
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, photos.length, day, load])

  const filters: { v: number | null; label: string }[] = [
    { v: null, label: t('gallery.all') },
    ...days.map((d) => ({ v: d.day, label: L(d.label).split('·')[0].trim() })),
  ]

  return (
    <>
    <PageHeader kicker="Pyne Awards Africa 2026" title={t('gallery.title')} sub={t('gallery.sub')}>
      <AlbumLink />
    </PageHeader>
    <div className="mx-auto max-w-6xl px-4">

      {!supabase ? (
        <div className="mt-8">
          <Offline />
        </div>
      ) : (
        <>
          <div className="sticky top-16 z-30 -mx-4 flex gap-2 overflow-x-auto border-b border-paper-line/70 bg-paper/90 px-4 py-3 backdrop-blur-md" role="group">
            {filters.map((f) => (
              <button
                key={String(f.v)}
                onClick={() => setDay(f.v)}
                aria-pressed={day === f.v}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  day === f.v ? 'bg-navy text-gold shadow-md ring-2 ring-gold' : 'bg-white text-ink shadow-sm ring-1 ring-paper-line hover:ring-gold'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {newCount > 0 && (
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                setNewCount(0)
              }}
              className="animate-pop-in fixed top-20 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-red px-4 py-2 text-sm font-semibold text-white shadow-xl"
            >
              <IconArrowUp className="h-4 w-4" />
              {newCount === 1 ? t('gallery.new.one') : t('gallery.new.many', { n: newCount })}
            </button>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setOpen(i)}
                className={`group relative aspect-square overflow-hidden rounded-xl bg-white shadow-sm ring-1 ${fresh.has(p.id) ? 'animate-pop-in ring-2 ring-gold' : 'ring-paper-line'}`}
              >
                <img
                  src={publicUrl(p.thumb_path)}
                  alt={p.caption || `${t('gallery.photo')} ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>

          {!loading && !error && photos.length === 0 && (
            <div className="mx-auto mt-8 max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-paper-line">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-gold">
                <IconImage className="h-7 w-7" />
              </span>
              <p className="mt-4 text-ink-soft">{t('gallery.empty')}</p>
            </div>
          )}
          {error && (
            <div className="mt-8 text-center">
              <p className="text-ink-soft">{t('loadError')}</p>
              <button onClick={() => load(photos.length, day)} className="mt-3 rounded-xl bg-navy px-4 py-2 font-semibold text-gold">
                {t('retry')}
              </button>
            </div>
          )}
          <div ref={sentinel} className="h-4" />
          {loading && <p className="py-6 text-center text-ink-soft">{t('gallery.loading')}</p>}
          {!loading && hasMore && photos.length > 0 && (
            <div className="text-center">
              <button onClick={() => load(photos.length, day)} className="rounded-xl bg-navy px-5 py-2.5 font-semibold text-gold shadow-md hover:bg-navy-soft">
                {t('gallery.more')}
              </button>
            </div>
          )}
        </>
      )}

      {open !== null && photos[open] && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
    </>
  )
}
