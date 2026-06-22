import { useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { listarAreas, listarTiposVehiculo, crearSolicitud, Area, TipoVehiculo } from '../lib/data'
import { notificar } from '../lib/notificar'
import { Input, Select, Textarea, Boton, Modal } from '../components/ui'
import IconoVehiculo from '../components/IconoVehiculo'

function CampoL({ icono, label, children }: { icono: string; label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
        <span className="text-base">{icono}</span>{label}
      </span>
      {children}
    </label>
  )
}

export default function NuevaSolicitud() {
  const { session, perfil } = useAuth()
  const nav = useNavigate()
  const [areas, setAreas] = useState<Area[]>([])
  const [tipos, setTipos] = useState<TipoVehiculo[]>([])
  const [enviando, setEnviando] = useState(false)
  const [err, setErr] = useState('')
  const [okCodigo, setOkCodigo] = useState<string | null>(null)
  const [okTipo, setOkTipo] = useState<string | null>(null)

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
      setOkTipo(tipos.find((t) => t.id === Number(f.tipo_vehiculo_id))?.nombre ?? null)
      setOkCodigo(sol.codigo)
    } catch (e: any) {
      setErr(e.message ?? 'No se pudo crear la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        {/* Encabezado en degradado */}
        <div className="flex items-center gap-4 bg-gradient-to-r from-[#0D2D6B] to-[#16468E] px-7 py-5 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">🚐</div>
          <div>
            <h1 className="text-lg font-bold">Nueva solicitud de transporte</h1>
            <p className="text-xs text-white/80">Complete los datos del servicio requerido</p>
          </div>
        </div>

        <form onSubmit={enviar} className="grid grid-cols-1 gap-x-6 gap-y-4 p-7 sm:grid-cols-2">
          <CampoL icono="🏢" label="Área / Proceso *">
            <Select value={f.area_id} onChange={(e) => set('area_id', e.target.value)} required className="w-full">
              <option value="">— Seleccione —</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </Select>
          </CampoL>
          <CampoL icono="🚗" label="Tipo de vehículo *">
            <Select value={f.tipo_vehiculo_id} onChange={(e) => set('tipo_vehiculo_id', e.target.value)} required className="w-full">
              <option value="">— Seleccione —</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </Select>
          </CampoL>
          <CampoL icono="📍" label="Lugar de destino *">
            <Input value={f.destino} onChange={(e) => set('destino', e.target.value)} required className="w-full" placeholder="Ej: Sede Urgencias, Palmira…" />
          </CampoL>
          <CampoL icono="👥" label="Cantidad de personas *">
            <Input type="number" min={1} value={f.cantidad_personas} onChange={(e) => set('cantidad_personas', e.target.value)} required className="w-full" />
          </CampoL>
          <CampoL icono="📅" label="Fecha requerida *">
            <Input type="date" value={f.fecha_requerida} onChange={(e) => set('fecha_requerida', e.target.value)} required className="w-full" />
          </CampoL>
          <div className="grid grid-cols-2 gap-3">
            <CampoL icono="🕐" label="Hora salida *">
              <Input type="time" value={f.hora_requerida} onChange={(e) => set('hora_requerida', e.target.value)} required className="w-full" />
            </CampoL>
            <CampoL icono="↩️" label="Hora retorno">
              <Input type="time" value={f.hora_retorno} onChange={(e) => set('hora_retorno', e.target.value)} className="w-full" />
            </CampoL>
          </div>
          <CampoL icono="📝" label="Descripción de la solicitud *">
            <Textarea rows={2} value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} required className="w-full"
              placeholder="Motivo del desplazamiento" />
          </CampoL>
          <CampoL icono="💬" label="Observaciones">
            <Textarea rows={2} value={f.observaciones} onChange={(e) => set('observaciones', e.target.value)} className="w-full" />
          </CampoL>

          {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{err}</p>}
          <div className="mt-1 flex justify-end gap-2 border-t border-slate-100 pt-4 sm:col-span-2">
            <Boton type="button" variante="secundario" onClick={() => nav('/')}>Cancelar</Boton>
            <Boton type="submit" disabled={enviando}>{enviando ? 'Enviando…' : '🚀 Enviar solicitud'}</Boton>
          </div>
        </form>
      </div>

      <Modal open={!!okCodigo} onClose={() => nav('/')} titulo="Solicitud registrada">
        <div className="text-center">
          <div className="mb-2 text-4xl">✅</div>
          <p className="text-slate-600">Su solicitud fue registrada con el código:</p>
          <p className="my-2 text-2xl font-bold text-[#0D2D6B]">{okCodigo}</p>
          {okTipo && <div className="my-2 flex justify-center"><IconoVehiculo tipo={okTipo} size={130} /></div>}
          <p className="text-sm text-slate-500">Recibirá un correo de confirmación y será notificado cuando se gestione.</p>
          <Boton className="mt-4 justify-center" onClick={() => nav('/')}>Ver mis solicitudes</Boton>
        </div>
      </Modal>
    </div>
  )
}
