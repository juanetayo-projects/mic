import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, LineChart, Line,
} from 'recharts'
import {
  listarSolicitudes, listarAreas, listarTiposVehiculo, listarVehiculos, listarTripulantes, diasHasta,
  Solicitud, Estado, ESTADOS, Area, TipoVehiculo, Vehiculo, Tripulante,
} from '../lib/data'
import { PageHeader, FilterBar, Campo, Select, Input, Boton, MetricCard, Spinner, Tabla, THead, TH, TR, TD } from '../components/ui'

const ALERTA_DIAS = 30

const ANIOS = [2024, 2025, 2026, 2027]
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const COLORES = ['#0D2D6B', '#16468E', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const COLOR_ESTADO: Record<string, string> = {
  solicitada: '#64748B', aprobada: '#10B981', programada: '#2563EB',
  realizada: '#8B5CF6', aplazada: '#F59E0B', rechazada: '#EF4444', cancelada: '#EF4444',
}

export default function Dashboard() {
  const [filas, setFilas] = useState<Solicitud[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [tipos, setTipos] = useState<TipoVehiculo[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [tripulantesList, setTripulantesList] = useState<Tripulante[]>([])
  const [cargando, setCargando] = useState(true)
  const [f, setF] = useState({ estado: '' as Estado | '', area_id: '' as number | '', tipo_vehiculo_id: '' as number | '', anio: 2026 as number | '', mes: '' as number | '', texto: '' })
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }))

  async function cargar() { setCargando(true); setFilas(await listarSolicitudes(f)); setCargando(false) }
  useEffect(() => {
    void listarAreas().then(setAreas)
    void listarTiposVehiculo().then(setTipos)
    void listarVehiculos(true).then(setVehiculos)
    void listarTripulantes(true).then(setTripulantesList)
  }, [])
  useEffect(() => { void cargar() }, [f.estado, f.area_id, f.tipo_vehiculo_id, f.anio, f.mes])

  const m = useMemo(() => {
    const porEstado = ESTADOS.map((e) => ({ estado: e, total: filas.filter((x) => x.estado === e).length }))
      .filter((x) => x.total > 0)
    const areasMap = new Map<string, number>()
    filas.forEach((x) => { const k = x.area?.nombre ?? 'Sin área'; areasMap.set(k, (areasMap.get(k) ?? 0) + 1) })
    const topAreas = [...areasMap.entries()].map(([area, total]) => ({ area, total }))
      .sort((a, b) => b.total - a.total).slice(0, 8)
    const vehMap = new Map<string, number>()
    filas.forEach((x) => { const k = x.tipo_vehiculo?.nombre ?? 'Sin def.'; vehMap.set(k, (vehMap.get(k) ?? 0) + 1) })
    const porVehiculo = [...vehMap.entries()].map(([name, value]) => ({ name, value }))
    const porMes = MESES.map((mm, i) => ({
      mes: mm,
      total: filas.filter((x) => x.fecha_solicitud && new Date(x.fecha_solicitud + 'T00:00').getMonth() === i).length,
    }))
    return { porEstado, topAreas, porVehiculo, porMes }
  }, [filas])

  // Alertas de vencimiento de documentos: SOAT/seguro/tecnomecánica de vehículos activos
  // y licencia de conducción de tripulantes activos, dentro de los próximos ALERTA_DIAS días.
  const alertas = useMemo(() => {
    const filas: { tipo: string; entidad: string; vence: string; dias: number }[] = []
    for (const v of vehiculos) {
      const campos: [string, string | null][] = [
        ['SOAT', v.soat_vencimiento], ['Seguro', v.seguro_vencimiento], ['Tecnomecánica', v.tecnomecanica_vencimiento],
      ]
      for (const [tipo, fecha] of campos) {
        const dias = diasHasta(fecha)
        if (dias !== null && dias <= ALERTA_DIAS)
          filas.push({ tipo, entidad: `${v.placas} · ${v.marca} ${v.modelo}`.trim(), vence: fecha as string, dias })
      }
    }
    for (const t of tripulantesList) {
      const dias = diasHasta(t.fecha_vencimiento_licencia)
      if (dias !== null && dias <= ALERTA_DIAS)
        filas.push({ tipo: 'Licencia conducción', entidad: t.profile?.nombre ?? t.identificacion, vence: t.fecha_vencimiento_licencia as string, dias })
    }
    return filas.sort((a, b) => a.dias - b.dias)
  }, [vehiculos, tripulantesList])

  const total = filas.length
  const cnt = (e: string) => filas.filter((x) => x.estado === e).length

  return (
    <div>
      <PageHeader titulo="Dashboard MIC" subtitulo="Indicadores de solicitudes de transporte interno" />

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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard titulo="Total solicitudes" valor={total} icono="🚐" color="azul" />
            <MetricCard titulo="Solicitadas (pendientes)" valor={cnt('solicitada')} icono="⏳" color="ambar" />
            <MetricCard titulo="Aprobadas" valor={cnt('aprobada')} icono="✅" color="verde" />
            <MetricCard titulo="Realizadas" valor={cnt('realizada')} icono="🏁" color="morado" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard titulo="Vehículos activos" valor={vehiculos.length} icono="🚗" color="cyan" />
            <MetricCard titulo="Tripulantes activos" valor={tripulantesList.length} icono="🧑‍✈️" color="cyan" />
            <MetricCard titulo="Atendidas" valor={cnt('atendida')} icono="✅" color="verde" />
            <MetricCard titulo="No atendidas" valor={cnt('no_atendida')} icono="⚠️" color="rojo" />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
            <h3 className="mb-3 font-semibold text-[#0D2D6B]">⚠️ Alertas de vencimiento</h3>
            {alertas.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Sin vencimientos en los próximos {ALERTA_DIAS} días.</p>
            ) : (
              <Tabla>
                <THead><tr><TH>Tipo</TH><TH>Entidad</TH><TH>Vence</TH><TH>Estado</TH></tr></THead>
                <tbody>
                  {alertas.map((a, i) => (
                    <TR key={`${a.tipo}-${a.entidad}-${i}`} i={i}>
                      <TD>{a.tipo}</TD>
                      <TD>{a.entidad}</TD>
                      <TD className="whitespace-nowrap">{a.vence}</TD>
                      <TD>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                          a.dias < 0 ? 'bg-rose-100 text-rose-700 ring-rose-300' : 'bg-amber-100 text-amber-700 ring-amber-300'
                        }`}>
                          {a.dias < 0 ? `Vencido hace ${Math.abs(a.dias)} día(s)` : a.dias === 0 ? 'Vence hoy' : `Vence en ${a.dias} día(s)`}
                        </span>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Tabla>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Tarjeta titulo="Solicitudes por mes">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={m.porMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="mes" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip /><Line type="monotone" dataKey="total" stroke="#0D2D6B" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Tarjeta>

            <Tarjeta titulo="Por estado">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={m.porEstado}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="estado" fontSize={11} /><YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {m.porEstado.map((e) => <Cell key={e.estado} fill={COLOR_ESTADO[e.estado] ?? '#0D2D6B'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Tarjeta>

            <Tarjeta titulo="Top áreas solicitantes">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={m.topAreas} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="area" width={140} fontSize={11} />
                  <Tooltip /><Bar dataKey="total" fill="#16468E" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Tarjeta>

            <Tarjeta titulo="Por tipo de vehículo">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={m.porVehiculo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {m.porVehiculo.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </Tarjeta>
          </div>
        </>
      )}
    </div>
  )
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
      <h3 className="mb-3 font-semibold text-[#0D2D6B]">{titulo}</h3>
      {children}
    </div>
  )
}
