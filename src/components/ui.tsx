import { type ReactNode, useEffect } from 'react'
import { Minus, Plus, X } from 'lucide-react'

export function Progress({ valor, total, cor = 'bg-brand-600' }: { valor: number; total: number; cor?: string }) {
  const pct = total === 0 ? 0 : Math.round((valor / total) * 100)
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Stepper({
  valor, onChange, min = 0, disabled, rotulo, destaque,
}: { valor: number | null; onChange: (v: number) => void; min?: number; disabled?: boolean; rotulo?: string; destaque?: boolean }) {
  const v = valor ?? 0
  return (
    <div className={`inline-flex items-stretch overflow-hidden rounded-xl border ${destaque ? 'border-brand-400 dark:border-brand-500' : 'border-stone-200 dark:border-stone-700'} ${disabled ? 'opacity-50' : ''}`} aria-label={rotulo}>
      <button type="button" className="px-3 text-stone-600 active:bg-stone-100 disabled:opacity-30 dark:text-stone-300 dark:active:bg-stone-800" onClick={() => onChange(Math.max(min, v - 1))} disabled={disabled || v <= min} aria-label="menos">
        <Minus size={18} />
      </button>
      <input
        type="number" inputMode="numeric" className="w-12 border-x border-stone-200 bg-transparent text-center text-[16px] font-semibold tabular-nums outline-none dark:border-stone-700"
        value={valor === null ? '' : v} placeholder="0" disabled={disabled}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value || 0)))}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" className="px-3 text-stone-600 active:bg-stone-100 dark:text-stone-300 dark:active:bg-stone-800" onClick={() => onChange(v + 1)} disabled={disabled} aria-label="mais">
        <Plus size={18} />
      </button>
    </div>
  )
}

export function Sheet({ aberto, onFechar, titulo, children, rodape }: { aberto: boolean; onFechar: () => void; titulo: string; children: ReactNode; rodape?: ReactNode }) {
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [aberto, onFechar])
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onFechar} />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-paper shadow-2xl dark:bg-stone-950 sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-[17px] font-bold">{titulo}</h2>
          <button className="rounded-full p-2 text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800" onClick={onFechar} aria-label="Fechar"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {rodape && <div className="border-t border-stone-200 px-5 py-3 dark:border-stone-800" style={{ paddingBottom: 'calc(12px + var(--sab))' }}>{rodape}</div>}
      </div>
    </div>
  )
}

export function Vazio({ icone, titulo, texto, acao }: { icone: ReactNode; titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 rounded-2xl bg-brand-50 p-4 text-brand-700 dark:bg-stone-800 dark:text-brand-300">{icone}</div>
      <p className="text-[16px] font-semibold">{titulo}</p>
      {texto && <p className="mt-1 max-w-xs text-[14px] text-stone-500 dark:text-stone-400">{texto}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  )
}

export function Chip({ children, cor = 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200', className = '' }: { children: ReactNode; cor?: string; className?: string }) {
  return <span className={`chip ${cor} ${className}`}>{children}</span>
}

export function SecaoTitulo({ nome, extra }: { nome: string; extra?: ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between px-1 first:mt-0">
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{nome}</h3>
      {extra}
    </div>
  )
}

export function Campo({ rotulo, children, dica }: { rotulo: string; children: ReactNode; dica?: string }) {
  return (
    <label className="block">
      <span className="label">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-[12px] text-stone-500">{dica}</span>}
    </label>
  )
}
