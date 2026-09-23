import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'
import { eventById } from '../lib/programa'
import { publicUrl, type Photo } from '../lib/supabase'
import { IconChevronL, IconChevronR, IconDownload, IconX } from './Icons'

interface Props {
  photos: Photo[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}

export default function Lightbox({ photos, index, onIndex, onClose }: Props) {
  const { t, L } = useI18n()
  const photo = photos[index]
  const touchX = useRef<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const prev = () => index > 0 && onIndex(index - 1)
  const next = () => index < photos.length - 1 && onIndex(index + 1)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  })

  // pré-carregar vizinhas
  useEffect(() => {
    for (const p of [photos[index - 1], photos[index + 1]]) if (p) new Image().src = publicUrl(p.path)
  }, [index, photos])

  if (!photo) return null
  const src = publicUrl(photo.path)
  const ev = eventById(photo.event_id)

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`${t('gallery.photo')} ${index + 1} / ${photos.length}`}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx > 50) prev()
        else if (dx < -50) next()
        touchX.current = null
      }}
    >
      <div className="flex items-center justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-sm text-white/80">
        <span className="tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={`${src}?download=pyne-awards-${photo.id.slice(0, 8)}.webp`}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20"
          >
            <IconDownload className="h-5 w-5" />
            <span className="hidden sm:inline">{t('gallery.download')}</span>
          </a>
          <button ref={closeRef} onClick={onClose} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label={t('gallery.close')}>
            <IconX className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2" onClick={onClose}>
        <img
          key={photo.id}
          src={src}
          alt={photo.caption || (ev ? L(ev.title) : t('gallery.photo'))}
          className="animate-pop-in max-h-full max-w-full rounded object-contain"
          style={{ backgroundImage: `url(${publicUrl(photo.thumb_path)})`, backgroundSize: 'cover' }}
          onClick={(e) => e.stopPropagation()}
        />
        {index > 0 && (
          <button
            onClick={(e) => (e.stopPropagation(), prev())}
            className="absolute left-2 hidden rounded-full bg-black/50 p-3 text-white hover:bg-black/80 sm:block"
            aria-label={t('gallery.prev')}
          >
            <IconChevronL className="h-7 w-7" />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            onClick={(e) => (e.stopPropagation(), next())}
            className="absolute right-2 hidden rounded-full bg-black/50 p-3 text-white hover:bg-black/80 sm:block"
            aria-label={t('gallery.next')}
          >
            <IconChevronR className="h-7 w-7" />
          </button>
        )}
      </div>

      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-sm text-white/75">
        {photo.caption && <p className="text-white">{photo.caption}</p>}
        {ev && <p className="text-gold/90">{L(ev.title)}</p>}
      </div>
    </div>
  )
}
