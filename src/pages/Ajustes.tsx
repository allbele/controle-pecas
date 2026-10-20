import { useRef, useState } from 'react'
import { ClipboardList, Download, PackageCheck, RefreshCw, Smartphone, Upload } from 'lucide-react'
import Cabecalho from '../components/Cabecalho'
import { Campo } from '../components/ui'
import { useToast } from '../components/Toast'
import { useConfig } from '../db/hooks'
import { exportarBackup, importarBackup, setNomeUsuario, setPapel } from '../db/actions'
import { restaurarDemo } from '../db/seed'
import { baixar } from '../lib/share'
import type { Papel } from '../db/schema'

const PAPEIS: { id: Papel; titulo: string; texto: string; Icone: typeof ClipboardList }[] = [
  { id: 'pecas', titulo: 'Setor de Peças', texto: 'Confere a saída, recebe a volta, registra quebras e cuida da reposição.', Icone: PackageCheck },
  { id: 'coordenador', titulo: 'Coordenador', texto: 'Monta a lista de peças do evento e acompanha o resumo.', Icone: ClipboardList },
]

export default function Ajustes() {
  const cfg = useConfig()
  const avisar = useToast()
  const [confirmaDemo, setConfirmaDemo] = useState(false)
  const arquivo = useRef<HTMLInputElement>(null)

  async function exportar() {
    const blob = await exportarBackup()
    baixar(blob, `controle-pecas-backup-${new Date().toISOString().slice(0, 10)}.json`)
    avisar('Backup gerado')
  }
  async function importar(f: File | undefined) {
    if (!f) return
    try { await importarBackup(f); avisar('Backup restaurado') } catch { avisar('Arquivo de backup inválido', 'erro') }
  }
  async function demo() {
    if (!confirmaDemo) { setConfirmaDemo(true); return }
    await restaurarDemo()
    setConfirmaDemo(false)
    avisar('Dados de demonstração restaurados')
  }

  return (
    <>
      <Cabecalho grande titulo="Ajustes" />
      <div className="space-y-6 px-4 pb-10">
        <section>
          <span className="label">Estou usando como</span>
          <div className="space-y-2">
            {PAPEIS.map(({ id, titulo, texto, Icone }) => (
              <button key={id} onClick={() => setPapel(id)} className={`card flex w-full items-start gap-3 px-4 py-3.5 text-left ring-2 ${cfg.papel === id ? 'ring-brand-600' : 'ring-transparent'}`} aria-pressed={cfg.papel === id}>
                <span className={`mt-0.5 rounded-xl p-2 ${cfg.papel === id ? 'bg-brand-700 text-white' : 'bg-stone-100 text-stone-500'}`}><Icone size={20} /></span>
                <span><span className="block text-[15px] font-semibold">{titulo}</span><span className="block text-[13px] text-stone-500">{texto}</span></span>
              </button>
            ))}
          </div>
        </section>

        <Campo rotulo="Meu nome" dica="Aparece nas observações e no resumo compartilhado.">
          <input className="input" defaultValue={cfg.nomeUsuario} onBlur={(e) => setNomeUsuario(e.target.value.trim())} placeholder="Seu nome" />
        </Campo>

        <section className="card px-4 py-4">
          <div className="flex items-center gap-2 text-[15px] font-semibold"><Smartphone size={18} /> Instalar no celular</div>
          <p className="mt-1.5 text-[13px] text-stone-600">
            <b>Android:</b> menu ⋮ do navegador → <i>Adicionar à tela inicial</i>.<br />
            <b>iPhone:</b> botão compartilhar → <i>Adicionar à Tela de Início</i>.
          </p>
        </section>

        <section>
          <span className="label">Dados</span>
          <div className="card divide-y divide-stone-100">
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={exportar}><Download size={18} className="text-stone-500" /><span className="flex-1 text-[15px]">Exportar backup</span></button>
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={() => arquivo.current?.click()}><Upload size={18} className="text-stone-500" /><span className="flex-1 text-[15px]">Restaurar backup</span></button>
            <input ref={arquivo} type="file" accept="application/json" className="hidden" onChange={(e) => importar(e.target.files?.[0])} />
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={demo}>
              <RefreshCw size={18} className="text-stone-500" />
              <span className={`flex-1 text-[15px] ${confirmaDemo ? 'font-semibold text-red-600' : ''}`}>{confirmaDemo ? 'Toque de novo: isso apaga tudo e volta à demonstração' : 'Restaurar dados de demonstração'}</span>
            </button>
          </div>
          <p className="mt-2 px-1 text-[12px] text-stone-500">Nesta versão os dados ficam só neste aparelho. Faça um backup antes de trocar de celular.</p>
        </section>

        <p className="pt-4 text-center text-[12px] text-stone-400">Controle de Peças · v0.1 protótipo</p>
      </div>
    </>
  )
}
