import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  listarSolicitudes, listarAreas, listarTiposVehiculo, listarTripulantes, getHeatmapConfig,
  Solicitud, Estado, ESTADOS, Area, TipoVehiculo, Tripulante,
} from '../lib/data'
import { PageHeader, FilterBar, Campo, Select, Input, Boton, Spinner } from '../components/ui'
import HeatmapDemanda from '../components/HeatmapDemanda'
import HeatmapEjecucionTripulante from '../components/HeatmapEjecucionTripulante'

const ANIOS = [2024, 2025, 2026, 2027]
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function HeatmapPage() {
  const { session, perfil } = useAuth()
  const esTripulante = perfil?.rol === 'tripulante'

  const [vista, setVista] = useState<'demanda' | 'ejecucion'>('demanda')
  const [filas, setFilas] = useState<Solicitud[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [tipos, setTipos] = useState<TipoVehiculo[]>([])
  const [tripulantes, setTripulantes] = useState<Tripulante[]>([])
  const [tripulanteSel, setTripulanteSel] = useState('')
  const [colores, setColores] = useState<string[]>()
  const [cargando, setCargando] = useState(true)
  const [f, setF] = useState({
    estado: '' as Estado | '', area_id: '' as number | '', tipo_vehiculo_id: '' as number | '',
    anio: '' as number | '', mes: '' as number | '', texto: '',
  })
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }))

  async function cargar() {
    if (!session) return
    setCargando(true)
    const filtro = esTripulante ? { ...f, soloTripulante: session.user.id } : f
    setFilas(await listarSolicitudes(filtro))
    setCargando(false)
  }
  useEffect(() => {
    void listarAreas().then(setAreas)
    void listarTiposVehiculo().then(setTipos)
    void getHeatmapConfig().then((c) => setColores(c.colores))
    if (!esTripulante) void listarTripulantes(true).then(setTripulantes)
  }, [esTripulante])
  useEffect(() => { void cargar() }, [f.estado, f.area_id, f.tipo_vehiculo_id, f.anio, f.mes, session, esTripulante])

  const filasEjecucion = useMemo(() => filas.filter((s) =>
    s.estado === 'atendida' && s.fecha_hora_inicio_servicio &&
    (!tripulanteSel || s.tripulante_id === tripulanteSel)), [filas, tripulanteSel])

  return (
    <div>
      <PageHeader titulo="Mapa de calor" subtitulo={esTripulante
        ? 'Demanda y ejecución de sus servicios por día de la semana y hora'
        : 'Demanda de transporte y ejecución de tripulantes por día de la semana y hora'} />

      <div className="mb-4 flex gap-2">
        <button onClick={() => setVista('demanda')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            vista === 'demanda' ? 'bg-[#0D2D6B] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
          }`}>Demanda de solicitudes</button>
        <button onClick={() => setVista('ejecucion')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            vista === 'ejecucion' ? 'bg-[#0D2D6B] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
          }`}>Ejecución de tripulantes</button>
      </div>

      <FilterBar>
        {vista === 'demanda' && (
          <Campo label="Estado">
            <Select value={f.estado} onChange={(e) => set('estado', e.target.value)}>
              <option value="">Todos</option>{ESTADOS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </Select>
          </Campo>
        )}
        {vista === 'ejecucion' && !esTripulante && (
          <Campo label="Tripulante">
            <Select value={tripulanteSel} onChange={(e) => setTripulanteSel(e.target.value)}>
              <option value="">Todos</option>
              {tripulantes.map((t) => <option key={t.id} value={t.id}>{t.profile?.nombre ?? t.identificacion}</option>)}
            </Select>
          </Campo>
        )}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          {vista === 'demanda' ? (
            filas.length > 0
              ? <HeatmapDemanda solicitudes={filas} colores={colores} />
              : <p className="py-8 text-center text-slate-400">No hay solicitudes que coincidan con los filtros.</p>
          ) : (
            filasEjecucion.length > 0
              ? <HeatmapEjecucionTripulante solicitudes={filasEjecucion} colores={colores} />
              : <p className="py-8 text-center text-slate-400">No hay servicios atendidos que coincidan con los filtros.</p>
          )}
        </div>
      )}
      <p className="mt-2 text-xs text-slate-400">
        {vista === 'demanda' ? `${filas.length} solicitud(es)` : `${filasEjecucion.length} servicio(s) atendido(s)`}
      </p>
    </div>
  )
}
