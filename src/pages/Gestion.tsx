import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  listarSolicitudes, listarAreas, listarTiposVehiculo, listarVehiculos, listarTripulantes,
  gestionarSolicitud, eliminarSolicitud, asignarTripulante, reasignarTripulante, formatDuracion,
  Solicitud, Estado, ESTADOS, TRANSICIONES, Area, TipoVehiculo, Vehiculo, Tripulante,
} from '../lib/data'
import { notificar } from '../lib/notificar'
import {
  PageHeader, FilterBar, Campo, Select, Input, Boton, Tabla, THead, TH, TR, TD,
  EstadoBadge, Modal, Textarea, Spinner,
} from '../components/ui'
import HeatmapDemanda from '../components/HeatmapDemanda'

const ANIOS = [2024, 2025, 2026, 2027]
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Colores por estado (coinciden con EstadoBadge de la tabla) para las opciones seleccionadas
const COLOR_OPCION: Record<Estado, { sel: string; accent: string }> = {
  solicitada: { sel: 'border-slate-400 bg-slate-100 text-slate-700', accent: 'accent-slate-500' },
  aprobada: { sel: 'border-emerald-400 bg-emerald-100 text-emerald-700', accent: 'accent-emerald-600' },
  programada: { sel: 'border-blue-400 bg-blue-100 text-blue-700', accent: 'accent-blue-600' },
  realizada: { sel: 'border-violet-400 bg-violet-100 text-violet-700', accent: 'accent-violet-600' },
  aplazada: { sel: 'border-amber-400 bg-amber-100 text-amber-700', accent: 'accent-amber-600' },
  rechazada: { sel: 'border-rose-400 bg-rose-100 text-rose-700', accent: 'accent-rose-600' },
  cancelada: { sel: 'border-rose-400 bg-rose-100 text-rose-700', accent: 'accent-rose-600' },
  asignada: { sel: 'border-blue-400 bg-blue-100 text-blue-700', accent: 'accent-blue-600' },
  atendida: { sel: 'border-violet-400 bg-violet-100 text-violet-700', accent: 'accent-violet-600' },
  no_atendida: { sel: 'border-rose-400 bg-rose-100 text-rose-700', accent: 'accent-rose-600' },
}

