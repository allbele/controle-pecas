import { useState } from 'react'
import { AlertTriangle, Check, PackageCheck, Plus, Truck, Undo2 } from 'lucide-react'
import { Progress, SecaoTitulo, Stepper } from '../../components/ui'
import { useToast } from '../../components/Toast'
import { atualizarLinha, liberarSaida, removerLinha, setStatus } from '../../db/actions'
import { plural, qtdTexto } from '../../lib/format'
import { agruparPorSecao, RodapeFixo, type Ctx } from './Evento'
import SeletorPecas from './SeletorPecas'

export default function Saida({ ctx }: { ctx: Ctx }) {
  const { evento, linhas, itens } = ctx
  const avisar = useToast()
  const [seletor, setSeletor] = useState(false)
  const [confirma, setConfirma] = useState(false)
  const conferindo = evento.status === 'lista_pronta' || evento.status === 'planejado'
  const liberada = evento.status === 'saiu' || evento.status === 'fechado'
  const total = linhas.length
  const ok = linhas.filter((l) => l.saidaOk).length
  const pendentes = linhas.filter((l) => !l.saidaOk)
  const grupos = agruparPorSecao(linhas, itens)

  async function liberar() {
    if (pendentes.length > 0 && !confirma) { setConfirma(true); return }
    await liberarSaida(evento.id)
    setConfirma(false)
    avisar('Saída liberada')
  }

  return (
    <div className="pb-32">
      {evento.status === 'planejado' && (
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-sky-50 px-3.5 py-3 text-[13px] text-sky-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> O coordenador ainda não marcou a lista como pronta. Dá para conferir mesmo assim.
        </div>
      )}
      {total > 0 && (
        <div className="card mb-4 px-4 py-3.5">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">Conferência de saída</p>
              <p className="text-[22px] font-bold leading-tight tabular-nums">{ok} <span className="text-[15px] font-medium text-stone-500">de {total} peças</span></p>
            </div>
            {liberada ? <span className="chip bg-brand-100 text-brand-800"><Truck size={13} /> Saída liberada</span> : pendentes.length === 0 ? <span className="chip bg-brand-100 text-brand-800"><Check size={13} /> Tudo conferido</span> : null}
          </div>
          <Progress valor={ok} total={total} cor={pendentes.length === 0 ? 'bg-brand-600' : 'bg-amber-500'} />
          {!liberada && pendentes.length > 0 && (
            <p className="mt-2.5 text-[13px] text-amber-800">
              <b>Falta conferir:</b> {pendentes.slice(0, 4).map((l) => itens.get(l.itemId)?.nome).join(', ')}{pendentes.length > 4 ? ` e mais ${pendentes.length - 4}` : ''}
            </p>
          )}
        </div>
      )}
      {total === 0 && <p className="card px-4 py-6 text-center text-[14px] text-stone-500">A lista deste evento ainda está vazia. Monte a lista ou inclua as peças aqui.</p>}

      {grupos.map(([secao, ls]) => (
        <section key={secao}>
          <SecaoTitulo nome={secao} extra={<span className="text-[12px] text-stone-400">{ls.filter((l) => l.saidaOk).length}/{ls.length}</span>} />
          <ul className="card divide-y divide-stone-100">
            {ls.map((l) => {
              const it = itens.get(l.itemId)
              const saida = l.qtdSaida ?? l.qtdPedida
              const difere = !l.todos && l.qtdSaida !== null && l.qtdSaida !== l.qtdPedida
              return (
                <li key={l.id} className={`flex items-center gap-2 px-3 py-2.5 ${l.saidaOk ? '' : conferindo ? 'bg-amber-50/60' : ''}`}>
                  <button disabled={!conferindo} aria-pressed={l.saidaOk} aria-label={`Conferir ${it?.nome}`}
                    onClick={() => atualizarLinha(l.id!, { saidaOk: !l.saidaOk, qtdSaida: l.saidaOk ? l.qtdSaida : (l.qtdSaida ?? l.qtdPedida) })}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition ${l.saidaOk ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 text-transparent'}`}>
                    <Check size={20} strokeWidth={3} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[15px] ${l.saidaOk ? 'text-stone-500' : 'font-medium'}`}>{it?.nome ?? l.itemId}</p>
                    <p className="text-[12px] text-stone-400">
                      {l.extra ? 'fora da lista' : `pedido: ${qtdTexto(l.qtdPedida, l.todos, it?.unidade ?? 'un')}`}
                      {difere && <span className="ml-1 font-semibold text-amber-700">· saiu {saida}</span>}
                    </p>
                  </div>
                  {l.todos ? (
                    <span className="chip bg-stone-100 text-stone-600">todos</span>
                  ) : conferindo ? (
                    <Stepper valor={saida} onChange={(v) => atualizarLinha(l.id!, { qtdSaida: v, saidaOk: true })} destaque={difere} rotulo={`Saída de ${it?.nome}`} />
                  ) : (
                    <span className="text-[16px] font-semibold tabular-nums">{saida}</span>
                  )}
                  {conferindo && l.extra && <button className="rounded-lg p-1 text-stone-400" onClick={() => removerLinha(l.id!)} aria-label="Remover">×</button>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {conferindo && (
        <RodapeFixo>
          {confirma && <p className="mb-2 text-center text-[13px] font-semibold text-amber-800">{plural(pendentes.length, 'peça não conferida', 'peças não conferidas')}. Liberar mesmo assim?</p>}
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setSeletor(true)} aria-label="Incluir peça fora da lista"><Plus size={18} /> Incluir</button>
            <button className={`${pendentes.length === 0 ? 'btn-primary' : confirma ? 'btn-confirm' : 'btn-secondary'} flex-1`} disabled={total === 0} onClick={liberar}>
              <Truck size={18} /> {confirma ? 'Sim, liberar saída' : 'Liberar saída'}
            </button>
          </div>
        </RodapeFixo>
      )}
      {evento.status === 'saiu' && (
        <RodapeFixo>
          <div className="flex items-center gap-2">
            <p className="flex flex-1 items-center gap-2 text-[13px] text-stone-600"><PackageCheck size={18} className="text-brand-600" /> Peças em evento. Registre a volta na aba Retorno.</p>
            <button className="btn-ghost !px-3 !text-[13px]" onClick={() => setStatus(evento.id, 'lista_pronta')}><Undo2 size={16} /> Reabrir</button>
          </div>
        </RodapeFixo>
      )}
      <SeletorPecas aberto={seletor} onFechar={() => setSeletor(false)} eventoId={evento.id} linhas={linhas} extra />
    </div>
  )
}
