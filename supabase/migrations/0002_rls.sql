-- =====================================================================
-- MIC · Políticas RLS
-- =====================================================================

-- Helpers (security definer para no recursar sobre RLS de profiles)
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and rol = 'administrador' and activo);
$$;

create or replace function public.es_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles
                where id = auth.uid() and rol in ('administrador','coordinador') and activo);
$$;

-- ---- profiles ----
alter table public.profiles enable row level security;

create policy "perfil: ver propio o gestor" on public.profiles
  for select using (id = auth.uid() or es_gestor());
create policy "perfil: actualizar propio" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "perfil: admin total" on public.profiles
  for all using (es_admin()) with check (es_admin());

-- ---- catálogos: lectura para autenticados, escritura solo admin ----
alter table public.areas enable row level security;
create policy "areas: lectura" on public.areas
  for select using (auth.role() = 'authenticated');
create policy "areas: admin escribe" on public.areas
  for all using (es_admin()) with check (es_admin());

alter table public.tipos_vehiculo enable row level security;
create policy "veh: lectura" on public.tipos_vehiculo
  for select using (auth.role() = 'authenticated');
create policy "veh: admin escribe" on public.tipos_vehiculo
  for all using (es_admin()) with check (es_admin());

-- ---- solicitudes ----
alter table public.solicitudes enable row level security;

create policy "sol: ver propias o gestor" on public.solicitudes
  for select using (solicitante_id = auth.uid() or es_gestor());

create policy "sol: crear propia" on public.solicitudes
  for insert with check (solicitante_id = auth.uid() or es_gestor());

-- el solicitante puede editar su solicitud mientras siga 'solicitada'
create policy "sol: editar propia pendiente" on public.solicitudes
  for update using (solicitante_id = auth.uid() and estado = 'solicitada')
  with check (solicitante_id = auth.uid());

-- gestor (coordinador/admin) puede gestionar cualquiera
create policy "sol: gestor actualiza" on public.solicitudes
  for update using (es_gestor()) with check (es_gestor());

create policy "sol: admin elimina" on public.solicitudes
  for delete using (es_admin());

-- ---- eventos ----
alter table public.solicitud_eventos enable row level security;
create policy "ev: ver si ve la solicitud" on public.solicitud_eventos
  for select using (
    exists (select 1 from public.solicitudes s
            where s.id = solicitud_id and (s.solicitante_id = auth.uid() or es_gestor()))
  );
create policy "ev: insertar autenticado" on public.solicitud_eventos
  for insert with check (auth.role() = 'authenticated');
