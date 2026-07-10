import { supabase } from './supabase'
import type { Solicitud } from './data'

// Invoca la Edge Function 'notificar' (Resend). No bloquea el flujo si falla.
type Evento = 'nueva' | 'cambio_estado' | 'asignada' | 'atendida' | 'no_atendida' | 'reasignada' | 'viaticos'

export async function notificar(evento: Evento, solicitud: Solicitud, extra?: { estado?: string; comentario?: string }) {
  try {
    await supabase.functions.invoke('notificar', { body: { evento, solicitud, ...extra } })
  } catch (e) {
    console.warn('No se pudo enviar notificación:', e)
  }
}
