import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function BottomSheet({ open, onClose, children, title }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/30 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full bg-white rounded-t-3xl shadow-sheet animate-slide-up max-h-[85vh] flex flex-col">
        <div className="flex-shrink-0 pt-3 pb-1 px-5">
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
          {title && (
            <h2 className="text-base font-semibold text-zinc-900 mb-1">{title}</h2>
          )}
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}
