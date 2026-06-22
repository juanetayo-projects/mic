import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, LineChart, Line,
} from 'recharts'
import { listarSolicitudes, Solicitud, ESTADOS } from '../lib/data'
import { PageHeader, FilterBar, Campo, Select, MetricCard, Spinner } from '../components/ui'

const ANIOS = [2024, 2025, 2026, 2027]
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const COLORES = ['#0D2D6B', '#16468E', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const COLOR_ESTADO: Record<string, string> = {
  solicitada: '#64748B', aprobada: '#10B981', programada: '#2563EB',
  realizada: '#8B5CF6', aplazada: '#F59E0B', rechazada: '#EF4444', cancelada: '#EF4444',
}

export default function Dashboard() {
  const [filas, setFilas] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)
  const [anio, setAnio] = useState<number | ''>(2026)

  useEffect(() => {
    setCargando(true)
    void listarSolicitudes({ anio }).then((d) => { setFilas(d); setCargando(false) })
  }, [anio])

  const m = useMemo(() => {
    const porEstado = ESTADOS.map((e) => ({ estado: e, total: filas.filter((f) => f.estado === e).length }))
      .filter((x) => x.total > 0)
    const areasMap = new Map<string, number>()
    filas.forEach((f) => { const k = f.area?.nombre ?? 'Sin área'; areasMap.set(k, (areasMap.get(k) ?? 0) + 1) })
    const topAreas = [...areasMap.entries()].map(([area, total]) => ({ area, total }))
      .sort((a, b) => b.total - a.total).slice(0, 8)
    const vehMap = new Map<string, number>()
    filas.forEach((f) => { const k = f.tipo_vehiculo?.nombre ?? 'Sin def.'; vehMap.set(k, (vehMap.get(k) ?? 0) + 1) })
    const porVehiculo = [...vehMap.entries()].map(([name, value]) => ({ name, value }))
    const porMes = MESES.map((mm, i) => ({
      mes: mm,
      total: filas.filter((f) => f.fecha_solicitud && new Date(f.fecha_solicitud + 'T00:00').getMonth() === i).length,
    }))
    return { porEstado, topAreas, porVehiculo, porMes }
  }, [filas])

  const total = filas.length
  const cnt = (e: string) => filas.filter((f) => f.estado === e).length

  return (
    <div>
      <PageHeader titulo="Dashboard MIC" subtitulo="Indicadores de solicitudes de transporte interno"
        acciones={
          <FilterBar>
            <Campo label="Año">
              <Select value={anio} onChange={(e) => setAnio(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Todos</option>{ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </Campo>
          </FilterBar>
        } />

      {cargando ? <Spinner /> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard titulo="Total solicitudes" valor={total} icono="🚐" color="azul" />
            <MetricCard titulo="Solicitadas (pendientes)" valor={cnt('solicitada')} icono="⏳" color="ambar" />
            <MetricCard titulo="Aprobadas" valor={cnt('aprobada')} icono="✅" color="verde" />
            <MetricCard titulo="Realizadas" valor={cnt('realizada')} icono="🏁" color="morado" />
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
