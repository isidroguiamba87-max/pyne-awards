import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import imageCompression from 'browser-image-compression'
import ConfirmDialog from '../../components/ConfirmDialog'
import { IconBook, IconUpload } from '../../components/Icons'
import { useToast } from '../../components/Toast'
import { useEvent } from '../../events/EventContext'
import { useI18n } from '../../i18n'
import { DOCS_BUCKET, docUrl, formatBytes, type Doc } from '../../lib/documents'
import { uploadResumable } from '../../lib/resumableUpload'
import { supabase } from '../../lib/supabase'

// 200 MB exige o plano Pro do Supabase (no gratuito o máximo absoluto é 50 MB)
const MAX_BYTES = 200 * 1024 * 1024
// até aqui usa-se o envio normal; acima, o envio por partes (TUS)
const SIMPLE_MAX = 45 * 1024 * 1024

type Status = 'reading' | 'ready' | 'uploading' | 'done' | 'error'
interface Pending {
  key: string
  docId: string // fixo desde a escolha: uma nova tentativa retoma o mesmo ficheiro no mesmo caminho
  progress: number
  file: File
  title: string
  pages: number | null
  cover: Blob | null
  coverUrl: string | null
  status: Status
  error?: string
}

const uuid = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

function coverExt(b: Blob) {
  return b.type === 'image/jpeg' ? 'jpg' : b.type === 'image/png' ? 'png' : 'webp'
}

