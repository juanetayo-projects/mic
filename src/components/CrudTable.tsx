import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Boton, Input, Modal, Tabla, THead, TH, TR, TD, Spinner, Campo, Select } from './ui'

export type CampoDef = {
  key: string
  label: string
  tipo?: 'text' | 'number' | 'boolean' | 'select' | 'date'
  optionsTable?: string       // tabla FK
  optionLabel?: string        // columna a mostrar
  opcionesFijas?: { value: string; label: string }[]  // select sin FK (p.ej. valores de un CHECK)
  requerido?: boolean
  soloLectura?: boolean       // no editable (p.ej. id, created_at)
  ocultarEnTabla?: boolean
}

type Props = {
  tabla: string
  titulo: string
  campos: CampoDef[]
  orden?: string
  anchoModal?: string   // ancho del Modal de alta/edición (ver Modal.ancho); útil con muchos campos
}

export default function CrudTable({ tabla, titulo, campos, orden, anchoModal }: Props) {
  const [filas, setFilas] = useState<Record<string, any>[]>([])
  const [opciones, setOpciones] = useState<Record<string, { id: any; label: string }[]>>({})
  const [cargando, setCargando] = useState(true)
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Record<string, any> | null>(null)
  const [esNuevo, setEsNuevo] = useState(false)
  const [error, setError] = useState('')

  async function cargar() {
    setCargando(true)
    const { data } = await supabase.from(tabla).select('*').order(orden ?? campos[0].key)
    setFilas(data ?? [])
    // opciones FK
    const op: Record<string, { id: any; label: string }[]> = {}
    for (const c of campos.filter((x) => x.tipo === 'select' && x.optionsTable)) {
      const { data: o } = await supabase.from(c.optionsTable!).select('*').order(c.optionLabel ?? 'id')
      op[c.key] = (o ?? []).map((r: any) => ({ id: r.id, label: r[c.optionLabel ?? 'nombre'] }))
    }
    setOpciones(op)
    setCargando(false)
  }
  useEffect(() => { void cargar() }, [tabla])

  function abrirNuevo() {
    const base: Record<string, any> = {}
    campos.forEach((c) => { base[c.key] = c.tipo === 'boolean' ? true : '' })
    setEditando(base); setEsNuevo(true); setError('')
  }

  async function guardar() {
    if (!editando) return
    setError('')
    const payload: Record<string, any> = {}
    for (const c of campos) {
      if (c.soloLectura) continue
      let v = editando[c.key]
      if (c.tipo === 'number') v = v === '' ? null : Number(v)
      if (c.tipo === 'select' || c.tipo === 'date') v = v === '' ? null : v
      payload[c.key] = v
    }
    const q = esNuevo
      ? supabase.from(tabla).insert(payload)
      : supabase.from(tabla).update(payload).eq('id', editando.id)
    const { error } = await q
    if (error) { setError(error.message); return }
    setEditando(null); await cargar()
  }

  async function eliminar(id: any) {
    if (!confirm('¿Eliminar este registro?')) return
    const { error } = await supabase.from(tabla).delete().eq('id', id)
    if (error) { alert(error.message); return }
    await cargar()
  }

  const visibles = campos.filter((c) => !c.ocultarEnTabla)
  const filtradas = filas.filter((f) =>
    !busca || JSON.stringify(f).toLowerCase().includes(busca.toLowerCase()))

  function etiqueta(c: CampoDef, f: Record<string, any>) {
    if (c.tipo === 'boolean') return f[c.key] ? 'Sí' : 'No'
    if (c.tipo === 'select' && c.opcionesFijas) {
      return c.opcionesFijas.find((o) => o.value === f[c.key])?.label ?? '—'
    }
    if (c.tipo === 'select' && opciones[c.key]) {
      return opciones[c.key].find((o) => o.id === f[c.key])?.label ?? '—'
    }
    return f[c.key] ?? '—'
  }

  if (cargando) return <Spinner />
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Input placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} className="w-64" />
        <Boton onClick={abrirNuevo}>+ Nuevo</Boton>
      </div>
      <Tabla>
        <THead>
          <tr>{visibles.map((c) => <TH key={c.key}>{c.label}</TH>)}<TH className="text-right">Acciones</TH></tr>
        </THead>
        <tbody>
          {filtradas.map((f, i) => (
            <TR key={f.id} i={i}>
              {visibles.map((c) => <TD key={c.key}>{String(etiqueta(c, f))}</TD>)}
              <TD className="text-right whitespace-nowrap">
                <button className="text-[#16468E] hover:underline mr-3"
                  onClick={() => { setEditando({ ...f }); setEsNuevo(false); setError('') }}>Editar</button>
                <button className="text-rose-600 hover:underline" onClick={() => eliminar(f.id)}>Eliminar</button>
              </TD>
            </TR>
          ))}
          {filtradas.length === 0 && <TR><TD className="text-slate-400">Sin registros</TD></TR>}
        </tbody>
      </Tabla>

      <Modal open={!!editando} onClose={() => setEditando(null)} titulo={`${esNuevo ? 'Nuevo' : 'Editar'} · ${titulo}`} ancho={anchoModal ?? 'max-w-lg'}>
        {editando && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {campos.filter((c) => !c.soloLectura).map((c) => (
              <Campo key={c.key} label={c.label}>
                {c.tipo === 'boolean' ? (
                  <Select value={editando[c.key] ? '1' : '0'} onChange={(e) => setEditando({ ...editando, [c.key]: e.target.value === '1' })}>
                    <option value="1">Sí</option><option value="0">No</option>
                  </Select>
                ) : c.tipo === 'select' && c.opcionesFijas ? (
                  <Select value={editando[c.key] ?? ''} onChange={(e) => setEditando({ ...editando, [c.key]: e.target.value })}>
                    <option value="">— Seleccione —</option>
                    {c.opcionesFijas.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                ) : c.tipo === 'select' ? (
                  <Select value={editando[c.key] ?? ''} onChange={(e) => setEditando({ ...editando, [c.key]: e.target.value })}>
                    <option value="">— Seleccione —</option>
                    {(opciones[c.key] ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                ) : (
                  <Input type={c.tipo === 'number' ? 'number' : c.tipo === 'date' ? 'date' : 'text'}
                    value={editando[c.key] ?? ''} onChange={(e) => setEditando({ ...editando, [c.key]: e.target.value })} />
                )}
              </Campo>
            ))}
            {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <Boton variante="secundario" onClick={() => setEditando(null)}>Cancelar</Boton>
              <Boton onClick={guardar}>Guardar</Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
