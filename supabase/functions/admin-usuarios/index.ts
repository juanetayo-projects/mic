// Edge Function: admin-usuarios
// Alta / baja / reset de contraseña de usuarios. Solo administradores.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const admin = createClient(url, service)

    // Identificar al invocador
    const authHeader = req.headers.get('Authorization') ?? ''
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await caller.auth.getUser()
    if (!user) return json(401, { error: 'No autenticado' })

    // Verificar rol admin
    const { data: perfil } = await admin.from('profiles').select('rol, activo').eq('id', user.id).single()
    if (!perfil || perfil.rol !== 'administrador' || !perfil.activo)
      return json(403, { error: 'Requiere rol administrador' })

    const { accion, email, password, nombre, rol, area_id, id } = await req.json()

    if (accion === 'crear') {
      if (!email) return json(400, { error: 'Falta el correo' })
      // Los tripulantes pueden no tener correo institucional (p.ej. conductores externos)
      if (rol !== 'tripulante' && !String(email).toLowerCase().endsWith('@cacsantabarbara.co'))
        return json(400, { error: 'El correo debe ser @cacsantabarbara.co' })
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { nombre, rol: rol ?? 'solicitante' },
      })
      if (error) return json(400, { error: error.message })
      await admin.from('profiles').update({ nombre, rol: rol ?? 'solicitante', area_id: area_id ?? null })
        .eq('id', data.user.id)
      return json(200, { ok: true, id: data.user.id })
    }

    if (accion === 'reset') {
      if (!id || !password) return json(400, { error: 'Faltan datos' })
      const { error } = await admin.auth.admin.updateUserById(id, { password })
      if (error) return json(400, { error: error.message })
      return json(200, { ok: true })
    }

    if (accion === 'actualizarEmail') {
      if (!id || !email) return json(400, { error: 'Faltan datos' })
      const { data: perfilObjetivo } = await admin.from('profiles').select('rol').eq('id', id).single()
      // Los tripulantes pueden no tener correo institucional (p.ej. conductores externos)
      if (perfilObjetivo?.rol !== 'tripulante' && !String(email).toLowerCase().endsWith('@cacsantabarbara.co'))
        return json(400, { error: 'El correo debe ser @cacsantabarbara.co' })
      const { error } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true })
      if (error) return json(400, { error: error.message })
      await admin.from('profiles').update({ email }).eq('id', id)
      return json(200, { ok: true })
    }

    if (accion === 'eliminar') {
      if (!id) return json(400, { error: 'Falta id' })
      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) return json(400, { error: error.message })
      return json(200, { ok: true })
    }

    return json(400, { error: 'Acción inválida' })
  } catch (e) {
    return json(500, { error: String((e as Error).message ?? e) })
  }
})
