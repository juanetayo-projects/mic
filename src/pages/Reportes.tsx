import { useEffect, useMemo, useState } from 'react'
import {
  listarSolicitudes, listarAreas, listarTiposVehiculo, listarVehiculos, listarTripulantes, listarRodamiento,
  Solicitud, Estado, ESTADOS, Area, TipoVehiculo, Vehiculo, Tripulante, Rodamiento,
} from '../lib/data'
import { exportarExcel, exportarPDF } from '../lib/exportar'
import { PageHeader, FilterBar, Campo, Select, Input, Boton, Tabla, THead, TH, TR, TD, EstadoBadge, Spinner } from '../components/ui'

const ANIOS = [2024, 2025, 2026, 2027]
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const COLS = [
  { header: 'Código', key: 'codigo', width: 16 },
  { header: 'Fecha solicitud', key: 'fecha_solicitud', width: 14 },
  { header: 'Solicitante', key: 'solicitante_nombre', width: 22 },
  { header: 'Área', key: 'area', width: 22 },
  { header: 'Tipo vehículo', key: 'tipo_vehiculo', width: 12 },
  { header: 'Placas', key: 'placas', width: 10 },
  { header: 'Tripulante', key: 'tripulante', width: 20 },
  { header: 'Destino', key: 'destino', width: 24 },
  { header: 'Personas', key: 'cantidad_personas', width: 9 },
  { header: 'Fecha req.', key: 'fecha_requerida', width: 12 },
  { header: 'Hora', key: 'hora_requerida', width: 9 },
  { header: 'Estado', key: 'estado', width: 12 },
  { header: 'Evento', key: 'evento', width: 8 },
  { header: 'Respuesta', key: 'respuesta', width: 28 },
]

