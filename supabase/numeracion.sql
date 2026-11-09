-- Numeración consecutiva sin saltos (se aplica al publicar).
-- 1) El número ya no lo pone un contador que se "gasta" con pruebas o errores:
alter table public.facturas alter column numero drop identity if exists;

-- 2) Renumera las facturas existentes en orden (0001, 0002, ...):
with r as (select id, row_number() over (order by numero) as n from public.facturas)
update public.facturas f set numero = r.n + 100000 from r where f.id = r.id;
update public.facturas set numero = numero - 100000 where numero > 100000;

-- 3) Cada factura nueva toma el siguiente número libre:
create or replace function public.facturas_crear(p_email text, p jsonb)
returns public.facturas language plpgsql security definer set search_path = public as $$
declare r public.facturas; n bigint;
begin
  if not public.admin_ok(p_email) then raise exception 'sin acceso'; end if;
  if coalesce(trim(p->>'cliente_nombre'), '') = '' then raise exception 'falta el nombre del cliente'; end if;
  lock table public.facturas in share row exclusive mode;
  select coalesce(max(numero), 0) + 1 into n from public.facturas;
  insert into public.facturas (numero, cliente_nombre, cliente_telefono, cliente_documento, cliente_direccion,
    equipo, marca, modelo, serial, falla, trabajo, items, subtotal, descuento, total,
    metodo_pago, garantia_meses, notas, tecnico, creado_por)
  values (n, p->>'cliente_nombre', p->>'cliente_telefono', p->>'cliente_documento', p->>'cliente_direccion',
    p->>'equipo', p->>'marca', p->>'modelo', p->>'serial', p->>'falla', p->>'trabajo',
    coalesce(p->'items', '[]'::jsonb), coalesce((p->>'subtotal')::numeric, 0), coalesce((p->>'descuento')::numeric, 0),
    coalesce((p->>'total')::numeric, 0), p->>'metodo_pago', coalesce((p->>'garantia_meses')::int, 4), p->>'notas',
    p->>'tecnico', lower(trim(p_email)))
  returning * into r;
  return r;
end $$;
grant execute on function public.facturas_crear(text, jsonb) to anon, authenticated;
