import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import imageCompression from 'browser-image-compression'
import ConfirmDialog from '../../components/ConfirmDialog'
import { IconCheck, IconUpload } from '../../components/Icons'
import { useToast } from '../../components/Toast'
import { useI18n } from '../../i18n'
import { days, eventById, events } from '../../lib/programa'
import { BUCKET, publicUrl, supabase, type Photo } from '../../lib/supabase'
import { currentDay, defaultEventId } from '../../lib/time'

type Status = 'queued' | 'compressing' | 'uploading' | 'done' | 'error'
interface Job {
  id: string
  file: File
  preview: string
  status: Status
  progress: number
  error?: string
  day: number
  eventId: string
}

const CONCURRENCY = 2

// Safari antigo não codifica WebP no canvas → usar JPEG nesse caso
const webpOk = (() => {
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    return c.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
})()
const MIME = webpOk ? 'image/webp' : 'image/jpeg'
const EXT = webpOk ? 'webp' : 'jpg'

function uuid() {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

async function processJob(job: Job, update: (p: Partial<Job>) => void) {
  const sb = supabase!
  update({ status: 'compressing', progress: 2 })
  const large = await imageCompression(job.file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1.2,
    initialQuality: 0.8,
    fileType: MIME,
    useWebWorker: true,
    onProgress: (p) => update({ progress: Math.round(p * 0.5) }),
  })
  const thumb = await imageCompression(large, {
    maxWidthOrHeight: 480,
    maxSizeMB: 0.15,
    initialQuality: 0.75,
    fileType: MIME,
    useWebWorker: true,
  })
  let width: number | null = null
  let height: number | null = null
  try {
    const bmp = await createImageBitmap(large)
    width = bmp.width
    height = bmp.height
    bmp.close()
  } catch {
    /* dimensões são opcionais */
  }

  update({ status: 'uploading', progress: 60 })
  const id = uuid()
  const path = `${job.day}/${id}.${EXT}`
  const thumbPath = `${job.day}/thumbs/${id}.${EXT}`
  const opts = { contentType: MIME, cacheControl: '31536000', upsert: false }

  const up1 = await sb.storage.from(BUCKET).upload(path, large, opts)
  if (up1.error) throw up1.error
  update({ progress: 85 })
  const up2 = await sb.storage.from(BUCKET).upload(thumbPath, thumb, opts)
  if (up2.error) throw up2.error
  update({ progress: 95 })

  const { error } = await sb.from('photos').insert({ day: job.day, event_id: job.eventId, path, thumb_path: thumbPath, width, height })
  if (error) throw error
  update({ status: 'done', progress: 100 })
}

