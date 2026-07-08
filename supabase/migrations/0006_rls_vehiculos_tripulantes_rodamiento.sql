create or replace function public.es_tripulante() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and rol = 'tripulante' and activo);
$$;

alter table public.vehiculos enable row level security;
create policy "veh_flota: lectura autenticados" on public.vehiculos
  for select using (auth.role() = 'authenticated');
create policy "veh_flota: admin escribe" on public.vehiculos
  for all using (es_admin()) with check (es_admin());

alter table public.tripulantes enable row level security;
create policy "trip: ver propio o gestor" on public.tripulantes
  for select using (id = auth.uid() or es_gestor());
create policy "trip: admin escribe" on public.tripulantes
  for all using (es_admin()) with check (es_admin());

alter table public.rodamiento enable row level security;
create policy "rod: ver propio o gestor" on public.rodamiento
  for select using (tripulante_id = auth.uid() or es_gestor());
create policy "rod: crear propio o gestor" on public.rodamiento
  for insert with check (tripulante_id = auth.uid() or es_gestor());
create policy "rod: actualizar propio o gestor" on public.rodamiento
  for update using (tripulante_id = auth.uid() or es_gestor())
  with check (tripulante_id = auth.uid() or es_gestor());
create policy "rod: admin elimina" on public.rodamiento
  for delete using (es_admin());

alter table public.rodamiento_adjuntos enable row level security;
create policy "rod_adj: ver si ve el rodamiento" on public.rodamiento_adjuntos
  for select using (
    exists (select 1 from public.rodamiento r
            where r.id = rodamiento_id and (r.tripulante_id = auth.uid() or es_gestor()))
  );
create policy "rod_adj: insertar si es dueno del turno o gestor" on public.rodamiento_adjuntos
  for insert with check (
    exists (select 1 from public.rodamiento r
            where r.id = rodamiento_id and (r.tripulante_id = auth.uid() or es_gestor()))
  );
create policy "rod_adj: admin elimina" on public.rodamiento_adjuntos
  for delete using (es_admin());

alter table public.heatmap_config enable row level security;
create policy "heatmap_config: lectura autenticados" on public.heatmap_config
  for select using (auth.role() = 'authenticated');
create policy "heatmap_config: admin escribe" on public.heatmap_config
  for update using (es_admin()) with check (es_admin());

drop policy if exists "sol: ver propias o gestor" on public.solicitudes;
create policy "sol: ver propias, asignadas o gestor" on public.solicitudes
  for select using (
    solicitante_id = auth.uid() or tripulante_id = auth.uid() or es_gestor()
  );
create policy "sol: tripulante atiende su asignada" on public.solicitudes
  for update using (tripulante_id = auth.uid() and estado = 'asignada')
  with check (tripulante_id = auth.uid());
