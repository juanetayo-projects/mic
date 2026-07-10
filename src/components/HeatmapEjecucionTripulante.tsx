import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { Solicitud } from '../lib/data'
import { formatDuracion } from '../lib/data'
import { Modal, Tabla, THead, TH, TR, TD } from './ui'

// Mapa de calor de ejecución de tripulantes: día de la semana × hora de inicio real del
// servicio, a partir de solicitudes 'atendida' (fecha_hora_inicio_servicio/fin_servicio).
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORA_INI = 5, HORA_FIN = 20
const HORAS = Array.from({ length: HORA_FIN - HORA_INI + 1 }, (_, i) => HORA_INI + i)

// Día de la semana 0=Lun..6=Dom y hora 0-23 desde un timestamp ISO de inicio de servicio
function celdaDe(s: Solicitud): { dia: number; hora: number } | null {
  if (!s.fecha_hora_inicio_servicio) return null
  const d = new Date(s.fecha_hora_inicio_servicio)
  if (isNaN(d.getTime())) return null
  const dia = (d.getDay() + 6) % 7 // JS: 0=Dom → 6; 1=Lun → 0
  const hora = d.getHours()
  if (hora < HORA_INI || hora > HORA_FIN) return null
  return { dia, hora }
}

const COLORES_DEFECTO = ['#EAF0FA', '#7FA0D6', '#16468E', '#0D2D6B']

export default function HeatmapEjecucionTripulante({ solicitudes, colores }: { solicitudes: Solicitud[]; colores?: string[] }) {
  const paleta = colores && colores.length > 0 ? colores : COLORES_DEFECTO
  const [sel, setSel] = useState<{ dia: number; hora: number } | null>(null)

  const { data, max } = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => HORAS.map(() => 0))
    for (const s of solicitudes) {
      const c = celdaDe(s)
      if (c) grid[c.dia][c.hora - HORA_INI]++
    }
    const arr: [number, number, number][] = []
    let mx = 0
    for (let d = 0; d < 7; d++) for (let h = 0; h < HORAS.length; h++) {
      const v = grid[d][h]; if (v > mx) mx = v
      arr.push([h, d, v])
    }
    return { data: arr, max: mx }
  }, [solicitudes])

  const detalle = useMemo(() => {
    if (!sel) return []
    return solicitudes.filter((s) => {
      const c = celdaDe(s)
      return c && c.dia === sel.dia && c.hora === sel.hora
    })
  }, [sel, solicitudes])

  const option = {
    tooltip: {
      position: 'top',
      formatter: (p: any) => `${DIAS[p.value[1]]} · ${HORAS[p.value[0]]}:00<br/><b>${p.value[2]}</b> servicio(s)<br/><span style="font-size:10px;color:#888">Clic para ver el detalle</span>`,
    },
    grid: { left: 50, right: 10, top: 10, bottom: 40 },
    xAxis: { type: 'category', data: HORAS.map((h) => `${h}h`), splitArea: { show: true }, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'category', data: DIAS, splitArea: { show: true }, axisLabel: { fontSize: 11 } },
    visualMap: {
      min: 0, max: Math.max(max, 1), calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
      inRange: { color: paleta }, itemHeight: 80, textStyle: { fontSize: 10 },
    },
    series: [{
      name: 'Ejecución', type: 'heatmap', data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.4)' } },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
    }],
  }

  const onEvents = {
    click: (p: any) => {
      const [h, d, v] = p.value as [number, number, number]
      if (v > 0) setSel({ dia: d, hora: HORA_INI + h })
    },
  }

  return (
    <>
      <ReactECharts option={option} style={{ height: 280, width: '100%' }} notMerge onEvents={onEvents} />

      <Modal open={!!sel} onClose={() => setSel(null)}
        titulo={sel ? `Servicios · ${DIAS[sel.dia]} a las ${sel.hora}:00 (${detalle.length})` : ''}
        ancho="max-w-4xl">
        <Tabla>
          <THead><tr>
            <TH>Código</TH><TH>Tripulante</TH><TH>Destino</TH><TH>Inicio</TH><TH>Fin</TH><TH>Duración</TH>
          </tr></THead>
          <tbody>
            {detalle.map((s, i) => (
              <TR key={s.id} i={i}>
                <TD className="whitespace-nowrap font-mono text-xs font-semibold text-[#0D2D6B]">{s.codigo}</TD>
                <TD>{s.tripulante_nombre ?? '—'}</TD>
                <TD>{s.destino}</TD>
                <TD className="whitespace-nowrap">{s.fecha_hora_inicio_servicio ? new Date(s.fecha_hora_inicio_servicio).toLocaleString('es-CO') : '—'}</TD>
                <TD className="whitespace-nowrap">{s.fecha_hora_fin_servicio ? new Date(s.fecha_hora_fin_servicio).toLocaleString('es-CO') : '—'}</TD>
                <TD>{formatDuracion(s.fecha_hora_inicio_servicio, s.fecha_hora_fin_servicio)}</TD>
              </TR>
            ))}
            {detalle.length === 0 && <TR><TD className="text-slate-400">Sin registros.</TD></TR>}
          </tbody>
        </Tabla>
      </Modal>
    </>
  )
}
