import { useEffect, useState } from 'react'
import { listarSolicitudes, listarAreas, listarTiposVehiculo, Solicitud, Estado, ESTADOS, Area, TipoVehiculo } from '../lib/data'
import { exportarExcel, exportarPDF } from '../lib/exportar'
import { PageHeader, FilterBar, Campo, Select, Input, Boton, Tabla, THead, TH, TR, TD, EstadoBadge, Spinner } from '../components/ui'

const ANIOS = [2024, 2025, 2026, 2027]
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const COLS = [
  { header: 'Código', key: 'codigo', width: 16 },
  { header: 'Fecha solicitud', key: 'fecha_solicitud', width: 14 },
  { header: 'Solicitante', key: 'solicitante_nombre', width: 22 },
  { header: 'Área', key: 'area', width: 22 },
  { header: 'Vehículo', key: 'vehiculo', width: 12 },
  { header: 'Destino', key: 'destino', width: 24 },
  { header: 'Personas', key: 'cantidad_personas', width: 9 },
  { header: 'Fecha req.', key: 'fecha_requerida', width: 12 },
  { header: 'Hora', key: 'hora_requerida', width: 9 },
  { header: 'Estado', key: 'estado', width: 12 },
  { header: 'Respuesta', key: 'respuesta', width: 28 },
]

export default function Reportes() {
  const [filas, setFilas] = useState<Solicitud[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [tipos, setTipos] = useState<TipoVehiculo[]>([])
  const [cargando, setCargando] = useState(true)
  const [f, setF] = useState({ estado: '' as Estado | '', area_id: '' as number | '', tipo_vehiculo_id: '' as number | '', anio: '' as number | '', mes: '' as number | '', texto: '' })
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }))

  async function cargar() { setCargando(true); setFilas(await listarSolicitudes(f)); setCargando(false) }
  useEffect(() => { void listarAreas().then(setAreas); void listarTiposVehiculo().then(setTipos) }, [])
  useEffect(() => { void cargar() }, [f.estado, f.area_id, f.tipo_vehiculo_id, f.anio, f.mes])

  function aplanar(s: Solicitud) {
    return {
      codigo: s.codigo, fecha_solicitud: s.fecha_solicitud, solicitante_nombre: s.solicitante_nombre,
      area: s.area?.nombre ?? '', vehiculo: s.tipo_vehiculo?.nombre ?? '', destino: s.destino,
      cantidad_personas: s.cantidad_personas, fecha_requerida: s.fecha_requerida ?? '',
      hora_requerida: s.hora_requerida ?? '', estado: s.estado, respuesta: s.respuesta ?? '',
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
            <option value="">Todos</option>{MESES.map((mm, i) => <option key={mm} value={i + 1}>{mm}</option>)}
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
              <TH>Código</TH><TH>Fecha</TH><TH>Solicitante</TH><TH>Área</TH><TH>Destino</TH><TH>Estado</TH>
            </tr></THead>
            <tbody>
              {filas.slice(0, 300).map((s, i) => (
                <TR key={s.id} i={i}>
                  <TD className="font-mono text-xs">{s.codigo}</TD>
                  <TD>{s.fecha_solicitud}</TD>
                  <TD>{s.solicitante_nombre}</TD>
                  <TD>{s.area?.nombre ?? '—'}</TD>
                  <TD>{s.destino}</TD>
                  <TD><EstadoBadge estado={s.estado} /></TD>
                </TR>
              ))}
            </tbody>
          </Tabla>
          <p className="mt-2 text-xs text-slate-400">
            {filas.length} registro(s){filas.length > 300 && ' · se muestran 300; la exportación incluye todos'}
          </p>
        </>
      )}
    </div>
  )
}
