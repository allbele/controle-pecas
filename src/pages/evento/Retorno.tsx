import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, CheckCheck, Lock, MessageSquare, Undo2, X } from 'lucide-react'
import { SecaoTitulo, Stepper } from '../../components/ui'
import { useToast } from '../../components/Toast'
import { adicionarFoto, atualizarLinha, fecharEvento, reabrirEvento, voltouTudo } from '../../db/actions'
import { removerFoto } from '../../db/actions'
import { diferencaRetorno, plural, saidaEfetiva } from '../../lib/format'
import type { Foto, Linha } from '../../db/schema'
import { agruparPorSecao, RodapeFixo, type Ctx } from './Evento'

export default function Retorno({ ctx }: { ctx: Ctx }) {
  const { evento, linhas, itens, fotos } = ctx
  const avisar = useToast()
  const [confirma, setConfirma] = useState(false)
  const aberto = evento.status === 'saiu'
  const fechado = evento.status === 'fechado'
  const antes = !aberto && !fechado
  const grupos = agruparPorSecao(linhas, itens)
  const quebras = linhas.reduce((s, l) => s + l.quebras, 0)
  const perdas = linhas.reduce((s, l) => s + l.perdas, 0)
  const semRegistro = linhas.filter((l) => !l.todos && l.qtdVolta === null).length
  const inconsistentes = linhas.filter((l) => l.qtdVolta !== null && diferencaRetorno(l) !== 0).length

  async function fechar() {
    if (semRegistro > 0 && !confirma) { setConfirma(true); return }
    await fecharEvento(evento.id)
    setConfirma(false)
    avisar(quebras + perdas ? `Evento fechado · ${plural(quebras + perdas, 'peça', 'peças')} para repor` : 'Evento fechado, voltou tudo')
  }

  if (antes) {
    return (
      <div className="card mt-2 flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-3 rounded-2xl bg-stone-100 p-4 text-stone-500 dark:bg-stone-800"><Lock size={26} /></div>
        <p className="text-[16px] font-semibold">A saída ainda não foi liberada</p>
        <p className="mt-1 max-w-xs text-[14px] text-stone-500">Confira a saída primeiro. O retorno fica disponível quando as peças saírem para o evento.</p>
      </div>
    )
  }

  return (
    <div className="pb-32">
      <div className="card mb-4 px-4 py-3.5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-[22px] font-bold tabular-nums">{linhas.filter((l) => l.qtdVolta !== null || l.todos).length}<span className="text-[13px] font-medium text-stone-400">/{linhas.length}</span></p><p className="text-[11px] uppercase tracking-wide text-stone-500">conferidas</p></div>
          <div><p className={`text-[22px] font-bold tabular-nums ${quebras ? 'text-red-600 dark:text-red-300' : ''}`}>{quebras}</p><p className="text-[11px] uppercase tracking-wide text-stone-500">quebras</p></div>
          <div><p className={`text-[22px] font-bold tabular-nums ${perdas ? 'text-orange-600 dark:text-orange-300' : ''}`}>{perdas}</p><p className="text-[11px] uppercase tracking-wide text-stone-500">perdas</p></div>
        </div>
        {inconsistentes > 0 && <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-amber-800 dark:text-amber-200"><AlertTriangle size={14} /> {plural(inconsistentes, 'peça com conta que não fecha', 'peças com conta que não fecha')}</p>}
      </div>

      {grupos.map(([secao, ls]) => (
        <section key={secao}>
          <SecaoTitulo nome={secao} extra={aberto ? (
            <button className="btn-ghost !px-2 !py-1 !text-[12px]" onClick={() => voltouTudo(evento.id, ls.map((l) => l.itemId))}><CheckCheck size={14} /> Voltou tudo</button>
          ) : undefined} />
          <ul className="card divide-y divide-stone-100 dark:divide-stone-800">
            {ls.map((l) => <LinhaRetorno key={l.id} linha={l} nome={itens.get(l.itemId)?.nome ?? l.itemId} fotos={fotos.filter((f) => f.itemId === l.itemId)} editavel={aberto} eventoId={evento.id} />)}
          </ul>
        </section>
      ))}

      {aberto && (
        <RodapeFixo>
          {confirma && <p className="mb-2 text-center text-[13px] font-semibold text-amber-800 dark:text-amber-200">{plural(semRegistro, 'peça sem volta registrada', 'peças sem volta registradas')}. Vou considerar que voltaram inteiras. Fechar?</p>}
          <button className={`${confirma ? 'btn-confirm' : 'btn-primary'} w-full`} onClick={fechar} disabled={linhas.length === 0}>{confirma ? 'Sim, fechar evento' : 'Fechar evento'}</button>
        </RodapeFixo>
      )}
      {fechado && (
        <RodapeFixo>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-[13px] text-stone-600 dark:text-stone-300">Evento fechado. {quebras + perdas ? `${plural(quebras + perdas, 'peça foi', 'peças foram')} para a reposição.` : 'Voltou tudo.'}</p>
            <button className="btn-ghost !px-3 !text-[13px]" onClick={() => reabrirEvento(evento.id)}><Undo2 size={16} /> Reabrir</button>
          </div>
        </RodapeFixo>
      )}
    </div>
  )
}

function LinhaRetorno({ linha: l, nome, fotos, editavel, eventoId }: { linha: Linha; nome: string; fotos: Foto[]; editavel: boolean; eventoId: string }) {
  const saida = saidaEfetiva(l)
  const volta = l.qtdVolta ?? saida
  const dif = l.qtdVolta === null ? 0 : diferencaRetorno(l)
  const [obsAberta, setObsAberta] = useState(!!l.obs)
  const input = useRef<HTMLInputElement>(null)
  const temProblema = l.quebras > 0 || l.perdas > 0
  const registrado = l.qtdVolta !== null || l.todos

  return (
    <li className={`px-3.5 py-3 ${temProblema ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[15px] ${registrado ? '' : 'font-medium'}`}>{nome}</p>
          <p className="text-[12px] text-stone-400">saiu: {l.todos ? 'todos' : saida}{dif !== 0 && <span className="ml-1 font-semibold text-amber-700 dark:text-amber-300">· {Math.abs(dif)} sem explicação</span>}</p>
        </div>
        {editavel && !l.todos && (
          <div className="flex gap-1">
            <button className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800" onClick={() => input.current?.click()} aria-label="Foto da quebra"><Camera size={18} /></button>
            <button className={`rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800 ${obsAberta ? 'text-brand-700' : 'text-stone-500'}`} onClick={() => setObsAberta((v) => !v)} aria-label="Observação"><MessageSquare size={18} /></button>
            <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await adicionarFoto(eventoId, l.itemId, f); e.target.value = '' }} />
          </div>
        )}
      </div>
      {!l.todos && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Contador rotulo="Voltou" valor={volta} cor="text-brand-700 dark:text-brand-300" editavel={editavel}
            onChange={(v) => atualizarLinha(l.id!, { qtdVolta: v })} />
          <Contador rotulo="Quebrou" valor={l.quebras} cor={l.quebras ? 'text-red-600 dark:text-red-300' : ''} editavel={editavel}
            onChange={(v) => atualizarLinha(l.id!, { quebras: v, qtdVolta: Math.max(0, (saida ?? 0) - v - l.perdas) })} />
          <Contador rotulo="Perdeu" valor={l.perdas} cor={l.perdas ? 'text-orange-600 dark:text-orange-300' : ''} editavel={editavel}
            onChange={(v) => atualizarLinha(l.id!, { perdas: v, qtdVolta: Math.max(0, (saida ?? 0) - l.quebras - v) })} />
        </div>
      )}
      {(fotos.length > 0) && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {fotos.map((f) => <Miniatura key={f.id} foto={f} editavel={editavel} />)}
        </div>
      )}
      {(obsAberta || (!editavel && l.obs)) && (
        <input className="input mt-2 !py-2 !text-[14px]" placeholder="Observação (ex.: quebrou no transporte)" defaultValue={l.obs} disabled={!editavel}
          onBlur={(e) => atualizarLinha(l.id!, { obs: e.target.value })} />
      )}
    </li>
  )
}

