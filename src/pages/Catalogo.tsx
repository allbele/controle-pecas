import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Search, Tag } from 'lucide-react'
import Cabecalho from '../components/Cabecalho'
import { Campo, Chip, Sheet, Vazio } from '../components/ui'
import { useToast } from '../components/Toast'
import { useItens } from '../db/hooks'
import { atualizarItem, criarItem, excluirItem, moverItem } from '../db/actions'
import { UNIDADES } from '../lib/format'
import type { Item, Unidade } from '../db/schema'
import { SECOES } from '../data/seed'

export default function Catalogo() {
  const itens = useItens()
  const [busca, setBusca] = useState('')
  const [abertas, setAbertas] = useState<Set<string>>(new Set())
  const [editando, setEditando] = useState<Item | 'novo' | null>(null)

  const secoes = useMemo(() => {
    const s = [...SECOES]
    for (const i of itens ?? []) if (!s.includes(i.secao)) s.push(i.secao)
    return s
  }, [itens])

  const termo = busca.trim().toLowerCase()
  const filtrados = (itens ?? []).filter((i) => !termo || i.nome.toLowerCase().includes(termo) || i.secao.toLowerCase().includes(termo))
  const ativos = (itens ?? []).filter((i) => i.ativo).length

  const alterna = (s: string) => setAbertas((a) => { const n = new Set(a); n.has(s) ? n.delete(s) : n.add(s); return n })

  return (
    <>
      <Cabecalho grande titulo="Catálogo" subtitulo={`${ativos} peças em ${secoes.length} seções`}
        acao={<button className="btn-primary !px-3 !py-2.5" onClick={() => setEditando('novo')} aria-label="Nova peça"><Plus size={20} /><span className="hidden sm:inline">Nova</span></button>} />
      <div className="px-4 pb-6">
        <div className="relative mb-3">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className="input !pl-10" placeholder="Buscar peça" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        {filtrados.length === 0 && <Vazio icone={<Tag size={26} />} titulo="Nada encontrado" texto="Tente outro nome ou crie a peça." />}
        {secoes.map((s) => {
          const lista = filtrados.filter((i) => i.secao === s)
          if (lista.length === 0) return null
          const aberta = termo ? true : abertas.has(s)
          return (
            <div key={s} className="card mb-2.5 overflow-hidden">
              <button className="flex w-full items-center justify-between px-4 py-3.5 text-left" onClick={() => alterna(s)} aria-expanded={aberta}>
                <span className="text-[14px] font-bold uppercase tracking-wide">{s}</span>
                <span className="text-[13px] text-stone-500">{lista.length}</span>
              </button>
              {aberta && (
                <ul className="divide-y divide-stone-100 border-t border-stone-100 dark:divide-stone-800 dark:border-stone-800">
                  {lista.map((i) => (
                    <li key={i.id}>
                      <button className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-stone-50 dark:active:bg-stone-800" onClick={() => setEditando(i)}>
                        <span className={`flex-1 text-[15px] ${i.ativo ? '' : 'text-stone-400 line-through'}`}>{i.nome}</span>
                        {i.unidade !== 'un' && <Chip>{UNIDADES[i.unidade].longa}</Chip>}
                        {!i.ativo && <Chip cor="bg-stone-100 text-stone-500">inativa</Chip>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
      <EditorItem item={editando} secoes={secoes} onFechar={() => setEditando(null)} />
    </>
  )
}

function EditorItem({ item, secoes, onFechar }: { item: Item | 'novo' | null; secoes: string[]; onFechar: () => void }) {
  const avisar = useToast()
  const novo = item === 'novo'
  const [nome, setNome] = useState('')
  const [secao, setSecao] = useState(secoes[0] ?? 'GERAL')
  const [novaSecao, setNovaSecao] = useState('')
  const [unidade, setUnidade] = useState<Unidade>('un')
  const [confirma, setConfirma] = useState(false)
  const [chave, setChave] = useState<string | null>(null)

  const idAtual = item && item !== 'novo' ? item.id : 'novo'
  if (item && chave !== idAtual) {
    setChave(idAtual)
    setConfirma(false); setNovaSecao('')
    if (item === 'novo') { setNome(''); setSecao(secoes[0] ?? 'GERAL'); setUnidade('un') }
    else { setNome(item.nome); setSecao(item.secao); setUnidade(item.unidade) }
  }
  if (!item) return null

  const secaoFinal = (secao === '__nova' ? novaSecao.trim().toUpperCase() : secao) || 'GERAL'

  async function salvar() {
    if (!nome.trim()) { avisar('Dê um nome à peça', 'erro'); return }
    if (novo) { await criarItem({ nome: nome.trim(), secao: secaoFinal, unidade }); avisar('Peça criada') }
    else { await atualizarItem((item as Item).id, { nome: nome.trim(), secao: secaoFinal, unidade }); avisar('Peça atualizada') }
    onFechar()
  }
  async function remover() {
    if (!confirma) { setConfirma(true); return }
    const r = await excluirItem((item as Item).id)
    avisar(r === 'excluido' ? 'Peça excluída' : 'Peça usada em eventos: ficou inativa')
    onFechar()
  }

  return (
    <Sheet aberto={!!item} onFechar={onFechar} titulo={novo ? 'Nova peça' : 'Editar peça'}
      rodape={<div className="flex gap-2"><button className="btn-primary flex-1" onClick={salvar}>{novo ? 'Criar' : 'Salvar'}</button></div>}>
      <div className="space-y-4 pt-1">
        <Campo rotulo="Nome"><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Boleira cristal G" autoFocus={novo} /></Campo>
        <Campo rotulo="Seção">
          <select className="input" value={secao} onChange={(e) => setSecao(e.target.value)}>
            {secoes.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="__nova">+ Nova seção…</option>
          </select>
        </Campo>
        {secao === '__nova' && <input className="input" value={novaSecao} onChange={(e) => setNovaSecao(e.target.value)} placeholder="NOME DA SEÇÃO" />}
        <div>
          <span className="label">Unidade de contagem</span>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(UNIDADES) as Unidade[]).map((u) => (
              <button key={u} type="button" onClick={() => setUnidade(u)} className={`rounded-xl px-2 py-2.5 text-[14px] font-semibold ring-1 ${unidade === u ? 'bg-brand-700 text-white ring-brand-700 dark:bg-brand-500 dark:text-stone-950 dark:ring-brand-500' : 'bg-white text-stone-700 ring-stone-200 dark:bg-stone-900 dark:text-stone-200 dark:ring-stone-700'}`}>{UNIDADES[u].longa}</button>
            ))}
          </div>
        </div>
        {!novo && (
          <>
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
              <span className="text-[14px]">Ordem na seção</span>
              <div className="flex gap-1">
                <button className="btn-ghost !p-2" onClick={() => moverItem((item as Item).id, -1)} aria-label="Subir"><ArrowUp size={18} /></button>
                <button className="btn-ghost !p-2" onClick={() => moverItem((item as Item).id, 1)} aria-label="Descer"><ArrowDown size={18} /></button>
              </div>
            </div>
            <label className="flex items-center justify-between rounded-xl bg-white px-3 py-3 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
              <span className="text-[14px]">Peça ativa</span>
              <input type="checkbox" className="h-5 w-5 accent-brand-700" checked={(item as Item).ativo} onChange={(e) => atualizarItem((item as Item).id, { ativo: e.target.checked })} />
            </label>
            <button className="btn-danger w-full" onClick={remover}>{confirma ? 'Toque de novo para confirmar' : 'Excluir peça'}</button>
          </>
        )}
      </div>
    </Sheet>
  )
}
