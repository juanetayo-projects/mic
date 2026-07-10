import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { atenderSolicitud, marcarNoAtendida, Solicitud, Vehiculo } from '../lib/data'
import { notificar } from '../lib/notificar'
import { Modal, Campo, Select, Input, Textarea, Boton } from './ui'

type Props = {
  solicitud: Solicitud
  vehiculos: Vehiculo[]
  onClose: () => void
  onGuardado: () => void
}

function ahoraLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function FormularioAtencion({ solicitud: s, vehiculos, onClose, onGuardado }: Props) {
  const { session, perfil } = useAuth()
  const inicioDefault = ahoraLocal()
  const [vehiculoId, setVehiculoId] = useState<number | ''>(s.vehiculo_id ?? '')
  const [inicio, setInicio] = useState(inicioDefault)
  const [fin, setFin] = useState(inicioDefault)
  const [observaciones, setObservaciones] = useState('')
  const [noAtendida, setNoAtendida] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function cambiarInicio(v: string) {
    setInicio(v)
    // la fecha final por defecto sigue a la de inicio hasta que el tripulante la edite manualmente
    if (fin === inicioDefault || fin === inicio) setFin(v)
  }

  async function guardarAtendida() {
    if (!session || !perfil || !vehiculoId) return
    setGuardando(true); setError('')
    try {
      const sol = await atenderSolicitud(s.id, {
        vehiculo_id: Number(vehiculoId),
        fecha_hora_inicio_servicio: new Date(inicio).toISOString(),
        fecha_hora_fin_servicio: new Date(fin).toISOString(),
        observaciones_atencion: observaciones,
      }, { id: session.user.id, nombre: perfil.nombre })
      void notificar('atendida', sol)
      onGuardado()
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar')
    } finally { setGuardando(false) }
  }

  async function guardarNoAtendida() {
    if (!session || !perfil || !motivo) return
    setGuardando(true); setError('')
    try {
      const sol = await marcarNoAtendida(s.id, motivo, { id: session.user.id, nombre: perfil.nombre })
      void notificar('no_atendida', sol, { comentario: motivo })
      onGuardado()
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar')
    } finally { setGuardando(false) }
  }

  return (
    <Modal open onClose={onClose} titulo={`Atender · ${s.codigo ?? ''}`} ancho="max-w-lg">
      <div className="space-y-3 text-sm">
        <div className="rounded-lg bg-slate-50 p-3">
          <div><b>{s.solicitante_nombre}</b> · {s.area?.nombre ?? '—'}</div>
          <div className="text-slate-600">{s.destino} · {s.fecha_requerida ?? '—'} {s.hora_requerida ?? ''}</div>
          <div className="text-slate-500">{s.descripcion}</div>
          {s.observaciones_geriater && (
            <div className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-amber-800">
              <b>Observaciones GERIATER:</b> {s.observaciones_geriater}
            </div>
          )}
        </div>

        {!noAtendida ? (
          <>
            <Campo label="Tipo de vehículo que presta el servicio *">
              <Select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">— Seleccione —</option>
                {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.placas} · {v.marca} {v.modelo}</option>)}
              </Select>
            </Campo>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Campo label="Inicio del servicio *">
                <Input type="datetime-local" value={inicio} onChange={(e) => cambiarInicio(e.target.value)} />
              </Campo>
              <Campo label="Fin del servicio *">
                <Input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} />
              </Campo>
            </div>
            <Campo label="Observaciones">
              <Textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </Campo>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex justify-between gap-2">
              <button className="text-sm text-rose-600 hover:underline" onClick={() => setNoAtendida(true)}>
                No pude atender este servicio
              </button>
              <div className="flex gap-2">
                <Boton variante="secundario" onClick={onClose}>Cancelar</Boton>
                <Boton onClick={guardarAtendida} disabled={guardando || !vehiculoId}>
                  {guardando ? 'Guardando…' : 'Marcar atendida'}
                </Boton>
              </div>
            </div>
          </>
        ) : (
          <>
            <Campo label="Motivo por el que no se pudo atender *">
              <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder="Vehículo no disponible, falla mecánica, etc." />
            </Campo>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex justify-between gap-2">
              <button className="text-sm text-slate-500 hover:underline" onClick={() => setNoAtendida(false)}>← Volver</button>
              <div className="flex gap-2">
                <Boton variante="secundario" onClick={onClose}>Cancelar</Boton>
                <Boton variante="peligro" onClick={guardarNoAtendida} disabled={guardando || !motivo}>
                  {guardando ? 'Guardando…' : 'Marcar NO atendida'}
                </Boton>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
