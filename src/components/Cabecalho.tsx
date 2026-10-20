import { type ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Cabecalho({ titulo, subtitulo, voltar, acao, grande }: { titulo: string; subtitulo?: ReactNode; voltar?: string | true; acao?: ReactNode; grande?: boolean }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur" style={{ paddingTop: 'var(--sat)' }}>
      <div className="flex items-center gap-2 px-4 pb-3 pt-3">
        {voltar && (
          <button className="-ml-2 rounded-full p-1.5 text-brand-800 hover:bg-stone-200/60" onClick={() => (voltar === true ? nav(-1) : nav(voltar))} aria-label="Voltar">
            <ChevronLeft size={26} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className={`truncate font-bold leading-tight ${grande ? 'text-[26px]' : 'text-[19px]'}`}>{titulo}</h1>
          {subtitulo && <div className="truncate text-[13px] text-stone-500">{subtitulo}</div>}
        </div>
        {acao}
      </div>
    </header>
  )
}
