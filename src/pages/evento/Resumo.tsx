import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, Share2, ShoppingBag } from 'lucide-react'
import { SecaoTitulo } from '../../components/ui'
import { useToast } from '../../components/Toast'
import { gerarCSV, nomeArquivoCSV } from '../../lib/csv'
import { compartilharArquivo, compartilharTexto } from '../../lib/share'
import { dataBR, saidaEfetiva, titulo } from '../../lib/format'
import { useConfig } from '../../db/hooks'
import { SECOES } from '../../data/seed'
import { agruparPorSecao, type Ctx } from './Evento'
import { Miniatura } from './Retorno'

export default function Resumo({ ctx }: { ctx: Ctx }) {
  const { evento, linhas, itens, fotos } = ctx
  const avisar = useToast()
  const cfg = useConfig()
  const grupos = agruparPorSecao(linhas, itens)
  const fechado = evento.status === 'fechado'
  const retornoIniciado = linhas.some((l) => l.qtdVolta !== null)

  const tot = useMemo(() => {
    let saida = 0, volta = 0, quebras = 0, perdas = 0
    for (const l of linhas) { if (!l.todos) { saida += saidaEfetiva(l) ?? 0; volta += l.qtdVolta ?? 0 } quebras += l.quebras; perdas += l.perdas }
    return { saida, volta, quebras, perdas }
  }, [linhas])
  const repor = linhas.filter((l) => l.quebras + l.perdas > 0)

  async function exportar() {
    const secoes = [...SECOES]
    for (const i of itens.values()) if (!secoes.includes(i.secao)) secoes.push(i.secao)
    const csv = gerarCSV(evento, linhas, itens, secoes)
    const r = await compartilharArquivo(new Blob([csv], { type: 'text/csv;charset=utf-8' }), nomeArquivoCSV(evento), 'Planilha do evento')
    if (r === 'baixado') avisar('Planilha salva nos downloads')
  }
  async function compartilhar() {
    const cab = `*${evento.tipo} · ${titulo(evento.contratante)}*\n${dataBR(evento.data)} · ${titulo(evento.local)}${evento.coordenadores.length ? ` · ${evento.coordenadores.join(', ')}` : ''}`
    const corpo = fechado || retornoIniciado
      ? `Saíram ${tot.saida} peças, voltaram ${tot.volta}.\nQuebras: ${tot.quebras} · Perdas: ${tot.perdas}` + (repor.length ? `\n\n*Para repor:*\n${repor.map((l) => `• ${itens.get(l.itemId)?.nome}: ${l.quebras + l.perdas}${l.obs ? ` (${l.obs})` : ''}`).join('\n')}` : '\n\nVoltou tudo. ✅')
      : `Lista com ${linhas.length} peças em ${grupos.length} seções.\n` + grupos.map(([s, ls]) => `${s}: ${ls.length}`).join(' · ')
    const r = await compartilharTexto(`${cab}\n\n${corpo}${cfg.nomeUsuario ? `\n\n— ${cfg.nomeUsuario}` : ''}`, 'Resumo do evento')
    if (r === 'copiado') avisar('Resumo copiado')
  }

  return (
    <div className="pb-8">
      <div className="mb-4 grid grid-cols-4 gap-2">
        <Tile rotulo="Saída" valor={tot.saida} />
        <Tile rotulo="Volta" valor={retornoIniciado || fechado ? tot.volta : null} />
        <Tile rotulo="Quebras" valor={tot.quebras} cor={tot.quebras ? 'text-red-600 dark:text-red-300' : ''} />
        <Tile rotulo="Perdas" valor={tot.perdas} cor={tot.perdas ? 'text-orange-600 dark:text-orange-300' : ''} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <button className="btn-secondary" onClick={exportar}><FileSpreadsheet size={18} /> Planilha</button>
        <button className="btn-primary" onClick={compartilhar}><Share2 size={18} /> Compartilhar</button>
      </div>

      {repor.length > 0 && (
        <section className="mb-2">
          <SecaoTitulo nome="O que repor" extra={<Link to="/reposicao" className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 dark:text-brand-300"><ShoppingBag size={13} /> ver reposição</Link>} />
          <ul className="card divide-y divide-stone-100 dark:divide-stone-800">
            {repor.map((l) => (
              <li key={l.id} className="px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-medium">{itens.get(l.itemId)?.nome}</span>
                  <span className="text-[13px] text-stone-600 dark:text-stone-300">{l.quebras ? `${l.quebras} quebra${l.quebras > 1 ? 's' : ''}` : ''}{l.quebras && l.perdas ? ' · ' : ''}{l.perdas ? `${l.perdas} perda${l.perdas > 1 ? 's' : ''}` : ''}</span>
                </div>
                {l.obs && <p className="text-[12px] text-stone-500">{l.obs}</p>}
                {fotos.some((f) => f.itemId === l.itemId) && <div className="mt-1.5 flex gap-2">{fotos.filter((f) => f.itemId === l.itemId).map((f) => <Miniatura key={f.id} foto={f} tamanho={48} />)}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <SecaoTitulo nome="Por seção" />
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500 dark:bg-stone-800/60"><th className="px-3.5 py-2 font-semibold">Seção</th><th className="px-2 py-2 text-right font-semibold">Saída</th><th className="px-2 py-2 text-right font-semibold">Volta</th><th className="px-2 py-2 text-right font-semibold">Queb.</th><th className="px-3.5 py-2 text-right font-semibold">Perd.</th></tr></thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {grupos.map(([s, ls]) => {
              const sa = ls.reduce((a, l) => a + (l.todos ? 0 : saidaEfetiva(l) ?? 0), 0)
              const vo = ls.reduce((a, l) => a + (l.qtdVolta ?? 0), 0)
              const q = ls.reduce((a, l) => a + l.quebras, 0)
              const p = ls.reduce((a, l) => a + l.perdas, 0)
              return (
                <tr key={s}><td className="px-3.5 py-2 font-medium">{s} <span className="text-stone-400">· {ls.length}</span></td><td className="px-2 py-2 text-right tabular-nums">{sa}</td><td className="px-2 py-2 text-right tabular-nums">{retornoIniciado || fechado ? vo : '—'}</td><td className={`px-2 py-2 text-right tabular-nums ${q ? 'font-semibold text-red-600 dark:text-red-300' : ''}`}>{q || ''}</td><td className={`px-3.5 py-2 text-right tabular-nums ${p ? 'font-semibold text-orange-600 dark:text-orange-300' : ''}`}>{p || ''}</td></tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {linhas.length === 0 && <p className="mt-4 text-center text-[14px] text-stone-500">Sem peças ainda. O resumo aparece quando a lista for montada.</p>}
    </div>
  )
}

function Tile({ rotulo, valor, cor = '' }: { rotulo: string; valor: number | null; cor?: string }) {
  return (
    <div className="card px-2 py-3 text-center">
      <p className={`text-[22px] font-bold leading-none tabular-nums ${cor}`}>{valor === null ? '—' : valor}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">{rotulo}</p>
    </div>
  )
}
