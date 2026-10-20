import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, CalendarPlus, ChevronDown, ChevronRight, MapPin, Users } from 'lucide-react'
import Cabecalho from '../components/Cabecalho'
import { Chip, Vazio } from '../components/ui'
import { db, type Evento, type Linha } from '../db/schema'
import { useConfig, useEventos } from '../db/hooks'
import { STATUS, dataLonga, hojeISO, plural, titulo } from '../lib/format'

export default function Agenda() {
  const cfg = useConfig()
  const eventos = useEventos()
  const linhas = useLiveQuery(() => db.linhas.toArray(), [])
  const [mostrarPassados, setMostrarPassados] = useState(false)
  const hoje = hojeISO()

  const porEvento = useMemo(() => {
    const m = new Map<string, Linha[]>()
    for (const l of linhas ?? []) {
      if (!m.has(l.eventoId)) m.set(l.eventoId, [])
      m.get(l.eventoId)!.push(l)
    }
    return m
  }, [linhas])

  if (!eventos) return null
  const futuros = eventos.filter((e) => e.data >= hoje)
  const passados = eventos.filter((e) => e.data < hoje).reverse()

  return (
    <>
      <Cabecalho
        grande titulo="Agenda"
        subtitulo={<span>Guy Gourmet · {cfg.papel === 'coordenador' ? 'Coordenador' : 'Setor de Peças'}</span>}
        acao={<Link to="/evento/novo" className="btn-primary !px-3 !py-2.5" aria-label="Novo evento"><CalendarPlus size={20} /><span className="hidden sm:inline">Novo</span></Link>}
      />
      <div className="px-4 pb-6">
        {futuros.length === 0 && passados.length === 0 && (
          <Vazio icone={<CalendarPlus size={28} />} titulo="Nenhum evento ainda" texto="Crie o primeiro evento para montar a lista de peças." acao={<Link to="/evento/novo" className="btn-primary">Novo evento</Link>} />
        )}
        {futuros.length === 0 && passados.length > 0 && (
          <p className="card mt-2 px-4 py-5 text-center text-[14px] text-stone-500">Nenhum evento à frente. Toque em <b>Novo</b> para incluir.</p>
        )}
        <ListaPorData eventos={futuros} porEvento={porEvento} />

        {passados.length > 0 && (
          <div className="mt-8">
            <button className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left" onClick={() => setMostrarPassados((v) => !v)} aria-expanded={mostrarPassados}>
              <span className="text-[13px] font-bold uppercase tracking-wider text-stone-500">Eventos anteriores · {passados.length}</span>
              <ChevronDown size={18} className={`text-stone-400 transition ${mostrarPassados ? 'rotate-180' : ''}`} />
            </button>
            {mostrarPassados && <ListaPorData eventos={passados} porEvento={porEvento} passado />}
          </div>
        )}
      </div>
    </>
  )
}

function ListaPorData({ eventos, porEvento, passado }: { eventos: Evento[]; porEvento: Map<string, Linha[]>; passado?: boolean }) {
  const grupos = new Map<string, Evento[]>()
  for (const e of eventos) {
    if (!grupos.has(e.data)) grupos.set(e.data, [])
    grupos.get(e.data)!.push(e)
  }
  const hoje = hojeISO()
  return (
    <div className="space-y-6">
      {[...grupos.entries()].map(([data, evs]) => (
        <section key={data}>
          <div className="mb-2 mt-4 flex items-center justify-between px-1">
            <h2 className={`text-[14px] font-bold ${data === hoje ? 'text-brand-700 dark:text-brand-300' : passado ? 'text-stone-400' : ''}`}>
              {data === hoje ? 'Hoje · ' : ''}{dataLonga(data)}
            </h2>
            {evs.length > 1 && (
              <Chip cor="bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"><AlertTriangle size={12} /> {evs.length} eventos no dia</Chip>
            )}
          </div>
          <div className="space-y-2.5">
            {evs.map((e) => <CartaoEvento key={e.id} evento={e} linhas={porEvento.get(e.id) ?? []} />)}
          </div>
        </section>
      ))}
    </div>
  )
}

function CartaoEvento({ evento, linhas }: { evento: Evento; linhas: Linha[] }) {
  const st = STATUS[evento.status]
  const total = linhas.length
  const conferidas = linhas.filter((l) => l.saidaOk).length
  const quebras = linhas.reduce((s, l) => s + l.quebras + l.perdas, 0)
  const grande = (evento.convidados ?? 0) >= 900

  let resumo = ''
  if (evento.status === 'planejado') resumo = total ? `${plural(total, 'peça', 'peças')} na lista` : 'Lista vazia'
  else if (evento.status === 'lista_pronta') resumo = `Saída: ${conferidas} de ${total} conferidas`
  else if (evento.status === 'saiu') resumo = `${plural(total, 'peça', 'peças')} em evento`
  else resumo = quebras ? `${plural(quebras, 'peça a repor', 'peças a repor')}` : 'Voltou tudo'

  return (
    <Link to={`/evento/${evento.id}`} className="card block px-4 py-3.5 active:bg-stone-50 dark:active:bg-stone-800">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">{evento.tipo}</span>
            {grande && <Chip cor="bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-100">grande porte</Chip>}
          </div>
          <p className="mt-0.5 truncate text-[16px] font-semibold">{titulo(evento.contratante) || 'Sem nome'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-stone-500 dark:text-stone-400">
            {evento.local && <span className="inline-flex items-center gap-1"><MapPin size={13} />{titulo(evento.local)}</span>}
            {evento.convidados !== null && <span className="inline-flex items-center gap-1"><Users size={13} />{evento.convidados}</span>}
            {evento.coordenadores.length > 0 && <span>{evento.coordenadores.join(', ')}</span>}
          </div>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-stone-300" />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <Chip cor={st.cor}>{st.rotulo}</Chip>
        <span className={`text-[12px] ${evento.status === 'fechado' && quebras ? 'font-semibold text-red-600 dark:text-red-300' : 'text-stone-500'}`}>{resumo}</span>
      </div>
    </Link>
  )
}
