# Super Prompt consolidado · MIC (Movilidad Interna Clínica)

Prompt de referencia para reconstruir o evolucionar la aplicación. Consolida el
requerimiento original y las decisiones tomadas durante el desarrollo.

## Objetivo

App SaaS para gestionar **solicitudes de transporte interno** de la Clínica CAC
Santa Bárbara. Un colaborador solicita transporte; el encargado del MIC la
gestiona (aprobar/aplazar/rechazar/programar/realizar). Cada paso notifica por
correo. Incluye histórico, dashboard, filtros, reportes exportables y CRUD.

## Decisiones acordadas

- **Repo y proyecto Supabase:** `mic` (el prompt original decía "cambiodeturnos",
  que ya existía; se renombró para no sobrescribir esa app).
- **Aprobador inicial:** el **administrador** (`juan.etayo@cacsantabarbara.co`);
  el usuario `coordinador` se creará tras validar la app.
- **Registro:** auto-registro **solo con correo `@cacsantabarbara.co`**,
  activación por enlace de correo, rol inicial `solicitante`.
- **Branding:** azul `#0D2D6B` / contraste `#16468E`, logos `logo_cacsb2.png`
  (color) y `logo_cacsb_blanc.png` (blanco).

## Stack

React 19 + Vite + TS + Tailwind v4 · Supabase (Postgres + Auth + RLS + Edge
Functions) · Recharts · ExcelJS + pdfmake · Resend · GitHub Pages (HashRouter,
`base: '/mic/'`).

## Datos (del Excel base, 15 columnas)

Fecha, Proceso/área, Nombre solicitante, Tipo de vehículo, Destino, Descripción,
Cantidad de personas, Fecha/hora requerida, Hora retorno, Estado (gestión),
Respuesta, Observaciones, Observaciones GERIATER, Consecutivo talonario de taxis.
Datos sucios → normalizados a catálogos (áreas, vehículos) y a una máquina de
estados. 442 registros históricos importados.

## Roles

- **solicitante:** crea y ve sus solicitudes con estado e historial.
- **coordinador:** gestiona todas; dashboard; reportes.
- **administrador:** todo + usuarios + catálogos.

## Máquina de estados

`solicitada → aprobada | aplazada | rechazada | cancelada`;
`aprobada → programada | realizada | cancelada`;
`aplazada → aprobada | rechazada | cancelada`;
`programada → realizada | cancelada`. Cada transición envía correo al solicitante.

## Requisitos funcionales

1. Login + auto-registro restringido + recuperación de contraseña (modelo de
   "cambiodeturnos").
2. Formulario de solicitud en **una sola pantalla**, con código `MIC-AAAA-####`,
   campo de observaciones. Confirmación por correo HTML con el ID como evidencia.
3. Notificación al encargado de cada nueva solicitud.
4. Gestión por el coordinador con comentario; correo al solicitante en cada estado.
5. Carga del histórico desde el Excel.
6. Filtros: estado, área, vehículo, año, mes, texto.
7. Cards de métricas con color/sombra/relieve; gráficos; tablas con relieve y
   filas alternas (estilo Odoo).
8. CRUD en todas las tablas (catálogos y solicitudes).
9. Reportes exportables a Excel y PDF con título y logo.
10. Despliegue inicial en GitHub Pages.
11. Usuario administrador inicial sembrado.

## Infraestructura

- Repo `juanetayo-projects/mic` · Pages vía Actions.
- Supabase `mrubzgjnzshwzcqkutga` (us-east-1). RLS en todas las tablas.
- Edge Functions `admin-usuarios` y `notificar`.
- Resend con key `notificacionturnos` (pendiente de configurar; ver DESPLIEGUE.md).

## Cambios surgidos durante el desarrollo

- Renombrado de `cambiodeturnos` → `mic` (conflicto con app existente).
- El "estado" estaba en la columna rotulada como fecha de programación; se
  reinterpretó como `estado`.
- Filtrado de 556 filas en blanco arrastradas en el Excel (quedaron 442 reales).
- Acotación de fechas con seriales fuera de rango.
- Hardening de funciones (search_path fijo, revocación de EXECUTE del trigger).
- Exportación PDF mediante `getBlob` + descarga propia (más fiable que `download()`).
