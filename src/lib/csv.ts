import type { Evento, Item, Linha } from '../db/schema'
import { dataBR, saidaEfetiva } from './format'

/** Gera o CSV no mesmo layout da planilha do setor (separador ; e BOM UTF-8). */
export function gerarCSV(evento: Evento, linhas: Linha[], itens: Map<string, Item>, secoes: string[]): string {
  const L: string[][] = []
  const col = (...c: (string | number | null | undefined)[]) => {
    const row = c.map((v) => (v === null || v === undefined ? '' : String(v)))
    while (row.length < 7) row.push('')
    L.push(row)
  }
  col('PEÇAS GUY GOURMET – CONTROLE DE SAÍDA E RETORNO DO EVENTO')
  col()
  col('Nome do coordenador:', evento.coordenadores.join(' / '), '', `Evento: ${evento.tipo.toUpperCase()} ${evento.contratante}`)
  col('Data:', dataBR(evento.data), '', `Local: ${evento.local}`)
  col()
  col('Nº', 'Item / Peça', 'Quantidade na saída', 'Quantidade na volta', 'Quebras', 'Perdas', 'Observações')

  const porSecao = new Map<string, Linha[]>()
  for (const l of linhas) {
    const it = itens.get(l.itemId)
    const s = it?.secao ?? 'OUTROS'
    if (!porSecao.has(s)) porSecao.set(s, [])
    porSecao.get(s)!.push(l)
  }
  const ordemSecoes = [...secoes, ...[...porSecao.keys()].filter((s) => !secoes.includes(s))]

  let n = 0
  let tSaida = 0, tVolta = 0, tQuebra = 0, tPerda = 0
  for (const s of ordemSecoes) {
    const ls = porSecao.get(s)
    if (!ls || ls.length === 0) continue
    ls.sort((a, b) => (itens.get(a.itemId)?.ordem ?? 0) - (itens.get(b.itemId)?.ordem ?? 0))
    if (s !== 'GERAL') col(++n, s)
    for (const l of ls) {
      const it = itens.get(l.itemId)
      const saida = l.todos ? 'TODOS' : saidaEfetiva(l)
      const volta = l.todos ? '' : l.qtdVolta
      col(++n, it?.nome ?? l.itemId, saida, volta, l.quebras || '', l.perdas || '', l.obs)
      if (!l.todos) {
        tSaida += saidaEfetiva(l) ?? 0
        tVolta += l.qtdVolta ?? 0
      }
      tQuebra += l.quebras
      tPerda += l.perdas
    }
  }
  col()
  col('TOTAIS', '', tSaida, tVolta, tQuebra, tPerda)
  col()
  col('CONFERÊNCIA FINAL / OBSERVAÇÕES')
  col('', evento.observacoes)

  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return '﻿' + L.map((r) => r.map(esc).join(';')).join('\r\n') + '\r\n'
}

export function nomeArquivoCSV(evento: Evento) {
  const slug = `${evento.tipo}_${evento.contratante}`.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
  return `Pecas_${evento.data}_${slug}.csv`
}
