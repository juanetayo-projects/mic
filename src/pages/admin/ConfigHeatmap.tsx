import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useAuth } from '../../lib/auth'
import { getHeatmapConfig, actualizarHeatmapConfig } from '../../lib/data'
import { PageHeader, Boton, Spinner } from '../../components/ui'

const COLORES_DEFECTO = ['#EAF0FA', '#7FA0D6', '#16468E', '#0D2D6B']

// Datos fijos solo para la vista previa (no vienen de la base de datos)
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORAS = ['5h', '6h', '7h', '8h', '9h', '10h']
const DATA_EJEMPLO: [number, number, number][] = []
for (let d = 0; d < 7; d++) {
  for (let h = 0; h < HORAS.length; h++) DATA_EJEMPLO.push([h, d, Math.round(Math.abs(Math.sin(d + h)) * 6)])
}

export default function ConfigHeatmap() {
  const { session } = useAuth()
  const [colores, setColores] = useState<string[]>(COLORES_DEFECTO)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    void getHeatmapConfig().then((c) => { setColores(c.colores); setCargando(false) })
  }, [])

  function cambiarColor(i: number, valor: string) {
    setColores((prev) => prev.map((c, idx) => (idx === i ? valor : c)))
  }
  function agregarColor() {
    setColores((prev) => [...prev, '#16468E'])
  }
  function quitarColor(i: number) {
    setColores((prev) => prev.filter((_, idx) => idx !== i))
  }
  function restaurar() {
    setColores(COLORES_DEFECTO)
  }

  async function guardar() {
    if (!session) return
    setGuardando(true); setMsg('')
    try {
      await actualizarHeatmapConfig(colores, session.user.id)
      setMsg('Colores guardados.')
    } finally { setGuardando(false) }
  }

  const option = {
    grid: { left: 50, right: 10, top: 10, bottom: 40 },
    xAxis: { type: 'category', data: HORAS, splitArea: { show: true }, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'category', data: DIAS, splitArea: { show: true }, axisLabel: { fontSize: 11 } },
    visualMap: {
      min: 0, max: 6, calculable: false, orient: 'horizontal', left: 'center', bottom: 0,
      inRange: { color: colores.length > 0 ? colores : COLORES_DEFECTO }, itemHeight: 60, textStyle: { fontSize: 10 },
    },
    series: [{ type: 'heatmap', data: DATA_EJEMPLO, label: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: 1 } }],
  }

  if (cargando) return <Spinner />

  return (
    <div>
      <PageHeader titulo="Colores del mapa de calor" subtitulo="Defina la escala de colores usada en el mapa de calor de demanda" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <h3 className="mb-3 font-semibold text-[#0D2D6B]">Escala de colores (de menor a mayor intensidad)</h3>
          <div className="flex flex-col gap-2">
            {colores.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <input type="color" value={c} onChange={(e) => cambiarColor(i, e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded border border-slate-300" />
                <span className="font-mono text-sm text-slate-600">{c}</span>
                {colores.length > 2 && (
                  <button className="ml-auto text-sm text-rose-600 hover:underline" onClick={() => quitarColor(i)}>Quitar</button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Boton variante="secundario" onClick={agregarColor}>+ Agregar color</Boton>
            <Boton variante="secundario" onClick={restaurar}>Restaurar por defecto</Boton>
          </div>
          {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
          <div className="mt-4 flex justify-end">
            <Boton onClick={guardar} disabled={guardando || colores.length < 2}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <h3 className="mb-3 font-semibold text-[#0D2D6B]">Vista previa</h3>
          <ReactECharts option={option} style={{ height: 280, width: '100%' }} notMerge />
        </div>
      </div>
    </div>
  )
}
