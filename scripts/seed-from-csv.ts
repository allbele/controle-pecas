// Gera src/data/seed.ts a partir das planilhas em ../contexto/planilha.
// Uso: pnpm seed
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const planilhaDir = resolve(here, '../../contexto/planilha')

type Unidade = 'un' | 'cx' | 'dz' | 'fardo'
type ItemSeed = { id: string; nome: string; secao: string; unidade: Unidade; ordem: number }
type PedidoSeed = { itemId: string; qtd: number | null; todos: boolean }
type EventoSeed = {
  id: string; data: string; tipo: string; contratante: string; convidados: number | null
  local: string; coordenadores: string[]
}

// ---------- peças ----------
const raw = new TextDecoder('windows-1252').decode(readFileSync(resolve(planilhaDir, 'Pecas_Guy_Gourmet_Controle_Evento.csv')))
const linhas = raw.split(/\r?\n/)

const SECAO_INICIAL = 'GERAL'
const secoes: string[] = [SECAO_INICIAL]
const itens: ItemSeed[] = []
const pedidosDemo: PedidoSeed[] = []
let secaoAtual = SECAO_INICIAL
let ordem = 0

function limpa(s: string) { return s.replace(/\s+/g, ' ').trim() }
function unidadePara(nome: string, secao: string): Unidade {
  const n = nome.toLowerCase()
  if (secao === 'COPOS' || /\bcxs?\b/.test(n)) return 'cx'
  if (secao === 'TALHERES' || /d[uú]zia/.test(n)) return 'dz'
  if (/fardo/.test(n)) return 'fardo'
  return 'un'
}

for (const linha of linhas) {
  const c = linha.split(';')
  const n = limpa(c[0] ?? '')
  const nome = limpa(c[1] ?? '')
  const qtdRaw = limpa(c[2] ?? '')
  if (!/^\d+$/.test(n)) continue           // ignora cabeçalhos, TOTAIS etc.
  if (!nome) continue                       // linha vazia
  const ehSecao = qtdRaw === '' && nome === nome.toUpperCase() && !/\d/.test(nome)
  if (ehSecao) {
    secaoAtual = nome
    if (!secoes.includes(secaoAtual)) secoes.push(secaoAtual)
    continue
  }
  const id = `i${n.padStart(3, '0')}`
  const unidade = unidadePara(nome, secaoAtual)
  itens.push({ id, nome, secao: secaoAtual, unidade, ordem: ordem++ })
  const todos = /^todos$/i.test(qtdRaw)
  const qtd = todos ? null : (qtdRaw === '' ? null : Number(qtdRaw))
  if (todos || (qtd !== null && !Number.isNaN(qtd) && qtd > 0)) pedidosDemo.push({ itemId: id, qtd, todos })
}

// ---------- agenda ----------
const agendaRaw = readFileSync(resolve(planilhaDir, 'agenda_out_nov_2026.csv'), 'utf8')
const eventos: EventoSeed[] = agendaRaw.split(/\r?\n/).slice(1).filter(Boolean).map((l, i) => {
  const [data, tipo, contratante, convidados, local, coords] = l.split(';').map((s) => limpa(s ?? ''))
  const coordenadores = coords
    ? coords.split(/[\/,]/).map((s) => limpa(s)).filter(Boolean).map(normalizaCoord)
    : []
  return {
    id: `e${String(i + 1).padStart(2, '0')}`,
    data, tipo: titulo(tipo), contratante: limpa(contratante.replace(/\(⚠\)/, '')),
    convidados: convidados ? Number(convidados) : null,
    local: local || '', coordenadores,
  }
})

function normalizaCoord(s: string) {
  const m: Record<string, string> = {
    'LÉO': 'Léo', 'LEO': 'Léo', 'EDIVALDO': 'Edvaldo', 'EDVALDO': 'Edvaldo', 'JOEL': 'Joel',
    'SAULINHO': 'Saulo', 'SAULO': 'Saulo', 'BRENO': 'Breno', 'WATSON': 'Watson',
  }
  return m[s.toUpperCase()] ?? titulo(s)
}
function titulo(s: string) {
  return s.toLowerCase().replace(/(^|\s|-)\p{L}/gu, (c) => c.toUpperCase())
}

const out = `// Arquivo gerado por scripts/seed-from-csv.ts. Não editar à mão.
export type Unidade = 'un' | 'cx' | 'dz' | 'fardo'

export const SECOES: string[] = ${JSON.stringify(secoes)}

export const ITENS: { id: string; nome: string; secao: string; unidade: Unidade; ordem: number }[] = ${JSON.stringify(itens, null, 2)}

export const EVENTOS: { id: string; data: string; tipo: string; contratante: string; convidados: number | null; local: string; coordenadores: string[] }[] = ${JSON.stringify(eventos, null, 2)}

/** Lista do coordenador do evento de demonstração (Almoço Izabel, 10/10). */
export const PEDIDOS_DEMO: { itemId: string; qtd: number | null; todos: boolean }[] = ${JSON.stringify(pedidosDemo)}
`
writeFileSync(resolve(here, '../src/data/seed.ts'), out)
console.log(`itens: ${itens.length}, seções: ${secoes.join(', ')}, eventos: ${eventos.length}, pedidos demo: ${pedidosDemo.length}`)
