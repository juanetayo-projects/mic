import { supabase } from './supabase'

export type Estado =
  | 'solicitada' | 'aprobada' | 'aplazada'
  | 'rechazada' | 'programada' | 'realizada' | 'cancelada'
  | 'asignada' | 'atendida' | 'no_atendida'

export const ESTADOS: Estado[] = [
  'solicitada', 'aprobada', 'aplazada', 'rechazada', 'cancelada',
  'asignada', 'atendida', 'no_atendida',
  'programada', 'realizada',
]

// Transiciones permitidas desde cada estado (gestión del coordinador).
// 'programada'/'realizada' quedan solo por compatibilidad con el histórico
// (no se ofrecen como destino para solicitudes nuevas, que usan asignada/atendida/no_atendida).
export const TRANSICIONES: Record<Estado, Estado[]> = {
  solicitada: ['aprobada', 'aplazada', 'rechazada', 'cancelada'],
  aprobada: ['asignada', 'cancelada'],
  aplazada: ['aprobada', 'rechazada', 'cancelada'],
  asignada: ['cancelada'],
  no_atendida: ['asignada'],
  rechazada: [],
  cancelada: [],
  atendida: [],
  programada: [],
  realizada: [],
}

export type Area = { id: number; nombre: string; activo: boolean }
export type TipoVehiculo = { id: number; nombre: string; activo: boolean }

export type Vehiculo = {
  id: number
  tipo_vehiculo_id: number | null
  marca: string
  modelo: string
  placas: string
  matricula: string | null
  soat_vencimiento: string | null
  seguro_vencimiento: string | null
  tecnomecanica_vencimiento: string | null
  propiedad: 'geriater' | 'alquilado'
  activo: boolean
}

export type Tripulante = {
  id: string
  identificacion: string
  tarjeta_conduccion: string | null
  categoria_licencia: string | null
  fecha_vencimiento_licencia: string | null
  activo: boolean
  profile?: { nombre: string; email: string; activo: boolean } | null
}

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
  vehiculo_id: number | null
  tripulante_id: string | null
  tripulante_nombre: string | null
  tripulante_reasignado_de: string | null
  fecha_asignacion: string | null
  fecha_hora_inicio_servicio: string | null
  fecha_hora_fin_servicio: string | null
  observaciones_atencion: string | null
  motivo_no_atendida: string | null
  area?: Area | null
  tipo_vehiculo?: TipoVehiculo | null
  vehiculo?: Vehiculo | null
}

const SELECT = '*, area:areas(id,nombre,activo), tipo_vehiculo:tipos_vehiculo(id,nombre,activo), vehiculo:vehiculos(id,placas,marca,modelo)'

export async function listarVehiculos(soloActivos = false) {
  let q = supabase.from('vehiculos').select('*').order('placas')
  if (soloActivos) q = q.eq('activo', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Vehiculo[]
}

export async function listarTripulantes(soloActivos = false) {
  let q = supabase.from('tripulantes').select('*, profile:profiles(nombre,email,activo)').order('identificacion')
  if (soloActivos) q = q.eq('activo', true)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Tripulante[]
}

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
  vehiculo_id?: number | ''
  tripulante_id?: string | ''
  anio?: number | ''
  mes?: number | ''       // 1-12
  texto?: string
  destino?: string
  fecha_desde?: string
  fecha_hasta?: string
  soloMias?: string       // uid si solo las del solicitante
  soloTripulante?: string // uid si solo las asignadas a un tripulante
}

export async function listarSolicitudes(f: FiltrosSolicitud = {}) {
  let q = supabase.from('solicitudes').select(SELECT)
    .order('fecha_solicitud', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
  if (f.estado) q = q.eq('estado', f.estado)
  if (f.area_id) q = q.eq('area_id', f.area_id)
  if (f.tipo_vehiculo_id) q = q.eq('tipo_vehiculo_id', f.tipo_vehiculo_id)
  if (f.vehiculo_id) q = q.eq('vehiculo_id', f.vehiculo_id)
  if (f.tripulante_id) q = q.eq('tripulante_id', f.tripulante_id)
  if (f.soloMias) q = q.eq('solicitante_id', f.soloMias)
  if (f.soloTripulante) q = q.eq('tripulante_id', f.soloTripulante)
  if (f.destino) q = q.ilike('destino', `%${f.destino}%`)
  if (f.fecha_desde) q = q.gte('fecha_requerida', f.fecha_desde)
  if (f.fecha_hasta) q = q.lte('fecha_requerida', f.fecha_hasta)
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

export async function asignarTripulante(
  id: number,
  datos: { tripulante_id: string; tripulante_nombre: string; vehiculo_id: number },
  gestor: { id: string; nombre: string },
  comentario = '',
) {
  const cambios: Partial<Solicitud> = {
    estado: 'asignada',
    tripulante_id: datos.tripulante_id,
    tripulante_nombre: datos.tripulante_nombre,
    vehiculo_id: datos.vehiculo_id,
    fecha_asignacion: new Date().toISOString(),
    gestionado_por: gestor.id,
    fecha_gestion: new Date().toISOString(),
  }
  const sol = await actualizarSolicitud(id, cambios)
  await supabase.from('solicitud_eventos').insert({
    solicitud_id: id, estado: 'asignada', comentario: comentario || null,
    actor_id: gestor.id, actor_nombre: gestor.nombre,
  })
  return sol
}

export async function reasignarTripulante(
  id: number,
  datos: { tripulante_id: string; tripulante_nombre: string; tripulante_anterior_id: string | null },
  gestor: { id: string; nombre: string },
  motivo: string,
) {
  const cambios: Partial<Solicitud> = {
    estado: 'asignada',
    tripulante_id: datos.tripulante_id,
    tripulante_nombre: datos.tripulante_nombre,
    tripulante_reasignado_de: datos.tripulante_anterior_id,
    fecha_asignacion: new Date().toISOString(),
    gestionado_por: gestor.id,
    fecha_gestion: new Date().toISOString(),
  }
  const sol = await actualizarSolicitud(id, cambios)
  await supabase.from('solicitud_eventos').insert({
    solicitud_id: id, estado: 'asignada', comentario: `Reasignada. Motivo: ${motivo}`,
    actor_id: gestor.id, actor_nombre: gestor.nombre,
  })
  return sol
}

export async function atenderSolicitud(
  id: number,
  datos: {
    vehiculo_id: number
    fecha_hora_inicio_servicio: string
    fecha_hora_fin_servicio: string
    observaciones_atencion: string
  },
  tripulante: { id: string; nombre: string },
) {
  const cambios: Partial<Solicitud> = { estado: 'atendida', ...datos }
  const sol = await actualizarSolicitud(id, cambios)
  await supabase.from('solicitud_eventos').insert({
    solicitud_id: id, estado: 'atendida', comentario: datos.observaciones_atencion || null,
    actor_id: tripulante.id, actor_nombre: tripulante.nombre,
  })
  return sol
}

export async function marcarNoAtendida(
  id: number, motivo: string, tripulante: { id: string; nombre: string },
) {
  const cambios: Partial<Solicitud> = { estado: 'no_atendida', motivo_no_atendida: motivo }
  const sol = await actualizarSolicitud(id, cambios)
  await supabase.from('solicitud_eventos').insert({
    solicitud_id: id, estado: 'no_atendida', comentario: motivo,
    actor_id: tripulante.id, actor_nombre: tripulante.nombre,
  })
  return sol
}
