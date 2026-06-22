# Modelo de datos · MIC

Proyecto Supabase **`mic`** · ref **`mrubzgjnzshwzcqkutga`** · región `us-east-1`.
URL: `https://mrubzgjnzshwzcqkutga.supabase.co`

## Tablas

### `areas` (catálogo de procesos/áreas)
| Columna | Tipo | Notas |
|---|---|---|
| id | serial PK | |
| nombre | text unique | |
| activo | boolean | default true |

### `tipos_vehiculo` (catálogo)
`id` serial PK · `nombre` text unique · `activo` boolean. Seed: Carro, Camioneta, Automóvil, Moto.

### `profiles` (1:1 con `auth.users`)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | FK a `auth.users` (cascade) |
| email | text | |
| nombre | text | |
| rol | text | `administrador` \| `coordinador` \| `solicitante` |
| area_id | int | FK `areas` (opcional) |
| activo | boolean | default true |

### `solicitudes`
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint identity PK | |
| codigo | text unique | `MIC-AAAA-####` (trigger) |
| solicitante_id | uuid | FK `profiles` (null en histórico) |
| solicitante_nombre | text | snapshot |
| area_id | int | FK `areas` |
| tipo_vehiculo_id | int | FK `tipos_vehiculo` |
| destino | text | |
| descripcion | text | |
| cantidad_personas | int | |
| fecha_requerida | date | |
| hora_requerida / hora_retorno | text | |
| observaciones | text | del solicitante |
| estado | text | ver máquina de estados |
| fecha_programada | date | gestión |
| respuesta | text | comentario del gestor |
| observaciones_geriater | text | gestión (proveedor) |
| consecutivo_talonario | text | gestión (taxis) |
| gestionado_por | uuid | FK `profiles` |
| fecha_gestion | timestamptz | |
| fecha_solicitud | date | |
| es_historico | boolean | true para importados del Excel |
| created_at | timestamptz | |

### `solicitud_eventos` (bitácora / trazabilidad)
`id` · `solicitud_id` FK · `estado` · `comentario` · `actor_id` · `actor_nombre` · `created_at`.

## Máquina de estados

```
solicitada → aprobada | aplazada | rechazada | cancelada
aprobada   → programada | realizada | cancelada
aplazada   → aprobada | rechazada | cancelada
programada → realizada | cancelada
rechazada / realizada / cancelada = estados finales
```
Cada transición registra un evento y dispara un correo al solicitante.

## RLS (resumen)

- **profiles:** cada quien ve su perfil; gestor (admin/coordinador) ve todos; admin total.
- **areas / tipos_vehiculo:** lectura autenticada; escritura solo admin.
- **solicitudes:** el solicitante ve/crea/edita las suyas (solo mientras estén
  `solicitada`); el gestor ve y actualiza todas; el admin elimina.
- **solicitud_eventos:** visible si se puede ver la solicitud; inserción por autenticados.
- Helpers `es_admin()` / `es_gestor()` (SECURITY DEFINER, search_path fijo).

## Alta de usuarios

- Trigger `handle_new_user` valida dominio `@cacsantabarbara.co` y crea el perfil
  con rol `solicitante`.
- Creación administrativa (con rol/área) vía Edge Function **`admin-usuarios`**.

## Importación del histórico

442 registros desde `Solicitud servicios MIC.xlsx` (`es_historico = true`),
normalizando áreas, tipos de vehículo y estados. Script reutilizable:
`scripts/importar_historico.mjs` (`node --env-file=.env.local scripts/importar_historico.mjs`).
