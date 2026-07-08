import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { listarSolicitudes, listarVehiculos, eventosDe, Solicitud, Estado, ESTADOS, Vehiculo } from '../lib/data'
import { PageHeader, FilterBar, Campo, Select, Input, Boton, Tabla, THead, TH, TR, TD, EstadoBadge, Modal, Spinner, MetricCard } from '../components/ui'
import IconoVehiculo from '../components/IconoVehiculo'
import FormularioAtencion from '../components/FormularioAtencion'

export default function MisSolicitudes() {
  const { session, perfil } = useAuth()
  const esTripulante = perfil?.rol === 'tripulante'
  const [filas, setFilas] = useState<Solicitud[]>([])
  const [resumen, setResumen] = useState<Solicitud[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [cargando, setCargando] = useState(true)
  const [estado, setEstado] = useState<Estado | ''>('')
  const [texto, setTexto] = useState('')
  const [destino, setDestino] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [detalle, setDetalle] = useState<Solicitud | null>(null)
  const [eventos, setEventos] = useState<any[]>([])
  const [atendiendo, setAtendiendo] = useState<Solicitud | null>(null)

  async function cargar() {
    if (!session) return
    setCargando(true)
    const filtro = esTripulante
      ? { soloTripulante: session.user.id, estado, destino, fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
      : { soloMias: session.user.id, estado, texto }
    const data = await listarSolicitudes(filtro)
    setFilas(data); setCargando(false)
  }
  async function cargarResumen() {
    if (!session || !esTripulante) return
    setResumen(await listarSolicitudes({ soloTripulante: session.user.id }))
  }
  useEffect(() => { void cargar(); void cargarResumen() }, [estado, esTripulante])
  useEffect(() => { if (esTripulante) void listarVehiculos(true).then(setVehiculos) }, [esTripulante])

  async function verDetalle(s: Solicitud) {
    setDetalle(s)
    setEventos(await eventosDe(s.id))
  }

  const totalAsignadas = resumen.length
  const pendientes = resumen.filter((s) => s.estado === 'asignada').length
  const atendidas = resumen.filter((s) => s.estado === 'atendida').length
  const noAtendidas = resumen.filter((s) => s.estado === 'no_atendida').length

  return (
    <div>
      <PageHeader titulo={esTripulante ? 'Mis servicios asignados' : 'Mis solicitudes'} subtitulo={`Hola, ${perfil?.nombre ?? ''}`}
        acciones={!esTripulante && <Link to="/nueva"><Boton>➕ Nueva solicitud</Boton></Link>} />

      {esTripulante && (
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard titulo="Total asignadas" valor={totalAsignadas} icono="📋" />
          <MetricCard titulo="Pendientes" valor={pendientes} icono="🕒" color="ambar" />
          <MetricCard titulo="Atendidas" valor={atendidas} icono="✅" color="morado" />
          <MetricCard titulo="No atendidas" valor={noAtendidas} icono="⚠️" color="rojo" />
        </div>
      )}

      <FilterBar>
        <Campo label="Estado">
          <Select value={estado} onChange={(e) => setEstado(e.target.value as Estado | '')}>
            <option value="">Todos</option>
            {ESTADOS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </Select>
        </Campo>
        {esTripulante ? (
          <>
            <Campo label="Destino">
              <Input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Destino…"
                onKeyDown={(e) => e.key === 'Enter' && cargar()} />
            </Campo>
            <Campo label="Desde"><Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} /></Campo>
            <Campo label="Hasta"><Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} /></Campo>
          </>
        ) : (
          <Campo label="Buscar">
            <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Código, destino…"
              onKeyDown={(e) => e.key === 'Enter' && cargar()} />
          </Campo>
        )}
        <Boton variante="secundario" onClick={cargar}>Filtrar</Boton>
      </FilterBar>

      {cargando ? <Spinner /> : (
        <Tabla>
          <THead><tr>
            <TH>Código</TH><TH>Fecha sol.</TH><TH>Destino</TH><TH>Vehículo</TH>
            <TH>Requerido</TH><TH>Estado</TH><TH></TH>
          </tr></THead>
          <tbody>
            {filas.map((s, i) => (
              <TR key={s.id} i={i}>
                <TD className="whitespace-nowrap font-mono text-xs font-semibold text-[#0D2D6B]">{s.codigo}</TD>
                <TD className="whitespace-nowrap">{s.fecha_solicitud}</TD>
                <TD>{s.destino}</TD>
                <TD>{s.tipo_vehiculo?.nombre ?? '—'}</TD>
                <TD>{s.fecha_requerida ?? '—'} {s.hora_requerida ?? ''}</TD>
                <TD><EstadoBadge estado={s.estado} /></TD>
                <TD className="whitespace-nowrap">
                  {esTripulante && s.estado === 'asignada' &&
                    <button className="text-[#16468E] hover:underline mr-3" onClick={() => setAtendiendo(s)}>Atender</button>}
                  <button className="text-[#16468E] hover:underline" onClick={() => verDetalle(s)}>Ver</button>
                </TD>
              </TR>
            ))}
            {filas.length === 0 && <TR><TD className="text-slate-400">{esTripulante ? 'No tiene servicios asignados.' : 'No tiene solicitudes registradas.'}</TD></TR>}
          </tbody>
        </Tabla>
      )}

      <Modal open={!!detalle} onClose={() => setDetalle(null)} titulo={`Solicitud ${detalle?.codigo ?? ''}`} ancho="max-w-xl">
        {detalle && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <EstadoBadge estado={detalle.estado} />
              <span className="text-slate-400">{detalle.fecha_solicitud}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Dato l="Área" v={detalle.area?.nombre} />
              <Dato l="Vehículo" v={detalle.tipo_vehiculo?.nombre} />
              <Dato l="Destino" v={detalle.destino} />
              <Dato l="Personas" v={String(detalle.cantidad_personas)} />
              <Dato l="Fecha requerida" v={detalle.fecha_requerida} />
              <Dato l="Hora" v={`${detalle.hora_requerida ?? ''} ${detalle.hora_retorno ? '– ' + detalle.hora_retorno : ''}`} />
            </div>
            <Dato l="Descripción" v={detalle.descripcion} />
            {detalle.observaciones && <Dato l="Observaciones" v={detalle.observaciones} />}
            {detalle.respuesta && <Dato l="Respuesta del coordinador" v={detalle.respuesta} />}
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <p className="mb-1 font-semibold text-slate-600">Historial</p>
                <ol className="space-y-1 border-l-2 border-slate-200 pl-3">
                  {eventos.map((ev) => (
                    <li key={ev.id} className="text-xs">
                      <span className="capitalize font-medium text-[#16468E]">{ev.estado}</span>
                      {' · '}{new Date(ev.created_at).toLocaleString('es-CO')}
                      {ev.comentario && <div className="text-slate-500">{ev.comentario}</div>}
                    </li>
                  ))}
                  {eventos.length === 0 && <li className="text-xs text-slate-400">Sin movimientos.</li>}
                </ol>
              </div>
              <div className="shrink-0 opacity-90">
                <IconoVehiculo tipo={detalle.tipo_vehiculo?.nombre} size={132} />
                <div className="text-center text-[11px] font-medium text-slate-400">{detalle.tipo_vehiculo?.nombre ?? ''}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {atendiendo && (
        <FormularioAtencion solicitud={atendiendo} vehiculos={vehiculos}
          onClose={() => setAtendiendo(null)}
          onGuardado={() => { setAtendiendo(null); void cargar(); void cargarResumen() }} />
      )}
    </div>
  )
}

function Dato({ l, v }: { l: string; v?: string | null }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{l}</div>
      <div className="text-slate-700">{v || '—'}</div>
    </div>
  )
}