function Contador({ rotulo, valor, cor, editavel, onChange }: { rotulo: string; valor: number | null; cor: string; editavel: boolean; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-stone-50 px-1 py-1.5 dark:bg-stone-800/60">
      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{rotulo}</span>
      {editavel ? <Stepper valor={valor} onChange={onChange} rotulo={rotulo} /> : <span className={`py-1 text-[18px] font-bold tabular-nums ${cor}`}>{valor ?? '—'}</span>}
    </div>
  )
}

export function Miniatura({ foto, editavel, tamanho = 64 }: { foto: Foto; editavel?: boolean; tamanho?: number }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => { const u = URL.createObjectURL(foto.blob); setUrl(u); return () => URL.revokeObjectURL(u) }, [foto.blob])
  const [ampliada, setAmpliada] = useState(false)
  return (
    <>
      <div className="relative shrink-0">
        <button onClick={() => setAmpliada(true)} className="block overflow-hidden rounded-lg ring-1 ring-stone-200 dark:ring-stone-700" style={{ width: tamanho, height: tamanho }}>
          {url && <img src={url} alt="Foto da peça" className="h-full w-full object-cover" />}
        </button>
        {editavel && <button className="absolute -right-1.5 -top-1.5 rounded-full bg-stone-800 p-0.5 text-white" onClick={() => removerFoto(foto.id!)} aria-label="Remover foto"><X size={12} /></button>}
      </div>
      {ampliada && url && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setAmpliada(false)}>
          <img src={url} alt="Foto da peça" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </>
  )
}
