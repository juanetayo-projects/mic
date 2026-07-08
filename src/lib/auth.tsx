import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

export type Rol = 'administrador' | 'coordinador' | 'solicitante' | 'tripulante'
export type Perfil = {
  id: string
  email: string
  nombre: string
  rol: Rol
  area_id: number | null
  activo: boolean
}

type Ctx = {
  session: Session | null
  perfil: Perfil | null
  loading: boolean
  refrescarPerfil: () => Promise<void>
  salir: () => Promise<void>
}
const AuthCtx = createContext<Ctx>({
  session: null, perfil: null, loading: true,
  refrescarPerfil: async () => {}, salir: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  async function cargarPerfil(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setPerfil(data as Perfil)
  }

  useEffect(() => {
    // El loading se resuelve con .finally() aunque la carga del perfil falle,
    // para no quedar colgados en "Cargando" (gotcha conocido).
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session)
        if (data.session) void cargarPerfil(data.session.user.id)
      })
      .finally(() => setLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) void cargarPerfil(s.user.id)
      else setPerfil(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const refrescarPerfil = async () => {
    if (session) await cargarPerfil(session.user.id)
  }
  const salir = async () => { await supabase.auth.signOut(); setPerfil(null) }

  return (
    <AuthCtx.Provider value={{ session, perfil, loading, refrescarPerfil, salir }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
