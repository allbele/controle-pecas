export async function compartilharArquivo(blob: Blob, nome: string, titulo: string) {
  const file = new File([blob], nome, { type: blob.type })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: titulo })
      return 'compartilhado' as const
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelado' as const
    }
  }
  baixar(blob, nome)
  return 'baixado' as const
}

export async function compartilharTexto(texto: string, titulo: string) {
  if (navigator.share) {
    try {
      await navigator.share({ text: texto, title: titulo })
      return 'compartilhado' as const
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelado' as const
    }
  }
  await navigator.clipboard?.writeText(texto)
  return 'copiado' as const
}

export function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
