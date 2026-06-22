// Ilustraciones SVG por tipo de vehículo, en paleta institucional.
type Props = { tipo?: string | null; size?: number; className?: string }

const A = '#0D2D6B', B = '#16468E', G = '#94A3B8'

function norm(t?: string | null) {
  const s = (t ?? '').toLowerCase()
  if (s.includes('camioneta')) return 'camioneta'
  if (s.includes('moto')) return 'moto'
  if (s.includes('auto')) return 'automovil'
  return 'carro'
}

export default function IconoVehiculo({ tipo, size = 120, className = '' }: Props) {
  const k = norm(tipo)
  const common = { width: size, height: size * 0.62, viewBox: '0 0 200 124', className }
  if (k === 'moto') {
    return (
      <svg {...common} xmlns="http://www.w3.org/2000/svg">
        <circle cx="46" cy="92" r="22" fill="none" stroke={A} strokeWidth="7" />
        <circle cx="154" cy="92" r="22" fill="none" stroke={A} strokeWidth="7" />
        <path d="M46 92 L92 92 L112 58 L138 58" fill="none" stroke={B} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M92 92 L132 92 L154 92" fill="none" stroke={B} strokeWidth="7" strokeLinecap="round" />
        <path d="M104 58 L132 58 L140 70" fill="none" stroke={A} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="60" y="70" width="44" height="12" rx="6" fill={B} />
        <path d="M138 58 l16 -8" stroke={A} strokeWidth="7" strokeLinecap="round" />
      </svg>
    )
  }
  if (k === 'camioneta') {
    return (
      <svg {...common} xmlns="http://www.w3.org/2000/svg">
        <path d="M18 86 L18 52 Q18 44 26 44 L120 44 L150 64 L182 70 Q190 72 190 82 L190 86" fill={B} />
        <path d="M30 52 L72 52 L72 64 L30 64 Z" fill="#DBE6F7" />
        <path d="M84 52 L116 52 L140 64 L84 64 Z" fill="#DBE6F7" />
        <rect x="14" y="84" width="180" height="10" rx="5" fill={A} />
        <circle cx="58" cy="96" r="16" fill="#1e293b" /><circle cx="58" cy="96" r="7" fill={G} />
        <circle cx="150" cy="96" r="16" fill="#1e293b" /><circle cx="150" cy="96" r="7" fill={G} />
      </svg>
    )
  }
  // carro / automovil (sedán)
  return (
    <svg {...common} xmlns="http://www.w3.org/2000/svg">
      <path d="M16 88 L26 66 Q30 58 40 56 L70 50 Q82 38 104 38 L132 40 Q150 42 162 58 L176 66 Q188 70 188 82 L188 88" fill={B} />
      <path d="M62 54 L84 44 L102 44 L102 56 Z" fill="#DBE6F7" />
      <path d="M108 44 L128 45 Q140 48 150 58 L108 58 Z" fill="#DBE6F7" />
      <rect x="12" y="86" width="180" height="10" rx="5" fill={A} />
      <circle cx="58" cy="98" r="16" fill="#1e293b" /><circle cx="58" cy="98" r="7" fill={G} />
      <circle cx="146" cy="98" r="16" fill="#1e293b" /><circle cx="146" cy="98" r="7" fill={G} />
    </svg>
  )
}
