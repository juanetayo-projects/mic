# Estructura del proyecto · MIC

```
movilidad_interna/
├── .github/workflows/deploy.yml      Deploy automático a GitHub Pages
├── public/images/                    Logos institucionales (color y blanco)
├── scripts/
│   └── importar_historico.mjs        Importa el histórico del Excel a Supabase
├── src/
│   ├── components/
│   │   ├── ui.tsx                    Card, FilterBar, Modal, Tabla, Boton, EstadoBadge…
│   │   ├── CrudTable.tsx             Tabla CRUD genérica (catálogos)
│   │   └── Layout.tsx                Navegación lateral por rol
│   ├── lib/
│   │   ├── supabase.ts               Cliente Supabase
│   │   ├── auth.tsx                  AuthProvider + useAuth (carga perfil en 2º plano)
│   │   ├── data.ts                   Tipos, queries, estados y transiciones
│   │   ├── exportar.ts               Exportación Excel (ExcelJS) y PDF (pdfmake) con logo
│   │   └── notificar.ts              Invoca la Edge Function de correos
│   ├── pages/
│   │   ├── Login.tsx                 Ingreso / registro / recuperación
│   │   ├── Restablecer.tsx           Nueva contraseña (callback de recuperación)
│   │   ├── MisSolicitudes.tsx        Solicitudes propias + historial
│   │   ├── NuevaSolicitud.tsx        Formulario en una pantalla
│   │   ├── Gestion.tsx               Gestión de solicitudes (gestor)
│   │   ├── Dashboard.tsx             Métricas y gráficos
│   │   ├── Reportes.tsx              Filtros + exportación
│   │   └── admin/
│   │       ├── Usuarios.tsx          CRUD de usuarios (Edge Function)
│   │       ├── Areas.tsx             CRUD de áreas/procesos
│   │       └── Vehiculos.tsx         CRUD de tipos de vehículo
│   ├── App.tsx                       Rutas (HashRouter) + guard por rol
│   ├── main.tsx                      Entrada (Provider + Router)
│   └── index.css                     Tailwind v4 + paleta institucional
├── supabase/
│   ├── migrations/                   0001 esquema · 0002 RLS · 0003 seed · 0004 hardening
│   └── functions/
│       ├── admin-usuarios/index.ts   Alta/baja/reset de usuarios (solo admin)
│       └── notificar/index.ts        Correos Resend (HTML profesional)
├── docs/                             Documentación + Excel base (Excel gitignored por PII)
├── index.html · vite.config.ts · tsconfig.json · package.json
└── .env.local (gitignored) · .env.example
```

## Rutas de la aplicación

| Ruta | Acceso | Página |
|---|---|---|
| `/login`, `/restablecer` | público | Login / nueva contraseña |
| `/` | autenticado | Mis solicitudes |
| `/nueva` | autenticado | Nueva solicitud |
| `/gestion` | gestor | Gestión de solicitudes |
| `/dashboard` | gestor | Dashboard |
| `/reportes` | gestor | Reportes |
| `/admin/usuarios`, `/admin/areas`, `/admin/vehiculos` | admin | Catálogos y usuarios |
