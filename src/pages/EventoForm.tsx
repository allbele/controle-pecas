import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import Cabecalho from '../components/Cabecalho'
import { Campo } from '../components/ui'
import { useToast } from '../components/Toast'
import { useEvento, useEventos } from '../db/hooks'
import { atualizarEvento, criarEvento, excluirEvento } from '../db/actions'
import { hojeISO } from '../lib/format'

const TIPOS = ['Casamento', 'Formatura', 'Formatura Militar', 'Empresarial', 'Aniversário', 'Jantar', 'Almoço', 'Baile', 'Degustação', 'Pré Evento', 'Visita Técnica']
const COORDS_BASE = ['Léo', 'Edvaldo', 'Joel', 'Saulo', 'Breno', 'Watson']

export default function EventoForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const avisar = useToast()
  const existente = useEvento(id)
  const todos = useEventos()
  const [data, setData] = useState(hojeISO())
  const [tipo, setTipo] = useState('')
  const [contratante, setContratante] = useState('')
  const [convidados, setConvidados] = useState('')
  const [local, setLocal] = useState('')
  const [coords, setCoords] = useState<string[]>([])
  const [novoCoord, setNovoCoord] = useState('')
  const [obs, setObs] = useState('')
  const [confirmaExcluir, setConfirmaExcluir] = useState(false)

  useEffect(() => {
    if (!existente) return
    setData(existente.data); setTipo(existente.tipo); setContratante(existente.contratante)
    setConvidados(existente.convidados?.toString() ?? ''); setLocal(existente.local)
    setCoords(existente.coordenadores); setObs(existente.observacoes)
  }, [existente])

  const conhecidos = Array.from(new Set([...COORDS_BASE, ...(todos ?? []).flatMap((e) => e.coordenadores), ...coords]))
  const alterna = (c: string) => setCoords((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]))

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!tipo.trim() && !contratante.trim()) { avisar('Informe pelo menos o tipo ou o contratante', 'erro'); return }
    const dados = {
      data, tipo: tipo.trim(), contratante: contratante.trim(), local: local.trim(),
      convidados: convidados ? Number(convidados) : null, coordenadores: coords, observacoes: obs,
    }
    if (id) { await atualizarEvento(id, dados); avisar('Evento atualizado'); nav(`/evento/${id}`, { replace: true }) }
    else { const novo = await criarEvento(dados); avisar('Evento criado'); nav(`/evento/${novo}/lista`, { replace: true }) }
  }

  async function excluir() {
    if (!id) return
    if (!confirmaExcluir) { setConfirmaExcluir(true); return }
    await excluirEvento(id)
    avisar('Evento excluído')
    nav('/', { replace: true })
  }

  return (
    <>
      <Cabecalho titulo={id ? 'Editar evento' : 'Novo evento'} voltar />
      <form onSubmit={salvar} className="space-y-4 px-4 pb-10">
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Data"><input type="date" className="input" value={data} onChange={(e) => setData(e.target.value)} required /></Campo>
          <Campo rotulo="Convidados"><input type="number" inputMode="numeric" className="input" value={convidados} onChange={(e) => setConvidados(e.target.value)} placeholder="150" /></Campo>
        </div>
        <Campo rotulo="Tipo">
          <input list="tipos" className="input" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Casamento, Formatura…" />
          <datalist id="tipos">{TIPOS.map((t) => <option key={t} value={t} />)}</datalist>
        </Campo>
        <Campo rotulo="Contratante / nome do evento"><input className="input" value={contratante} onChange={(e) => setContratante(e.target.value)} placeholder="Ex.: Isabella Albuquerque" /></Campo>
        <Campo rotulo="Local"><input className="input" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Cidade ou espaço" /></Campo>
        <div>
          <span className="label">Coordenadores</span>
          <div className="flex flex-wrap gap-2">
            {conhecidos.map((c) => (
              <button type="button" key={c} onClick={() => alterna(c)} className={`chip !px-3 !py-2 !text-[13px] ${coords.includes(c) ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-stone-950' : 'bg-white text-stone-700 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-200 dark:ring-stone-700'}`}>{c}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input className="input" value={novoCoord} onChange={(e) => setNovoCoord(e.target.value)} placeholder="Outro nome" />
            <button type="button" className="btn-secondary shrink-0" onClick={() => { const n = novoCoord.trim(); if (n) { if (!coords.includes(n)) setCoords([...coords, n]); setNovoCoord('') } }}>Incluir</button>
          </div>
        </div>
        <Campo rotulo="Observações"><textarea className="input min-h-[80px]" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Recados para a equipe" /></Campo>
        <button type="submit" className="btn-primary w-full">{id ? 'Salvar' : 'Criar evento'}</button>
        {id && (
          <button type="button" className="btn-danger w-full" onClick={excluir}>
            <Trash2 size={18} /> {confirmaExcluir ? 'Toque de novo para confirmar a exclusão' : 'Excluir evento'}
          </button>
        )}
      </form>
    </>
  )
}
