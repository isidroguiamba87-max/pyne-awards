import { useRef, useState } from 'react'
import { QRCanvas, QRSvg } from '../components/PyneQR'
import { IconDownload } from '../components/Icons'
import { useI18n } from '../i18n'
import { SITE_URL } from '../lib/supabase'

function save(href: string, name: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function QR() {
  const { t } = useI18n()
  const [target, setTarget] = useState<'site' | 'questions'>('site')
  const value = target === 'site' ? SITE_URL : `${SITE_URL}/perguntas`
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const base = target === 'site' ? 'pyne-awards-qr' : 'pyne-awards-qr-perguntas'

  function downloadPng() {
    const c = canvasRef.current
    if (c) save(c.toDataURL('image/png'), `${base}.png`)
  }

  function downloadSvg() {
    const s = svgRef.current
    if (!s) return
    const clone = s.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', '1024')
    clone.setAttribute('height', '1024')
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone)
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }))
    save(url, `${base}.svg`)
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-8 text-center">
      <h1 className="font-serif text-4xl font-bold">{t('qr.title')}</h1>

      <div className="mx-auto mt-5 inline-flex rounded-xl border border-navy-line p-1" role="group">
        {(['site', 'questions'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTarget(k)}
            aria-pressed={target === k}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${target === k ? 'bg-gold text-navy' : 'text-white/80'}`}
          >
            {t(k === 'site' ? 'qr.target.site' : 'qr.target.questions')}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-sm rounded-3xl bg-white p-5 text-navy shadow-2xl">
        <QRSvg ref={svgRef} value={value} size={512} className="h-auto w-full" />
        <p className="mt-2 font-serif text-xl font-bold">The Pyne Awards Africa 2026</p>
        <p className="text-sm font-semibold tracking-wide text-red">
          {t(target === 'site' ? 'qr.caption.site' : 'qr.caption.questions')}
        </p>
      </div>

      {/* canvas de alta resolução, só para exportar */}
      <div className="hidden" aria-hidden>
        <QRCanvas ref={canvasRef} value={value} size={2048} />
      </div>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button onClick={downloadPng} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 font-semibold text-navy hover:brightness-105">
          <IconDownload className="h-5 w-5" /> {t('qr.png')}
        </button>
        <button onClick={downloadSvg} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold px-5 py-3 font-semibold text-gold hover:bg-gold/10">
          <IconDownload className="h-5 w-5" /> {t('qr.svg')}
        </button>
      </div>

      <p className="mt-6 text-sm text-white/60">
        {t('qr.hint')}
        <br />
        <code className="break-all text-gold">{value}</code>
      </p>
    </div>
  )
}
