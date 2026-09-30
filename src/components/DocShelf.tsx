import { useEffect, useMemo, useState } from 'react'
import { IconBook, IconDownload, IconExternal } from './Icons'
import { useI18n } from '../i18n'
import { docUrl, downloadUrl, formatBytes, type Doc } from '../lib/documents'
import { supabase } from '../lib/supabase'

function BookCard({ d }: { d: Doc }) {
  const { t } = useI18n()
  const [loaded, setLoaded] = useState(false)
  const meta = [d.pages ? `${d.pages} ${d.pages === 1 ? t('lib.page') : t('lib.pages')}` : '', formatBytes(d.bytes)].filter(Boolean).join(' · ')

  return (
    <article className="group flex h-full flex-col">
      {/* capa com lombada, como um livro */}
      <a
        href={docUrl(d.file_path)}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[3/4] overflow-hidden rounded-r-xl rounded-l-sm bg-white shadow-[0_14px_30px_-12px_rgba(19,38,61,0.45)] ring-1 ring-paper-line transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_40px_-14px_rgba(19,38,61,0.55)]"
        aria-label={`${t('lib.read')}: ${d.title}`}
      >
        {d.cover_path ? (
          <img
            src={docUrl(d.cover_path)}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover object-top transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="hero-bg flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-white">
            <IconBook className="h-10 w-10 text-gold" />
            <p className="line-clamp-4 font-serif text-sm font-bold">{d.title}</p>
          </div>
        )}
        <span className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/5 to-transparent" aria-hidden />
      </a>

      <h3 className="mt-3 line-clamp-3 leading-snug font-semibold text-ink" title={d.title}>
        {d.title}
      </h3>
      {meta && <p className="mt-0.5 text-xs text-ink-soft">{meta}</p>}

      <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
        <a
          href={docUrl(d.file_path)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-2 py-2 text-sm font-semibold text-navy ring-1 ring-paper-line hover:ring-gold"
        >
          <IconExternal className="h-4 w-4" />
          {t('lib.read')}
        </a>
        <a
          href={downloadUrl(d)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy px-2 py-2 text-sm font-semibold text-gold shadow-sm hover:bg-navy-soft"
        >
          <IconDownload className="h-4 w-4" />
          {t('lib.download')}
        </a>
      </div>
    </article>
  )
}

/** Estante do relatório (documentos PDF). Usada no ecrã "Relatório" da galeria. */
export default function DocShelf() {
  const { t } = useI18n()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('documents')
      .select('*')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(true)
        setDocs((data ?? []) as Doc[])
      })
  }, [])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? docs.filter((d) => d.title.toLowerCase().includes(s)) : docs
  }, [docs, q])

  return (
    <>
      <div className="pt-6">
        <p className="mb-5 text-ink-soft">{t('lib.sub')}</p>
        {!supabase ? null : (
          <>
            {docs.length > 6 && (
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('lib.search')}
                aria-label={t('lib.search')}
                className="mb-6 w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-ink shadow-sm focus:border-gold focus:outline-none sm:max-w-sm"
              />
            )}

            {loading && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-paper-line/60" />
                ))}
              </div>
            )}

            {!loading && error && <p className="text-ink-soft">{t('loadError')}</p>}

            {!loading && !error && docs.length === 0 && (
              <div className="mx-auto mt-2 max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-paper-line">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-gold">
                  <IconBook className="h-7 w-7" />
                </span>
                <p className="mt-4 text-ink-soft">{t('lib.empty')}</p>
              </div>
            )}

            {shown.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {shown.map((d) => (
                  <BookCard key={d.id} d={d} />
                ))}
              </div>
            )}
            {!loading && docs.length > 0 && shown.length === 0 && <p className="text-ink-soft">{t('lib.noResults')}</p>}
          </>
        )}
      </div>
    </>
  )
}
