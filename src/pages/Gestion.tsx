import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  listarSolicitudes, listarAreas, listarTiposVehiculo, listarVehiculos, listarTripulantes,
  gestionarSolicitud, eliminarSolicitud, reasignarTripulante, formatDuracion,
  Solicitud, Estado, ESTADOS, TRANSICIONES, Area, TipoVehiculo, Vehiculo, Tripulante,
} from '../lib/data'
import { notificar } from '../lib/notificar'
import {
  PageHeader, FilterBar, Campo, Select, Input, Boton, Tabla, THead, TH, TR, TD,
  EstadoBadge, Modal, Textarea, Spinner,
} from '../components/ui'

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
  const [f, setF] = useState({
    estado: '' as Estado | '', area_id: '' as number | '', tipo_vehiculo_id: '' as number | '',
    anio: '' as number | '', mes: '' as number | '', texto: '', evento: '' as boolean | '',
  })
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }))

  // gestión (incluye asignación de tripulante cuando se aprueba)
  const [g, setG] = useState<Solicitud | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<Estado | ''>('')
  const [comentario, setComentario] = useState('')
  const [fechaProg, setFechaProg] = useState('')
  const [talonario, setTalonario] = useState('')
  const [eventoVal, setEventoVal] = useState<'si' | 'no'>('no')
  const [asignarAhora, setAsignarAhora] = useState<'si' | 'no'>('si')
  const [tripulanteSel, setTripulanteSel] = useState('')
  const [vehiculoSel, setVehiculoSel] = useState<number | ''>('')
  const [obsGer, setObsGer] = useState('')
  const [obsViaticos, setObsViaticos] = useState('')
  const [guardando, setGuardando] = useState(false)

  // reasignación de tripulante (solicitud ya asignada o no atendida)
  const [reasignando, setReasignando] = useState<Solicitud | null>(null)
  const [tripulanteReasig, setTripulanteReasig] = useState('')
  const [motivoReasig, setMotivoReasig] = useState('')
  const [guardandoReasig, setGuardandoReasig] = useState(false)

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
  useEffect(() => { void cargar() }, [f.estado, f.area_id, f.tipo_vehiculo_id, f.anio, f.mes, f.evento])

  function abrirGestion(s: Solicitud) {
    setG(s); setNuevoEstado(''); setComentario('')
    // precarga la fecha programada con la que ya tenga, o la fecha requerida de la solicitud
    setFechaProg(s.fecha_programada ?? s.fecha_requerida ?? '')
    setTalonario(s.consecutivo_talonario ?? '')
    setEventoVal(s.evento ? 'si' : 'no')
    setAsignarAhora('si')
    setTripulanteSel(s.tripulante_id ?? '')
    setVehiculoSel(s.vehiculo_id ?? '')
    setObsGer(s.observaciones_geriater ?? '')
    setObsViaticos(s.observaciones_viaticos ?? '')
  }

  async function aplicar() {
    if (!g || !session || !perfil || !nuevoEstado) return
    setGuardando(true)
    try {
      let estadoFinal: Estado = nuevoEstado
      const extra: Partial<Solicitud> = {
        fecha_programada: fechaProg || null,
        consecutivo_talonario: talonario || null,
        evento: eventoVal === 'si',
      }
      // Aprobar asignando de una vez, o asignar directamente una solicitud ya aprobada.
      const asignarEnEsteEnvio = (nuevoEstado === 'aprobada' && asignarAhora === 'si') || nuevoEstado === 'asignada'
      if (asignarEnEsteEnvio) {
        estadoFinal = 'asignada'
        const trip = tripulantes.find((t) => t.id === tripulanteSel)
        extra.tripulante_id = tripulanteSel
        extra.tripulante_nombre = trip?.profile?.nombre ?? ''
        extra.vehiculo_id = Number(vehiculoSel)
        extra.fecha_asignacion = new Date().toISOString()
        extra.observaciones_geriater = obsGer || null
      } else if (nuevoEstado === 'aprobada' && asignarAhora === 'no') {
        // No aplica transporte con tripulante: se resuelve por viáticos.
        extra.observaciones_viaticos = obsViaticos || null
      }
      const sol = await gestionarSolicitud(g.id, estadoFinal, comentario,
        { id: session.user.id, nombre: perfil.nombre }, extra)
      if (estadoFinal === 'asignada') {
        void notificar('asignada', sol, { comentario })
      } else if (nuevoEstado === 'aprobada' && asignarAhora === 'no') {
        void notificar('viaticos', sol, { comentario: obsViaticos })
      } else {
        void notificar('cambio_estado', sol, { estado: estadoFinal, comentario })
      }
      setG(null); await cargar()
    } finally { setGuardando(false) }
  }

  async function borrar(s: Solicitud) {
    if (!confirm(`¿Eliminar la solicitud ${s.codigo}?`)) return
    await eliminarSolicitud(s.id); await cargar()
  }

  // 'asignada' solo se ofrece como transición genérica cuando viene de 'aprobada'
  // (asignación posterior a una aprobación por viáticos). Desde 'no_atendida' se usa
  // el botón dedicado "Reasignar", que exige un motivo.
  const transiciones = g ? TRANSICIONES[g.estado].filter((t) => !(t === 'asignada' && g.estado === 'no_atendida')) : []
  const mostrarAsignacion = nuevoEstado === 'asignada' || (nuevoEstado === 'aprobada' && asignarAhora === 'si')
  const asignacionCompleta = !mostrarAsignacion || (!!tripulanteSel && !!vehiculoSel)
  const viaticosCompleto = !(nuevoEstado === 'aprobada' && asignarAhora === 'no') || !!obsViaticos

  function abrirReasignar(s: Solicitud) {
    setReasignando(s); setTripulanteReasig(''); setMotivoReasig('')
  }

  async function aplicarReasignacion() {
    if (!reasignando || !session || !perfil || !tripulanteReasig || !motivoReasig) return
    setGuardandoReasig(true)
    try {
      const trip = tripulantes.find((t) => t.id === tripulanteReasig)
      const sol = await reasignarTripulante(reasignando.id,
        { tripulante_id: tripulanteReasig, tripulante_nombre: trip?.profile?.nombre ?? '', tripulante_anterior_id: reasignando.tripulante_id },
        { id: session.user.id, nombre: perfil.nombre }, motivoReasig)
      void notificar('reasignada', sol, { comentario: motivoReasig })
      setReasignando(null); await cargar()
    } finally { setGuardandoReasig(false) }
  }

  return (
    <div>
      <PageHeader titulo="Gestión de solicitudes" subtitulo="Apruebe, asigne, aplace, rechace o marque como realizada" />

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
        <Campo label="Evento">
          <Select value={f.evento === '' ? '' : f.evento ? '1' : '0'}
            onChange={(e) => set('evento', e.target.value === '' ? '' : e.target.value === '1')}>
            <option value="">Todos</option><option value="1">Sí</option><option value="0">No</option>
          </Select>
        </Campo>
        <Campo label="Buscar">
          <Input value={f.texto} onChange={(e) => set('texto', e.target.value)} placeholder="Código, destino, solicitante…"
            onKeyDown={(e) => e.key === 'Enter' && cargar()} />
        </Campo>
        <Boton variante="secundario" onClick={cargar}>Filtrar</Boton>
      </FilterBar>

      {cargando ? <Spinner /> : (
        <Tabla>
          <THead><tr>
            <TH>Código</TH><TH>Solicitante</TH><TH>Área</TH><TH>Destino</TH><TH>Requerido</TH>
            <TH>Vehículo</TH><TH>Tripulante</TH><TH>Tiempo</TH><TH>Evento</TH><TH>Estado</TH><TH className="text-right">Acciones</TH>
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
                <TD>{s.evento ? 'Sí' : 'No'}</TD>
                <TD><EstadoBadge estado={s.estado} /></TD>
                <TD className="text-right whitespace-nowrap">
                  <button className="text-[#16468E] hover:underline mr-3" onClick={() => abrirGestion(s)}>Gestionar</button>
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
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
              <Dato l="Solicitante" v={g.solicitante_nombre} />
              <Dato l="Área" v={g.area?.nombre} />
              <Dato l="Destino" v={g.destino} />
              <Dato l="Fecha requerida" v={`${g.fecha_requerida ?? ''} ${g.hora_requerida ?? ''}`.trim()} />
              <Dato l="Descripción" v={g.descripcion} className="col-span-2" />
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
            {transiciones.length === 0 && <p className="text-xs text-amber-600">Esta solicitud está en un estado final o solo admite reasignación.</p>}

            <div>
              <span className="mb-1.5 block text-sm font-semibold text-slate-600">Evento</span>
              <div className="flex gap-2">
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  eventoVal === 'si' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}>
                  <input type="radio" name="evento" checked={eventoVal === 'si'} onChange={() => setEventoVal('si')} className="h-4 w-4 accent-blue-600" />Sí
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  eventoVal === 'no' ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}>
                  <input type="radio" name="evento" checked={eventoVal === 'no'} onChange={() => setEventoVal('no')} className="h-4 w-4 accent-slate-500" />No
                </label>
              </div>
            </div>

            <Campo label="Comentario para el solicitante">
              <Textarea rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fecha programada"><Input type="date" value={fechaProg} onChange={(e) => setFechaProg(e.target.value)} /></Campo>
              <Campo label="Consecutivo talonario"><Input value={talonario} onChange={(e) => setTalonario(e.target.value)} /></Campo>
            </div>

            {nuevoEstado === 'aprobada' && (
              <div className="rounded-lg border border-slate-200 p-3">
                <span className="mb-1.5 block text-sm font-semibold text-slate-600">¿Asignar tripulante ahora?</span>
                <div className="mb-3 flex gap-2">
                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    asignarAhora === 'si' ? 'border-emerald-400 bg-emerald-100 text-emerald-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input type="radio" name="asignarAhora" checked={asignarAhora === 'si'} onChange={() => setAsignarAhora('si')} className="h-4 w-4 accent-emerald-600" />Sí
                  </label>
                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    asignarAhora === 'no' ? 'border-amber-400 bg-amber-100 text-amber-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input type="radio" name="asignarAhora" checked={asignarAhora === 'no'} onChange={() => setAsignarAhora('no')} className="h-4 w-4 accent-amber-600" />No aplica (viáticos)
                  </label>
                </div>
                {asignarAhora === 'no' && (
                  <Campo label="Observaciones de viáticos *">
                    <Textarea rows={2} value={obsViaticos} onChange={(e) => setObsViaticos(e.target.value)}
                      placeholder="Motivo por el que no aplica transporte con tripulante" />
                  </Campo>
                )}
              </div>
            )}

            {mostrarAsignacion && (
              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Asignación del servicio</p>
                <Campo label="Tripulante *">
                  <Select value={tripulanteSel} onChange={(e) => setTripulanteSel(e.target.value)}>
                    <option value="">— Seleccione —</option>
                    {tripulantes.map((t) => <option key={t.id} value={t.id}>{t.profile?.nombre ?? t.identificacion}</option>)}
                  </Select>
                </Campo>
                <Campo label="Vehículo *">
                  <Select value={vehiculoSel} onChange={(e) => setVehiculoSel(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">— Seleccione —</option>
                    {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.placas} · {v.marca} {v.modelo}</option>)}
                  </Select>
                </Campo>
                <Campo label="Observaciones GERIATER">
                  <Textarea rows={2} value={obsGer} onChange={(e) => setObsGer(e.target.value)}
                    placeholder="Visibles para el tripulante asignado" />
                </Campo>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Boton variante="secundario" onClick={() => setG(null)}>Cancelar</Boton>
              <Boton onClick={aplicar} disabled={!nuevoEstado || guardando || !asignacionCompleta || !viaticosCompleto}>
                {guardando ? 'Guardando…' : 'Aplicar y notificar'}
              </Boton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!reasignando} onClose={() => setReasignando(null)} titulo={`Reasignar · ${reasignando?.codigo ?? ''}`} ancho="max-w-lg">
        {reasignando && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
              <Dato l="Solicitante" v={reasignando.solicitante_nombre} />
              <Dato l="Área" v={reasignando.area?.nombre} />
              <Dato l="Destino" v={reasignando.destino} />
              <Dato l="Fecha requerida" v={`${reasignando.fecha_requerida ?? ''} ${reasignando.hora_requerida ?? ''}`.trim()} />
              <Dato l="Tripulante actual" v={reasignando.tripulante_nombre} className="col-span-2" />
            </div>
            <Campo label="Nuevo tripulante *">
              <Select value={tripulanteReasig} onChange={(e) => setTripulanteReasig(e.target.value)}>
                <option value="">— Seleccione —</option>
                {tripulantes.map((t) => <option key={t.id} value={t.id}>{t.profile?.nombre ?? t.identificacion}</option>)}
              </Select>
            </Campo>
            <Campo label="Motivo de la reasignación *">
              <Textarea rows={2} value={motivoReasig} onChange={(e) => setMotivoReasig(e.target.value)}
                placeholder="Vehículo no disponible, falla mecánica, etc." />
            </Campo>
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" onClick={() => setReasignando(null)}>Cancelar</Boton>
              <Boton onClick={aplicarReasignacion} disabled={guardandoReasig || !tripulanteReasig || !motivoReasig}>
                {guardandoReasig ? 'Guardando…' : 'Guardar y notificar'}
              </Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Dato({ l, v, className = '' }: { l: string; v?: string | null; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{l}</div>
      <div className="text-slate-700">{v || '—'}</div>
    </div>
  )
}
