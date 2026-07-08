-- =====================================================================
-- MIC · Vehiculos, tripulantes y rodamiento
-- =====================================================================

create table if not exists public.vehiculos (
  id                          serial primary key,
  tipo_vehiculo_id            int references public.tipos_vehiculo(id),
  marca                       text not null default '',
  modelo                      text not null default '',
  placas                      text not null unique,
  matricula                   text,
  soat_vencimiento            date,
  seguro_vencimiento          date,
  tecnomecanica_vencimiento   date,
  propiedad                   text not null default 'geriater'
                               check (propiedad in ('geriater','alquilado')),
  activo                      boolean not null default true,
  created_at                  timestamptz not null default now()
);
create index if not exists idx_vehiculos_tipo on public.vehiculos(tipo_vehiculo_id);
create index if not exists idx_vehiculos_activo on public.vehiculos(activo);

-- Ficha extendida de tripulante, 1:1 con profiles (mismo id, sin FK adicional)
create table if not exists public.tripulantes (
  id                          uuid primary key references public.profiles(id) on delete cascade,
  identificacion              text not null unique,
  tarjeta_conduccion          text,
  categoria_licencia          text,
  fecha_vencimiento_licencia  date,
  activo                      boolean not null default true,
  created_at                  timestamptz not null default now()
);

-- Bitácora de turnos, independiente de solicitudes puntuales
create table if not exists public.rodamiento (
  id                      bigint generated always as identity primary key,
  vehiculo_id             int not null references public.vehiculos(id),
  tripulante_id           uuid not null references public.tripulantes(id),
  fecha_inicio_turno      timestamptz not null,
  fecha_fin_turno         timestamptz,
  kilometraje_inicial     numeric(10,1),
  kilometraje_final       numeric(10,1),
  combustible             text check (combustible in ('lleno','3/4','1/2','1/4','reserva')),
  condiciones             text,
  estado                  text not null default 'abierto' check (estado in ('abierto','cerrado')),
  created_at              timestamptz not null default now()
);
create index if not exists idx_rodamiento_vehiculo on public.rodamiento(vehiculo_id);
create index if not exists idx_rodamiento_tripulante on public.rodamiento(tripulante_id);
create index if not exists idx_rodamiento_estado on public.rodamiento(estado);

create table if not exists public.rodamiento_adjuntos (
  id               bigint generated always as identity primary key,
  rodamiento_id    bigint not null references public.rodamiento(id) on delete cascade,
  storage_path     text not null,
  nombre_original  text,
  tipo_mime        text,
  subido_por       uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);
create index if not exists idx_rod_adjuntos_rodamiento on public.rodamiento_adjuntos(rodamiento_id);

-- Configuración global (singleton) de colores del heatmap
create table if not exists public.heatmap_config (
  id               int primary key default 1 check (id = 1),
  colores          jsonb not null default '["#EAF0FA","#7FA0D6","#16468E","#0D2D6B"]'::jsonb,
  actualizado_por  uuid references public.profiles(id),
  updated_at       timestamptz not null default now()
);
insert into public.heatmap_config (id, colores)
  values (1, '["#EAF0FA","#7FA0D6","#16468E","#0D2D6B"]'::jsonb)
  on conflict (id) do nothing;
