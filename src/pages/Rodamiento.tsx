import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  listarRodamiento, listarVehiculos, listarTripulantes, abrirTurno, cerrarTurno, rodamientoAbiertoDe,
  subirAdjuntoRodamiento, listarAdjuntosRodamiento, urlFirmadaAdjunto, formatDuracion,
  Rodamiento, Vehiculo, Tripulante, RodamientoAdjunto,
} from '../lib/data'
import {
  PageHeader, FilterBar, Campo, Select, Input, Textarea, Boton, Tabla, THead, TH, TR, TD, Modal, Spinner, EstadoBadge,
} from '../components/ui'

const NIVELES_COMBUSTIBLE = [
  { value: 25, label: '1/4' },
  { value: 50, label: '1/2' },
  { value: 75, label: '3/4' },
  { value: 100, label: 'Full' },
]
function combustibleLabel(v: number | null) {
  if (v == null) return '—'
  return NIVELES_COMBUSTIBLE.find((n) => n.value === v)?.label ?? `${v}%`
}
function SelectorCombustible({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {NIVELES_COMBUSTIBLE.map((n) => (
        <label key={n.value} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
          Number(value) === n.value ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
        }`}>
          <input type="radio" name={name} checked={Number(value) === n.value}
            onChange={() => onChange(String(n.value))} className="h-4 w-4 accent-blue-600" />
          {n.label}
        </label>
      ))}
    </div>
  )
}

export default function RodamientoPage() {
  const { session, perfil } = useAuth()
  const esGestor = perfil?.rol === 'administrador' || perfil?.rol === 'coordinador'
  const esTripulante = perfil?.rol === 'tripulante'

  const [filas, setFilas] = useState<Rodamiento[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [tripulantes, setTripulantes] = useState<Tripulante[]>([])
  const [cargando, setCargando] = useState(true)
  const [f, setF] = useState({
    vehiculo_id: '' as number | '', tripulante_id: '' as string | '',
    estado: '' as 'abierto' | 'cerrado' | '', fecha_desde: '', fecha_hasta: '',
  })
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }))

  const [miTurnoAbierto, setMiTurnoAbierto] = useState<Rodamiento | null>(null)

  const [abriendo, setAbriendo] = useState(false)
  const [tripSelAbrir, setTripSelAbrir] = useState('')
  const [vehSelAbrir, setVehSelAbrir] = useState<number | ''>('')
  const [kmInicial, setKmInicial] = useState('')
  const [combInicial, setCombInicial] = useState('')
  const [condInicial, setCondInicial] = useState('')
  const [errAbrir, setErrAbrir] = useState('')
  const [guardandoAbrir, setGuardandoAbrir] = useState(false)

  const [cerrando, setCerrando] = useState<Rodamiento | null>(null)
  const [kmFinal, setKmFinal] = useState('')
  const [combFinal, setCombFinal] = useState('')
  const [condFinal, setCondFinal] = useState('')
  const [archivos, setArchivos] = useState<File[]>([])
  const [errCerrar, setErrCerrar] = useState('')
  const [guardandoCerrar, setGuardandoCerrar] = useState(false)

  const [adjuntosVer, setAdjuntosVer] = useState<{ rod: Rodamiento; items: RodamientoAdjunto[] } | null>(null)

  async function cargarMiTurnoAbierto() {
    if (esTripulante && session) setMiTurnoAbierto(await rodamientoAbiertoDe(session.user.id))
  }

  async function cargar() {
    if (!session) return
    setCargando(true)
    const filtro = esTripulante && !esGestor ? { ...f, soloTripulante: session.user.id } : f
    setFilas(await listarRodamiento(filtro))
    setCargando(false)
  }
  useEffect(() => {
    void listarVehiculos(true).then(setVehiculos)
    if (esGestor) void listarTripulantes(true).then(setTripulantes)
  }, [esGestor])
  useEffect(() => { void cargar(); void cargarMiTurnoAbierto() }, [f.vehiculo_id, f.tripulante_id, f.estado, session, esGestor, esTripulante])

  function abrirModalAbrir() {
    setTripSelAbrir(esTripulante && session ? session.user.id : '')
    setVehSelAbrir(''); setKmInicial(''); setCombInicial(''); setCondInicial(''); setErrAbrir('')
    setAbriendo(true)
  }

  async function guardarAbrir() {
    const tripId = esTripulante ? session?.user.id : tripSelAbrir
    if (!tripId || !vehSelAbrir) return
    setGuardandoAbrir(true); setErrAbrir('')
    try {
      await abrirTurno({
        vehiculo_id: Number(vehSelAbrir),
        kilometraje_inicial: kmInicial ? Number(kmInicial) : null,
        combustible_inicial: combInicial ? Number(combInicial) : null,
        condiciones_inicial: condInicial || null,
      }, tripId)
      setAbriendo(false)
      await cargar(); await cargarMiTurnoAbierto()
    } catch (e: any) {
      setErrAbrir(e.message ?? 'Error al abrir el turno')
    } finally { setGuardandoAbrir(false) }
  }

  function abrirModalCerrar(r: Rodamiento) {
    setCerrando(r); setKmFinal(''); setCombFinal(''); setCondFinal(''); setArchivos([]); setErrCerrar('')
  }

  async function guardarCerrar() {
    if (!cerrando || !session) return
    setGuardandoCerrar(true); setErrCerrar('')
    try {
      await cerrarTurno(cerrando.id, {
        kilometraje_final: kmFinal ? Number(kmFinal) : null,
        combustible_final: combFinal ? Number(combFinal) : null,
        condiciones_final: condFinal || null,
      })
      for (const file of archivos) await subirAdjuntoRodamiento(cerrando.id, file, session.user.id)
      setCerrando(null)
      await cargar(); await cargarMiTurnoAbierto()
    } catch (e: any) {
      setErrCerrar(e.message ?? 'Error al cerrar el turno')
    } finally { setGuardandoCerrar(false) }
  }

  async function verAdjuntos(r: Rodamiento) {
    setAdjuntosVer({ rod: r, items: await listarAdjuntosRodamiento(r.id) })
  }

  async function abrirAdjunto(path: string) {
    window.open(await urlFirmadaAdjunto(path), '_blank')
  }

  return (
    <div>
      <PageHeader titulo="Rodamiento" subtitulo="Bitácora de turnos de vehículo y tripulante"
        acciones={
          <Boton onClick={abrirModalAbrir} disabled={esTripulante && !!miTurnoAbierto}>+ Abrir turno</Boton>
        } />

      {esTripulante && miTurnoAbierto && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Tiene un turno abierto desde el {new Date(miTurnoAbierto.fecha_inicio_turno).toLocaleString('es-CO')}
          {' '}con el vehículo {miTurnoAbierto.vehiculo?.placas ?? '—'}. Debe cerrarlo antes de abrir uno nuevo.
        </p>
      )}

      <FilterBar>
        <Campo label="Vehículo">
          <Select value={f.vehiculo_id} onChange={(e) => set('vehiculo_id', e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos</option>{vehiculos.map((v) => <option key={v.id} value={v.id}>{v.placas}</option>)}
          </Select>
        </Campo>
        {esGestor && (
          <Campo label="Tripulante">
            <Select value={f.tripulante_id} onChange={(e) => set('tripulante_id', e.target.value)}>
              <option value="">Todos</option>
              {tripulantes.map((t) => <option key={t.id} value={t.id}>{t.profile?.nombre ?? t.identificacion}</option>)}
            </Select>
          </Campo>
        )}
        <Campo label="Estado">
          <Select value={f.estado} onChange={(e) => set('estado', e.target.value)}>
            <option value="">Todos</option><option value="abierto">Abierto</option><option value="cerrado">Cerrado</option>
          </Select>
        </Campo>
        <Campo label="Desde"><Input type="date" value={f.fecha_desde} onChange={(e) => set('fecha_desde', e.target.value)} /></Campo>
        <Campo label="Hasta"><Input type="date" value={f.fecha_hasta} onChange={(e) => set('fecha_hasta', e.target.value)} /></Campo>
        <Boton variante="secundario" onClick={cargar}>Filtrar</Boton>
      </FilterBar>

      {cargando ? <Spinner /> : (
        <Tabla>
          <THead><tr>
            <TH>Vehículo</TH><TH>Tripulante</TH><TH>Inicio</TH><TH>Fin</TH><TH>Tiempo</TH>
            <TH>Km inicial</TH><TH>Km final</TH><TH>Combustible</TH><TH>Estado</TH><TH className="text-right">Acciones</TH>
          </tr></THead>
          <tbody>
            {filas.map((r, i) => (
              <TR key={r.id} i={i}>
                <TD>{r.vehiculo?.placas ?? '—'}</TD>
                <TD>{r.tripulante?.profile?.nombre ?? '—'}</TD>
                <TD className="whitespace-nowrap">{new Date(r.fecha_inicio_turno).toLocaleString('es-CO')}</TD>
                <TD className="whitespace-nowrap">{r.fecha_fin_turno ? new Date(r.fecha_fin_turno).toLocaleString('es-CO') : '—'}</TD>
                <TD>{formatDuracion(r.fecha_inicio_turno, r.fecha_fin_turno)}</TD>
                <TD>{r.kilometraje_inicial ?? '—'}</TD>
                <TD>{r.kilometraje_final ?? '—'}</TD>
                <TD>{combustibleLabel(r.combustible_inicial)} → {combustibleLabel(r.combustible_final)}</TD>
                <TD><EstadoBadge estado={r.estado} /></TD>
                <TD className="text-right whitespace-nowrap">
                  {r.estado === 'abierto' && (esGestor || r.tripulante_id === session?.user.id) &&
                    <button className="text-[#16468E] hover:underline mr-3" onClick={() => abrirModalCerrar(r)}>Cerrar turno</button>}
                  <button className="text-[#16468E] hover:underline" onClick={() => verAdjuntos(r)}>Adjuntos</button>
                </TD>
              </TR>
            ))}
            {filas.length === 0 && <TR><TD className="text-slate-400">Sin registros.</TD></TR>}
          </tbody>
        </Tabla>
      )}

      {/* Abrir turno */}
      <Modal open={abriendo} onClose={() => setAbriendo(false)} titulo="Abrir turno" ancho="max-w-lg">
        <div className="space-y-3 text-sm">
          {esGestor && (
            <Campo label="Tripulante *">
              <Select value={tripSelAbrir} onChange={(e) => setTripSelAbrir(e.target.value)}>
                <option value="">— Seleccione —</option>
                {tripulantes.map((t) => <option key={t.id} value={t.id}>{t.profile?.nombre ?? t.identificacion}</option>)}
              </Select>
            </Campo>
          )}
          <Campo label="Vehículo *">
            <Select value={vehSelAbrir} onChange={(e) => setVehSelAbrir(e.target.value ? Number(e.target.value) : '')}>
              <option value="">— Seleccione —</option>
              {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.placas} · {v.marca} {v.modelo}</option>)}
            </Select>
          </Campo>
          <Campo label="Kilometraje inicial"><Input type="number" value={kmInicial} onChange={(e) => setKmInicial(e.target.value)} /></Campo>
          <Campo label="Combustible inicial">
            <SelectorCombustible name="combInicial" value={combInicial} onChange={setCombInicial} />
          </Campo>
          <Campo label="Condiciones del vehículo"><Textarea rows={2} value={condInicial} onChange={(e) => setCondInicial(e.target.value)} /></Campo>
          {errAbrir && <p className="text-sm text-rose-600">{errAbrir}</p>}
          <div className="flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setAbriendo(false)}>Cancelar</Boton>
            <Boton onClick={guardarAbrir} disabled={guardandoAbrir || !vehSelAbrir || (esGestor && !tripSelAbrir)}>
              {guardandoAbrir ? 'Guardando…' : 'Abrir turno'}
            </Boton>
          </div>
        </div>
      </Modal>

      {/* Cerrar turno */}
      <Modal open={!!cerrando} onClose={() => setCerrando(null)} titulo={`Cerrar turno · ${cerrando?.vehiculo?.placas ?? ''}`} ancho="max-w-lg">
        {cerrando && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3 text-slate-600">
              Inicio: {new Date(cerrando.fecha_inicio_turno).toLocaleString('es-CO')} · Km inicial: {cerrando.kilometraje_inicial ?? '—'}
            </div>
            <Campo label="Kilometraje final"><Input type="number" value={kmFinal} onChange={(e) => setKmFinal(e.target.value)} /></Campo>
            <Campo label="Combustible final">
              <SelectorCombustible name="combFinal" value={combFinal} onChange={setCombFinal} />
            </Campo>
            <Campo label="Condiciones del vehículo al cierre"><Textarea rows={2} value={condFinal} onChange={(e) => setCondFinal(e.target.value)} /></Campo>
            <Campo label="Adjuntos (PDF o fotos)">
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#0D2D6B] bg-white px-4 py-2 text-sm font-medium text-[#0D2D6B] transition hover:bg-[#EAF0FA]">
                  📎 Seleccionar archivos
                  <input type="file" multiple accept=".pdf,image/*" className="hidden"
                    onChange={(e) => setArchivos(e.target.files ? Array.from(e.target.files) : [])} />
                </label>
                <span className="text-xs text-slate-500">
                  {archivos.length > 0 ? `${archivos.length} archivo(s) seleccionado(s)` : 'Ningún archivo seleccionado'}
                </span>
              </div>
            </Campo>
            {errCerrar && <p className="text-sm text-rose-600">{errCerrar}</p>}
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" onClick={() => setCerrando(null)}>Cancelar</Boton>
              <Boton onClick={guardarCerrar} disabled={guardandoCerrar}>{guardandoCerrar ? 'Guardando…' : 'Cerrar turno'}</Boton>
            </div>
          </div>
        )}
      </Modal>

      {/* Ver adjuntos */}
      <Modal open={!!adjuntosVer} onClose={() => setAdjuntosVer(null)} titulo={`Adjuntos · ${adjuntosVer?.rod.vehiculo?.placas ?? ''}`} ancho="max-w-md">
        {adjuntosVer && (
          <div className="space-y-2 text-sm">
            {adjuntosVer.items.length === 0 && <p className="text-slate-400">Sin adjuntos.</p>}
            {adjuntosVer.items.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span className="truncate">{a.nombre_original ?? a.storage_path}</span>
                <button className="text-[#16468E] hover:underline" onClick={() => abrirAdjunto(a.storage_path)}>Ver</button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
