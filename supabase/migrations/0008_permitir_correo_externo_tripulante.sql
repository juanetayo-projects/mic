-- =====================================================================
-- MIC · Permite correo de dominio externo para el rol tripulante
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_rol text := coalesce(new.raw_user_meta_data->>'rol', 'solicitante');
begin
  if v_rol not in ('administrador','coordinador','solicitante','tripulante') then
    v_rol := 'solicitante';
  end if;

  -- Los tripulantes pueden no tener correo institucional (p.ej. conductores externos);
  -- el resto de roles debe seguir usando el dominio corporativo.
  if v_rol <> 'tripulante' and (new.email is null or lower(new.email) not like '%@cacsantabarbara.co') then
    raise exception 'Solo se permite el registro con correo institucional @cacsantabarbara.co';
  end if;

  insert into public.profiles (id, email, nombre, rol)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
          v_rol)
  on conflict (id) do nothing;
  return new;
end $$;
