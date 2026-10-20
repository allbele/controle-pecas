import { db, type Evento, type Item, type Linha, type Papel, type StatusEvento } from './schema'

export async function setPapel(papel: Papel) {
  await db.config.update('app', { papel })
}
export async function setNomeUsuario(nomeUsuario: string) {
  await db.config.update('app', { nomeUsuario })
}

export async function setStatus(eventoId: string, status: StatusEvento) {
  await db.eventos.update(eventoId, { status })
}

export function novoId(prefixo: string) {
  return `${prefixo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function criarEvento(dados: Omit<Evento, 'id' | 'status' | 'criadoEm'>) {
  const id = novoId('e')
  await db.eventos.add({ ...dados, id, status: 'planejado', criadoEm: Date.now() })
  return id
}

export async function atualizarEvento(id: string, dados: Partial<Evento>) {
  await db.eventos.update(id, dados)
}

export async function excluirEvento(id: string) {
  await db.transaction('rw', [db.eventos, db.linhas, db.fotos, db.reposicoes], async () => {
    await db.linhas.where('eventoId').equals(id).delete()
    await db.fotos.where('eventoId').equals(id).delete()
    await db.reposicoes.where('eventoId').equals(id).delete()
    await db.eventos.delete(id)
  })
}

// ---------- linhas ----------
export async function obterLinha(eventoId: string, itemId: string) {
  return db.linhas.where('[eventoId+itemId]').equals([eventoId, itemId]).first()
}

export async function adicionarAoPedido(eventoId: string, itemId: string, qtd: number | null = 1, todos = false, extra = false) {
  const existente = await obterLinha(eventoId, itemId)
  if (existente) {
    await db.linhas.update(existente.id!, { qtdPedida: todos ? null : (existente.qtdPedida ?? 0) + (qtd ?? 0), todos })
    return existente.id!
  }
  return db.linhas.add({
    eventoId, itemId, qtdPedida: todos ? null : qtd, todos, qtdSaida: extra ? qtd : null, saidaOk: false,
    qtdVolta: null, quebras: 0, perdas: 0, obs: '', extra,
  })
}

export async function atualizarLinha(id: number, dados: Partial<Linha>) {
  await db.linhas.update(id, dados)
}

export async function removerLinha(id: number) {
  await db.linhas.delete(id)
}

export async function copiarLista(deEventoId: string, paraEventoId: string) {
  const origem = await db.linhas.where('eventoId').equals(deEventoId).toArray()
  const existentes = new Set((await db.linhas.where('eventoId').equals(paraEventoId).toArray()).map((l) => l.itemId))
  const novas: Linha[] = origem
    .filter((l) => !existentes.has(l.itemId))
    .map((l) => ({
      eventoId: paraEventoId, itemId: l.itemId, qtdPedida: l.qtdPedida, todos: l.todos,
      qtdSaida: null, saidaOk: false, qtdVolta: null, quebras: 0, perdas: 0, obs: '', extra: false,
    }))
  await db.linhas.bulkAdd(novas)
  return novas.length
}

/** Marca todas as linhas de saída como conferidas, usando a quantidade pedida quando não informada. */
export async function liberarSaida(eventoId: string) {
  await db.transaction('rw', [db.linhas, db.eventos], async () => {
    const ls = await db.linhas.where('eventoId').equals(eventoId).toArray()
    for (const l of ls) {
      if (l.qtdSaida === null && !l.todos) await db.linhas.update(l.id!, { qtdSaida: l.qtdPedida })
    }
    await db.eventos.update(eventoId, { status: 'saiu' })
  })
}

export async function voltouTudo(eventoId: string, itemIds: string[]) {
  await db.transaction('rw', db.linhas, async () => {
    const ls = await db.linhas.where('eventoId').equals(eventoId).toArray()
    for (const l of ls) {
      if (!itemIds.includes(l.itemId)) continue
      await db.linhas.update(l.id!, { qtdVolta: l.todos ? null : (l.qtdSaida ?? l.qtdPedida), quebras: 0, perdas: 0 })
    }
  })
}

/** Fecha o evento e gera as reposições a partir das quebras e perdas. */
export async function fecharEvento(eventoId: string) {
  await db.transaction('rw', [db.linhas, db.eventos, db.reposicoes], async () => {
    const ls = await db.linhas.where('eventoId').equals(eventoId).toArray()
    await db.reposicoes.where('eventoId').equals(eventoId).delete()
    const agora = Date.now()
    for (const l of ls) {
      if (l.qtdVolta === null && !l.todos) {
        await db.linhas.update(l.id!, { qtdVolta: Math.max(0, (l.qtdSaida ?? l.qtdPedida ?? 0) - l.quebras - l.perdas) })
      }
      if (l.quebras > 0) await db.reposicoes.add({ itemId: l.itemId, eventoId, qtd: l.quebras, motivo: 'quebra', status: 'pendente', criadoEm: agora })
      if (l.perdas > 0) await db.reposicoes.add({ itemId: l.itemId, eventoId, qtd: l.perdas, motivo: 'perda', status: 'pendente', criadoEm: agora })
    }
    await db.eventos.update(eventoId, { status: 'fechado' })
  })
}

export async function reabrirEvento(eventoId: string) {
  await db.transaction('rw', [db.eventos, db.reposicoes], async () => {
    await db.reposicoes.where('eventoId').equals(eventoId).delete()
    await db.eventos.update(eventoId, { status: 'saiu' })
  })
}

// ---------- fotos ----------
export async function adicionarFoto(eventoId: string, itemId: string, arquivo: File) {
  const blob = await reduzirImagem(arquivo)
  await db.fotos.add({ eventoId, itemId, blob, criadoEm: Date.now() })
}
export async function removerFoto(id: number) {
  await db.fotos.delete(id)
}

async function reduzirImagem(arquivo: File, max = 1280, qualidade = 0.8): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(arquivo)
    const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', qualidade))
  } catch {
    return arquivo
  }
}

// ---------- reposições ----------
export async function marcarReposicao(id: number, status: 'pendente' | 'comprado') {
  await db.reposicoes.update(id, { status })
}

// ---------- catálogo ----------
export async function criarItem(dados: Omit<Item, 'id' | 'ordem' | 'ativo'>) {
  const ultimo = await db.itens.orderBy('ordem').last()
  const id = novoId('i')
  await db.itens.add({ ...dados, id, ordem: (ultimo?.ordem ?? 0) + 1, ativo: true })
  return id
}
export async function atualizarItem(id: string, dados: Partial<Item>) {
  await db.itens.update(id, dados)
}
export async function excluirItem(id: string) {
  const usos = await db.linhas.where('itemId').equals(id).count()
  if (usos > 0) {
    await db.itens.update(id, { ativo: false })
    return 'inativado' as const
  }
  await db.itens.delete(id)
  return 'excluido' as const
}
export async function moverItem(id: string, direcao: -1 | 1) {
  const todos = await db.itens.orderBy('ordem').toArray()
  const atual = todos.find((i) => i.id === id)
  if (!atual) return
  const mesmaSecao = todos.filter((i) => i.secao === atual.secao)
  const idx = mesmaSecao.findIndex((i) => i.id === id)
  const alvo = mesmaSecao[idx + direcao]
  if (!alvo) return
  await db.transaction('rw', db.itens, async () => {
    await db.itens.update(atual.id, { ordem: alvo.ordem })
    await db.itens.update(alvo.id, { ordem: atual.ordem })
  })
}

// ---------- backup ----------
export async function exportarBackup(): Promise<Blob> {
  const dados = {
    versao: 1,
    exportadoEm: new Date().toISOString(),
    itens: await db.itens.toArray(),
    eventos: await db.eventos.toArray(),
    linhas: await db.linhas.toArray(),
    reposicoes: await db.reposicoes.toArray(),
  }
  return new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
}

export async function importarBackup(arquivo: File) {
  const dados = JSON.parse(await arquivo.text())
  if (!dados || dados.versao !== 1 || !Array.isArray(dados.itens)) throw new Error('Arquivo inválido')
  await db.transaction('rw', [db.itens, db.eventos, db.linhas, db.fotos, db.reposicoes], async () => {
    await Promise.all([db.itens.clear(), db.eventos.clear(), db.linhas.clear(), db.fotos.clear(), db.reposicoes.clear()])
    await db.itens.bulkAdd(dados.itens)
    await db.eventos.bulkAdd(dados.eventos)
    await db.linhas.bulkAdd(dados.linhas.map((l: Linha) => ({ ...l, id: undefined })))
    await db.reposicoes.bulkAdd(dados.reposicoes.map((r: { id?: number }) => ({ ...r, id: undefined })))
  })
}
