import { ReactNode } from 'react'

// ---- Card de métrica con degradado / sombra / relieve ----
export function MetricCard({
  titulo, valor, icono, sub, color = 'azul',
}: {
  titulo: string; valor: ReactNode; icono?: ReactNode; sub?: string
  color?: 'azul' | 'verde' | 'ambar' | 'rojo' | 'morado' | 'cyan'
}) {
  const grad: Record<string, string> = {
    azul: 'from-[#0D2D6B] to-[#16468E]',
    verde: 'from-emerald-600 to-emerald-500',
    ambar: 'from-amber-500 to-amber-400',
    rojo: 'from-rose-600 to-rose-500',
    morado: 'from-violet-600 to-violet-500',
    cyan: 'from-cyan-600 to-cyan-500',
  }
  return (
    <div className={`rounded-2xl p-5 text-white shadow-lg ring-1 ring-black/5
                     bg-gradient-to-br ${grad[color]} transition hover:shadow-xl hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <span className="text-sm/5 font-medium opacity-90">{titulo}</span>
        {icono && <span className="text-2xl opacity-90">{icono}</span>}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{valor}</div>
      {sub && <div className="mt-1 text-xs opacity-80">{sub}</div>}
    </div>
  )
}

// ---- Encabezado de página ----
export function PageHeader({ titulo, subtitulo, acciones }:
  { titulo: string; subtitulo?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-[#0D2D6B]">{titulo}</h1>
        {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{acciones}</div>
    </div>
  )
}

// ---- Barra de filtros ----
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200
                    bg-white p-4 shadow-sm">
      {children}
    </div>
  )
}

export function Campo({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#16468E] focus:ring-2 focus:ring-[#16468E]/20'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} bg-white ${props.className ?? ''}`} />
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

// ---- Botones ----
export function Boton({ variante = 'primario', children, ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'secundario' | 'peligro' | 'ghost' }) {
  const v: Record<string, string> = {
    primario: 'bg-[#0D2D6B] text-white hover:bg-[#16468E]',
    secundario: 'bg-white text-[#0D2D6B] border border-[#0D2D6B] hover:bg-[#EAF0FA]',
    peligro: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }
  return (
    <button {...props}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium
                  transition disabled:opacity-50 ${v[variante]} ${props.className ?? ''}`}>
      {children}
    </button>
  )
}

// ---- Badge de estado ----
export function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    solicitada: 'bg-slate-100 text-slate-700 ring-slate-300',
    aprobada: 'bg-emerald-100 text-emerald-700 ring-emerald-300',
    programada: 'bg-blue-100 text-blue-700 ring-blue-300',
    realizada: 'bg-violet-100 text-violet-700 ring-violet-300',
    aplazada: 'bg-amber-100 text-amber-700 ring-amber-300',
    rechazada: 'bg-rose-100 text-rose-700 ring-rose-300',
    cancelada: 'bg-rose-100 text-rose-700 ring-rose-300',
    asignada: 'bg-blue-100 text-blue-700 ring-blue-300',
    atendida: 'bg-violet-100 text-violet-700 ring-violet-300',
    no_atendida: 'bg-rose-100 text-rose-700 ring-rose-300',
    abierto: 'bg-emerald-100 text-emerald-700 ring-emerald-300',
    cerrado: 'bg-slate-100 text-slate-700 ring-slate-300',
  }
  const cls = map[estado] ?? 'bg-slate-100 text-slate-700 ring-slate-300'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${cls}`}>
      {estado.replace('_', ' ')}
    </span>
  )
}

// ---- Modal reutilizable ----
export function Modal({ open, onClose, titulo, children, ancho = 'max-w-lg' }:
  { open: boolean; onClose: () => void; titulo?: string; children: ReactNode; ancho?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         onClick={onClose}>
      <div className={`w-full ${ancho} max-h-[90vh] overflow-auto rounded-2xl bg-white shadow-2xl`}
           onClick={(e) => e.stopPropagation()}>
        {titulo && (
          <div className="sticky top-0 flex items-center justify-between rounded-t-2xl
                          bg-gradient-to-r from-[#0D2D6B] to-[#16468E] px-5 py-3 text-white">
            <span className="font-semibold">{titulo}</span>
            <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ---- Tabla con relieve, sombras y filas impares ----
export function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-md">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-gradient-to-r from-[#0D2D6B] to-[#16468E] text-left text-white">
      {children}
    </thead>
  )
}
export function TH({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 font-semibold whitespace-nowrap ${className}`}>{children}</th>
}
export function TR({ children, i = 0 }: { children: ReactNode; i?: number }) {
  return <tr className={`${i % 2 ? 'bg-[#F6F8FC]' : 'bg-white'} hover:bg-[#EAF0FA] border-t border-slate-100`}>{children}</tr>
}
export function TD({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>
}

export function Spinner({ texto = 'Cargando…' }: { texto?: string }) {
  return <div className="p-8 text-center text-slate-500">{texto}</div>
}
