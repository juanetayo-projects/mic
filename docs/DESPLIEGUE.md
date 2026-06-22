# Despliegue y configuración · MIC

## Infraestructura

| Recurso | Valor |
|---|---|
| Repositorio | `juanetayo-projects/mic` (público) |
| App | https://juanetayo-projects.github.io/mic/ |
| Supabase proyecto | `mic` · ref `mrubzgjnzshwzcqkutga` · us-east-1 |
| Supabase URL | https://mrubzgjnzshwzcqkutga.supabase.co |
| Org Supabase | `azwkasydxdtlseetytcf` (costo ~US$10/mes) |

## Variables de entorno

`.env.local` (local, **no** va al repo):
```
VITE_SUPABASE_URL=https://mrubzgjnzshwzcqkutga.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Secrets del repo (para el build de GitHub Actions):
```bash
gh secret set VITE_SUPABASE_URL  --repo juanetayo-projects/mic --body "https://mrubzgjnzshwzcqkutga.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --repo juanetayo-projects/mic --body "<anon key>"
```

## GitHub Pages

Deploy automático vía `.github/workflows/deploy.yml` al hacer push a `main`.
Vite usa `base: '/mic/'` y la app usa `HashRouter` (compatible con Pages).

> Si los secrets se configuran **después** del primer push, re-dispare el
> workflow para que la URL real quede incrustada:
> `gh workflow run deploy.yml --repo juanetayo-projects/mic`.

## Edge Functions (desplegadas)

- **`admin-usuarios`** — alta/baja/reset de usuarios (solo admin, usa service_role).
- **`notificar`** — correos Resend en eventos `nueva` y `cambio_estado`.

## Resend (PENDIENTE de configurar por el usuario)

La Edge Function `notificar` queda desplegada pero **no enviará correos** hasta
configurar los secrets de la función en Supabase. El dominio `cacsantabarbara.co`
ya está verificado en Resend (de otros proyectos).

1. Crear la API key en Resend con el nombre **`notificacionturnos`**.
2. Configurar los secrets de Edge Functions (Dashboard → Project Settings →
   Edge Functions → Secrets, o CLI):
   ```
   RESEND_API_KEY      = re_xxx (la key notificacionturnos)
   RESEND_FROM         = MIC <notificaciones@cacsantabarbara.co>
   MIC_ENCARGADO_EMAIL = correo del encargado del MIC (hoy: juan.etayo@cacsantabarbara.co)
   ```
3. Sin esta configuración, la app funciona igual; las notificaciones simplemente
   se omiten (no bloquean el flujo).

## Correo de activación / recuperación (Supabase Auth)

El enlace de activación de cuenta y el de recuperación de contraseña los envía
**Supabase Auth**. Para producción conviene configurar SMTP propio (puede ser el
de Resend) en Dashboard → Authentication → SMTP, y añadir a **URL Configuration**:
- Site URL: `https://juanetayo-projects.github.io/mic/`
- Redirect URLs: `https://juanetayo-projects.github.io/mic/**`

## Pendientes recomendados

- Habilitar **Leaked Password Protection** (Auth → Policies) — advisor de seguridad.
- Configurar Resend (arriba) para activar las notificaciones.
- Code-splitting opcional del bundle (pdfmake/exceljs ya van por import dinámico).
