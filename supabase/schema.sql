-- Servi LG · Base de datos del panel de administración
-- Pégalo completo en Supabase → SQL Editor → Run.

-- 1) Administradores: solo los correos de esta tabla pueden entrar al panel.
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

drop policy if exists "admin lee su fila" on public.admins;
create policy "admin lee su fila" on public.admins
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where email = lower(auth.jwt() ->> 'email'));
$$;

-- 2) Facturas (comprobantes de servicio)
create table if not exists public.facturas (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  cliente_nombre text not null,
  cliente_telefono text,
  cliente_documento text,
  cliente_direccion text,
  equipo text,
  marca text,
  modelo text,
  serial text,
  falla text,
  trabajo text,
  items jsonb not null default '[]',
  subtotal numeric not null default 0,
  descuento numeric not null default 0,
  total numeric not null default 0,
  metodo_pago text,
  garantia_meses int not null default 4,
  notas text,
  creado_por text default lower(auth.jwt() ->> 'email')
);
alter table public.facturas enable row level security;

drop policy if exists "solo admins" on public.facturas;
create policy "solo admins" on public.facturas
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- 3) Registra aquí el correo del administrador (en minúsculas):
-- insert into public.admins (email) values ('correo@ejemplo.com');
