// Edge Function: notificar
// Envía correos (Resend) en eventos: 'nueva' y 'cambio_estado'.
// Secrets requeridos: RESEND_API_KEY, RESEND_FROM, (opcional) MIC_ENCARGADO_EMAIL
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (s, b) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

const AZUL = '#0D2D6B', AZUL2 = '#16468E'

function plantilla(titulo, cuerpo) {
  return `<!doctype html><html><body style='margin:0;background:#f4f6fb;font-family:Segoe UI,Arial,sans-serif;color:#1e293b'>
  <div style='max-width:560px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.08)'>
    <div style='background:linear-gradient(135deg,${AZUL},${AZUL2});padding:22px 28px;color:#fff'>
      <div style='font-size:13px;opacity:.85;letter-spacing:1px'>CLINICA CAC SANTA BARBARA</div>
      <div style='font-size:20px;font-weight:700;margin-top:2px'>Movilidad Interna - MIC</div>
    </div>
    <div style='padding:26px 28px'>
      <h2 style='margin:0 0 14px;color:${AZUL};font-size:18px'>${titulo}</h2>
      ${cuerpo}
    </div>
    <div style='padding:14px 28px;background:#f1f5f9;color:#64748b;font-size:11px;text-align:center'>
      Mensaje automatico del sistema de Movilidad Interna. Por favor no responda este correo.
    </div>
  </div></body></html>`
}

function tablaDatos(s, area, veh) {
  const fila = (k, v) =>
    `<tr><td style='padding:6px 0;color:#64748b;width:42%'>${k}</td><td style='padding:6px 0;font-weight:600'>${v || '-'}</td></tr>`
  return `<table style='width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 16px'>
    ${fila('Codigo', s.codigo)}
    ${fila('Area / Proceso', area)}
    ${fila('Tipo de vehiculo', veh)}
    ${fila('Destino', s.destino)}
    ${fila('Personas', String(s.cantidad_personas))}
    ${fila('Fecha requerida', `${s.fecha_requerida ?? ''} ${s.hora_requerida ?? ''}`)}
    ${fila('Descripcion', s.descripcion)}
  </table>`
}

const COLORES = {
  solicitada: '#64748b', aprobada: '#10b981', programada: '#2563eb',
  realizada: '#8b5cf6', aplazada: '#f59e0b', rechazada: '#ef4444', cancelada: '#ef4444',
}
const badge = (estado) =>
  `<span style='display:inline-block;background:${COLORES[estado] ?? '#64748b'};color:#fff;border-radius:999px;padding:3px 12px;font-size:13px;text-transform:capitalize'>${estado}</span>`

async function enviar(from, to, subject, html, key) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })
  if (!r.ok) console.error('Resend error', r.status, await r.text())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const key = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('RESEND_FROM') ?? 'MIC <notificaciones@cacsantabarbara.co>'
    const encargado = Deno.env.get('MIC_ENCARGADO_EMAIL') ?? 'juan.etayo@cacsantabarbara.co'
    if (!key) return json(200, { ok: false, skipped: 'RESEND_API_KEY no configurado' })

    const admin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    const { evento, solicitud: s, estado, comentario } = await req.json()

    let area = '-', veh = '-', emailSolicitante = null
    if (s.area_id) area = (await admin.from('areas').select('nombre').eq('id', s.area_id).single()).data?.nombre ?? '-'
    if (s.tipo_vehiculo_id) veh = (await admin.from('tipos_vehiculo').select('nombre').eq('id', s.tipo_vehiculo_id).single()).data?.nombre ?? '-'
    if (s.solicitante_id) emailSolicitante = (await admin.from('profiles').select('email').eq('id', s.solicitante_id).single()).data?.email ?? null

    if (evento === 'nueva') {
      if (emailSolicitante)
        await enviar(from, emailSolicitante, `Solicitud ${s.codigo} registrada - MIC`,
          plantilla('Su solicitud fue registrada',
            `<p>Hemos recibido su solicitud de transporte interno. Conservela como evidencia.</p>${tablaDatos(s, area, veh)}<p>Sera notificado cuando el coordinador la gestione.</p>`), key)
      await enviar(from, encargado, `Nueva solicitud por aprobar: ${s.codigo} - MIC`,
        plantilla('Nueva solicitud por aprobar',
          `<p><b>${s.solicitante_nombre}</b> registro una nueva solicitud que requiere su gestion.</p>${tablaDatos(s, area, veh)}<p>Ingrese al sistema para aprobarla, aplazarla o rechazarla.</p>`), key)
    } else if (evento === 'cambio_estado') {
      if (emailSolicitante)
        await enviar(from, emailSolicitante, `Solicitud ${s.codigo}: ${estado} - MIC`,
          plantilla('Actualizacion de su solicitud',
            `<p>El estado de su solicitud <b>${s.codigo}</b> cambio a: ${badge(estado)}</p>${comentario ? `<p style='background:#f1f5f9;border-radius:8px;padding:10px 12px'><b>Comentario:</b> ${comentario}</p>` : ''}${tablaDatos(s, area, veh)}`), key)
    }
    return json(200, { ok: true })
  } catch (e) {
    return json(500, { error: String(e?.message ?? e) })
  }
})
