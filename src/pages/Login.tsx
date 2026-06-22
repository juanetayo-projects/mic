import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Boton, Input } from '../components/ui'

type Modo = 'ingresar' | 'registrar' | 'recuperar'
const LOGO = `${import.meta.env.BASE_URL}images/logo_cacsb2.png`
const LOGO_BLANCO = `${import.meta.env.BASE_URL}images/logo_cacsb_blanc.png`

export default function Login() {
  const [modo, setModo] = useState<Modo>('ingresar')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [nombre, setNombre] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setMsg(''); setCargando(true)
    try {
      if (modo === 'ingresar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) throw new Error('Credenciales inválidas o usuario no confirmado.')
      } else if (modo === 'registrar') {
        if (!email.toLowerCase().endsWith('@cacsantabarbara.co'))
          throw new Error('Debe usar su correo institucional @cacsantabarbara.co')
        const { error } = await supabase.auth.signUp({
          email, password: pass,
          options: { data: { nombre }, emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
        })
        if (error) throw error
        setMsg('Cuenta creada. Revise su correo y haga clic en el enlace para activarla.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}#/restablecer`,
        })
        if (error) throw error
        setMsg('Le enviamos un correo con el enlace para restablecer su contraseña.')
      }
    } catch (e: any) {
      setErr(e.message ?? 'Ocurrió un error.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0D2D6B] to-[#16468E] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-col items-center gap-2 bg-gradient-to-r from-[#0D2D6B] to-[#16468E] px-8 py-6 text-white">
          <img src={LOGO_BLANCO} alt="CAC Santa Bárbara" className="h-14 object-contain" />
          <h1 className="text-lg font-bold">Movilidad Interna · MIC</h1>
          <p className="text-xs opacity-80">Gestión de solicitudes de transporte interno</p>
        </div>
        <form onSubmit={enviar} className="flex flex-col gap-3 px-8 py-6">
          <img src={LOGO} alt="" className="mx-auto mb-1 h-10 object-contain" />
          <h2 className="text-center text-sm font-semibold text-slate-600">
            {modo === 'ingresar' && 'Ingrese a su cuenta'}
            {modo === 'registrar' && 'Cree su cuenta institucional'}
            {modo === 'recuperar' && 'Recuperar contraseña'}
          </h2>

          {modo === 'registrar' && (
            <Input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          )}
          <Input type="email" placeholder="correo@cacsantabarbara.co" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          {modo !== 'recuperar' && (
            <Input type="password" placeholder="Contraseña" value={pass}
              onChange={(e) => setPass(e.target.value)} required minLength={6}
              autoComplete={modo === 'ingresar' ? 'current-password' : 'new-password'} />
          )}

          {err && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
          {msg && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}

          <Boton type="submit" disabled={cargando} className="justify-center">
            {cargando ? 'Procesando…'
              : modo === 'ingresar' ? 'Ingresar'
              : modo === 'registrar' ? 'Registrarme' : 'Enviar enlace'}
          </Boton>

          <div className="mt-1 flex flex-col items-center gap-1 text-xs text-[#16468E]">
            {modo === 'ingresar' && (
              <>
                <button type="button" onClick={() => { setModo('recuperar'); setErr(''); setMsg('') }} className="hover:underline">
                  ¿Olvidó su contraseña?
                </button>
                <button type="button" onClick={() => { setModo('registrar'); setErr(''); setMsg('') }} className="hover:underline">
                  ¿No tiene cuenta? Regístrese
                </button>
              </>
            )}
            {modo !== 'ingresar' && (
              <button type="button" onClick={() => { setModo('ingresar'); setErr(''); setMsg('') }} className="hover:underline">
                ← Volver a ingresar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
