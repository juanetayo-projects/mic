-- =====================================================================
-- MIC · Campo "Evento" y observaciones de viáticos en solicitudes
-- =====================================================================

alter table public.solicitudes add column if not exists evento boolean not null default false;
alter table public.solicitudes add column if not exists observaciones_viaticos text;
