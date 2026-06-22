-- =====================================================================
-- MIC · Seed de catálogos (normalizados del histórico Excel)
-- =====================================================================

insert into public.tipos_vehiculo (nombre) values
  ('Carro'), ('Camioneta'), ('Automóvil'), ('Moto')
on conflict (nombre) do nothing;

insert into public.areas (nombre) values
  ('Mantenimiento'),
  ('Urgencias'),
  ('Administrativo'),
  ('TICS'),
  ('Comité de Infecciones'),
  ('Seguridad y Salud en el Trabajo'),
  ('SIAU'),
  ('Calidad'),
  ('Cadena de Suministros'),
  ('Infraestructura'),
  ('Gestión Ambiental'),
  ('Glosas y Devoluciones'),
  ('Seguridad del Paciente'),
  ('Apoyo Terapéutico'),
  ('Compras'),
  ('Talento Humano'),
  ('Cartera'),
  ('Trabajo Social'),
  ('Gestión Riesgo y Contratación'),
  ('Biomédico'),
  ('Jurídico'),
  ('Gestión del Conocimiento'),
  ('Equipo Psicosocial'),
  ('Facturación'),
  ('Sistemas de Información'),
  ('Gestión Farmacéutica'),
  ('Radicación'),
  ('Comercial'),
  ('Hospitalización'),
  ('Referencia y Contrareferencia'),
  ('Dirección General'),
  ('Dirección Financiera'),
  ('Subdirección Médica'),
  ('Subdirección Comercial'),
  ('Contabilidad'),
  ('Imágenes'),
  ('Cuentas Médicas'),
  ('Angiografía'),
  ('Gerencia'),
  ('Planeación y Mejoramiento'),
  ('Gestión Experiencia del Paciente'),
  ('Consulta Externa'),
  ('Financiero'),
  ('Dirección')
on conflict (nombre) do nothing;