function Uploader() {
  const { t, L } = useI18n()
  const [day, setDay] = useState<number>(() => currentDay() ?? 1)
  const [eventId, setEventId] = useState(() => {
    const id = defaultEventId()
    return eventById(id)?.day === (currentDay() ?? 1) ? id : events.find((e) => e.day === (currentDay() ?? 1))!.id
  })
  const [jobs, setJobs] = useState<Job[]>([])
  const [drag, setDrag] = useState(false)
  const running = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const update = useCallback((id: string, p: Partial<Job>) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...p } : j))), [])

  // fila simples com concorrência limitada
  useEffect(() => {
    const free = CONCURRENCY - running.current
    if (free <= 0) return
    const next = jobs.filter((j) => j.status === 'queued').slice(0, free)
    for (const j of next) {
      running.current++
      update(j.id, { status: 'compressing' })
      processJob(j, (p) => update(j.id, p))
        .catch((e: unknown) => update(j.id, { status: 'error', error: e instanceof Error ? e.message : String(e) }))
        .finally(() => {
          running.current--
          setJobs((js) => [...js]) // acorda a fila
        })
    }
  }, [jobs, update])

  function add(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    setJobs((js) => [
      ...js,
      ...list.map((file) => ({ id: uuid(), file, preview: URL.createObjectURL(file), status: 'queued' as Status, progress: 0, day, eventId })),
    ])
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer.files.length) add(e.dataTransfer.files)
  }

  function clearDone() {
    setJobs((js) => {
      js.filter((j) => j.status === 'done').forEach((j) => URL.revokeObjectURL(j.preview))
      return js.filter((j) => j.status !== 'done')
    })
  }

  const dayEvents = events.filter((e) => e.day === day)
  const doneCount = jobs.filter((j) => j.status === 'done').length
  const field = 'mt-1.5 w-full rounded-xl border border-paper-line bg-paper px-3 py-3 text-ink focus:border-gold focus:outline-none'

  return (
    <section className="rounded-2xl border border-paper-line bg-white shadow-sm p-5">
      <h2 className="font-serif text-2xl font-bold">{t('admin.upload.title')}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-[10rem_1fr]">
        <label className="text-sm font-medium">
          {t('admin.upload.day')}
          <select
            className={field}
            value={day}
            onChange={(e) => {
              const d = Number(e.target.value)
              setDay(d)
              setEventId(events.find((x) => x.day === d)!.id)
            }}
          >
            {days.map((d) => (
              <option key={d.day} value={d.day}>
                {L(d.label)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          {t('admin.upload.event')}
          <select className={field} value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {dayEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {L(ev.title)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          drag ? 'border-gold bg-gold/10' : 'border-gold/50 hover:bg-gold/5'
        }`}
      >
        <IconUpload className="h-8 w-8 text-gold-deep" />
        <span className="font-semibold text-gold-deep">{t('admin.upload.pick')}</span>
        <span className="text-sm text-ink-soft">{t('admin.upload.drop')}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) add(e.target.files)
          e.target.value = ''
        }}
      />

      {jobs.length > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span>
              {doneCount}/{jobs.length} <IconCheck className="inline h-4 w-4 text-gold-deep" />
            </span>
            {doneCount > 0 && (
              <button onClick={clearDone} className="rounded-lg px-3 py-1.5 hover:bg-paper">
                {t('admin.upload.clear')}
              </button>
            )}
          </div>
          <ul className="mt-2 space-y-2">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center gap-3 rounded-xl bg-paper p-2">
                <img src={j.preview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate">{j.file.name}</span>
                    <span className={`shrink-0 font-semibold ${j.status === 'error' ? 'text-red' : j.status === 'done' ? 'text-gold-deep' : 'text-ink-soft'}`}>
                      {t(`admin.status.${j.status}`)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-line">
                    <div
                      className={`h-full rounded-full transition-all ${j.status === 'error' ? 'bg-red' : 'bg-gold'}`}
                      style={{ width: `${j.status === 'error' ? 100 : j.progress}%` }}
                    />
                  </div>
                  {j.error && <p className="mt-1 truncate text-xs text-ink-soft">{j.error}</p>}
                </div>
                {j.status === 'error' && (
                  <button onClick={() => update(j.id, { status: 'queued', progress: 0, error: undefined })} className="shrink-0 rounded-lg border border-gold px-2 py-1 text-xs text-gold-deep">
                    {t('retry')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function Published() {
  const { t, L } = useI18n()
  const toast = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [confirm, setConfirm] = useState<Photo | null>(null)

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(120)
    setPhotos((data ?? []) as Photo[])
  }, [])

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    refresh()
    const ch = sb.channel('photos-admin').on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, refresh).subscribe()
    return () => {
      sb.removeChannel(ch)
    }
  }, [refresh])

  async function toggle(p: Photo) {
    const { error } = await supabase!.from('photos').update({ hidden: !p.hidden }).eq('id', p.id)
    if (error) toast(error.message, 'error')
    else setPhotos((xs) => xs.map((x) => (x.id === p.id ? { ...x, hidden: !p.hidden } : x)))
  }

  async function remove(p: Photo) {
    setConfirm(null)
    const { error } = await supabase!.from('photos').delete().eq('id', p.id)
    if (error) return toast(error.message, 'error')
    await supabase!.storage.from(BUCKET).remove([p.path, p.thumb_path])
    setPhotos((xs) => xs.filter((x) => x.id !== p.id))
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl font-bold">
        {t('admin.photos.recent')} <span className="text-base font-normal text-ink-soft">({photos.length})</span>
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((p) => (
          <li key={p.id} className="overflow-hidden rounded-xl border border-paper-line bg-white shadow-sm">
            <div className="relative aspect-square">
              <img src={publicUrl(p.thumb_path)} alt="" loading="lazy" className={`h-full w-full object-cover ${p.hidden ? 'opacity-30 grayscale' : ''}`} />
              {p.hidden && (
                <span className="absolute top-2 left-2 rounded-full bg-red px-2 py-0.5 text-xs font-bold text-white">{t('admin.photos.hidden')}</span>
              )}
            </div>
            <p className="truncate px-2 pt-1.5 text-xs text-ink-soft">
              {p.day ? `${t('gallery.day')} ${p.day}` : ''} · {L(eventById(p.event_id)?.title)}
            </p>
            <div className="grid grid-cols-2 gap-1 p-2">
              <button onClick={() => toggle(p)} className="rounded-lg border border-paper-line py-1.5 text-xs font-semibold hover:border-gold">
                {p.hidden ? t('admin.photos.show') : t('admin.photos.hide')}
              </button>
              <button onClick={() => setConfirm(p)} className="rounded-lg border border-red/60 py-1.5 text-xs font-semibold text-red hover:bg-red hover:text-white">
                {t('admin.photos.delete')}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog open={!!confirm} message={t('admin.photos.confirmDelete')} onCancel={() => setConfirm(null)} onConfirm={() => confirm && remove(confirm)} />
    </section>
  )
}

export default function AdminFotos() {
  return (
    <div className="mt-6">
      <Uploader />
      <Published />
    </div>
  )
}
