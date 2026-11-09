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
  tecnico text,
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

-- 4) ACCESO TEMPORAL SOLO CON CORREO (sin contraseña ni enlace).
-- Cualquiera que conozca el correo de un admin puede usar el panel.
create or replace function public.admin_ok(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = lower(trim(p_email)));
$$;

create or replace function public.facturas_listar(p_email text)
returns setof public.facturas language plpgsql stable security definer set search_path = public as $$
begin
  if not public.admin_ok(p_email) then raise exception 'sin acceso'; end if;
  return query select * from public.facturas order by numero desc limit 500;
end $$;

create or replace function public.facturas_crear(p_email text, p jsonb)
returns public.facturas language plpgsql security definer set search_path = public as $$
declare r public.facturas;
begin
  if not public.admin_ok(p_email) then raise exception 'sin acceso'; end if;
  if coalesce(trim(p->>'cliente_nombre'), '') = '' then raise exception 'falta el nombre del cliente'; end if;
  insert into public.facturas (cliente_nombre, cliente_telefono, cliente_documento, cliente_direccion,
    equipo, marca, modelo, serial, falla, trabajo, items, subtotal, descuento, total,
    metodo_pago, garantia_meses, notas, tecnico, creado_por)
  values (p->>'cliente_nombre', p->>'cliente_telefono', p->>'cliente_documento', p->>'cliente_direccion',
    p->>'equipo', p->>'marca', p->>'modelo', p->>'serial', p->>'falla', p->>'trabajo',
    coalesce(p->'items', '[]'::jsonb), coalesce((p->>'subtotal')::numeric, 0), coalesce((p->>'descuento')::numeric, 0),
    coalesce((p->>'total')::numeric, 0), p->>'metodo_pago', coalesce((p->>'garantia_meses')::int, 4), p->>'notas',
    p->>'tecnico', lower(trim(p_email)))
  returning * into r;
  return r;
end $$;

create or replace function public.facturas_eliminar(p_email text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_ok(p_email) then raise exception 'sin acceso'; end if;
  delete from public.facturas where id = p_id;
end $$;

grant execute on function public.admin_ok(text), public.facturas_listar(text),
  public.facturas_crear(text, jsonb), public.facturas_eliminar(text, uuid) to anon, authenticated;

-- 5) Técnico que atendió
alter table public.facturas add column if not exists tecnico text;

-- 6) ACCESO CON CONTRASEÑA (reemplaza el acceso temporal solo con correo).
-- Las funciones ya no confían en el correo que manda la página: exigen una sesión
-- iniciada (correo + contraseña) de un administrador. p_email se ignora.
create or replace function public.facturas_listar(p_email text)
returns setof public.facturas language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'sin acceso'; end if;
  return query select * from public.facturas order by numero desc limit 500;
end $$;

create or replace function public.facturas_eliminar(p_email text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'sin acceso'; end if;
  delete from public.facturas where id = p_id;
end $$;
-- facturas_crear: igual que en numeracion.sql pero con "if not public.es_admin()" y
-- creado_por = lower(auth.jwt() ->> 'email').

revoke execute on function public.admin_ok(text), public.facturas_listar(text),
  public.facturas_crear(text, jsonb), public.facturas_eliminar(text, uuid) from public, anon;
grant execute on function public.facturas_listar(text), public.facturas_crear(text, jsonb),
  public.facturas_eliminar(text, uuid) to authenticated;
grant execute on function public.es_admin() to anon, authenticated;
