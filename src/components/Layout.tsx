import { ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const LOGO_BLANCO = `${import.meta.env.BASE_URL}images/logo_cacsb_blanc.png`

type Item = { to: string; label: string; icono: string }

const operativos = (esGestor: boolean): Item[] => [
  { to: '/', label: 'Mis solicitudes', icono: '📋' },
  { to: '/nueva', label: 'Nueva solicitud', icono: '➕' },
  ...(esGestor ? [
    { to: '/gestion', label: 'Gestión de solicitudes', icono: '✅' },
    { to: '/dashboard', label: 'Dashboard', icono: '📊' },
    { to: '/reportes', label: 'Reportes', icono: '📑' },
  ] : []),
]

const admin: Item[] = [
  { to: '/admin/usuarios', label: 'Usuarios', icono: '👤' },
  { to: '/admin/areas', label: 'Áreas / Procesos', icono: '🏷️' },
  { to: '/admin/vehiculos', label: 'Tipos de vehículo', icono: '🚗' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { perfil, salir } = useAuth()
  const nav = useNavigate()
  const [openAdmin, setOpenAdmin] = useState(true)
  const esGestor = perfil?.rol === 'administrador' || perfil?.rol === 'coordinador'
  const esAdmin = perfil?.rol === 'administrador'

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
      isActive ? 'bg-white/15 font-semibold text-white' : 'text-white/80 hover:bg-white/10'
    }`

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-gradient-to-b from-[#0D2D6B] to-[#16468E] p-4 text-white">
        <div className="mb-6 flex flex-col items-center gap-1 border-b border-white/15 pb-4">
          <img src={LOGO_BLANCO} alt="CAC" className="h-12 object-contain" />
          <span className="text-sm font-bold">Movilidad Interna</span>
          <span className="text-[10px] uppercase tracking-wider opacity-70">MIC</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {operativos(esGestor).map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'} className={linkCls}>
              <span>{i.icono}</span>{i.label}
            </NavLink>
          ))}
          {esAdmin && (
            <div className="mt-3">
              <button onClick={() => setOpenAdmin((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/60 hover:bg-white/10">
                Administración <span>{openAdmin ? '▾' : '▸'}</span>
              </button>
              {openAdmin && admin.map((i) => (
                <NavLink key={i.to} to={i.to} className={linkCls}>
                  <span>{i.icono}</span>{i.label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
        <div className="mt-4 border-t border-white/15 pt-3 text-sm">
          <div className="truncate font-medium">{perfil?.nombre}</div>
          <div className="truncate text-xs capitalize opacity-70">{perfil?.rol}</div>
          <button onClick={async () => { await salir(); nav('/login') }}
            className="mt-2 w-full rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-[#F4F6FB] p-6">{children}</main>
    </div>
  )
}
