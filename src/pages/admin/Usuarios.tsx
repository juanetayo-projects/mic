import { useEffect, useState } from 'react'
import { supabase, invocarFuncion } from '../../lib/supabase'
import { listarAreas, Area } from '../../lib/data'
import { PageHeader, Boton, Input, Select, Campo, Modal, Tabla, THead, TH, TR, TD, Spinner } from '../../components/ui'

type Perfil = { id: string; email: string; nombre: string; rol: string; area_id: number | null; activo: boolean }

export default function Usuarios() {
  const [filas, setFilas] = useState<Perfil[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [cargando, setCargando] = useState(true)
  const [nuevo, setNuevo] = useState<{ email: string; nombre: string; password: string; rol: string; area_id: string } | null>(null)
  const [editar, setEditar] = useState<Perfil | null>(null)
  const [emailOriginal, setEmailOriginal] = useState('')
  const [resetPara, setResetPara] = useState<Perfil | null>(null)
  const [nuevaClave, setNuevaClave] = useState('')
  const [confirmarClave, setConfirmarClave] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function cargar() {
    setCargando(true)
    const { data } = await supabase.from('profiles').select('*').order('nombre')
    setFilas(data ?? []); setCargando(false)
  }
  useEffect(() => { void cargar(); void listarAreas().then(setAreas) }, [])

  async function invocar(body: any) {
    setErr(''); setMsg('')
    const { error } = await invocarFuncion('admin-usuarios', body)
    if (error) { setErr(error); return false }
    return true
  }

  async function crear() {
    if (!nuevo) return
    const ok = await invocar({
      accion: 'crear', email: nuevo.email, password: nuevo.password, nombre: nuevo.nombre,
      rol: nuevo.rol, area_id: nuevo.area_id ? Number(nuevo.area_id) : null,
    })
    if (ok) { setMsg('Usuario creado.'); setNuevo(null); await cargar() }
  }

  async function guardarEdicion() {
    if (!editar) return
    setErr(''); setMsg('')
    if (editar.email !== emailOriginal) {
      const ok = await invocar({ accion: 'actualizarEmail', id: editar.id, email: editar.email })
      if (!ok) return
    }
    // rol/área/estado se editan directo en profiles (RLS admin)
    const { error } = await supabase.from('profiles')
      .update({ rol: editar.rol, area_id: editar.area_id, activo: editar.activo, nombre: editar.nombre })
      .eq('id', editar.id)
    if (error) { setErr(error.message); return }
    setEditar(null); await cargar()
  }

  function abrirReset(p: Perfil) {
    setResetPara(p); setNuevaClave(''); setConfirmarClave(''); setErr(''); setMsg('')
  }
  async function confirmarReset() {
    if (!resetPara || !nuevaClave || nuevaClave !== confirmarClave) return
    if (await invocar({ accion: 'reset', id: resetPara.id, password: nuevaClave })) {
      setMsg('Contraseña actualizada.'); setResetPara(null)
    }
  }

  async function eliminar(p: Perfil) {
    if (!confirm(`¿Eliminar al usuario ${p.email}?`)) return
    if (await invocar({ accion: 'eliminar', id: p.id })) { setMsg('Usuario eliminado.'); await cargar() }
  }

  const areaNom = (id: number | null) => areas.find((a) => a.id === id)?.nombre ?? '—'

  return (
    <div>
      <PageHeader titulo="Usuarios" subtitulo="Gestión de cuentas y roles"
        acciones={<Boton onClick={() => setNuevo({ email: '', nombre: '', password: '', rol: 'solicitante', area_id: '' })}>+ Nuevo usuario</Boton>} />

      {msg && <p className="mb-3 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}

      {cargando ? <Spinner /> : (
        <Tabla>
          <THead><tr>
            <TH>Nombre</TH><TH>Correo</TH><TH>Rol</TH><TH>Área</TH><TH>Activo</TH><TH className="text-right">Acciones</TH>
          </tr></THead>
          <tbody>
            {filas.map((p, i) => (
              <TR key={p.id} i={i}>
                <TD>{p.nombre}</TD>
                <TD>{p.email}</TD>
                <TD className="capitalize">{p.rol}</TD>
                <TD>{areaNom(p.area_id)}</TD>
                <TD>{p.activo ? 'Sí' : 'No'}</TD>
                <TD className="text-right whitespace-nowrap">
                  <button className="text-[#16468E] hover:underline mr-3" onClick={() => { setEditar({ ...p }); setEmailOriginal(p.email) }}>Editar</button>
                  <button className="text-[#16468E] hover:underline mr-3" onClick={() => abrirReset(p)}>Clave</button>
                  <button className="text-rose-600 hover:underline" onClick={() => eliminar(p)}>Eliminar</button>
                </TD>
              </TR>
            ))}
          </tbody>
        </Tabla>
      )}

      {/* Crear */}
      <Modal open={!!nuevo} onClose={() => setNuevo(null)} titulo="Nuevo usuario">
        {nuevo && (
          <div className="flex flex-col gap-3">
            <Campo label="Nombre"><Input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></Campo>
            <Campo label="Correo"><Input type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} placeholder="correo@cacsantabarbara.co" /></Campo>
            <Campo label="Contraseña"><Input value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} /></Campo>
            <Campo label="Rol">
              <Select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>
                <option value="solicitante">Solicitante</option><option value="coordinador">Coordinador</option>
                <option value="coordinador_administrativo">Coordinador administrativo</option>
                <option value="administrador">Administrador</option>
              </Select>
            </Campo>
            <Campo label="Área (opcional)">
              <Select value={nuevo.area_id} onChange={(e) => setNuevo({ ...nuevo, area_id: e.target.value })}>
                <option value="">— Ninguna —</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </Select>
            </Campo>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <div className="flex justify-end gap-2"><Boton variante="secundario" onClick={() => setNuevo(null)}>Cancelar</Boton><Boton onClick={crear}>Crear</Boton></div>
          </div>
        )}
      </Modal>

      {/* Editar */}
      <Modal open={!!editar} onClose={() => setEditar(null)} titulo={`Editar · ${editar?.email ?? ''}`}>
        {editar && (
          <div className="flex flex-col gap-3">
            <Campo label="Nombre"><Input value={editar.nombre} onChange={(e) => setEditar({ ...editar, nombre: e.target.value })} /></Campo>
            <Campo label="Correo"><Input type="email" value={editar.email} onChange={(e) => setEditar({ ...editar, email: e.target.value })} /></Campo>
            <Campo label="Rol">
              <Select value={editar.rol} onChange={(e) => setEditar({ ...editar, rol: e.target.value })}>
                <option value="solicitante">Solicitante</option><option value="coordinador">Coordinador</option>
                <option value="coordinador_administrativo">Coordinador administrativo</option>
                <option value="administrador">Administrador</option>
              </Select>
            </Campo>
            <Campo label="Área">
              <Select value={editar.area_id ?? ''} onChange={(e) => setEditar({ ...editar, area_id: e.target.value ? Number(e.target.value) : null })}>
                <option value="">— Ninguna —</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </Select>
            </Campo>
            <Campo label="Activo">
              <Select value={editar.activo ? '1' : '0'} onChange={(e) => setEditar({ ...editar, activo: e.target.value === '1' })}>
                <option value="1">Sí</option><option value="0">No</option>
              </Select>
            </Campo>
            <div className="flex justify-end gap-2"><Boton variante="secundario" onClick={() => setEditar(null)}>Cancelar</Boton><Boton onClick={guardarEdicion}>Guardar</Boton></div>
          </div>
        )}
      </Modal>

      {/* Nueva contraseña */}
      <Modal open={!!resetPara} onClose={() => setResetPara(null)} titulo={`Nueva contraseña · ${resetPara?.email ?? ''}`}>
        {resetPara && (
          <div className="flex flex-col gap-3">
            <Campo label="Nueva contraseña">
              <Input type="password" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} autoFocus />
            </Campo>
            <Campo label="Confirmar contraseña">
              <Input type="password" value={confirmarClave} onChange={(e) => setConfirmarClave(e.target.value)} />
            </Campo>
            {confirmarClave && nuevaClave !== confirmarClave && <p className="text-sm text-rose-600">Las contraseñas no coinciden.</p>}
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" onClick={() => setResetPara(null)}>Cancelar</Boton>
              <Boton onClick={confirmarReset} disabled={!nuevaClave || nuevaClave !== confirmarClave}>Actualizar</Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
