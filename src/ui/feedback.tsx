import { Check } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Sheet } from './Sheet'
import { Button, Input } from './primitives'

interface ToastState {
  id: number
  text: string
  action?: { label: string; run: () => void }
}

interface ConfirmOpts {
  title: string
  body?: ReactNode
  confirmLabel?: string
  /** User must type this word to enable the confirm button. */
  typeToConfirm?: string
  danger?: boolean
}

interface FeedbackApi {
  toast: (text: string, action?: ToastState['action']) => void
  confirm: (o: ConfirmOpts) => Promise<boolean>
}

const Ctx = createContext<FeedbackApi | null>(null)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const [typed, setTyped] = useState('')

  const showToast = useCallback((text: string, action?: ToastState['action']) => {
    clearTimeout(timer.current)
    setToast({ id: Date.now(), text, action })
    timer.current = setTimeout(() => setToast(null), action ? 4500 : 2200)
  }, [])

  const confirm = useCallback(
    (o: ConfirmOpts) =>
      new Promise<boolean>((resolve) => {
        setTyped('')
        setConfirmState({ ...o, resolve })
      }),
    [],
  )

  const close = (v: boolean) => {
    confirmState?.resolve(v)
    setConfirmState(null)
  }

  return (
    <Ctx.Provider value={{ toast: showToast, confirm }}>
      {children}
      {toast &&
        createPortal(
          <div
            key={toast.id}
            className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 92px)' }}
          >
            <div className="pointer-events-auto flex animate-rise items-center gap-3 rounded-2xl border border-line-strong bg-elev py-2.5 pr-2.5 pl-4 shadow-[0_10px_30px_rgb(0_0_0/0.35)]">
              <Check size={16} className="text-good" strokeWidth={2.6} />
              <span className="text-[14px] font-medium">{toast.text}</span>
              {toast.action && (
                <button
                  className="press rounded-xl px-3 py-1.5 text-[14px] font-semibold text-accent-strong active:bg-accent-soft"
                  onClick={() => {
                    toast.action!.run()
                    setToast(null)
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
      <Sheet open={!!confirmState} onClose={() => close(false)} title={confirmState?.title}>
        {confirmState && (
          <div className="space-y-4 pt-1">
            {confirmState.body && <div className="text-[15px] leading-relaxed text-muted">{confirmState.body}</div>}
            {confirmState.typeToConfirm && (
              <Input
                autoFocus
                placeholder={`Type ${confirmState.typeToConfirm} to confirm`}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoCapitalize="characters"
              />
            )}
            <div className="grid grid-cols-2 gap-3 pb-2">
              <Button onClick={() => close(false)}>Cancel</Button>
              <Button
                variant={confirmState.danger ? 'danger' : 'primary'}
                disabled={!!confirmState.typeToConfirm && typed.trim().toUpperCase() !== confirmState.typeToConfirm}
                onClick={() => close(true)}
              >
                {confirmState.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </Ctx.Provider>
  )
}

export function useFeedback(): FeedbackApi {
  const c = useContext(Ctx)
  if (!c) throw new Error('useFeedback outside FeedbackProvider')
  return c
}
