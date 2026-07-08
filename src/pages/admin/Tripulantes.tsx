import { useEffect, useState } from 'react'
import { supabase, invocarFuncion } from '../../lib/supabase'
import { PageHeader, Boton, Input, Select, Campo, Modal, Tabla, THead, TH, TR, TD, Spinner } from '../../components/ui'

type Tripulante = {
  id: string
  identificacion: string
  tarjeta_conduccion: string | null
  categoria_licencia: string | null
  fecha_vencimiento_licencia: string | null
  activo: boolean
  profile: { nombre: string; email: string; activo: boolean } | null
}

type Nuevo = {
  email: string; nombre: string; password: string
  identificacion: string; tarjeta_conduccion: string; categoria_licencia: string; fecha_vencimiento_licencia: string
}

export default function Tripulantes() {
  const [filas, setFilas] = useState<Tripulante[]>([])
  const [cargando, setCargando] = useState(true)
  const [nuevo, setNuevo] = useState<Nuevo | null>(null)
  const [editar, setEditar] = useState<Tripulante | null>(null)
  const [emailOriginal, setEmailOriginal] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase.from('tripulantes')
      .select('*, profile:profiles(nombre,email,activo)')
      .order('identificacion')
    if (error) setErr(error.message)
    setFilas((data as any) ?? [])
    setCargando(false)
  }
  useEffect(() => { void cargar() }, [])

  async function invocar(body: any) {
    setErr(''); setMsg('')
    const { data, error } = await invocarFuncion('admin-usuarios', body)
    if (error) { setErr(error); return null }
    return data
  }

  async function crear() {
    if (!nuevo) return
    const resp = await invocar({
      accion: 'crear', email: nuevo.email, password: nuevo.password, nombre: nuevo.nombre, rol: 'tripulante',
    })
    if (!resp) return
    const { error } = await supabase.from('tripulantes').insert({
      id: resp.id,
      identificacion: nuevo.identificacion,
      tarjeta_conduccion: nuevo.tarjeta_conduccion || null,
      categoria_licencia: nuevo.categoria_licencia || null,
      fecha_vencimiento_licencia: nuevo.fecha_vencimiento_licencia || null,
    })
    if (error) { setErr(error.message); return }
    setMsg('Tripulante creado.'); setNuevo(null); await cargar()
  }

  async function guardarEdicion() {
    if (!editar) return
    setErr(''); setMsg('')
    if (editar.profile?.email && editar.profile.email !== emailOriginal) {
      const resp = await invocar({ accion: 'actualizarEmail', id: editar.id, email: editar.profile.email })
      if (!resp) return
    }
    const { error } = await supabase.from('tripulantes').update({
      identificacion: editar.identificacion,
      tarjeta_conduccion: editar.tarjeta_conduccion,
      categoria_licencia: editar.categoria_licencia,
      fecha_vencimiento_licencia: editar.fecha_vencimiento_licencia,
      activo: editar.activo,
    }).eq('id', editar.id)
    if (error) { setErr(error.message); return }
    if (editar.profile) {
      await supabase.from('profiles').update({ nombre: editar.profile.nombre, activo: editar.profile.activo }).eq('id', editar.id)
    }
    setEditar(null); await cargar()
  }

  async function resetPass(t: Tripulante) {
    const nueva = prompt(`Nueva contraseña para ${t.profile?.email}:`)
    if (!nueva) return
    if (await invocar({ accion: 'reset', id: t.id, password: nueva })) setMsg('Contraseña actualizada.')
  }

  async function eliminar(t: Tripulante) {
    if (!confirm(`¿Eliminar al tripulante ${t.profile?.email}? Se elimina también su usuario.`)) return
    if (await invocar({ accion: 'eliminar', id: t.id })) { setMsg('Tripulante eliminado.'); await cargar() }
  }

  return (
    <div>
      <PageHeader titulo="Tripulantes" subtitulo="Conductores con acceso al sistema para atender solicitudes"
        acciones={<Boton onClick={() => setNuevo({ email: '', nombre: '', password: '', identificacion: '', tarjeta_conduccion: '', categoria_licencia: '', fecha_vencimiento_licencia: '' })}>+ Nuevo tripulante</Boton>} />

      {msg && <p className="mb-3 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}

      {cargando ? <Spinner /> : (
        <Tabla>
          <THead><tr>
            <TH>Nombre</TH><TH>Correo</TH><TH>Identificación</TH><TH>Tarjeta cond.</TH><TH>Categoría</TH><TH>Vence</TH><TH>Activo</TH><TH className="text-right">Acciones</TH>
          </tr></THead>
          <tbody>
            {filas.map((t, i) => (
              <TR key={t.id} i={i}>
                <TD>{t.profile?.nombre ?? '—'}</TD>
                <TD>{t.profile?.email ?? '—'}</TD>
                <TD>{t.identificacion}</TD>
                <TD>{t.tarjeta_conduccion ?? '—'}</TD>
                <TD>{t.categoria_licencia ?? '—'}</TD>
                <TD>{t.fecha_vencimiento_licencia ?? '—'}</TD>
                <TD>{t.activo ? 'Sí' : 'No'}</TD>
                <TD className="text-right whitespace-nowrap">
                  <button className="text-[#16468E] hover:underline mr-3" onClick={() => { setEditar({ ...t }); setEmailOriginal(t.profile?.email ?? '') }}>Editar</button>
                  <button className="text-[#16468E] hover:underline mr-3" onClick={() => resetPass(t)}>Clave</button>
                  <button className="text-rose-600 hover:underline" onClick={() => eliminar(t)}>Eliminar</button>
                </TD>
              </TR>
            ))}
            {filas.length === 0 && <TR><TD className="text-slate-400">Sin registros</TD></TR>}
          </tbody>
        </Tabla>
      )}

      {/* Crear */}
      <Modal open={!!nuevo} onClose={() => setNuevo(null)} titulo="Nuevo tripulante" ancho="max-w-2xl">
        {nuevo && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo label="Nombre"><Input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></Campo>
            <Campo label="Contraseña"><Input value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} /></Campo>
            <Campo label="Correo" className="sm:col-span-2">
              <Input type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} placeholder="correo@cacsantabarbara.co" />
            </Campo>
            <Campo label="Identificación"><Input value={nuevo.identificacion} onChange={(e) => setNuevo({ ...nuevo, identificacion: e.target.value })} /></Campo>
            <Campo label="Tarjeta de conducción"><Input value={nuevo.tarjeta_conduccion} onChange={(e) => setNuevo({ ...nuevo, tarjeta_conduccion: e.target.value })} /></Campo>
            <Campo label="Categoría"><Input value={nuevo.categoria_licencia} onChange={(e) => setNuevo({ ...nuevo, categoria_licencia: e.target.value })} placeholder="p.ej. C2" /></Campo>
            <Campo label="Vencimiento licencia"><Input type="date" value={nuevo.fecha_vencimiento_licencia} onChange={(e) => setNuevo({ ...nuevo, fecha_vencimiento_licencia: e.target.value })} /></Campo>
            {err && <p className="text-sm text-rose-600 sm:col-span-2">{err}</p>}
            <div className="mt-2 flex justify-end gap-2 sm:col-span-2"><Boton variante="secundario" onClick={() => setNuevo(null)}>Cancelar</Boton><Boton onClick={crear}>Crear</Boton></div>
          </div>
        )}
      </Modal>

      {/* Editar */}
      <Modal open={!!editar} onClose={() => setEditar(null)} titulo={`Editar · ${editar?.profile?.email ?? ''}`} ancho="max-w-2xl">
        {editar && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo label="Nombre">
              <Input value={editar.profile?.nombre ?? ''}
                onChange={(e) => setEditar({ ...editar, profile: { ...(editar.profile ?? { email: '', activo: true }), nombre: e.target.value } })} />
            </Campo>
            <Campo label="Correo">
              <Input type="email" value={editar.profile?.email ?? ''}
                onChange={(e) => setEditar({ ...editar, profile: { ...(editar.profile ?? { nombre: '', activo: true }), email: e.target.value } })} />
            </Campo>
            <Campo label="Identificación"><Input value={editar.identificacion} onChange={(e) => setEditar({ ...editar, identificacion: e.target.value })} /></Campo>
            <Campo label="Tarjeta de conducción"><Input value={editar.tarjeta_conduccion ?? ''} onChange={(e) => setEditar({ ...editar, tarjeta_conduccion: e.target.value })} /></Campo>
            <Campo label="Categoría"><Input value={editar.categoria_licencia ?? ''} onChange={(e) => setEditar({ ...editar, categoria_licencia: e.target.value })} /></Campo>
            <Campo label="Vencimiento licencia"><Input type="date" value={editar.fecha_vencimiento_licencia ?? ''} onChange={(e) => setEditar({ ...editar, fecha_vencimiento_licencia: e.target.value })} /></Campo>
            <Campo label="Disponible (activo)">
              <Select value={editar.activo ? '1' : '0'} onChange={(e) => setEditar({ ...editar, activo: e.target.value === '1' })}>
                <option value="1">Sí</option><option value="0">No</option>
              </Select>
            </Campo>
            <Campo label="Acceso al sistema (login)">
              <Select value={editar.profile?.activo ? '1' : '0'}
                onChange={(e) => setEditar({ ...editar, profile: { ...(editar.profile ?? { nombre: '', email: '' }), activo: e.target.value === '1' } })}>
                <option value="1">Sí</option><option value="0">No</option>
              </Select>
            </Campo>
            {err && <p className="text-sm text-rose-600 sm:col-span-2">{err}</p>}
            <div className="mt-2 flex justify-end gap-2 sm:col-span-2"><Boton variante="secundario" onClick={() => setEditar(null)}>Cancelar</Boton><Boton onClick={guardarEdicion}>Guardar</Boton></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
