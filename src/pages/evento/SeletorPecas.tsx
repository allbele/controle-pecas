import { useMemo, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { Sheet } from '../../components/ui'
import { useItens } from '../../db/hooks'
import { adicionarAoPedido } from '../../db/actions'
import { UNIDADES } from '../../lib/format'
import type { Linha } from '../../db/schema'
import { SECOES } from '../../data/seed'

export default function SeletorPecas({ aberto, onFechar, eventoId, linhas, extra }: { aberto: boolean; onFechar: () => void; eventoId: string; linhas: Linha[]; extra?: boolean }) {
  const itens = useItens()
  const [busca, setBusca] = useState('')
  const [secaoAtiva, setSecaoAtiva] = useState<string | null>(null)
  const termo = busca.trim().toLowerCase()
  const noPedido = useMemo(() => new Map(linhas.map((l) => [l.itemId, l])), [linhas])

  const secoes = useMemo(() => {
    const s = [...SECOES]
    for (const i of itens ?? []) if (!s.includes(i.secao)) s.push(i.secao)
    return s
  }, [itens])

  const visiveis = (itens ?? []).filter((i) => i.ativo && (!termo || i.nome.toLowerCase().includes(termo)) && (termo || !secaoAtiva || i.secao === secaoAtiva))
  const adicionados = linhas.length

  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo={extra ? 'Incluir peça fora da lista' : 'Adicionar peças'}
      rodape={<button className="btn-primary w-full" onClick={onFechar}>Pronto · {adicionados} na lista</button>}>
      <div className="relative mb-2">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input className="input !pl-10" placeholder="Buscar peça" value={busca} onChange={(e) => setBusca(e.target.value)} autoFocus />
      </div>
      {!termo && (
        <div className="no-scrollbar -mx-5 mb-2 flex gap-1.5 overflow-x-auto px-5 pb-1">
          <button onClick={() => setSecaoAtiva(null)} className={`chip shrink-0 !px-3 !py-2 !text-[12px] ${secaoAtiva === null ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-stone-200'}`}>Todas</button>
          {secoes.map((s) => (
            <button key={s} onClick={() => setSecaoAtiva(s)} className={`chip shrink-0 !px-3 !py-2 !text-[12px] ${secaoAtiva === s ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-stone-200'}`}>{s}</button>
          ))}
        </div>
      )}
      <ul className="divide-y divide-stone-100 rounded-2xl bg-white ring-1 ring-stone-200">
        {visiveis.length === 0 && <li className="px-4 py-6 text-center text-[14px] text-stone-500">Nenhuma peça com esse nome. Crie no Catálogo.</li>}
        {visiveis.map((i) => {
          const l = noPedido.get(i.id)
          return (
            <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{i.nome}</p>
                <p className="text-[11px] uppercase tracking-wide text-stone-400">{i.secao}{i.unidade !== 'un' ? ` · ${UNIDADES[i.unidade].longa}` : ''}</p>
              </div>
              {l && <span className="text-[13px] font-semibold text-brand-700">{l.todos ? 'todos' : l.qtdPedida}</span>}
              <button className={`rounded-xl p-2.5 ${l ? 'bg-brand-50 text-brand-700' : 'bg-brand-700 text-white'}`}
                onClick={() => adicionarAoPedido(eventoId, i.id, 1, false, extra)} aria-label={`Adicionar ${i.nome}`}>
                {l ? <Plus size={18} /> : <Plus size={18} />}
              </button>
              {l && <Check size={16} className="-ml-1 text-brand-600" aria-hidden />}
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
