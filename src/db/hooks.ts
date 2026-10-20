import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Config, type Item, type Linha } from './schema'

const CONFIG_PADRAO: Config = { id: 'app', papel: 'pecas', nomeUsuario: '', seedVersion: 0 }

export function useConfig(): Config {
  return useLiveQuery(() => db.config.get('app'), []) ?? CONFIG_PADRAO
}

export function useItens(): Item[] | undefined {
  return useLiveQuery(() => db.itens.orderBy('ordem').toArray(), [])
}

export function useItensMapa(): Map<string, Item> {
  const itens = useItens()
  return new Map((itens ?? []).map((i) => [i.id, i]))
}

export function useEvento(id: string | undefined) {
  return useLiveQuery(() => (id ? db.eventos.get(id) : undefined), [id])
}

export function useEventos() {
  return useLiveQuery(() => db.eventos.orderBy('data').toArray(), [])
}

export function useLinhas(eventoId: string | undefined): Linha[] | undefined {
  return useLiveQuery(() => (eventoId ? db.linhas.where('eventoId').equals(eventoId).toArray() : []), [eventoId])
}

export function useFotos(eventoId: string | undefined) {
  return useLiveQuery(() => (eventoId ? db.fotos.where('eventoId').equals(eventoId).toArray() : []), [eventoId])
}

export function useReposicoes() {
  return useLiveQuery(() => db.reposicoes.orderBy('criadoEm').reverse().toArray(), [])
}
