import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import imageCompression from 'browser-image-compression'
import ConfirmDialog from '../../components/ConfirmDialog'
import { IconCheck, IconUpload } from '../../components/Icons'
import { useToast } from '../../components/Toast'
import { EVENTS } from '../../events'
import { useEvent } from '../../events/EventContext'
import { useI18n } from '../../i18n'
import { at, maputoDate } from '../../lib/time'
import { BUCKET, publicUrl, supabase, type Photo } from '../../lib/supabase'

type Status = 'queued' | 'compressing' | 'uploading' | 'done' | 'error'
interface Job {
  id: string
  file: File
  preview: string
  status: Status
  progress: number
  error?: string
  eventSlug: string
  day: number
  eventId: string | null
}

const CONCURRENCY = 2
const LIST_PAGE = 120

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

/** Hora da câmara (EXIF). A câmara grava hora local sem fuso: assume-se Maputo (+02:00). */
async function readTakenAt(file: File): Promise<string | null> {
  try {
    const { default: exifr } = await import('exifr')
    const x = await exifr.parse(file, { pick: ['DateTimeOriginal', 'CreateDate', 'OffsetTimeOriginal'], reviveValues: false })
    const raw = x?.DateTimeOriginal ?? x?.CreateDate
    const m = raw && String(raw).match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
    if (!m) return null
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${x?.OffsetTimeOriginal ?? '+02:00'}`)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  } catch {
    return null
  }
}

async function processJob(job: Job, update: (p: Partial<Job>) => void) {
  const sb = supabase!
  update({ status: 'compressing', progress: 2 })
  const takenAt = await readTakenAt(job.file)
  const large = await imageCompression(job.file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1.2,
    initialQuality: 0.8,
    fileType: MIME,
    useWebWorker: true,
    onProgress: (p) => update({ progress: Math.round(p * 0.5) }),
  })
  const thumb = await imageCompression(large, { maxWidthOrHeight: 480, maxSizeMB: 0.15, initialQuality: 0.75, fileType: MIME, useWebWorker: true })
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
  // novos uploads: galeria/{event_slug}/dia-{n}/... (os antigos ficam onde estão)
  const dir = `${job.eventSlug}/dia-${job.day}`
  const path = `${dir}/${id}.${EXT}`
  const thumbPath = `${dir}/thumbs/${id}.${EXT}`
  const opts = { contentType: MIME, cacheControl: '31536000', upsert: false }

  const up1 = await sb.storage.from(BUCKET).upload(path, large, opts)
  if (up1.error) throw up1.error
  update({ progress: 85 })
  const up2 = await sb.storage.from(BUCKET).upload(thumbPath, thumb, opts)
  if (up2.error) throw up2.error
  update({ progress: 95 })

  const { error } = await sb.from('photos').insert({
    event_slug: job.eventSlug,
    day: job.day,
    event_id: job.eventId,
    path,
    thumb_path: thumbPath,
    width,
    height,
    taken_at: takenAt,
  })
  if (error) throw error
  update({ status: 'done', progress: 100 })
}

// ---------- envio ----------

function Uploader() {
  const { t, L } = useI18n()
  const ev = useEvent()
  const { days, events, eventById, currentDay, defaultEventId } = ev.program
  // bloco sugerido pela hora actual; dia = o de hoje, ou o do bloco sugerido
  const [eventId, setEventId] = useState(() => defaultEventId())
  const [day, setDay] = useState<number>(() => currentDay() ?? eventById(defaultEventId())?.day ?? days[0].day)
  const [jobs, setJobs] = useState<Job[]>([])
  const [staged, setStaged] = useState<File[]>([])
  const [drag, setDrag] = useState(false)
  const running = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const update = useCallback((id: string, p: Partial<Job>) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...p } : j))), [])

  // fila simples com concorrência limitada
  useEffect(() => {
    const free = CONCURRENCY - running.current
    if (free <= 0) return
    for (const j of jobs.filter((x) => x.status === 'queued').slice(0, free)) {
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

  /** escolher → confirmação ("Vai publicar N fotos em …") → fila */
  function stage(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (list.length) setStaged(list)
  }

  function confirmStaged() {
    const files = staged
    setStaged([])
    setJobs((js) => [
      ...js,
      ...files.map((file) => ({ id: uuid(), file, preview: URL.createObjectURL(file), status: 'queued' as Status, progress: 0, eventSlug: ev.slug, day, eventId })),
    ])
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer.files.length) stage(e.dataTransfer.files)
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
  const blockName = eventId ? L(eventById(eventId)?.title) : t('admin.upload.noBlock')

  return (
    <section className="rounded-2xl border border-paper-line bg-white p-5 shadow-sm">
      <h2 className="font-serif text-2xl font-bold">{t('admin.upload.title')}</h2>
      <div className={`mt-4 grid gap-4 ${days.length > 1 ? 'sm:grid-cols-[10rem_1fr]' : ''}`}>
        {days.length > 1 && (
          <label className="text-sm font-medium">
            {t('admin.upload.day')}
            <select
              className={field}
              value={day}
              onChange={(e) => {
                const d = Number(e.target.value)
                setDay(d)
                setEventId(events.find((x) => x.day === d)?.id ?? '')
              }}
            >
              {days.map((d) => (
                <option key={d.day} value={d.day}>
                  {L(d.label)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm font-medium">
          {t('admin.upload.event')}
          <select className={field} value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {dayEvents.map((b) => (
              <option key={b.id} value={b.id}>
                {b.sessionNumber ? `${t('agenda.session', { n: b.sessionNumber })} · ` : ''}
                {L(b.title)} ({b.time})
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
          if (e.target.files) stage(e.target.files)
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
                    <div className={`h-full rounded-full transition-all ${j.status === 'error' ? 'bg-red' : 'bg-gold'}`} style={{ width: `${j.status === 'error' ? 100 : j.progress}%` }} />
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

      <ConfirmDialog
        open={staged.length > 0}
        tone="primary"
        message={t('admin.upload.confirm', { n: staged.length, event: L(ev.name), block: blockName })}
        onCancel={() => setStaged([])}
        onConfirm={confirmStaged}
      />
    </section>
  )
}

// ---------- fotos publicadas ----------

type Filter = { kind: 'all' } | { kind: 'today' } | { kind: 'block'; id: string | null }

function Published() {
  const { t, L } = useI18n()
  const toast = useToast()
  const ev = useEvent()
  const { events, eventById } = ev.program
  const [photos, setPhotos] = useState<Photo[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [filter, setFilter] = useState<Filter>({ kind: 'all' })
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<null | { kind: 'delete'; ids: string[] } | { kind: 'move'; ids: string[]; to: string }>(null)
  const [assignTo, setAssignTo] = useState('')
  const [moveTo, setMoveTo] = useState('')
  const others = EVENTS.filter((e) => e.slug !== ev.slug)

  const query = useCallback(
    (from: number) => {
      let q = supabase!.from('photos').select('*').eq('event_slug', ev.slug).order('created_at', { ascending: false }).range(from, from + LIST_PAGE - 1)
      if (filter.kind === 'today') q = q.gte('created_at', new Date(at(maputoDate(), '00:00')).toISOString())
      if (filter.kind === 'block') q = filter.id ? q.eq('event_id', filter.id) : q.is('event_id', null)
      return q
    },
    [ev.slug, filter],
  )

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data } = await query(0)
    const rows = (data ?? []) as Photo[]
    setPhotos(rows)
    setHasMore(rows.length === LIST_PAGE)
  }, [query])

  async function loadMore() {
    const { data } = await query(photos.length)
    const rows = (data ?? []) as Photo[]
    setPhotos((xs) => [...xs, ...rows.filter((r) => !xs.some((x) => x.id === r.id))])
    setHasMore(rows.length === LIST_PAGE)
  }

  useEffect(() => {
    setSel(new Set())
    refresh()
  }, [refresh])

  // Realtime: só este evento (+ DELETE, que não é filtrável)
  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    const ch = sb
      .channel(`photos-admin-${ev.slug}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: `event_slug=eq.${ev.slug}` }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'photos', filter: `event_slug=eq.${ev.slug}` }, refresh)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'photos' }, refresh)
      .subscribe()
    return () => {
      sb.removeChannel(ch)
    }
  }, [ev.slug, refresh])

  const toggleSel = (id: string) =>
    setSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  async function setHidden(ids: string[], hidden: boolean) {
    const { error } = await supabase!.from('photos').update({ hidden }).in('id', ids)
    if (error) return toast(error.message, 'error')
    setPhotos((xs) => xs.map((x) => (ids.includes(x.id) ? { ...x, hidden } : x)))
    toast(t('admin.photos.done'), 'success')
  }

  async function assignBlock(ids: string[], blockId: string) {
    const block = eventById(blockId)
    const change = blockId ? { event_id: blockId, day: block?.day ?? null } : { event_id: null }
    const { error } = await supabase!.from('photos').update(change).in('id', ids)
    if (error) return toast(error.message, 'error')
    setAssignTo('')
    setSel(new Set())
    toast(t('admin.photos.done'), 'success')
    refresh()
  }

  async function remove(ids: string[]) {
    const victims = photos.filter((p) => ids.includes(p.id))
    const { error } = await supabase!.from('photos').delete().in('id', ids)
    if (error) return toast(error.message, 'error')
    await supabase!.storage.from(BUCKET).remove(victims.flatMap((p) => [p.path, p.thumb_path]))
    setPhotos((xs) => xs.filter((x) => !ids.includes(x.id)))
    setSel(new Set())
    toast(t('admin.photos.done'), 'success')
  }

  /** corrige enganos: muda o event_slug; o bloco fica por atribuir no outro evento */
  async function move(ids: string[], to: string) {
    const target = EVENTS.find((e) => e.slug === to)
    if (!target) return
    const targetDays = target.program.days.map((d) => d.day)
    const updates = photos
      .filter((p) => ids.includes(p.id))
      .map((p) => ({ id: p.id, day: p.day && targetDays.includes(p.day) ? p.day : targetDays[0] }))
    // agrupar por dia para poucas chamadas
    const byDay = new Map<number, string[]>()
    for (const u of updates) byDay.set(u.day, [...(byDay.get(u.day) ?? []), u.id])
    for (const [d, list] of byDay) {
      const { error } = await supabase!.from('photos').update({ event_slug: to, event_id: null, day: d }).in('id', list)
      if (error) return toast(error.message, 'error')
    }
    setPhotos((xs) => xs.filter((x) => !ids.includes(x.id)))
    setSel(new Set())
    setMoveTo('')
    toast(t('admin.photos.done'), 'success')
  }

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${active ? 'bg-navy text-gold shadow' : 'bg-white text-ink ring-1 ring-paper-line hover:ring-gold'}`
  const select = 'rounded-lg border border-paper-line bg-white px-2.5 py-1.5 text-sm text-ink'

  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl font-bold">
        {t('admin.photos.recent')} <span className="text-base font-normal text-ink-soft">({photos.length}{hasMore ? '+' : ''})</span>
      </h2>

      {/* filtros */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter({ kind: 'today' })} className={chip(filter.kind === 'today')}>
          {t('admin.photos.filter.today')}
        </button>
        <button onClick={() => setFilter({ kind: 'all' })} className={chip(filter.kind === 'all')}>
          {t('admin.photos.filter.all')}
        </button>
        <select
          aria-label={t('admin.photos.filter.block')}
          className={`${select} max-w-[18rem] ${filter.kind === 'block' ? 'ring-2 ring-gold' : ''}`}
          value={filter.kind === 'block' ? (filter.id ?? '__none') : ''}
          onChange={(e) => {
            const v = e.target.value
            setFilter(v === '' ? { kind: 'all' } : { kind: 'block', id: v === '__none' ? null : v })
          }}
        >
          <option value="">{t('admin.photos.filter.block')}…</option>
          <option value="__none">{t('admin.photos.noBlock')}</option>
          {events.map((b) => (
            <option key={b.id} value={b.id}>
              {L(b.title)}
            </option>
          ))}
        </select>
      </div>

      {/* acções em lote */}
      <div className="sticky top-[52px] z-30 mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white/95 p-2 shadow-sm ring-1 ring-paper-line backdrop-blur">
        <span className="px-1 text-sm font-semibold text-ink">{t('admin.photos.selected', { n: sel.size })}</span>
        <button onClick={() => setSel(new Set(photos.map((p) => p.id)))} className="rounded-lg px-2 py-1 text-sm text-ink-soft hover:bg-paper">
          {t('admin.photos.selectAll')}
        </button>
        {sel.size > 0 && (
          <>
            <button onClick={() => setSel(new Set())} className="rounded-lg px-2 py-1 text-sm text-ink-soft hover:bg-paper">
              {t('admin.photos.clearSel')}
            </button>
            <span className="mx-1 h-5 w-px bg-paper-line" aria-hidden />
            <button onClick={() => setHidden([...sel], true)} className="rounded-lg border border-paper-line px-2.5 py-1 text-sm font-semibold hover:border-gold">
              {t('admin.photos.hide')}
            </button>
            <button onClick={() => setHidden([...sel], false)} className="rounded-lg border border-paper-line px-2.5 py-1 text-sm font-semibold hover:border-gold">
              {t('admin.photos.show')}
            </button>
            <select aria-label={t('admin.photos.assign')} className={select} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              <option value="">{t('admin.photos.assign')}…</option>
              {events.map((b) => (
                <option key={b.id} value={b.id}>
                  {L(b.title)}
                </option>
              ))}
            </select>
            {assignTo && (
              <button onClick={() => assignBlock([...sel], assignTo)} className="rounded-lg bg-navy px-2.5 py-1 text-sm font-semibold text-gold">
                OK
              </button>
            )}
            <select aria-label={t('admin.photos.move')} className={select} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              <option value="">{t('admin.photos.move')}…</option>
              {others.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {L(o.name)}
                </option>
              ))}
            </select>
            {moveTo && (
              <button onClick={() => setConfirm({ kind: 'move', ids: [...sel], to: moveTo })} className="rounded-lg bg-navy px-2.5 py-1 text-sm font-semibold text-gold">
                OK
              </button>
            )}
            <button
              onClick={() => setConfirm({ kind: 'delete', ids: [...sel] })}
              className="rounded-lg border border-red/60 px-2.5 py-1 text-sm font-semibold text-red hover:bg-red hover:text-white"
            >
              {t('admin.photos.delete')}
            </button>
          </>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((p) => {
          const on = sel.has(p.id)
          return (
            <li key={p.id} className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ${on ? 'ring-2 ring-gold' : 'ring-paper-line'}`}>
              <button type="button" onClick={() => toggleSel(p.id)} className="relative block aspect-square w-full" aria-pressed={on}>
                <img src={publicUrl(p.thumb_path)} alt="" loading="lazy" className={`h-full w-full object-cover ${p.hidden ? 'opacity-30 grayscale' : ''}`} />
                <span
                  className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md ring-2 ${on ? 'bg-gold text-navy ring-gold' : 'bg-white/80 ring-white'}`}
                  aria-hidden
                >
                  {on && <IconCheck className="h-4 w-4" strokeWidth={3} />}
                </span>
                {p.hidden && <span className="absolute top-2 left-2 rounded-full bg-red px-2 py-0.5 text-xs font-bold text-white">{t('admin.photos.hidden')}</span>}
              </button>
              <p className="truncate px-2 pt-1.5 text-xs text-ink-soft">{p.event_id ? L(eventById(p.event_id)?.title) : t('admin.photos.noBlock')}</p>
              <div className="grid grid-cols-2 gap-1 p-2">
                <button onClick={() => setHidden([p.id], !p.hidden)} className="rounded-lg border border-paper-line py-1.5 text-xs font-semibold hover:border-gold">
                  {p.hidden ? t('admin.photos.show') : t('admin.photos.hide')}
                </button>
                <button
                  onClick={() => setConfirm({ kind: 'delete', ids: [p.id] })}
                  className="rounded-lg border border-red/60 py-1.5 text-xs font-semibold text-red hover:bg-red hover:text-white"
                >
                  {t('admin.photos.delete')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {hasMore && (
        <div className="mt-4 text-center">
          <button onClick={loadMore} className="rounded-xl bg-navy px-5 py-2.5 font-semibold text-gold shadow-md hover:bg-navy-soft">
            {t('gallery.more')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        tone={confirm?.kind === 'move' ? 'primary' : 'danger'}
        message={
          confirm?.kind === 'move'
            ? t('admin.photos.moveConfirm', { n: confirm.ids.length, event: L(EVENTS.find((e) => e.slug === confirm.to)?.name) })
            : confirm?.ids.length === 1
              ? t('admin.photos.confirmDelete')
              : t('admin.photos.deleteMany', { n: confirm?.ids.length ?? 0 })
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const c = confirm
          setConfirm(null)
          if (!c) return
          if (c.kind === 'delete') remove(c.ids)
          else move(c.ids, c.to)
        }}
      />
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
