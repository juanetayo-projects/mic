import { supabase } from './supabase'

// Dominio institucional + proveedores de correo públicos conocidos aceptados en el
// registro (mantener en sync con supabase/migrations/0011_... y admin-usuarios/index.ts).
export const DOMINIOS_CONOCIDOS = [
  'cacsantabarbara.co', 'gmail.com', 'hotmail.com', 'outlook.com',
  'yahoo.com', 'yahoo.es', 'icloud.com', 'live.com', 'msn.com', 'protonmail.com',
]

export function correoPermitido(email: string): boolean {
  const dominio = email.trim().toLowerCase().split('@')[1] ?? ''
  return DOMINIOS_CONOCIDOS.includes(dominio)
}

// Días de calendario hasta una fecha 'YYYY-MM-DD' (negativo si ya pasó); null si no hay fecha.
export function diasHasta(fecha: string | null): number | null {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha + 'T00:00')
  return Math.round((f.getTime() - hoy.getTime()) / 86400000)
}

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

// Duración legible entre dos timestamps ISO (p.ej. "1h 25min"); '—' si falta alguno.
export function formatDuracion(inicio: string | null, fin: string | null): string {
  if (!inicio || !fin) return '—'
  const ms = new Date(fin).getTime() - new Date(inicio).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
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
  evento: boolean
  observaciones_viaticos: string | null
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
  evento?: boolean | ''
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
  if (f.evento !== undefined && f.evento !== '') q = q.eq('evento', f.evento)
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

// ---- Rodamiento (bitácora de turnos) ----

export type Rodamiento = {
  id: number
  vehiculo_id: number
  tripulante_id: string
  fecha_inicio_turno: string
  fecha_fin_turno: string | null
  kilometraje_inicial: number | null
  kilometraje_final: number | null
  combustible_inicial: number | null
  combustible_final: number | null
  condiciones_inicial: string | null
  condiciones_final: string | null
  estado: 'abierto' | 'cerrado'
  created_at: string
  vehiculo?: Vehiculo | null
  tripulante?: Tripulante | null
}

export type RodamientoAdjunto = {
  id: number
  rodamiento_id: number
  storage_path: string
  nombre_original: string | null
  tipo_mime: string | null
  subido_por: string | null
  created_at: string
}

const RODAMIENTO_SELECT =
  '*, vehiculo:vehiculos(id,placas,marca,modelo), tripulante:tripulantes(id,identificacion,profile:profiles(nombre))'

export type FiltrosRodamiento = {
  vehiculo_id?: number | ''
  tripulante_id?: string | ''
  estado?: 'abierto' | 'cerrado' | ''
  fecha_desde?: string
  fecha_hasta?: string
  soloTripulante?: string
}

export async function listarRodamiento(f: FiltrosRodamiento = {}) {
  let q = supabase.from('rodamiento').select(RODAMIENTO_SELECT).order('fecha_inicio_turno', { ascending: false })
  if (f.vehiculo_id) q = q.eq('vehiculo_id', f.vehiculo_id)
  if (f.tripulante_id) q = q.eq('tripulante_id', f.tripulante_id)
  if (f.soloTripulante) q = q.eq('tripulante_id', f.soloTripulante)
  if (f.estado) q = q.eq('estado', f.estado)
  if (f.fecha_desde) q = q.gte('fecha_inicio_turno', f.fecha_desde)
  if (f.fecha_hasta) q = q.lte('fecha_inicio_turno', `${f.fecha_hasta}T23:59:59`)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Rodamiento[]
}

export async function rodamientoAbiertoDe(tripulanteId: string) {
  const { data, error } = await supabase.from('rodamiento').select(RODAMIENTO_SELECT)
    .eq('tripulante_id', tripulanteId).eq('estado', 'abierto').maybeSingle()
  if (error) throw error
  return data as Rodamiento | null
}

export async function abrirTurno(
  input: { vehiculo_id: number; kilometraje_inicial: number | null; combustible_inicial: number | null; condiciones_inicial: string | null },
  tripulanteId: string,
) {
  // Chequeo en cliente para un mensaje claro; el índice único parcial en BD es la garantía final
  // ("un tripulante no puede tomar un servicio sin haber cerrado el anterior").
  const abierto = await rodamientoAbiertoDe(tripulanteId)
  if (abierto) throw new Error('Ya tiene un turno abierto. Debe cerrarlo antes de abrir uno nuevo.')
  const { data, error } = await supabase.from('rodamiento').insert({
    ...input, tripulante_id: tripulanteId, fecha_inicio_turno: new Date().toISOString(), estado: 'abierto',
  }).select(RODAMIENTO_SELECT).single()
  if (error) throw error
  return data as Rodamiento
}

export async function cerrarTurno(
  id: number,
  input: { kilometraje_final: number | null; combustible_final: number | null; condiciones_final: string | null },
) {
  const { data, error } = await supabase.from('rodamiento').update({
    ...input, fecha_fin_turno: new Date().toISOString(), estado: 'cerrado',
  }).eq('id', id).select(RODAMIENTO_SELECT).single()
  if (error) throw error
  return data as Rodamiento
}

export async function listarAdjuntosRodamiento(rodamientoId: number) {
  const { data, error } = await supabase.from('rodamiento_adjuntos')
    .select('*').eq('rodamiento_id', rodamientoId).order('created_at')
  if (error) throw error
  return (data ?? []) as RodamientoAdjunto[]
}

export async function subirAdjuntoRodamiento(rodamientoId: number, file: File, subidoPor: string) {
  const path = `${rodamientoId}/${Date.now()}_${file.name}`
  const { error: upErr } = await supabase.storage.from('rodamiento-adjuntos').upload(path, file)
  if (upErr) throw upErr
  const { error } = await supabase.from('rodamiento_adjuntos').insert({
    rodamiento_id: rodamientoId, storage_path: path, nombre_original: file.name, tipo_mime: file.type, subido_por: subidoPor,
  })
  if (error) throw error
}

export async function urlFirmadaAdjunto(path: string) {
  const { data, error } = await supabase.storage.from('rodamiento-adjuntos').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function eliminarAdjuntoRodamiento(id: number, path: string) {
  await supabase.storage.from('rodamiento-adjuntos').remove([path])
  const { error } = await supabase.from('rodamiento_adjuntos').delete().eq('id', id)
  if (error) throw error
}

// ---- Configuración del mapa de calor ----

export type HeatmapConfig = { id: number; colores: string[]; actualizado_por: string | null; updated_at: string }

export async function getHeatmapConfig() {
  const { data, error } = await supabase.from('heatmap_config').select('*').eq('id', 1).single()
  if (error) throw error
  return data as HeatmapConfig
}

export async function actualizarHeatmapConfig(colores: string[], actualizadoPor: string) {
  const { data, error } = await supabase.from('heatmap_config')
    .update({ colores, actualizado_por: actualizadoPor, updated_at: new Date().toISOString() })
    .eq('id', 1).select('*').single()
  if (error) throw error
  return data as HeatmapConfig
}
