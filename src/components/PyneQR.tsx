import { forwardRef, useEffect, useState } from 'react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { useEvent } from '../events/EventContext'

// A imagem do centro (do evento activo) é embebida como data URL para que o SVG descarregado
// seja autónomo e o canvas não fique "tainted" ao exportar PNG.
const cache = new Map<string, string>()

function useCenterImage(url: string) {
  const [src, setSrc] = useState<string | null>(cache.get(url) ?? null)
  useEffect(() => {
    const hit = cache.get(url)
    if (hit) {
      setSrc(hit)
      return
    }
    let alive = true
    fetch(url)
      .then((r) => r.blob())
      .then(
        (b) =>
          new Promise<string>((res, rej) => {
            const fr = new FileReader()
            fr.onload = () => res(fr.result as string)
            fr.onerror = rej
            fr.readAsDataURL(b)
          }),
      )
      .then((d) => {
        cache.set(url, d)
        if (alive) setSrc(d)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [url])
  return src
}

/** Cores do QR e imagem do centro do evento activo */
function useQrLook(size: number) {
  const ev = useEvent()
  const src = useCenterImage(ev.qrCenter.src)
  const fg = ev.look === 'light' ? '#183A62' : '#13263D'
  if (!src) return { fg, image: undefined }
  // altura ~24% do QR, largura pela proporção da imagem (nível H aguenta a área tapada)
  const h = Math.round(size * 0.24)
  const w = Math.round((h * ev.qrCenter.width) / ev.qrCenter.height)
  return { fg, image: { src, height: h, width: w, excavate: true } }
}

interface Props {
  value: string
  size: number
  className?: string
}

export const QRSvg = forwardRef<SVGSVGElement, Props>(function QRSvg({ value, size, className }, ref) {
  const { fg, image } = useQrLook(size)
  return (
    <QRCodeSVG
      ref={ref}
      value={value}
      size={size}
      level="H"
      marginSize={2}
      fgColor={fg}
      bgColor="#FFFFFF"
      imageSettings={image}
      className={className}
      title={value}
    />
  )
})

export const QRCanvas = forwardRef<HTMLCanvasElement, Props>(function QRCanvas({ value, size, className }, ref) {
  const { fg, image } = useQrLook(size)
  return (
    <QRCodeCanvas
      ref={ref}
      value={value}
      size={size}
      level="H"
      marginSize={4}
      fgColor={fg}
      bgColor="#FFFFFF"
      imageSettings={image}
      className={className}
    />
  )
})
