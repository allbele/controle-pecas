import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, RotateCcw, Share2, ShoppingBag } from 'lucide-react'
import Cabecalho from '../components/Cabecalho'
import { Chip, Vazio } from '../components/ui'
import { useToast } from '../components/Toast'
import { useEventos, useItensMapa, useReposicoes } from '../db/hooks'
import { marcarReposicao } from '../db/actions'
import { UNIDADES, dataCurta, titulo } from '../lib/format'
import { compartilharTexto } from '../lib/share'

export default function Reposicao() {
  const reps = useReposicoes()
  const itens = useItensMapa()
  const eventos = useEventos()
  const avisar = useToast()
  const [aba, setAba] = useState<'pendente' | 'comprado'>('pendente')
  const evMap = useMemo(() => new Map((eventos ?? []).map((e) => [e.id, e])), [eventos])

  const lista = (reps ?? []).filter((r) => r.status === aba)
  const grupos = useMemo(() => {
    const m = new Map<string, typeof lista>()
    for (const r of lista) { if (!m.has(r.itemId)) m.set(r.itemId, []); m.get(r.itemId)!.push(r) }
    return [...m.entries()].sort((a, b) => (itens.get(a[0])?.ordem ?? 0) - (itens.get(b[0])?.ordem ?? 0))
  }, [lista, itens])

  const totalPendente = (reps ?? []).filter((r) => r.status === 'pendente').reduce((s, r) => s + r.qtd, 0)

  async function compartilhar() {
    const linhas = grupos.map(([itemId, rs]) => {
      const it = itens.get(itemId)
      const q = rs.reduce((s, r) => s + r.qtd, 0)
      return `• ${it?.nome ?? itemId}: ${q} ${it && it.unidade !== 'un' ? UNIDADES[it.unidade].curta : ''}`.trim()
    })
    const texto = `Reposição de peças – pendente\n\n${linhas.join('\n')}`
    const r = await compartilharTexto(texto, 'Reposição de peças')
    if (r === 'copiado') avisar('Lista copiada')
  }

  return (
    <>
      <Cabecalho grande titulo="Reposição" subtitulo={totalPendente ? `${totalPendente} peças para comprar` : 'Nada pendente'}
        acao={aba === 'pendente' && grupos.length > 0 ? <button className="btn-secondary !px-3 !py-2.5" onClick={compartilhar} aria-label="Compartilhar lista"><Share2 size={18} /></button> : undefined} />
      <div className="px-4 pb-6">
        <div className="mb-3 grid grid-cols-2 rounded-xl bg-stone-200/70 p-1">
          {(['pendente', 'comprado'] as const).map((a) => (
            <button key={a} onClick={() => setAba(a)} className={`rounded-lg py-2 text-[14px] font-semibold ${aba === a ? 'bg-white shadow-sm' : 'text-stone-500'}`}>{a === 'pendente' ? 'Pendentes' : 'Compradas'}</button>
          ))}
        </div>
        {grupos.length === 0 && <Vazio icone={<ShoppingBag size={26} />} titulo={aba === 'pendente' ? 'Nada para repor' : 'Nenhuma compra registrada'} texto={aba === 'pendente' ? 'Quebras e perdas registradas no retorno dos eventos aparecem aqui.' : undefined} />}
        <div className="space-y-2.5">
          {grupos.map(([itemId, rs]) => {
            const it = itens.get(itemId)
            const total = rs.reduce((s, r) => s + r.qtd, 0)
            return (
              <div key={itemId} className="card px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold">{it?.nome ?? itemId}</p>
                    <p className="text-[12px] uppercase tracking-wide text-stone-500">{it?.secao}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[22px] font-bold leading-none tabular-nums">{total}</p>
                    <p className="text-[11px] text-stone-500">{it ? UNIDADES[it.unidade].longa : ''}</p>
                  </div>
                </div>
                <ul className="mt-2.5 space-y-1.5">
                  {rs.map((r) => {
                    const ev = evMap.get(r.eventoId)
                    return (
                      <li key={r.id} className="flex items-center justify-between gap-2 text-[13px]">
                        <div className="flex min-w-0 items-center gap-2">
                          <Chip cor={r.motivo === 'quebra' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>{r.qtd} {r.motivo}{r.qtd > 1 ? 's' : ''}</Chip>
                          {ev && <Link to={`/evento/${ev.id}/retorno`} className="truncate text-stone-500 underline-offset-2 hover:underline">{dataCurta(ev.data)} · {titulo(ev.contratante)}</Link>}
                        </div>
                        <button className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${aba === 'pendente' ? 'bg-brand-50 text-brand-800' : 'bg-stone-100 text-stone-600'}`}
                          onClick={() => marcarReposicao(r.id!, aba === 'pendente' ? 'comprado' : 'pendente')}>
                          {aba === 'pendente' ? <span className="inline-flex items-center gap-1"><Check size={14} /> Comprado</span> : <span className="inline-flex items-center gap-1"><RotateCcw size={14} /> Desfazer</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
