import { useState } from 'react'
import { CheckCircle2, ClipboardList, Copy, Plus, Undo2, X } from 'lucide-react'
import { Chip, SecaoTitulo, Sheet, Stepper, Vazio } from '../../components/ui'
import { useToast } from '../../components/Toast'
import { useEventos } from '../../db/hooks'
import { atualizarLinha, copiarLista, removerLinha, setStatus } from '../../db/actions'
import { UNIDADES, dataCurta, plural, titulo } from '../../lib/format'
import { agruparPorSecao, RodapeFixo, type Ctx } from './Evento'
import SeletorPecas from './SeletorPecas'

export default function Lista({ ctx }: { ctx: Ctx }) {
  const { evento, linhas, itens } = ctx
  const avisar = useToast()
  const [seletor, setSeletor] = useState(false)
  const [copiar, setCopiar] = useState(false)
  const editavel = evento.status === 'planejado' || evento.status === 'lista_pronta'
  const grupos = agruparPorSecao(linhas.filter((l) => !l.extra), itens)
  const extras = linhas.filter((l) => l.extra)

  return (
    <div className="pb-28">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-stone-500">
          {linhas.length ? `${plural(linhas.length, 'peça', 'peças')} em ${plural(grupos.length, 'seção', 'seções')}` : 'Lista do coordenador'}
          {evento.coordenadores.length > 0 && ` · ${evento.coordenadores.join(', ')}`}
        </p>
        {editavel && <button className="btn-ghost !px-2 !py-1.5 !text-[13px]" onClick={() => setCopiar(true)}><Copy size={15} /> Copiar de outro evento</button>}
      </div>

      {linhas.length === 0 && (
        <Vazio icone={<ClipboardList size={26} />} titulo="Lista vazia" texto="Inclua as peças que o evento vai precisar. Dá para copiar de um evento parecido."
          acao={editavel ? <button className="btn-primary" onClick={() => setSeletor(true)}><Plus size={18} /> Adicionar peças</button> : undefined} />
      )}

      {grupos.map(([secao, ls]) => (
        <section key={secao}>
          <SecaoTitulo nome={secao} extra={<span className="text-[12px] text-stone-400">{ls.length}</span>} />
          <ul className="card divide-y divide-stone-100">
            {ls.map((l) => {
              const it = itens.get(l.itemId)
              return (
                <li key={l.id} className="flex items-center gap-2 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px]">{it?.nome ?? l.itemId}</p>
                    {it && it.unidade !== 'un' && <p className="text-[11px] text-stone-400">em {UNIDADES[it.unidade].longa}s</p>}
                  </div>
                  {editavel ? (
                    <>
                      {l.todos ? (
                        <button className="chip bg-brand-700 text-white !px-3 !py-2" onClick={() => atualizarLinha(l.id!, { todos: false, qtdPedida: 1 })}>todos</button>
                      ) : (
                        <>
                          <Stepper valor={l.qtdPedida} min={1} onChange={(v) => atualizarLinha(l.id!, { qtdPedida: v })} rotulo={`Quantidade de ${it?.nome}`} />
                          {it?.secao === 'PRATOS' && <button className="chip bg-stone-100 text-stone-600 !px-2 !py-2" onClick={() => atualizarLinha(l.id!, { todos: true, qtdPedida: null })}>todos</button>}
                        </>
                      )}
                      <button className="rounded-lg p-1.5 text-stone-400 hover:text-red-600" onClick={() => removerLinha(l.id!)} aria-label="Remover"><X size={18} /></button>
                    </>
                  ) : (
                    <span className="text-[16px] font-semibold tabular-nums">{l.todos ? 'todos' : l.qtdPedida}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {extras.length > 0 && (
        <section>
          <SecaoTitulo nome="Incluídas na saída (fora da lista)" />
          <ul className="card divide-y divide-stone-100">
            {extras.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-3.5 py-2.5 text-[15px]"><span>{itens.get(l.itemId)?.nome}</span><Chip>{l.qtdSaida}</Chip></li>
            ))}
          </ul>
        </section>
      )}

      {editavel && (
        <RodapeFixo>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setSeletor(true)}><Plus size={18} /> Peças</button>
            {evento.status === 'planejado' ? (
              <button className="btn-primary flex-[2]" disabled={linhas.length === 0} onClick={async () => { await setStatus(evento.id, 'lista_pronta'); avisar('Lista enviada para conferência') }}>
                <CheckCircle2 size={18} /> Lista pronta
              </button>
            ) : (
              <button className="btn-ghost flex-[2]" onClick={() => setStatus(evento.id, 'planejado')}><Undo2 size={18} /> Voltar a editar</button>
            )}
          </div>
        </RodapeFixo>
      )}

      <SeletorPecas aberto={seletor} onFechar={() => setSeletor(false)} eventoId={evento.id} linhas={linhas} />
      <CopiarDeEvento aberto={copiar} onFechar={() => setCopiar(false)} paraEventoId={evento.id} />
    </div>
  )
}

function CopiarDeEvento({ aberto, onFechar, paraEventoId }: { aberto: boolean; onFechar: () => void; paraEventoId: string }) {
  const eventos = useEventos()
  const avisar = useToast()
  const candidatos = (eventos ?? []).filter((e) => e.id !== paraEventoId).reverse()
  return (
    <Sheet aberto={aberto} onFechar={onFechar} titulo="Copiar lista de">
      <ul className="divide-y divide-stone-100 rounded-2xl bg-white ring-1 ring-stone-200">
        {candidatos.map((e) => (
          <li key={e.id}>
            <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={async () => { const n = await copiarLista(e.id, paraEventoId); avisar(n ? `${plural(n, 'peça copiada', 'peças copiadas')}` : 'Nada novo para copiar'); onFechar() }}>
              <span><span className="block text-[15px] font-medium">{e.tipo} · {titulo(e.contratante)}</span><span className="block text-[12px] text-stone-500">{dataCurta(e.data)} · {titulo(e.local)}</span></span>
              <Copy size={16} className="text-stone-400" />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
