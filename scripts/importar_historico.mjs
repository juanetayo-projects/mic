// Importa el histórico del Excel a Supabase autenticándose como admin (gestor).
// Uso: node --env-file=.env.local scripts/importar_historico.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const URL = process.env.VITE_SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_EMAIL = process.env.MIC_ADMIN_EMAIL || 'juan.etayo@cacsantabarbara.co'
const ADMIN_PASS = process.env.MIC_ADMIN_PASS || 'admin123*'
const SRC = 'docs/Solicitud servicios MIC.xlsx'

// ---------- Leer xlsx (zip + XML) ----------
const TMP = path.join(process.env.TEMP || '/tmp', 'mic_xlsx_imp')
fs.rmSync(TMP, { recursive: true, force: true })
fs.mkdirSync(TMP, { recursive: true })
fs.copyFileSync(SRC, path.join(TMP, 'b.zip'))
execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${path.join(TMP, 'b.zip')}' -DestinationPath '${path.join(TMP, 'x')}' -Force"`)
const xl = path.join(TMP, 'x', 'xl')
const ss = fs.readFileSync(path.join(xl, 'sharedStrings.xml'), 'utf8')
const strings = [...ss.matchAll(/<si>(.*?)<\/si>/gs)].map(m =>
  [...m[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map(x => x[1]).join('')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#10;/g, ' '))
const sheet = fs.readFileSync(path.join(xl, 'worksheets', 'sheet1.xml'), 'utf8')
const rows = [...sheet.matchAll(/<row[^>]*r="(\d+)"[^>]*>(.*?)<\/row>/gs)]
const cellVal = c => { const t = (c.match(/t="([^"]+)"/) || [])[1]; const v = (c.match(/<v>(.*?)<\/v>/s) || [])[1]; if (v === undefined) return ''; return t === 's' ? strings[+v] : v }
const rowCells = x => { const cs = [...x.matchAll(/<c[^>]*r="([A-Z]+)\d+"[^>]*\/?>(?:(.*?)<\/c>)?/gs)]; const m = {}; for (const c of cs) m[c[1]] = cellVal(c[0]); return m }
const data = rows.filter(r => +r[1] > 1).map(r => rowCells(r[2]))
  // descartar filas en blanco arrastradas: requiere algún contenido real
  .filter(d => ['B', 'C', 'D', 'E', 'F'].some(c => (d[c] || '').trim()))

// ---------- Normalización ----------
const simpl = s => (s || '').toString().trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')
const titulo = s => (s || '').toString().trim().replace(/\s+/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
const serialAFecha = v => { const n = parseFloat(v); if (!isFinite(n) || n < 1 || n > 80000) return null; return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000).toISOString().slice(0, 10) }
const AREA_MAP = {
  'urgencias': 'Urgencias', 'urgenias': 'Urgencias', 'urgencais': 'Urgencias', 'coordinacion urgencias': 'Urgencias',
  'mantenimiento': 'Mantenimiento', 'infraestructura': 'Infraestructura',
  'administrativo': 'Administrativo', 'administrativa': 'Administrativo', 'administracion': 'Administrativo',
  'administrativio': 'Administrativo', 'gestion administrativa': 'Administrativo', 'administrativo ge2': 'Administrativo',
  'tics': 'TICS', 'sistemas': 'Sistemas de Información', 'sistemas de informacion': 'Sistemas de Información',
  'comite de infecciones': 'Comité de Infecciones', 'comite infecciones': 'Comité de Infecciones', 'comite de infeccines': 'Comité de Infecciones',
  'sst': 'Seguridad y Salud en el Trabajo', 'seguridad y salud en el trabajo': 'Seguridad y Salud en el Trabajo',
  'siau': 'SIAU', 'siaut': 'SIAU', 'siau urgencias': 'SIAU', 'calidad': 'Calidad',
  'cadena de suministros': 'Cadena de Suministros', 'cadena de suministro': 'Cadena de Suministros',
  'gestion ambiental': 'Gestión Ambiental', 'ambiental': 'Gestión Ambiental', 'glosas y devoluciones': 'Glosas y Devoluciones',
  'seguridad del paciente': 'Seguridad del Paciente', 'seguiridad del paciente': 'Seguridad del Paciente',
  'apoyo terapeutico': 'Apoyo Terapéutico', 'compras': 'Compras', 'talento humano': 'Talento Humano',
  'cartera': 'Cartera', 'trabajo social': 'Trabajo Social', 'riesgo y contratacion': 'Gestión Riesgo y Contratación',
  'gestion riesgo y contratacion': 'Gestión Riesgo y Contratación', 'biomedico': 'Biomédico', 'juridico': 'Jurídico',
  'gestion del conocimiento': 'Gestión del Conocimiento', 'equipo psicosocial': 'Equipo Psicosocial', 'facturacion': 'Facturación',
  'gestion farmaceutica': 'Gestión Farmacéutica', 'radicacion': 'Radicación', 'comercial': 'Comercial',
  'hospitalizacion': 'Hospitalización', 'hospitalizacion hd': 'Hospitalización', 'referencia y contrareferencia': 'Referencia y Contrareferencia',
  'direccion general': 'Dirección General', 'direccion financiera': 'Dirección Financiera', 'direccion': 'Dirección',
  'subdireccion medica': 'Subdirección Médica', 'subdireccion comercial': 'Subdirección Comercial', 'contabilidad': 'Contabilidad',
  'imagenes': 'Imágenes', 'cuentas medicas': 'Cuentas Médicas', 'angiografia': 'Angiografía', 'gerencia': 'Gerencia',
  'planeacion y mejoramiento': 'Planeación y Mejoramiento', 'gestion experiencia del pciente': 'Gestión Experiencia del Paciente',
  'gestion experiencia del paciente': 'Gestión Experiencia del Paciente', 'consulta externa/sede bizerta': 'Consulta Externa', 'financiero': 'Financiero',
}
const normArea = raw => { const s = simpl(raw); if (!s || s === '0.0') return null; return AREA_MAP[s] || titulo(raw) }
const normVeh = raw => { const s = simpl(raw); if (s.includes('camioneta')) return 'Camioneta'; if (s.includes('moto')) return 'Moto'; if (s.includes('auto')) return 'Automóvil'; if (s.includes('carro')) return 'Carro'; return null }
const normEstado = raw => { const s = simpl(raw); if (!s) return 'solicitada'; if (s.includes('realiz') || s.includes('reliz')) return 'realizada'; if (s.includes('program')) return 'programada'; if (s.includes('cancel')) return 'cancelada'; if (s.includes('no cuenta con disponibilidad') || s.includes('rechaz')) return 'rechazada'; if (s.includes('aprob') || s.includes('viatic')) return 'aprobada'; return 'solicitada' }

const filas = data.map(d => ({
  solicitante_nombre: titulo(d.C) || 'Histórico',
  _area: normArea(d.B), _veh: normVeh(d.D),
  destino: titulo(d.E) || '', descripcion: (d.F || '').trim(),
  cantidad_personas: (() => { const n = parseInt(d.G, 10); return isFinite(n) ? n : 1 })(),
  fecha_solicitud: serialAFecha(d.A) || serialAFecha(d.H) || new Date().toISOString().slice(0, 10),
  fecha_requerida: serialAFecha(d.H),
  hora_requerida: (d.I || '').trim() || null, hora_retorno: (d.J || '').trim() || null,
  observaciones: (d.M || '').trim() || null, estado: normEstado(d.K),
  observaciones_geriater: (d.N || '').trim() || null, consecutivo_talonario: (d.O || '').trim() || null,
  es_historico: true,
}))

// ---------- Importar ----------
const sb = createClient(URL, ANON)
const { error: errLogin } = await sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASS })
if (errLogin) { console.error('Login admin falló:', errLogin.message); process.exit(1) }

// 1) asegurar áreas
const areasUsadas = [...new Set(filas.map(f => f._area).filter(Boolean))]
await sb.from('areas').upsert(areasUsadas.map(nombre => ({ nombre })), { onConflict: 'nombre', ignoreDuplicates: true })

// 2) mapas de catálogo
const { data: areas } = await sb.from('areas').select('id,nombre')
const { data: tipos } = await sb.from('tipos_vehiculo').select('id,nombre')
const areaId = Object.fromEntries((areas || []).map(a => [a.nombre, a.id]))
const tipoId = Object.fromEntries((tipos || []).map(t => [t.nombre, t.id]))

// 3) construir e insertar por lotes
const registros = filas.map(({ _area, _veh, ...r }) => ({
  ...r, area_id: _area ? areaId[_area] ?? null : null, tipo_vehiculo_id: _veh ? tipoId[_veh] ?? null : null,
}))
let ok = 0
for (let i = 0; i < registros.length; i += 200) {
  const lote = registros.slice(i, i + 200)
  const { error } = await sb.from('solicitudes').insert(lote)
  if (error) { console.error('Error lote', i, error.message); process.exit(1) }
  ok += lote.length
  console.log(`Insertadas ${ok}/${registros.length}`)
}
console.log('Importación completa:', ok, 'solicitudes históricas.')
