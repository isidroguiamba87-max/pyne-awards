import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'

interface Props {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

/** Substituto do confirm() nativo */
export default function ConfirmDialog({ open, message, onConfirm, onCancel }: Props) {
  const { t } = useI18n()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        className="animate-pop-in w-full max-w-sm rounded-2xl border border-navy-line bg-navy-soft p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} onClick={onCancel} className="rounded-lg px-4 py-2.5 font-medium text-white/80 hover:bg-white/10">
            {t('cancel')}
          </button>
          <button onClick={onConfirm} className="rounded-lg bg-red px-4 py-2.5 font-semibold text-white hover:brightness-110">
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
