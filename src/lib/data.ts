import { supabase } from './supabase'

export type Estado =
  | 'solicitada' | 'aprobada' | 'aplazada'
  | 'rechazada' | 'programada' | 'realizada' | 'cancelada'

export const ESTADOS: Estado[] = [
  'solicitada', 'aprobada', 'aplazada', 'rechazada', 'programada', 'realizada', 'cancelada',
]

// Transiciones permitidas desde cada estado (gestión del coordinador)
export const TRANSICIONES: Record<Estado, Estado[]> = {
  solicitada: ['aprobada', 'aplazada', 'rechazada', 'cancelada'],
  aprobada: ['programada', 'realizada', 'cancelada'],
  aplazada: ['aprobada', 'rechazada', 'cancelada'],
  programada: ['realizada', 'cancelada'],
  rechazada: [],
  realizada: [],
  cancelada: [],
}

export type Area = { id: number; nombre: string; activo: boolean }
export type TipoVehiculo = { id: number; nombre: string; activo: boolean }

export type Solicitud = {
  id: number
  codigo: string | null
  solicitante_id: string | null
  solicitante_nombre: string
  area_id: number | null
  tipo_vehiculo_id: number | null
  destino: string
  descripcion: string
  cantidad_personas: number
  fecha_requerida: string | null
  hora_requerida: string | null
  hora_retorno: string | null
  observaciones: string | null
  estado: Estado
  fecha_programada: string | null
  respuesta: string | null
  observaciones_geriater: string | null
  consecutivo_talonario: string | null
  gestionado_por: string | null
  fecha_gestion: string | null
  fecha_solicitud: string
  es_historico: boolean
  created_at: string
  area?: Area | null
  tipo_vehiculo?: TipoVehiculo | null
}

const SELECT = '*, area:areas(id,nombre,activo), tipo_vehiculo:tipos_vehiculo(id,nombre,activo)'

export async function listarAreas(soloActivas = false) {
  let q = supabase.from('areas').select('*').order('nombre')
  if (soloActivas) q = q.eq('activo', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Area[]
}

export async function listarTiposVehiculo(soloActivas = false) {
  let q = supabase.from('tipos_vehiculo').select('*').order('nombre')
  if (soloActivas) q = q.eq('activo', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as TipoVehiculo[]
}

export type FiltrosSolicitud = {
  estado?: Estado | ''
  area_id?: number | ''
  tipo_vehiculo_id?: number | ''
  anio?: number | ''
  mes?: number | ''       // 1-12
  texto?: string
  soloMias?: string       // uid si solo las del solicitante
}

export async function listarSolicitudes(f: FiltrosSolicitud = {}) {
  let q = supabase.from('solicitudes').select(SELECT)
    .order('fecha_solicitud', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
  if (f.estado) q = q.eq('estado', f.estado)
  if (f.area_id) q = q.eq('area_id', f.area_id)
  if (f.tipo_vehiculo_id) q = q.eq('tipo_vehiculo_id', f.tipo_vehiculo_id)
  if (f.soloMias) q = q.eq('solicitante_id', f.soloMias)
  if (f.anio) {
    const a = f.anio
    if (f.mes) {
      const ini = `${a}-${String(f.mes).padStart(2, '0')}-01`
      const fin = f.mes === 12 ? `${a + 1}-01-01` : `${a}-${String(f.mes + 1).padStart(2, '0')}-01`
      q = q.gte('fecha_solicitud', ini).lt('fecha_solicitud', fin)
    } else {
      q = q.gte('fecha_solicitud', `${a}-01-01`).lt('fecha_solicitud', `${a + 1}-01-01`)
    }
  }
  if (f.texto) {
    const t = `%${f.texto}%`
    q = q.or(`codigo.ilike.${t},destino.ilike.${t},descripcion.ilike.${t},solicitante_nombre.ilike.${t}`)
  }
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Solicitud[]
}

export type NuevaSolicitud = {
  area_id: number | null
  tipo_vehiculo_id: number | null
  destino: string
  descripcion: string
  cantidad_personas: number
  fecha_requerida: string | null
  hora_requerida: string | null
  hora_retorno: string | null
  observaciones: string | null
}

export async function crearSolicitud(input: NuevaSolicitud, solicitante: { id: string; nombre: string }) {
  const { data, error } = await supabase.from('solicitudes')
    .insert({ ...input, solicitante_id: solicitante.id, solicitante_nombre: solicitante.nombre })
    .select(SELECT).single()
  if (error) throw error
  return data as Solicitud
}

export async function actualizarSolicitud(id: number, cambios: Partial<Solicitud>) {
  const { data, error } = await supabase.from('solicitudes').update(cambios).eq('id', id).select(SELECT).single()
  if (error) throw error
  return data as Solicitud
}

export async function eliminarSolicitud(id: number) {
  const { error } = await supabase.from('solicitudes').delete().eq('id', id)
  if (error) throw error
}

export async function gestionarSolicitud(
  id: number, nuevoEstado: Estado, comentario: string,
  gestor: { id: string; nombre: string },
  extra: Partial<Solicitud> = {},
) {
  const cambios: Partial<Solicitud> = {
    estado: nuevoEstado,
    respuesta: comentario || null,
    gestionado_por: gestor.id,
    fecha_gestion: new Date().toISOString(),
    ...extra,
  }
  const sol = await actualizarSolicitud(id, cambios)
  await supabase.from('solicitud_eventos').insert({
    solicitud_id: id, estado: nuevoEstado, comentario,
    actor_id: gestor.id, actor_nombre: gestor.nombre,
  })
  return sol
}

export async function eventosDe(solicitudId: number) {
  const { data, error } = await supabase.from('solicitud_eventos')
    .select('*').eq('solicitud_id', solicitudId).order('created_at')
  if (error) throw error
  return data ?? []
}