export default function AdminBiblioteca() {
  const { t } = useI18n()
  const { slug } = useEvent()
  const toast = useToast()
  const [pending, setPending] = useState<Pending[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [drag, setDrag] = useState(false)
  const [confirm, setConfirm] = useState<Doc | null>(null)
  const [titles, setTitles] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const coverInput = useRef<HTMLInputElement>(null)
  const coverTarget = useRef<Doc | null>(null)

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('documents').select('*').eq('event_slug', slug).order('created_at', { ascending: false })
    setDocs((data ?? []) as Doc[])
  }, [slug])

  useEffect(() => {
    refresh()
  }, [refresh])

  const patch = (key: string, p: Partial<Pending>) => setPending((xs) => xs.map((x) => (x.key === key ? { ...x, ...p } : x)))

  // ---------- escolher PDFs: lê capa, páginas e título ----------
  async function add(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name))
    if (!list.length) return toast(t('lib.admin.onlyPdf'), 'error')
    const { readPdf, titleFromFileName } = await import('../../lib/pdfCover')
    for (const file of list) {
      const key = uuid()
      setPending((xs) => [...xs, { key, docId: uuid(), progress: 0, file, title: titleFromFileName(file.name), pages: null, cover: null, coverUrl: null, status: 'reading' }])
      if (file.size > MAX_BYTES) {
        patch(key, { status: 'error', error: t('lib.admin.tooBig') })
        continue
      }
      readPdf(file)
        .then((info) =>
          patch(key, {
            status: 'ready',
            pages: info.pages,
            cover: info.cover,
            coverUrl: info.cover ? URL.createObjectURL(info.cover) : null,
            ...(info.title ? { title: info.title } : {}),
          }),
        )
        .catch(() => patch(key, { status: 'error', error: t('lib.admin.readError') }))
    }
  }

  async function publish(p: Pending) {
    if (!supabase || !p.title.trim()) return
    patch(p.key, { status: 'uploading', progress: 0, error: undefined })
    try {
      const id = p.docId
      const filePath = `docs/${id}.pdf`
      if (p.file.size <= SIMPLE_MAX) {
        // até 45 MB: envio normal num só pedido (o mais fiável)
        const up = await supabase.storage.from(DOCS_BUCKET).upload(filePath, p.file, { contentType: 'application/pdf', cacheControl: '31536000', upsert: true })
        if (up.error) throw up.error
        patch(p.key, { progress: 1 })
      } else {
        // PDF grandes: envio por partes, com progresso e retoma
        await uploadResumable(DOCS_BUCKET, filePath, p.file, 'application/pdf', (f) => patch(p.key, { progress: f }))
      }
      let coverPath: string | null = null
      if (p.cover) {
        coverPath = `covers/${id}.${coverExt(p.cover)}`
        const c = await supabase.storage.from(DOCS_BUCKET).upload(coverPath, p.cover, { contentType: p.cover.type, cacheControl: '31536000', upsert: true })
        if (c.error) coverPath = null // sem capa não impede publicar
      }
      const { error } = await supabase.from('documents').insert({
        title: p.title.trim().slice(0, 200),
        file_path: filePath,
        cover_path: coverPath,
        pages: p.pages,
        bytes: p.file.size,
        event_slug: slug,
      })
      if (error) throw error
      patch(p.key, { status: 'done' })
      toast(t('lib.admin.published'), 'success')
      refresh()
      window.setTimeout(() => {
        setPending((xs) => xs.filter((x) => x.key !== p.key))
        if (p.coverUrl) URL.revokeObjectURL(p.coverUrl)
      }, 1200)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // o Supabase recusa ficheiros acima do limite do projecto (50 MB no plano gratuito)
      patch(p.key, { status: 'error', error: /maximum|exceed|too large|413|payload/i.test(msg) ? t('lib.admin.planLimit') : msg })
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer.files.length) add(e.dataTransfer.files)
  }

  // ---------- gerir documentos publicados ----------
  async function saveTitle(d: Doc) {
    const title = (titles[d.id] ?? d.title).trim()
    if (!title || title === d.title) return
    const { error } = await supabase!.from('documents').update({ title: title.slice(0, 200) }).eq('id', d.id)
    if (error) return toast(error.message, 'error')
    toast(t('lib.admin.saved'), 'success')
    refresh()
  }

  async function toggle(d: Doc) {
    const { error } = await supabase!.from('documents').update({ hidden: !d.hidden }).eq('id', d.id)
    if (error) return toast(error.message, 'error')
    refresh()
  }

  async function replaceCover(d: Doc, file: File) {
    try {
      const img = await imageCompression(file, { maxWidthOrHeight: 900, maxSizeMB: 0.4, fileType: 'image/webp', initialQuality: 0.82, useWebWorker: true })
      const path = `covers/${d.id}-${Date.now()}.${coverExt(img)}`
      const up = await supabase!.storage.from(DOCS_BUCKET).upload(path, img, { contentType: img.type, cacheControl: '31536000' })
      if (up.error) throw up.error
      const { error } = await supabase!.from('documents').update({ cover_path: path }).eq('id', d.id)
      if (error) throw error
      if (d.cover_path) await supabase!.storage.from(DOCS_BUCKET).remove([d.cover_path])
      toast(t('lib.admin.coverChanged'), 'success')
      refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error')
    }
  }

  async function remove(d: Doc) {
    setConfirm(null)
    const { error } = await supabase!.from('documents').delete().eq('id', d.id)
    if (error) return toast(error.message, 'error')
    await supabase!.storage.from(DOCS_BUCKET).remove([d.file_path, ...(d.cover_path ? [d.cover_path] : [])])
    refresh()
  }

  const field = 'w-full rounded-lg border border-paper-line bg-paper px-3 py-2 text-sm text-ink focus:border-gold focus:bg-white focus:outline-none'

  return (
    <div className="mt-6 space-y-8">
      {/* carregar */}
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-paper-line md:p-6">
        <h2 className="font-serif text-2xl font-bold">{t('lib.admin.add')}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t('lib.admin.hint')}</p>
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
          <span className="font-semibold text-gold-deep">{t('lib.admin.pick')}</span>
          <span className="text-sm text-ink-soft">{t('lib.admin.drop')}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) add(e.target.files)
            e.target.value = ''
          }}
        />

        {pending.length > 0 && (
          <ul className="mt-5 space-y-3">
            {pending.map((p) => (
              <li key={p.key} className="flex gap-4 rounded-2xl bg-paper p-3 ring-1 ring-paper-line">
                <div className="aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-md bg-white shadow ring-1 ring-paper-line">
                  {p.coverUrl ? (
                    <img src={p.coverUrl} alt="" className="h-full w-full object-cover object-top" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-soft">
                      {p.status === 'reading' ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" /> : <IconBook className="h-6 w-6" />}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <label className="block text-xs font-semibold text-ink-soft">
                    {t('lib.admin.titleField')}
                    <input
                      className={`${field} mt-1`}
                      value={p.title}
                      maxLength={200}
                      onChange={(e) => patch(p.key, { title: e.target.value })}
                      disabled={p.status === 'uploading' || p.status === 'done'}
                    />
                  </label>
                  <p className="mt-1.5 truncate text-xs text-ink-soft">
                    {p.file.name} · {formatBytes(p.file.size)}
                    {p.pages ? ` · ${p.pages} ${t('lib.pages')}` : ''}
                  </p>
                  {p.error && <p className="mt-1 text-xs font-medium text-red">{p.error}</p>}
                  <div className="mt-2 flex gap-2">
                    {/* publicar: PDF lido (ou falhou só o envio e pode tentar de novo) */}
                    {(p.status === 'ready' || (p.status === 'error' && p.pages !== null)) && (
                      <button
                        onClick={() => publish(p)}
                        disabled={!p.title.trim()}
                        className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold shadow-sm hover:bg-navy-soft disabled:opacity-50"
                      >
                        {t('lib.admin.publish')}
                      </button>
                    )}
                    {p.status === 'uploading' && (
                      <div className="flex min-w-0 flex-1 items-center gap-3 py-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-line">
                          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${Math.round(p.progress * 100)}%` }} />
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-ink-soft tabular-nums">
                          {t('lib.admin.uploading')} {Math.round(p.progress * 100)}%
                        </span>
                      </div>
                    )}
                    {p.status === 'done' && <span className="py-2 text-sm font-semibold text-gold-deep">{t('lib.admin.published')}</span>}
                    {p.status !== 'uploading' && p.status !== 'done' && (
                      <button
                        onClick={() => setPending((xs) => xs.filter((x) => x.key !== p.key))}
                        className="rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-white"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* publicados */}
      <section>
        <h2 className="font-serif text-2xl font-bold">
          {t('lib.title')} <span className="text-base font-normal text-ink-soft">({docs.length})</span>
        </h2>
        {docs.length === 0 && <p className="mt-4 text-ink-soft">{t('admin.q.empty')}</p>}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <li key={d.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-paper-line">
              <a href={docUrl(d.file_path)} target="_blank" rel="noopener noreferrer" className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-md bg-paper ring-1 ring-paper-line">
                {d.cover_path ? (
                  <img src={docUrl(d.cover_path)} alt="" loading="lazy" className={`h-full w-full object-cover object-top ${d.hidden ? 'opacity-30 grayscale' : ''}`} />
                ) : (
                  <span className="flex h-full items-center justify-center text-ink-soft">
                    <IconBook className="h-6 w-6" />
                  </span>
                )}
                {d.hidden && <span className="absolute top-1 left-1 rounded-full bg-red px-1.5 py-0.5 text-[10px] font-bold text-white">{t('admin.photos.hidden')}</span>}
              </a>
              <div className="min-w-0 flex-1">
                <div className="flex gap-1.5">
                  <input
                    className={field}
                    value={titles[d.id] ?? d.title}
                    maxLength={200}
                    onChange={(e) => setTitles((x) => ({ ...x, [d.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && saveTitle(d)}
                    aria-label={t('lib.admin.titleField')}
                  />
                  {(titles[d.id] ?? d.title) !== d.title && (
                    <button onClick={() => saveTitle(d)} className="shrink-0 rounded-lg bg-navy px-2.5 text-xs font-semibold text-gold">
                      {t('lib.admin.save')}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {[d.pages ? `${d.pages} ${t('lib.pages')}` : '', formatBytes(d.bytes)].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => {
                      coverTarget.current = d
                      coverInput.current?.click()
                    }}
                    className="rounded-lg border border-paper-line py-1.5 text-[11px] font-semibold hover:border-gold"
                  >
                    {t('lib.admin.cover')}
                  </button>
                  <button onClick={() => toggle(d)} className="rounded-lg border border-paper-line py-1.5 text-[11px] font-semibold hover:border-gold">
                    {d.hidden ? t('admin.photos.show') : t('admin.photos.hide')}
                  </button>
                  <button onClick={() => setConfirm(d)} className="rounded-lg border border-red/60 py-1.5 text-[11px] font-semibold text-red hover:bg-red hover:text-white">
                    {t('admin.photos.delete')}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && coverTarget.current) replaceCover(coverTarget.current, f)
            e.target.value = ''
          }}
        />
      </section>

      <ConfirmDialog open={!!confirm} message={t('lib.admin.confirmDelete')} onCancel={() => setConfirm(null)} onConfirm={() => confirm && remove(confirm)} />
    </div>
  )
}
