import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { listarSolicitudes, eventosDe, Solicitud, Estado, ESTADOS } from '../lib/data'
import { PageHeader, FilterBar, Campo, Select, Input, Boton, Tabla, THead, TH, TR, TD, EstadoBadge, Modal, Spinner } from '../components/ui'

export default function MisSolicitudes() {
  const { session, perfil } = useAuth()
  const [filas, setFilas] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)
  const [estado, setEstado] = useState<Estado | ''>('')
  const [texto, setTexto] = useState('')
  const [detalle, setDetalle] = useState<Solicitud | null>(null)
  const [eventos, setEventos] = useState<any[]>([])

  async function cargar() {
    if (!session) return
    setCargando(true)
    const data = await listarSolicitudes({ soloMias: session.user.id, estado, texto })
    setFilas(data); setCargando(false)
  }
  useEffect(() => { void cargar() }, [estado])

  async function verDetalle(s: Solicitud) {
    setDetalle(s)
    setEventos(await eventosDe(s.id))
  }

  return (
    <div>
      <PageHeader titulo="Mis solicitudes" subtitulo={`Hola, ${perfil?.nombre ?? ''}`}
        acciones={<Link to="/nueva"><Boton>➕ Nueva solicitud</Boton></Link>} />

      <FilterBar>
        <Campo label="Estado">
          <Select value={estado} onChange={(e) => setEstado(e.target.value as Estado | '')}>
            <option value="">Todos</option>
            {ESTADOS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </Select>
        </Campo>
        <Campo label="Buscar">
          <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Código, destino…"
            onKeyDown={(e) => e.key === 'Enter' && cargar()} />
        </Campo>
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
                <TD className="font-mono text-xs">{s.codigo}</TD>
                <TD>{s.fecha_solicitud}</TD>
                <TD>{s.destino}</TD>
                <TD>{s.tipo_vehiculo?.nombre ?? '—'}</TD>
                <TD>{s.fecha_requerida ?? '—'} {s.hora_requerida ?? ''}</TD>
                <TD><EstadoBadge estado={s.estado} /></TD>
                <TD><button className="text-[#16468E] hover:underline" onClick={() => verDetalle(s)}>Ver</button></TD>
              </TR>
            ))}
            {filas.length === 0 && <TR><TD className="text-slate-400">No tiene solicitudes registradas.</TD></TR>}
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
            <div>
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
          </div>
        )}
      </Modal>
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
