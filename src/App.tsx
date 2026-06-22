import { JSX } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, Rol } from './lib/auth'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import Login from './pages/Login'
import Restablecer from './pages/Restablecer'
import MisSolicitudes from './pages/MisSolicitudes'
import NuevaSolicitud from './pages/NuevaSolicitud'
import Gestion from './pages/Gestion'
import Dashboard from './pages/Dashboard'
import Reportes from './pages/Reportes'
import Usuarios from './pages/admin/Usuarios'
import Areas from './pages/admin/Areas'
import Vehiculos from './pages/admin/Vehiculos'

function Guard({ roles, children }: { roles?: Rol[]; children: JSX.Element }) {
  const { session, perfil, loading } = useAuth()
  if (loading) return <Spinner texto="Cargando…" />
  if (!session) return <Navigate to="/login" replace />
  if (roles && perfil && !roles.includes(perfil.rol)) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

const gestor: Rol[] = ['administrador', 'coordinador']
const soloAdmin: Rol[] = ['administrador']

export default function App() {
  const { session, loading } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={loading ? <Spinner /> : session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/restablecer" element={<Restablecer />} />
      <Route path="/" element={<Guard><MisSolicitudes /></Guard>} />
      <Route path="/nueva" element={<Guard><NuevaSolicitud /></Guard>} />
      <Route path="/gestion" element={<Guard roles={gestor}><Gestion /></Guard>} />
      <Route path="/dashboard" element={<Guard roles={gestor}><Dashboard /></Guard>} />
      <Route path="/reportes" element={<Guard roles={gestor}><Reportes /></Guard>} />
      <Route path="/admin/usuarios" element={<Guard roles={soloAdmin}><Usuarios /></Guard>} />
      <Route path="/admin/areas" element={<Guard roles={soloAdmin}><Areas /></Guard>} />
      <Route path="/admin/vehiculos" element={<Guard roles={soloAdmin}><Vehiculos /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
