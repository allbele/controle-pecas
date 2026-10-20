import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Toast = { id: number; texto: string; tipo: 'ok' | 'erro' }
const Ctx = createContext<(texto: string, tipo?: Toast['tipo']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Toast[]>([])
  const seq = useRef(0)
  const avisar = useCallback((texto: string, tipo: Toast['tipo'] = 'ok') => {
    const id = ++seq.current
    setLista((l) => [...l, { id, texto, tipo }])
    setTimeout(() => setLista((l) => l.filter((t) => t.id !== id)), 2600)
  }, [])
  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4" style={{ bottom: 'calc(84px + var(--sab))' }} aria-live="polite">
        {lista.map((t) => (
          <div key={t.id} className={`rounded-xl px-4 py-2.5 text-[14px] font-medium text-white shadow-lg ${t.tipo === 'ok' ? 'bg-stone-900 dark:bg-stone-100 dark:text-stone-900' : 'bg-red-600'}`}>{t.texto}</div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
