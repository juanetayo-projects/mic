import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Boton, Input } from '../components/ui'

export default function Restablecer() {
  const [pass, setPass] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setMsg('')
    if (pass !== confirmar) { setErr('Las contraseñas no coinciden.'); return }
    const { error } = await supabase.auth.updateUser({ password: pass })
    if (error) { setErr(error.message); return }
    setMsg('Contraseña actualizada. Redirigiendo…')
    setTimeout(() => nav('/'), 1500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0D2D6B] to-[#16468E] p-4">
      <form onSubmit={guardar} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h1 className="mb-4 text-center font-bold text-[#0D2D6B]">Nueva contraseña</h1>
        <Input type="password" placeholder="Nueva contraseña" value={pass}
          onChange={(e) => setPass(e.target.value)} required minLength={6} className="mb-3 w-full" />
        <Input type="password" placeholder="Confirmar contraseña" value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)} required minLength={6} className="w-full" />
        {confirmar && pass !== confirmar && <p className="mt-2 text-sm text-rose-600">Las contraseñas no coinciden.</p>}
        {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
        {msg && <p className="mt-2 text-sm text-emerald-600">{msg}</p>}
        <Boton type="submit" className="mt-4 w-full justify-center" disabled={!pass || pass !== confirmar}>Guardar</Boton>
      </form>
    </div>
  )
}