export default function Gestion() {
  const { session, perfil } = useAuth()
  const [filas, setFilas] = useState<Solicitud[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [tipos, setTipos] = useState<TipoVehiculo[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [tripulantes, setTripulantes] = useState<Tripulante[]>([])
  const [cargando, setCargando] = useState(true)
  const [f, setF] = useState({ estado: '' as Estado | '', area_id: '' as number | '', tipo_vehiculo_id: '' as number | '', anio: '' as number | '', mes: '' as number | '', texto: '' })
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }))

  // gestión
  const [g, setG] = useState<Solicitud | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<Estado | ''>('')
  const [comentario, setComentario] = useState('')
  const [fechaProg, setFechaProg] = useState('')
  const [obsGer, setObsGer] = useState('')
  const [talonario, setTalonario] = useState('')
  const [guardando, setGuardando] = useState(false)

  // asignación / reasignación de tripulante
  const [asignacion, setAsignacion] = useState<{ solicitud: Solicitud; modo: 'asignar' | 'reasignar' } | null>(null)
  const [tripulanteSel, setTripulanteSel] = useState('')
  const [vehiculoSel, setVehiculoSel] = useState<number | ''>('')
  const [comentarioAsig, setComentarioAsig] = useState('')
  const [motivoReasig, setMotivoReasig] = useState('')
  const [guardandoAsig, setGuardandoAsig] = useState(false)

  async function cargar() {
    setCargando(true)
    setFilas(await listarSolicitudes(f))
    setCargando(false)
  }
  useEffect(() => {
    void listarAreas().then(setAreas)
    void listarTiposVehiculo().then(setTipos)
    void listarVehiculos(true).then(setVehiculos)
    void listarTripulantes(true).then(setTripulantes)
  }, [])
  useEffect(() => { void cargar() }, [f.estado, f.area_id, f.tipo_vehiculo_id, f.anio, f.mes])

  function abrirGestion(s: Solicitud) {
    setG(s); setNuevoEstado(''); setComentario('')
    // precarga la fecha programada con la que ya tenga, o la fecha requerida de la solicitud
    setFechaProg(s.fecha_programada ?? s.fecha_requerida ?? '')
    setObsGer(s.observaciones_geriater ?? '')
    setTalonario(s.consecutivo_talonario ?? '')
  }

  async function aplicar() {
    if (!g || !session || !perfil || !nuevoEstado) return
    setGuardando(true)
    try {
      const sol = await gestionarSolicitud(g.id, nuevoEstado, comentario,
        { id: session.user.id, nombre: perfil.nombre },
        {
          fecha_programada: fechaProg || null,
          observaciones_geriater: obsGer || null,
          consecutivo_talonario: talonario || null,
        })
      void notificar('cambio_estado', sol, { estado: nuevoEstado, comentario })
      setG(null); await cargar()
    } finally { setGuardando(false) }
  }

  async function borrar(s: Solicitud) {
    if (!confirm(`¿Eliminar la solicitud ${s.codigo}?`)) return
    await eliminarSolicitud(s.id); await cargar()
  }

  // 'asignada' se excluye del selector genérico: requiere elegir tripulante+vehículo,
  // lo cual se hace con el modal dedicado de Asignar/Reasignar.
  const transiciones = g ? TRANSICIONES[g.estado].filter((t) => t !== 'asignada') : []

  function abrirAsignar(s: Solicitud) {
    setAsignacion({ solicitud: s, modo: 'asignar' })
    setTripulanteSel(''); setVehiculoSel(''); setComentarioAsig(''); setMotivoReasig('')
  }
  function abrirReasignar(s: Solicitud) {
    setAsignacion({ solicitud: s, modo: 'reasignar' })
    setTripulanteSel(''); setVehiculoSel(s.vehiculo_id ?? ''); setComentarioAsig(''); setMotivoReasig('')
  }

  async function aplicarAsignacion() {
    if (!asignacion || !session || !perfil || !tripulanteSel) return
    setGuardandoAsig(true)
    try {
      const trip = tripulantes.find((t) => t.id === tripulanteSel)
      const tripNombre = trip?.profile?.nombre ?? ''
      const gestor = { id: session.user.id, nombre: perfil.nombre }
      if (asignacion.modo === 'asignar') {
        if (!vehiculoSel) return
        const sol = await asignarTripulante(asignacion.solicitud.id,
          { tripulante_id: tripulanteSel, tripulante_nombre: tripNombre, vehiculo_id: Number(vehiculoSel) },
          gestor, comentarioAsig)
        void notificar('asignada', sol, { comentario: comentarioAsig })
      } else {
        const sol = await reasignarTripulante(asignacion.solicitud.id,
          { tripulante_id: tripulanteSel, tripulante_nombre: tripNombre, tripulante_anterior_id: asignacion.solicitud.tripulante_id },
          gestor, motivoReasig)
        void notificar('reasignada', sol, { comentario: motivoReasig })
      }
      setAsignacion(null); await cargar()
    } finally { setGuardandoAsig(false) }
  }

  return (
    <div>
      <PageHeader titulo="Gestión de solicitudes" subtitulo="Apruebe, aplace, rechace, programe o marque como realizada" />

      <FilterBar>
        <Campo label="Estado">
          <Select value={f.estado} onChange={(e) => set('estado', e.target.value)}>
            <option value="">Todos</option>{ESTADOS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </Select>
        </Campo>
        <Campo label="Área">
          <Select value={f.area_id} onChange={(e) => set('area_id', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todas</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </Select>
        </Campo>
        <Campo label="Vehículo">
          <Select value={f.tipo_vehiculo_id} onChange={(e) => set('tipo_vehiculo_id', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos</option>{tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </Select>
        </Campo>
        <Campo label="Año">
          <Select value={f.anio} onChange={(e) => set('anio', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos</option>{ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </Campo>
        <Campo label="Mes">
          <Select value={f.mes} onChange={(e) => set('mes', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos</option>{MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
        </Campo>
        <Campo label="Buscar">
          <Input value={f.texto} onChange={(e) => set('texto', e.target.value)} placeholder="Código, destino, solicitante…"
            onKeyDown={(e) => e.key === 'Enter' && cargar()} />
        </Campo>
        <Boton variante="secundario" onClick={cargar}>Filtrar</Boton>
      </FilterBar>

      {!cargando && filas.length > 0 && (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <h3 className="mb-1 font-semibold text-[#0D2D6B]">Mapa de calor de demanda</h3>
          <p className="mb-2 text-xs text-slate-500">Solicitudes por día de la semana y hora requerida (según los filtros aplicados)</p>
          <HeatmapDemanda solicitudes={filas} />
        </div>
      )}

      {cargando ? <Spinner /> : (
        <Tabla>
          <THead><tr>
            <TH>Código</TH><TH>Solicitante</TH><TH>Área</TH><TH>Destino</TH><TH>Requerido</TH>
            <TH>Vehículo</TH><TH>Tripulante</TH><TH>Tiempo</TH><TH>Estado</TH><TH className="text-right">Acciones</TH>
          </tr></THead>
          <tbody>
            {filas.map((s, i) => (
              <TR key={s.id} i={i}>
                <TD className="whitespace-nowrap font-mono text-xs font-semibold text-[#0D2D6B]">{s.codigo}</TD>
                <TD>{s.solicitante_nombre}</TD>
                <TD>{s.area?.nombre ?? '—'}</TD>
                <TD>{s.destino}</TD>
                <TD>{s.fecha_requerida ?? '—'} {s.hora_requerida ?? ''}</TD>
                <TD>{s.tipo_vehiculo?.nombre ?? '—'}</TD>
                <TD>{s.tripulante_nombre ?? '—'}</TD>
                <TD>{formatDuracion(s.fecha_hora_inicio_servicio, s.fecha_hora_fin_servicio)}</TD>
                <TD><EstadoBadge estado={s.estado} /></TD>
                <TD className="text-right whitespace-nowrap">
                  <button className="text-[#16468E] hover:underline mr-3" onClick={() => abrirGestion(s)}>Gestionar</button>
                  {s.estado === 'aprobada' &&
                    <button className="text-[#16468E] hover:underline mr-3" onClick={() => abrirAsignar(s)}>Asignar tripulante</button>}
                  {(s.estado === 'asignada' || s.estado === 'no_atendida') &&
                    <button className="text-[#16468E] hover:underline mr-3" onClick={() => abrirReasignar(s)}>Reasignar</button>}
                  {perfil?.rol === 'administrador' &&
                    <button className="text-rose-600 hover:underline" onClick={() => borrar(s)}>Eliminar</button>}
                </TD>
              </TR>
            ))}
            {filas.length === 0 && <TR><TD className="text-slate-400">Sin resultados.</TD></TR>}
          </tbody>
        </Tabla>
      )}
      <p className="mt-2 text-xs text-slate-400">{filas.length} solicitud(es)</p>

      <Modal open={!!g} onClose={() => setG(null)} titulo={`Gestionar ${g?.codigo ?? ''}`} ancho="max-w-lg">
        {g && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <div><b>{g.solicitante_nombre}</b> · {g.area?.nombre}</div>
              <div className="text-slate-600">{g.destino} · {g.fecha_requerida} {g.hora_requerida}</div>
              <div className="text-slate-500">{g.descripcion}</div>
            </div>
            <div className="flex items-center gap-2">
              <span>Estado actual:</span><EstadoBadge estado={g.estado} />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-slate-600">Nuevo estado *</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {transiciones.map((t) => {
                  const activo = nuevoEstado === t
                  const c = COLOR_OPCION[t]
                  return (
                    <label key={t}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                        activo ? c.sel : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}>
                      <input type="checkbox" checked={activo}
                        onChange={() => setNuevoEstado(activo ? '' : t)}
                        className={`h-4 w-4 shrink-0 ${c.accent}`} />
                      {t}
                    </label>
                  )
                })}
              </div>
            </div>
            {transiciones.length === 0 && <p className="text-xs text-amber-600">Esta solicitud está en un estado final.</p>}
            <Campo label="Comentario para el solicitante">
              <Textarea rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fecha programada"><Input type="date" value={fechaProg} onChange={(e) => setFechaProg(e.target.value)} /></Campo>
              <Campo label="Consecutivo talonario"><Input value={talonario} onChange={(e) => setTalonario(e.target.value)} /></Campo>
            </div>
            <Campo label="Observaciones GERIATER"><Input value={obsGer} onChange={(e) => setObsGer(e.target.value)} /></Campo>
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" onClick={() => setG(null)}>Cancelar</Boton>
              <Boton onClick={aplicar} disabled={!nuevoEstado || guardando}>{guardando ? 'Guardando…' : 'Aplicar y notificar'}</Boton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!asignacion} onClose={() => setAsignacion(null)}
        titulo={`${asignacion?.modo === 'reasignar' ? 'Reasignar' : 'Asignar tripulante'} · ${asignacion?.solicitud.codigo ?? ''}`} ancho="max-w-lg">
        {asignacion && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <div><b>{asignacion.solicitud.solicitante_nombre}</b> · {asignacion.solicitud.area?.nombre}</div>
              <div className="text-slate-600">{asignacion.solicitud.destino} · {asignacion.solicitud.fecha_requerida} {asignacion.solicitud.hora_requerida}</div>
              {asignacion.modo === 'reasignar' && (
                <div className="mt-1 text-slate-500">Tripulante actual: <b>{asignacion.solicitud.tripulante_nombre ?? '—'}</b></div>
              )}
            </div>
            <Campo label={asignacion.modo === 'reasignar' ? 'Nuevo tripulante *' : 'Tripulante *'}>
              <Select value={tripulanteSel} onChange={(e) => setTripulanteSel(e.target.value)}>
                <option value="">— Seleccione —</option>
                {tripulantes.map((t) => <option key={t.id} value={t.id}>{t.profile?.nombre ?? t.identificacion}</option>)}
              </Select>
            </Campo>
            {asignacion.modo === 'asignar' && (
              <Campo label="Vehículo *">
                <Select value={vehiculoSel} onChange={(e) => setVehiculoSel(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">— Seleccione —</option>
                  {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.placas} · {v.marca} {v.modelo}</option>)}
                </Select>
              </Campo>
            )}
            {asignacion.modo === 'asignar' ? (
              <Campo label="Comentario (opcional)">
                <Textarea rows={2} value={comentarioAsig} onChange={(e) => setComentarioAsig(e.target.value)} />
              </Campo>
            ) : (
              <Campo label="Motivo de la reasignación *">
                <Textarea rows={2} value={motivoReasig} onChange={(e) => setMotivoReasig(e.target.value)}
                  placeholder="Vehículo no disponible, falla mecánica, etc." />
              </Campo>
            )}
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" onClick={() => setAsignacion(null)}>Cancelar</Boton>
              <Boton onClick={aplicarAsignacion}
                disabled={guardandoAsig || !tripulanteSel || (asignacion.modo === 'asignar' && !vehiculoSel) || (asignacion.modo === 'reasignar' && !motivoReasig)}>
                {guardandoAsig ? 'Guardando…' : 'Guardar y notificar'}
              </Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
