import type { Linha, StatusEvento, Unidade } from '../db/schema'

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const DIAS_LONGO = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export function parseData(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}
export function hojeISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function dataCurta(iso: string) {
  const d = parseData(iso)
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}
export function dataLonga(iso: string) {
  const d = parseData(iso)
  const dia = DIAS_LONGO[d.getDay()]
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${d.getDate()} de ${MESES_LONGO[d.getMonth()]}`
}
export function dataBR(iso: string) {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}
export function mesAno(iso: string) {
  const d = parseData(iso)
  return `${MESES_LONGO[d.getMonth()]} de ${d.getFullYear()}`
}

export const UNIDADES: Record<Unidade, { curta: string; longa: string }> = {
  un: { curta: 'un', longa: 'unidade' },
  cx: { curta: 'cx', longa: 'caixa' },
  dz: { curta: 'dz', longa: 'dúzia' },
  fardo: { curta: 'fardo', longa: 'fardo' },
}

export function qtdTexto(q: number | null, todos: boolean, unidade: Unidade) {
  if (todos) return 'todos'
  if (q === null) return '—'
  return unidade === 'un' ? String(q) : `${q} ${UNIDADES[unidade].curta}`
}

export const STATUS: Record<StatusEvento, { rotulo: string; cor: string }> = {
  planejado: { rotulo: 'Montando lista', cor: 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200' },
  lista_pronta: { rotulo: 'Lista pronta', cor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200' },
  saiu: { rotulo: 'Em evento', cor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' },
  fechado: { rotulo: 'Fechado', cor: 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200' },
}

const MINUSCULAS = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'a', 'o', 'em', 'com', 'para', 'por'])
/** Converte "SANTOS DUMONT" em "Santos Dumont", mantendo siglas curtas como RJ/MG. */
export function titulo(s: string) {
  return s.split(/(\s+|-|\/)/).map((w, i) => {
    if (!/\p{L}/u.test(w)) return w
    if (/^[A-Z]{2,3}$/.test(w) && !/[AEIOU]/.test(w.slice(1))) return w
    if (/^[A-Z]{2}$/.test(w)) return w
    const lower = w.toLowerCase()
    if (i > 0 && MINUSCULAS.has(lower)) return lower
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  }).join('')
}

export function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`
}

export function saidaEfetiva(l: Linha) {
  return l.qtdSaida ?? l.qtdPedida
}
export function diferencaRetorno(l: Linha) {
  if (l.todos) return 0
  const saida = saidaEfetiva(l) ?? 0
  const volta = l.qtdVolta ?? saida
  return saida - volta - l.quebras - l.perdas
}
