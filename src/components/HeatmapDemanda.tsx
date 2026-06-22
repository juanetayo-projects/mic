import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { Solicitud } from '../lib/data'

// Mapa de calor de demanda de transporte: día de la semana × hora requerida.
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORA_INI = 5, HORA_FIN = 20
const HORAS = Array.from({ length: HORA_FIN - HORA_INI + 1 }, (_, i) => HORA_INI + i)

// Parsea "08:00", "8:00 AM", "3:00 PM", "10:20am" → hora 0-23
function parseHora(h?: string | null): number | null {
  if (!h) return null
  const s = h.toLowerCase().trim()
  const m = s.match(/(\d{1,2})(?::(\d{2}))?/)
  if (!m) return null
  let hh = parseInt(m[1], 10)
  if (!isFinite(hh) || hh > 23) return null
  if (s.includes('pm') && hh < 12) hh += 12
  if (s.includes('am') && hh === 12) hh = 0
  return hh
}

// Día de la semana 0=Lun..6=Dom desde una fecha ISO
function diaSemana(fecha?: string | null): number | null {
  if (!fecha) return null
  const d = new Date(fecha + 'T00:00')
  if (isNaN(d.getTime())) return null
  return (d.getDay() + 6) % 7 // JS: 0=Dom → 6; 1=Lun → 0
}

export default function HeatmapDemanda({ solicitudes }: { solicitudes: Solicitud[] }) {
  const { data, max } = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => HORAS.map(() => 0))
    for (const s of solicitudes) {
      const dia = diaSemana(s.fecha_requerida ?? s.fecha_solicitud)
      const hora = parseHora(s.hora_requerida)
      if (dia === null || hora === null) continue
      if (hora < HORA_INI || hora > HORA_FIN) continue
      grid[dia][hora - HORA_INI]++
    }
    const arr: [number, number, number][] = []
    let mx = 0
    for (let d = 0; d < 7; d++) for (let h = 0; h < HORAS.length; h++) {
      const v = grid[d][h]; if (v > mx) mx = v
      arr.push([h, d, v])
    }
    return { data: arr, max: mx }
  }, [solicitudes])

  const option = {
    tooltip: {
      position: 'top',
      formatter: (p: any) => `${DIAS[p.value[1]]} · ${HORAS[p.value[0]]}:00<br/><b>${p.value[2]}</b> solicitud(es)`,
    },
    grid: { left: 50, right: 10, top: 10, bottom: 40 },
    xAxis: { type: 'category', data: HORAS.map((h) => `${h}h`), splitArea: { show: true }, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'category', data: DIAS, splitArea: { show: true }, axisLabel: { fontSize: 11 } },
    visualMap: {
      min: 0, max: Math.max(max, 1), calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
      inRange: { color: ['#EAF0FA', '#7FA0D6', '#16468E', '#0D2D6B'] }, itemHeight: 80, textStyle: { fontSize: 10 },
    },
    series: [{
      name: 'Demanda', type: 'heatmap', data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.4)' } },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
    }],
  }

  return <ReactECharts option={option} style={{ height: 280, width: '100%' }} notMerge />
}
