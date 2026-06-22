import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { listarAreas, listarTiposVehiculo, crearSolicitud, Area, TipoVehiculo } from '../lib/data'
import { notificar } from '../lib/notificar'
import { PageHeader, Campo, Input, Select, Textarea, Boton, Modal } from '../components/ui'

export default function NuevaSolicitud() {
  const { session, perfil } = useAuth()
  const nav = useNavigate()
  const [areas, setAreas] = useState<Area[]>([])
  const [tipos, setTipos] = useState<TipoVehiculo[]>([])
  const [enviando, setEnviando] = useState(false)
  const [err, setErr] = useState('')
  const [okCodigo, setOkCodigo] = useState<string | null>(null)

  const [f, setF] = useState({
    area_id: perfil?.area_id ?? ('' as number | ''),
    tipo_vehiculo_id: '' as number | '',
    destino: '', descripcion: '', cantidad_personas: 1,
    fecha_requerida: '', hora_requerida: '', hora_retorno: '', observaciones: '',
  })
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    void listarAreas(true).then(setAreas)
    void listarTiposVehiculo(true).then(setTipos)
  }, [])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !perfil) return
    setErr(''); setEnviando(true)
    try {
      const sol = await crearSolicitud({
        area_id: f.area_id === '' ? null : Number(f.area_id),
        tipo_vehiculo_id: f.tipo_vehiculo_id === '' ? null : Number(f.tipo_vehiculo_id),
        destino: f.destino, descripcion: f.descripcion,
        cantidad_personas: Number(f.cantidad_personas) || 1,
        fecha_requerida: f.fecha_requerida || null,
        hora_requerida: f.hora_requerida || null,
        hora_retorno: f.hora_retorno || null,
        observaciones: f.observaciones || null,
      }, { id: session.user.id, nombre: perfil.nombre })
      void notificar('nueva', sol)
      setOkCodigo(sol.codigo)
    } catch (e: any) {
      setErr(e.message ?? 'No se pudo crear la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader titulo="Nueva solicitud de transporte" subtitulo="Complete los datos del servicio requerido" />
      <form onSubmit={enviar}
        className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:grid-cols-2">
        <Campo label="Área / Proceso *">
          <Select value={f.area_id} onChange={(e) => set('area_id', e.target.value)} required>
            <option value="">— Seleccione —</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </Select>
        </Campo>
        <Campo label="Tipo de vehículo *">
          <Select value={f.tipo_vehiculo_id} onChange={(e) => set('tipo_vehiculo_id', e.target.value)} required>
            <option value="">— Seleccione —</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </Select>
        </Campo>
        <Campo label="Lugar de destino *">
          <Input value={f.destino} onChange={(e) => set('destino', e.target.value)} required placeholder="Ej: Sede Urgencias, Palmira…" />
        </Campo>
        <Campo label="Cantidad de personas *">
          <Input type="number" min={1} value={f.cantidad_personas} onChange={(e) => set('cantidad_personas', e.target.value)} required />
        </Campo>
        <Campo label="Fecha requerida *">
          <Input type="date" value={f.fecha_requerida} onChange={(e) => set('fecha_requerida', e.target.value)} required />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Hora salida *">
            <Input type="time" value={f.hora_requerida} onChange={(e) => set('hora_requerida', e.target.value)} required />
          </Campo>
          <Campo label="Hora retorno">
            <Input type="time" value={f.hora_retorno} onChange={(e) => set('hora_retorno', e.target.value)} />
          </Campo>
        </div>
        <Campo label="Descripción de la solicitud *">
          <Textarea rows={2} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} required
            placeholder="Motivo del desplazamiento" />
        </Campo>
        <Campo label="Observaciones">
          <Textarea rows={2} value={f.observaciones} onChange={(e) => set('observaciones', e.target.value)} />
        </Campo>

        {err && <p className="sm:col-span-2 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Boton type="button" variante="secundario" onClick={() => nav('/')}>Cancelar</Boton>
          <Boton type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</Boton>
        </div>
      </form>

      <Modal open={!!okCodigo} onClose={() => nav('/')} titulo="Solicitud registrada">
        <div className="text-center">
          <div className="mb-2 text-4xl">✅</div>
          <p className="text-slate-600">Su solicitud fue registrada con el código:</p>
          <p className="my-2 text-2xl font-bold text-[#0D2D6B]">{okCodigo}</p>
          <p className="text-sm text-slate-500">Recibirá un correo de confirmación y será notificado cuando se gestione.</p>
          <Boton className="mt-4 justify-center" onClick={() => nav('/')}>Ver mis solicitudes</Boton>
        </div>
      </Modal>
    </div>
  )
}
