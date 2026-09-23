import { forwardRef, useEffect, useState } from 'react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'

// O emblema é embebido como data URL para que o SVG descarregado seja autónomo
// e o canvas não fique "tainted" ao exportar PNG.
let cached: string | null = null
export function useEmblem() {
  const [src, setSrc] = useState<string | null>(cached)
  useEffect(() => {
    if (cached) return
    fetch('/pyne-emblem.png')
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
        cached = d
        setSrc(d)
      })
      .catch(() => {})
  }, [])
  return src
}

function imageSettings(src: string | null, size: number) {
  if (!src) return undefined
  const h = Math.round(size * 0.24)
  return { src, height: h, width: Math.round((h * 182) / 437), excavate: true }
}

interface Props {
  value: string
  size: number
  className?: string
}

export const QRSvg = forwardRef<SVGSVGElement, Props>(function QRSvg({ value, size, className }, ref) {
  const emblem = useEmblem()
  return (
    <QRCodeSVG
      ref={ref}
      value={value}
      size={size}
      level="H"
      marginSize={2}
      fgColor="#13263D"
      bgColor="#FFFFFF"
      imageSettings={imageSettings(emblem, size)}
      className={className}
      title={value}
    />
  )
})

export const QRCanvas = forwardRef<HTMLCanvasElement, Props>(function QRCanvas({ value, size, className }, ref) {
  const emblem = useEmblem()
  return (
    <QRCodeCanvas
      ref={ref}
      value={value}
      size={size}
      level="H"
      marginSize={4}
      fgColor="#13263D"
      bgColor="#FFFFFF"
      imageSettings={imageSettings(emblem, size)}
      className={className}
    />
  )
})
