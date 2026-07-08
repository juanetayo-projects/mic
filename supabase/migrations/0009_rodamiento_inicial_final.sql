-- =====================================================================
-- MIC · Rodamiento: lecturas inicial/final de combustible y condiciones,
-- y regla de negocio "un tripulante no puede tener mas de un turno abierto"
-- =====================================================================

alter table public.rodamiento drop constraint if exists rodamiento_combustible_check;
alter table public.rodamiento rename column combustible to combustible_inicial;
alter table public.rodamiento alter column combustible_inicial type numeric(5,2) using null;
alter table public.rodamiento add constraint rodamiento_combustible_inicial_check check (combustible_inicial is null or combustible_inicial between 0 and 100);
alter table public.rodamiento add column if not exists combustible_final numeric(5,2) check (combustible_final is null or combustible_final between 0 and 100);

alter table public.rodamiento rename column condiciones to condiciones_inicial;
alter table public.rodamiento add column if not exists condiciones_final text;

-- Un tripulante no puede tener mas de un turno abierto a la vez
create unique index if not exists idx_rodamiento_un_abierto_por_tripulante
  on public.rodamiento(tripulante_id) where estado = 'abierto';
