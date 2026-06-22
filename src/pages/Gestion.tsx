import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  listarSolicitudes, listarAreas, listarTiposVehiculo, gestionarSolicitud, eliminarSolicitud,
  Solicitud, Estado, ESTADOS, TRANSICIONES, Area, TipoVehiculo,
} from '../lib/data'
import { notificar } from '../lib/notificar'
import {
  PageHeader, FilterBar, Campo, Select, Input, Boton, Tabla, THead, TH, TR, TD,
  EstadoBadge, Modal, Textarea, Spinner,
} from '../components/ui'

const ANIOS = [2024, 2025, 2026, 2027]
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function Gestion() {
  const { session, perfil } = useAuth()
  const [filas, setFilas] = useState<Solicitud[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [tipos, setTipos] = useState<TipoVehiculo[]>([])
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

  async function cargar() {
    setCargando(true)
    setFilas(await listarSolicitudes(f))
    setCargando(false)
  }
  useEffect(() => {
    void listarAreas().then(setAreas)
    void listarTiposVehiculo().then(setTipos)
  }, [])
  useEffect(() => { void cargar() }, [f.estado, f.area_id, f.tipo_vehiculo_id, f.anio, f.mes])

  function abrirGestion(s: Solicitud) {
    setG(s); setNuevoEstado(''); setComentario('')
    setFechaProg(s.fecha_programada ?? '')
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

  const transiciones = g ? TRANSICIONES[g.estado] : []

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

      {cargando ? <Spinner /> : (
        <Tabla>
          <THead><tr>
            <TH>Código</TH><TH>Solicitante</TH><TH>Área</TH><TH>Destino</TH><TH>Requerido</TH>
            <TH>Vehículo</TH><TH>Estado</TH><TH className="text-right">Acciones</TH>
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
                <TD><EstadoBadge estado={s.estado} /></TD>
                <TD className="text-right whitespace-nowrap">
                  <button className="text-[#16468E] hover:underline mr-3" onClick={() => abrirGestion(s)}>Gestionar</button>
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
            <Campo label="Nuevo estado *">
              <Select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as Estado)}>
                <option value="">— Seleccione —</option>
                {transiciones.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </Select>
            </Campo>
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
    </div>
  )
}
