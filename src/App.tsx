import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import Agenda from './pages/Agenda'
import EventoForm from './pages/EventoForm'
import Evento from './pages/evento/Evento'
import Catalogo from './pages/Catalogo'
import Reposicao from './pages/Reposicao'
import Ajustes from './pages/Ajustes'

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Agenda />} />
            <Route path="evento/novo" element={<EventoForm />} />
            <Route path="evento/:id/editar" element={<EventoForm />} />
            <Route path="evento/:id" element={<Evento />} />
            <Route path="evento/:id/:aba" element={<Evento />} />
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="reposicao" element={<Reposicao />} />
            <Route path="ajustes" element={<Ajustes />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}