export default function Reportes() {
  const [filas, setFilas] = useState<Solicitud[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [tipos, setTipos] = useState<TipoVehiculo[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [tripulantes, setTripulantes] = useState<Tripulante[]>([])
  const [rodamientoFilas, setRodamientoFilas] = useState<Rodamiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [f, setF] = useState({
    estado: '' as Estado | '', area_id: '' as number | '', tipo_vehiculo_id: '' as number | '',
    vehiculo_id: '' as number | '', tripulante_id: '' as string | '',
    anio: '' as number | '', mes: '' as number | '', texto: '', evento: '' as boolean | '',
  })
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }))

  async function cargar() { setCargando(true); setFilas(await listarSolicitudes(f)); setCargando(false) }
  useEffect(() => {
    void listarAreas().then(setAreas)
    void listarTiposVehiculo().then(setTipos)
    void listarVehiculos().then(setVehiculos)
    void listarTripulantes().then(setTripulantes)
  }, [])
  useEffect(() => { void cargar() }, [f.estado, f.area_id, f.tipo_vehiculo_id, f.vehiculo_id, f.tripulante_id, f.anio, f.mes, f.evento])
  useEffect(() => {
    void listarRodamiento({ vehiculo_id: f.vehiculo_id, tripulante_id: f.tripulante_id, estado: 'cerrado' })
      .then(setRodamientoFilas)
  }, [f.vehiculo_id, f.tripulante_id])

  // Indicadores diarios: km recorridos y combustible consumido (desde Rodamiento),
  // cantidad de servicios atendidos (desde solicitudes), agrupados por fecha.
  const indicadoresDiarios = useMemo(() => {
    const mapa = new Map<string, { fecha: string; km: number; combustible: number; servicios: number }>()
    const obtener = (fecha: string) => {
      let d = mapa.get(fecha)
      if (!d) { d = { fecha, km: 0, combustible: 0, servicios: 0 }; mapa.set(fecha, d) }
      return d
    }
    for (const r of rodamientoFilas) {
      const fecha = r.fecha_inicio_turno.slice(0, 10)
      if (f.anio && !fecha.startsWith(String(f.anio))) continue
      if (f.mes && new Date(`${fecha}T00:00`).getMonth() + 1 !== f.mes) continue
      const d = obtener(fecha)
      if (r.kilometraje_inicial != null && r.kilometraje_final != null) d.km += r.kilometraje_final - r.kilometraje_inicial
      if (r.combustible_inicial != null && r.combustible_final != null) d.combustible += r.combustible_inicial - r.combustible_final
    }
    for (const s of filas) {
      if (s.estado !== 'atendida') continue
      const base = s.fecha_hora_fin_servicio ?? s.fecha_hora_inicio_servicio
      if (!base) continue
      obtener(base.slice(0, 10)).servicios += 1
    }
    return [...mapa.values()].sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [rodamientoFilas, filas, f.anio, f.mes])

  const COLS_DIARIO = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Km recorridos', key: 'km', width: 14 },
    { header: 'Combustible consumido (%)', key: 'combustible', width: 22 },
    { header: 'Servicios atendidos', key: 'servicios', width: 16 },
  ]
  async function excelDiario() {
    await exportarExcel('Indicadores diarios de rodamiento MIC', COLS_DIARIO, indicadoresDiarios, 'indicadores_diarios_mic')
  }
  async function pdfDiario() {
    const headers = COLS_DIARIO.map((c) => c.header)
    const body = indicadoresDiarios.map((d) => [d.fecha, d.km.toFixed(1), d.combustible.toFixed(1), String(d.servicios)])
    await exportarPDF('Indicadores diarios de rodamiento MIC', headers, body, 'indicadores_diarios_mic')
  }

  function aplanar(s: Solicitud) {
    return {
      codigo: s.codigo, fecha_solicitud: s.fecha_solicitud, solicitante_nombre: s.solicitante_nombre,
      area: s.area?.nombre ?? '', tipo_vehiculo: s.tipo_vehiculo?.nombre ?? '', placas: s.vehiculo?.placas ?? '',
      tripulante: s.tripulante_nombre ?? '', destino: s.destino,
      cantidad_personas: s.cantidad_personas, fecha_requerida: s.fecha_requerida ?? '',
      hora_requerida: s.hora_requerida ?? '', estado: s.estado, evento: s.evento ? 'Sí' : 'No',
      respuesta: s.respuesta ?? '',
    }
  }

  async function excel() {
    await exportarExcel('Reporte de solicitudes MIC', COLS, filas.map(aplanar), 'reporte_mic')
  }
  async function pdf() {
    const headers = COLS.map((c) => c.header)
    const body = filas.map((s) => { const o = aplanar(s) as any; return COLS.map((c) => String(o[c.key] ?? '')) })
    await exportarPDF('Reporte de solicitudes MIC', headers, body, 'reporte_mic')
  }

  return (
    <div>
      <PageHeader titulo="Reportes" subtitulo="Consulte y exporte solicitudes con título y logo institucional"
        acciones={<>
          <Boton variante="secundario" onClick={excel} disabled={!filas.length}>⬇ Excel</Boton>
          <Boton onClick={pdf} disabled={!filas.length}>⬇ PDF</Boton>
        </>} />

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
        <Campo label="Tipo de vehículo">
          <Select value={f.tipo_vehiculo_id} onChange={(e) => set('tipo_vehiculo_id', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos</option>{tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </Select>
        </Campo>
        <Campo label="Vehículo">
          <Select value={f.vehiculo_id} onChange={(e) => set('vehiculo_id', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos</option>{vehiculos.map((v) => <option key={v.id} value={v.id}>{v.placas}</option>)}
          </Select>
        </Campo>
        <Campo label="Tripulante">
          <Select value={f.tripulante_id} onChange={(e) => set('tripulante_id', e.target.value)}>
            <option value="">Todos</option>
            {tripulantes.map((t) => <option key={t.id} value={t.id}>{t.profile?.nombre ?? t.identificacion}</option>)}
          </Select>
        </Campo>
        <Campo label="Año">
          <Select value={f.anio} onChange={(e) => set('anio', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos</option>{ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </Campo>
        <Campo label="Mes">
          <Select value={f.mes} onChange={(e) => set('mes', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos</option>{MESES.map((mm, i) => <option key={mm} value={i + 1}>{mm}</option>)}
          </Select>
        </Campo>
        <Campo label="Evento">
          <Select value={f.evento === '' ? '' : f.evento ? '1' : '0'}
            onChange={(e) => set('evento', e.target.value === '' ? '' : e.target.value === '1')}>
            <option value="">Todos</option><option value="1">Sí</option><option value="0">No</option>
          </Select>
        </Campo>
        <Campo label="Buscar">
          <Input value={f.texto} onChange={(e) => set('texto', e.target.value)} placeholder="Código, destino…"
            onKeyDown={(e) => e.key === 'Enter' && cargar()} />
        </Campo>
        <Boton variante="secundario" onClick={cargar}>Filtrar</Boton>
      </FilterBar>

      {cargando ? <Spinner /> : (
        <>
          <Tabla>
            <THead><tr>
              <TH>Código</TH><TH>Fecha</TH><TH>Solicitante</TH><TH>Área</TH><TH>Destino</TH><TH>Tripulante</TH><TH>Evento</TH><TH>Estado</TH>
            </tr></THead>
            <tbody>
              {filas.slice(0, 300).map((s, i) => (
                <TR key={s.id} i={i}>
                  <TD className="whitespace-nowrap font-mono text-xs font-semibold text-[#0D2D6B]">{s.codigo}</TD>
                  <TD className="whitespace-nowrap">{s.fecha_solicitud}</TD>
                  <TD>{s.solicitante_nombre}</TD>
                  <TD>{s.area?.nombre ?? '—'}</TD>
                  <TD>{s.destino}</TD>
                  <TD>{s.tripulante_nombre ?? '—'}</TD>
                  <TD>{s.evento ? 'Sí' : 'No'}</TD>
                  <TD><EstadoBadge estado={s.estado} /></TD>
                </TR>
              ))}
            </tbody>
          </Tabla>
          <p className="mt-2 text-xs text-slate-400">
            {filas.length} registro(s){filas.length > 300 && ' · se muestran 300; la exportación incluye todos'}
          </p>

          <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[#0D2D6B]">Indicadores diarios de rodamiento</h3>
              <p className="text-xs text-slate-500">Kilometraje recorrido, combustible consumido y servicios atendidos por día (según los filtros de vehículo/tripulante/año/mes)</p>
            </div>
            <div className="flex gap-2">
              <Boton variante="secundario" onClick={excelDiario} disabled={!indicadoresDiarios.length}>⬇ Excel</Boton>
              <Boton onClick={pdfDiario} disabled={!indicadoresDiarios.length}>⬇ PDF</Boton>
            </div>
          </div>
          <Tabla>
            <THead><tr>
              <TH>Fecha</TH><TH>Km recorridos</TH><TH>Combustible consumido</TH><TH>Servicios atendidos</TH>
            </tr></THead>
            <tbody>
              {indicadoresDiarios.map((d, i) => (
                <TR key={d.fecha} i={i}>
                  <TD className="whitespace-nowrap">{d.fecha}</TD>
                  <TD>{d.km.toFixed(1)} km</TD>
                  <TD>{d.combustible.toFixed(1)}%</TD>
                  <TD>{d.servicios}</TD>
                </TR>
              ))}
              {indicadoresDiarios.length === 0 && <TR><TD className="text-slate-400">Sin datos para los filtros seleccionados.</TD></TR>}
            </tbody>
          </Tabla>
        </>
      )}
    </div>
  )
}
