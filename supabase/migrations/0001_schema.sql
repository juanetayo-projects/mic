-- =====================================================================
-- MIC · Movilidad Interna Clínica — Esquema base
-- =====================================================================

-- ---- Catálogos ----
create table if not exists public.areas (
  id          serial primary key,
  nombre      text not null unique,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.tipos_vehiculo (
  id          serial primary key,
  nombre      text not null unique,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---- Perfiles (1:1 con auth.users) ----
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  nombre      text not null default '',
  rol         text not null default 'solicitante'
              check (rol in ('administrador','coordinador','solicitante')),
  area_id     int references public.areas(id),
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---- Solicitudes ----
create sequence if not exists public.mic_codigo_seq;

create table if not exists public.solicitudes (
  id                     bigint generated always as identity primary key,
  codigo                 text unique,
  solicitante_id         uuid references public.profiles(id),
  solicitante_nombre     text not null,
  area_id                int references public.areas(id),
  tipo_vehiculo_id       int references public.tipos_vehiculo(id),
  destino                text not null default '',
  descripcion            text not null default '',
  cantidad_personas      int not null default 1,
  fecha_requerida        date,
  hora_requerida         text,
  hora_retorno           text,
  observaciones          text,          -- del solicitante
  estado                 text not null default 'solicitada'
                         check (estado in ('solicitada','aprobada','aplazada',
                                           'rechazada','programada','realizada','cancelada')),
  -- campos de gestión (coordinador)
  fecha_programada       date,
  respuesta              text,          -- comentario del gestor en la última transición
  observaciones_geriater text,
  consecutivo_talonario  text,
  gestionado_por         uuid references public.profiles(id),
  fecha_gestion          timestamptz,
  -- trazabilidad
  fecha_solicitud        date not null default current_date,
  es_historico           boolean not null default false,
  created_at             timestamptz not null default now()
);

create index if not exists idx_solicitudes_solicitante on public.solicitudes(solicitante_id);
create index if not exists idx_solicitudes_estado on public.solicitudes(estado);
create index if not exists idx_solicitudes_area on public.solicitudes(area_id);
create index if not exists idx_solicitudes_fecha on public.solicitudes(fecha_solicitud);

-- ---- Bitácora de eventos / cambios de estado ----
create table if not exists public.solicitud_eventos (
  id            bigint generated always as identity primary key,
  solicitud_id  bigint not null references public.solicitudes(id) on delete cascade,
  estado        text not null,
  comentario    text,
  actor_id      uuid references public.profiles(id),
  actor_nombre  text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_eventos_solicitud on public.solicitud_eventos(solicitud_id);

-- ---- Generación de código MIC-AAAA-#### ----
create or replace function public.set_codigo_solicitud()
returns trigger language plpgsql as $$
begin
  if new.codigo is null then
    new.codigo := 'MIC-' || to_char(coalesce(new.fecha_solicitud, current_date), 'YYYY')
                  || '-' || lpad(nextval('public.mic_codigo_seq')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_codigo on public.solicitudes;
create trigger trg_codigo before insert on public.solicitudes
  for each row execute function public.set_codigo_solicitud();

-- ---- Alta de usuario: restringe dominio y crea perfil ----
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or lower(new.email) not like '%@cacsantabarbara.co' then
    raise exception 'Solo se permite el registro con correo institucional @cacsantabarbara.co';
  end if;
  insert into public.profiles (id, email, nombre, rol)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
          'solicitante')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
