# MIC · Movilidad Interna Clínica

Aplicación SaaS para la **gestión de solicitudes de transporte interno** de la
Clínica CAC Santa Bárbara. Los colaboradores registran solicitudes de transporte;
el encargado del MIC las aprueba, aplaza, rechaza, programa o marca como
realizadas, con notificación por correo en cada paso.

- **App (producción):** https://juanetayo-projects.github.io/mic/
- **Repositorio:** https://github.com/juanetayo-projects/mic
- **Código fuente:** `C:\Users\Juan Carlos Etayo\movilidad_interna`

## Stack

React 19 + Vite + TypeScript + Tailwind CSS v4 · Supabase (Postgres + Auth + RLS +
Edge Functions) · Recharts · ExcelJS + pdfmake · Resend · GitHub Pages.

## Roles

| Rol | Permisos |
|-----|----------|
| **solicitante** | Crea solicitudes y ve solo las suyas con su estado. |
| **coordinador** | Gestiona todas las solicitudes (aprobar/aplazar/rechazar/programar/realizar), dashboard, reportes. |
| **administrador** | Todo lo anterior + gestión de usuarios y catálogos (áreas, vehículos). |

> **Estado inicial:** el **administrador** (`juan.etayo@cacsantabarbara.co`) es
> también el aprobador. Cuando se valide la app, se creará el usuario
> `coordinador` desde el módulo de Usuarios.

## Funcionalidades

- Login institucional con **auto-registro restringido a `@cacsantabarbara.co`**
  (activación por enlace de correo) y **recuperación de contraseña**.
- Formulario de solicitud en **una sola pantalla** (código autogenerado `MIC-AAAA-####`).
- **Mis solicitudes** con estado e historial de cambios.
- **Gestión** con máquina de estados y campos de coordinación.
- **Dashboard** tipo Odoo: cards de métricas con color, gráficos (línea, barras,
  pastel) y tablas con relieve y filas alternas.
- **Filtros** por estado, área, vehículo, año, mes y texto.
- **Reportes** exportables a **Excel y PDF** con título y logo institucional.
- **CRUD** completo en todas las tablas de catálogo y solicitudes.
- **Correos** (Resend) de confirmación al solicitar y en cada cambio de estado;
  aviso al encargado por nuevas solicitudes.
- **Histórico** importado desde `Solicitud servicios MIC.xlsx` (442 registros).

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # y complete las credenciales (ver docs/DESPLIEGUE.md)
npm run dev                  # http://localhost:5181/mic/
npm run build                # build de producción
```

## Documentación

- [docs/SUPER_PROMPT.md](docs/SUPER_PROMPT.md) — prompt consolidado del proyecto.
- [docs/MODELO_DATOS.md](docs/MODELO_DATOS.md) — esquema, RLS y máquina de estados.
- [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md) — estructura de carpetas y archivos.
- [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) — credenciales, secrets, Resend y Pages.
