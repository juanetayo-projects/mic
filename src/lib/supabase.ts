import { createClient, FunctionsHttpError } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  console.warn('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, anon)

// supabase-js no expone el mensaje de error real de una Edge Function en `data`
// cuando la respuesta es non-2xx (deja `data` en null y sólo da un mensaje genérico
// en `error.message`); hay que leerlo del Response crudo en `error.context`.
export async function invocarFuncion<T = any>(nombre: string, body: unknown): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(nombre, { body })
  if (error) {
    let msg = error.message
    if (error instanceof FunctionsHttpError) {
      try {
        const cuerpo = await error.context.json()
        if (cuerpo?.error) msg = cuerpo.error
      } catch { /* la respuesta no traía JSON */ }
    }
    return { data: null, error: msg }
  }
  if ((data as any)?.error) return { data: null, error: (data as any).error }
  return { data, error: null }
}
