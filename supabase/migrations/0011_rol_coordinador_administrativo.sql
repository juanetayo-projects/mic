-- =====================================================================
-- MIC · Nuevo rol coordinador_administrativo + correo de dominios conocidos
-- =====================================================================

alter table public.profiles drop constraint if exists profiles_rol_check;
alter table public.profiles add constraint profiles_rol_check
  check (rol in ('administrador','coordinador','solicitante','tripulante','coordinador_administrativo'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_rol text := coalesce(new.raw_user_meta_data->>'rol', 'solicitante');
  v_dominio text := lower(split_part(coalesce(new.email, ''), '@', 2));
  -- Proveedores de correo públicos aceptados además del dominio institucional.
  v_dominios_conocidos text[] := array[
    'cacsantabarbara.co', 'gmail.com', 'hotmail.com', 'outlook.com',
    'yahoo.com', 'yahoo.es', 'icloud.com', 'live.com', 'msn.com', 'protonmail.com'
  ];
begin
  if v_rol not in ('administrador','coordinador','solicitante','tripulante','coordinador_administrativo') then
    v_rol := 'solicitante';
  end if;

  -- Los tripulantes pueden no tener correo institucional ni de un proveedor conocido
  -- (p.ej. conductores externos); el resto de roles debe usar el dominio institucional
  -- o uno de los proveedores públicos conocidos.
  if v_rol <> 'tripulante' and (new.email is null or v_dominio <> all (v_dominios_conocidos)) then
    raise exception 'Debe usar un correo institucional (@cacsantabarbara.co) o de un proveedor conocido (gmail, hotmail, outlook, etc.)';
  end if;

  insert into public.profiles (id, email, nombre, rol)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
          v_rol)
  on conflict (id) do nothing;
  return new;
end $$;
