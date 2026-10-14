import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'

interface Props {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  /** 'danger' (vermelho, por defeito) para apagar; 'primary' para confirmar uma acção normal */
  tone?: 'danger' | 'primary'
}

/** Substituto do confirm() nativo */
export default function ConfirmDialog({ open, message, onConfirm, onCancel, tone = 'danger' }: Props) {
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
        className="animate-pop-in w-full max-w-sm rounded-2xl bg-white p-6 text-ink shadow-2xl ring-1 ring-paper-line"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} onClick={onCancel} className="rounded-lg px-4 py-2.5 font-medium text-ink-soft hover:bg-paper">
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2.5 font-semibold hover:brightness-110 ${tone === 'danger' ? 'bg-red text-white' : 'bg-navy text-gold'}`}
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
