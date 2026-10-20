import Dexie, { type EntityTable } from 'dexie'
import type { Unidade } from '../data/seed'

export type Papel = 'coordenador' | 'pecas'
export type StatusEvento = 'planejado' | 'lista_pronta' | 'saiu' | 'fechado'
export type { Unidade }

export interface Item {
  id: string
  nome: string
  secao: string
  unidade: Unidade
  ordem: number
  ativo: boolean
}

export interface Evento {
  id: string
  data: string // YYYY-MM-DD
  tipo: string
  contratante: string
  convidados: number | null
  local: string
  coordenadores: string[]
  status: StatusEvento
  observacoes: string
  criadoEm: number
}

/** Uma linha por peça dentro de um evento: pedido do coordenador + conferência do setor. */
export interface Linha {
  id?: number
  eventoId: string
  itemId: string
  qtdPedida: number | null
  todos: boolean
  qtdSaida: number | null
  saidaOk: boolean
  qtdVolta: number | null
  quebras: number
  perdas: number
  obs: string
  extra: boolean // incluída pelo setor fora da lista do coordenador
}

export interface Foto {
  id?: number
  eventoId: string
  itemId: string
  blob: Blob
  criadoEm: number
}

export interface Reposicao {
  id?: number
  itemId: string
  eventoId: string
  qtd: number
  motivo: 'quebra' | 'perda'
  status: 'pendente' | 'comprado'
  criadoEm: number
}

export interface Config {
  id: 'app'
  papel: Papel
  nomeUsuario: string
  seedVersion: number
}

export const db = new Dexie('controle-pecas') as Dexie & {
  itens: EntityTable<Item, 'id'>
  eventos: EntityTable<Evento, 'id'>
  linhas: EntityTable<Linha, 'id'>
  fotos: EntityTable<Foto, 'id'>
  reposicoes: EntityTable<Reposicao, 'id'>
  config: EntityTable<Config, 'id'>
}

db.version(1).stores({
  itens: 'id, secao, ordem, ativo',
  eventos: 'id, data, status',
  linhas: '++id, eventoId, itemId, [eventoId+itemId]',
  fotos: '++id, eventoId, itemId, [eventoId+itemId]',
  reposicoes: '++id, itemId, eventoId, status, criadoEm',
  config: 'id',
})
