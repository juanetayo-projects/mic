alter table public.profiles drop constraint if exists profiles_rol_check;
alter table public.profiles add constraint profiles_rol_check
  check (rol in ('administrador','coordinador','solicitante','tripulante'));

alter table public.solicitudes drop constraint if exists solicitudes_estado_check;
alter table public.solicitudes add constraint solicitudes_estado_check
  check (estado in (
    'solicitada','aprobada','aplazada','rechazada','cancelada',
    'programada','realizada',
    'asignada','atendida','no_atendida'
  ));

alter table public.solicitudes
  add column if not exists vehiculo_id bigint references public.vehiculos(id),
  add column if not exists tripulante_id uuid references public.tripulantes(id),
  add column if not exists tripulante_nombre text,
  add column if not exists tripulante_reasignado_de uuid references public.tripulantes(id),
  add column if not exists fecha_asignacion timestamptz,
  add column if not exists fecha_hora_inicio_servicio timestamptz,
  add column if not exists fecha_hora_fin_servicio timestamptz,
  add column if not exists observaciones_atencion text,
  add column if not exists motivo_no_atendida text;

create index if not exists idx_solicitudes_tripulante on public.solicitudes(tripulante_id);
create index if not exists idx_solicitudes_vehiculo on public.solicitudes(vehiculo_id);
