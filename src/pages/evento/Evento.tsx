import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapPin, Pencil, Users } from 'lucide-react'
import Cabecalho from '../../components/Cabecalho'
import { Chip } from '../../components/ui'
import { useConfig, useEvento, useFotos, useItensMapa, useLinhas } from '../../db/hooks'
import { STATUS, dataLonga, titulo } from '../../lib/format'
import type { Evento as EventoT, Foto, Item, Linha, Papel } from '../../db/schema'
import Lista from './Lista'
import Saida from './Saida'
import Retorno from './Retorno'
import Resumo from './Resumo'

export type AbaId = 'lista' | 'saida' | 'retorno' | 'resumo'
export type Ctx = { evento: EventoT; linhas: Linha[]; itens: Map<string, Item>; fotos: Foto[]; papel: Papel }

const ABAS: { id: AbaId; rotulo: string }[] = [
  { id: 'lista', rotulo: 'Lista' }, { id: 'saida', rotulo: 'Saída' }, { id: 'retorno', rotulo: 'Retorno' }, { id: 'resumo', rotulo: 'Resumo' },
]

function abaPadrao(status: EventoT['status'], papel: Papel): AbaId {
  if (papel === 'coordenador') return status === 'fechado' ? 'resumo' : 'lista'
  if (status === 'planejado') return 'lista'
  if (status === 'lista_pronta') return 'saida'
  if (status === 'saiu') return 'retorno'
  return 'resumo'
}

export default function Evento() {
  const { id, aba } = useParams<{ id: string; aba?: AbaId }>()
  const nav = useNavigate()
  const cfg = useConfig()
  const evento = useEvento(id)
  const linhas = useLinhas(id)
  const fotos = useFotos(id)
  const itens = useItensMapa()

  const abas = useMemo(() => (cfg.papel === 'coordenador' ? ABAS.filter((a) => a.id === 'lista' || a.id === 'resumo') : ABAS), [cfg.papel])

  useEffect(() => {
    if (!evento) return
    const valida = abas.some((a) => a.id === aba)
    if (!aba || !valida) nav(`/evento/${evento.id}/${abaPadrao(evento.status, cfg.papel)}`, { replace: true })
  }, [evento, aba, abas, cfg.papel, nav])

  if (evento === undefined || !linhas || !fotos) return null
  if (evento === null) return <div className="p-6 text-center text-stone-500">Evento não encontrado. <Link className="underline" to="/">Voltar</Link></div>

  const st = STATUS[evento.status]
  const ctx: Ctx = { evento, linhas, itens, fotos, papel: cfg.papel }
  const abaAtual = (aba && abas.some((a) => a.id === aba) ? aba : abaPadrao(evento.status, cfg.papel)) as AbaId

  return (
    <>
      <Cabecalho voltar="/" titulo={`${evento.tipo}${evento.tipo && evento.contratante ? ' · ' : ''}${titulo(evento.contratante)}`}
        subtitulo={<span>{dataLonga(evento.data)}</span>}
        acao={<Link to={`/evento/${evento.id}/editar`} className="btn-ghost !p-2.5" aria-label="Editar evento"><Pencil size={20} /></Link>} />
      <div className="px-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-stone-600 dark:text-stone-400">
          <Chip cor={st.cor}>{st.rotulo}</Chip>
          {evento.local && <span className="inline-flex items-center gap-1"><MapPin size={13} />{titulo(evento.local)}</span>}
          {evento.convidados !== null && <span className="inline-flex items-center gap-1"><Users size={13} />{evento.convidados} convidados</span>}
          {evento.coordenadores.length > 0 && <span>Coord.: {evento.coordenadores.join(', ')}</span>}
        </div>
        <div className="sticky top-[56px] z-20 -mx-4 mt-3 bg-paper/95 px-4 py-2 backdrop-blur dark:bg-stone-950/95">
          <div className="grid rounded-xl bg-stone-200/70 p-1 dark:bg-stone-800" style={{ gridTemplateColumns: `repeat(${abas.length}, 1fr)` }} role="tablist">
            {abas.map((a) => (
              <button key={a.id} role="tab" aria-selected={abaAtual === a.id} onClick={() => nav(`/evento/${evento.id}/${a.id}`, { replace: true })}
                className={`rounded-lg py-2 text-[14px] font-semibold transition ${abaAtual === a.id ? 'bg-white shadow-sm dark:bg-stone-900' : 'text-stone-500'}`}>{a.rotulo}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 pb-6">
        {abaAtual === 'lista' && <Lista ctx={ctx} />}
        {abaAtual === 'saida' && <Saida ctx={ctx} />}
        {abaAtual === 'retorno' && <Retorno ctx={ctx} />}
        {abaAtual === 'resumo' && <Resumo ctx={ctx} />}
      </div>
    </>
  )
}

/** Agrupa linhas por seção na ordem do catálogo. */
export function agruparPorSecao(linhas: Linha[], itens: Map<string, Item>) {
  const grupos = new Map<string, Linha[]>()
  const ordenadas = [...linhas].sort((a, b) => (itens.get(a.itemId)?.ordem ?? 0) - (itens.get(b.itemId)?.ordem ?? 0))
  for (const l of ordenadas) {
    const s = itens.get(l.itemId)?.secao ?? 'OUTROS'
    if (!grupos.has(s)) grupos.set(s, [])
    grupos.get(s)!.push(l)
  }
  return [...grupos.entries()]
}

export function RodapeFixo({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200/80 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95" style={{ paddingBottom: 'calc(10px + var(--sab))' }}>
      <div className="mx-auto max-w-lg px-4 pt-2.5">{children}</div>
    </div>
  )
}
