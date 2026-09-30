// Lê um PDF no browser: número de páginas, título dos metadados e capa (1.ª página em WebP).
// Só é carregado no painel de admin (pdf.js é pesado).
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export interface PdfInfo {
  pages: number
  title: string | null
  cover: Blob | null
}

const COVER_WIDTH = 720

export async function readPdf(file: File): Promise<PdfInfo> {
  const data = new Uint8Array(await file.arrayBuffer())
  const task = pdfjs.getDocument({ data })
  const doc = await task.promise
  try {
    let title: string | null = null
    try {
      const meta = await doc.getMetadata()
      const t = (meta.info as { Title?: string } | undefined)?.Title?.trim()
      // ignora títulos genéricos ou lixo que alguns programas escrevem (about:blank, links, caminhos)
      if (t && !/^(untitled|sem t[ií]tulo|microsoft word|document\d*$|about:blank|https?:|file:|[a-z]:\\)/i.test(t)) title = t
    } catch {
      /* sem metadados */
    }

    let cover: Blob | null = null
    try {
      const page = await doc.getPage(1)
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: COVER_WIDTH / base.width })
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff' // PDFs sem fundo ficam brancos, não transparentes
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvas, canvasContext: ctx, viewport }).promise
      cover = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.82))
      if (cover && cover.type !== 'image/webp') cover = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85))
    } catch {
      /* capa opcional: o admin pode escolher uma imagem */
    }

    return { pages: doc.numPages, title, cover }
  } finally {
    await task.destroy()
  }
}

/** Título a partir do nome do ficheiro: "relatorio_anual-2026.pdf" → "Relatorio anual 2026" */
export function titleFromFileName(name: string) {
  const t = name
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}
