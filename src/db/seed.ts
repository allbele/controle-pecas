import { db, type Evento, type Linha, type Reposicao } from './schema'
import { EVENTOS, ITENS, PEDIDOS_DEMO } from '../data/seed'

export const SEED_VERSION = 1
const DEMO_ID = 'e03' // Almoço Izabel Ester Pires, 10/10, Santos Dumont

function linhaBase(eventoId: string, itemId: string): Linha {
  return {
    eventoId, itemId, qtdPedida: null, todos: false, qtdSaida: null, saidaOk: false,
    qtdVolta: null, quebras: 0, perdas: 0, obs: '', extra: false,
  }
}

/** Subconjunto determinístico da lista demo, com quantidades reescaladas. */
function subconjunto(passo: number, fator: number): Linha[] {
  return PEDIDOS_DEMO.filter((_, i) => i % passo === 0).map((p) => {
    const l = linhaBase('', p.itemId)
    l.qtdPedida = p.todos ? null : Math.max(1, Math.round((p.qtd ?? 1) * fator))
    l.todos = p.todos
    return l
  })
}

export async function garantirSeed() {
  const cfg = await db.config.get('app')
  if (cfg && cfg.seedVersion >= SEED_VERSION) return
  await restaurarDemo()
}

export async function restaurarDemo() {
  await db.transaction('rw', [db.itens, db.eventos, db.linhas, db.fotos, db.reposicoes, db.config], async () => {
    await Promise.all([db.itens.clear(), db.eventos.clear(), db.linhas.clear(), db.fotos.clear(), db.reposicoes.clear()])

    await db.itens.bulkAdd(ITENS.map((i) => ({ ...i, ativo: true })))

    const agora = Date.now()
    const eventos: Evento[] = EVENTOS.map((e) => ({
      ...e, status: 'planejado', observacoes: '', criadoEm: agora,
    }))
    const linhas: Linha[] = []
    const reposicoes: Reposicao[] = []

    const marcaFechado = (ev: Evento, ls: Linha[], quebras: Record<string, [number, number, string]> = {}) => {
      ev.status = 'fechado'
      for (const l of ls) {
        l.eventoId = ev.id
        l.qtdSaida = l.todos ? null : l.qtdPedida
        l.saidaOk = true
        const q = quebras[l.itemId]
        const quebra = q?.[0] ?? 0
        const perda = q?.[1] ?? 0
        l.quebras = quebra
        l.perdas = perda
        l.obs = q?.[2] ?? ''
        l.qtdVolta = l.todos ? null : Math.max(0, (l.qtdPedida ?? 0) - quebra - perda)
        if (quebra) reposicoes.push({ itemId: l.itemId, eventoId: ev.id, qtd: quebra, motivo: 'quebra', status: 'pendente', criadoEm: agora })
        if (perda) reposicoes.push({ itemId: l.itemId, eventoId: ev.id, qtd: perda, motivo: 'perda', status: 'pendente', criadoEm: agora })
      }
      linhas.push(...ls)
    }

    for (const ev of eventos) {
      if (ev.id === DEMO_ID) {
        // Lista completa da planilha dela, já fechada, com as quebras que ela citou.
        const ls = PEDIDOS_DEMO.map((p) => {
          const l = linhaBase(ev.id, p.itemId)
          l.qtdPedida = p.qtd
          l.todos = p.todos
          return l
        })
        marcaFechado(ev, ls, {
          i059: [3, 0, 'Aquários das tortas quebraram no transporte'],
          i046: [2, 0, ''],
          i040: [0, 1, 'Não voltou na caixa'],
        })
      } else if (ev.id === 'e01') {
        // Degustação pequena, fechada, sem quebra.
        marcaFechado(ev, subconjunto(9, 0.3))
      } else if (ev.id === 'e02') {
        // Casamento em Congonhas, fechado, uma perda.
        marcaFechado(ev, subconjunto(2, 1.2), { i089: [0, 1, 'Ficou no salão'] })
      } else if (ev.id === 'e04') {
        // Vivaworld, 1000 pessoas, 24/10: lista pronta, aguardando conferência de saída.
        ev.status = 'lista_pronta'
        const ls = subconjunto(1, 2.5)
        for (const l of ls) l.eventoId = ev.id
        linhas.push(...ls)
      } else if (ev.id === 'e05') {
        // Casamento em Paraty, mesmo dia: coordenador começou a lista.
        ev.status = 'planejado'
        const ls = subconjunto(3, 1)
        for (const l of ls) l.eventoId = ev.id
        linhas.push(...ls)
      }
    }

    await db.eventos.bulkAdd(eventos)
    await db.linhas.bulkAdd(linhas)
    await db.reposicoes.bulkAdd(reposicoes)

    const cfg = await db.config.get('app')
    await db.config.put({ id: 'app', papel: cfg?.papel ?? 'pecas', nomeUsuario: cfg?.nomeUsuario ?? '', seedVersion: SEED_VERSION })
  })
}
