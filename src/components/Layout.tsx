import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CalendarDays, LayoutGrid, ShoppingBag, Settings } from 'lucide-react'
import { useConfig, useReposicoes } from '../db/hooks'

const ABAS = [
  { to: '/', rotulo: 'Agenda', Icone: CalendarDays, fim: true },
  { to: '/catalogo', rotulo: 'Catálogo', Icone: LayoutGrid },
  { to: '/reposicao', rotulo: 'Reposição', Icone: ShoppingBag },
  { to: '/ajustes', rotulo: 'Ajustes', Icone: Settings },
]

export default function Layout() {
  const cfg = useConfig()
  const reps = useReposicoes()
  const pendentes = (reps ?? []).filter((r) => r.status === 'pendente').length
  const loc = useLocation()
  const dentroDeEvento = /^\/evento\//.test(loc.pathname)
  const abas = cfg.papel === 'coordenador' ? ABAS.filter((a) => a.to !== '/reposicao') : ABAS

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <main className="flex-1" style={{ paddingBottom: dentroDeEvento ? 'var(--sab)' : 'calc(72px + var(--sab))' }}>
        <Outlet />
      </main>
      {!dentroDeEvento && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90" style={{ paddingBottom: 'var(--sab)' }} aria-label="Navegação principal">
          <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${abas.length}, 1fr)` }}>
            {abas.map(({ to, rotulo, Icone, fim }) => (
              <NavLink key={to} to={to} end={fim} className={({ isActive }) => `relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-stone-500 dark:text-stone-400'}`}>
                <Icone size={22} strokeWidth={2.2} />
                {rotulo}
                {to === '/reposicao' && pendentes > 0 && (
                  <span className="absolute right-[calc(50%-22px)] top-1.5 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold text-white">{pendentes}</span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
