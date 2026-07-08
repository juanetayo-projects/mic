insert into storage.buckets (id, name, public)
values ('rodamiento-adjuntos', 'rodamiento-adjuntos', false)
on conflict (id) do nothing;

create policy "rod_adj storage: lectura propia o gestor" on storage.objects
  for select using (
    bucket_id = 'rodamiento-adjuntos' and (
      es_gestor() or exists (
        select 1 from public.rodamiento r
        where r.id::text = (storage.foldername(name))[1] and r.tripulante_id = auth.uid()
      )
    )
  );

create policy "rod_adj storage: insertar propia o gestor" on storage.objects
  for insert with check (
    bucket_id = 'rodamiento-adjuntos' and (
      es_gestor() or exists (
        select 1 from public.rodamiento r
        where r.id::text = (storage.foldername(name))[1] and r.tripulante_id = auth.uid()
      )
    )
  );

create policy "rod_adj storage: eliminar admin" on storage.objects
  for delete using (bucket_id = 'rodamiento-adjuntos' and es_admin());
