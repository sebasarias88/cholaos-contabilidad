-- =============================================================
-- 1) Perfil automático al crear usuario en Auth + funciones helper
-- =============================================================

-- El rol SIEMPRE nace como 'empleado'. Nunca se toma de user_metadata
-- (cualquiera que haga signup podría enviarse rol=admin).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, rol)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
    'empleado'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.get_mi_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.usuarios where id = auth.uid() and activo = true;
$$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.rol = 'admin' and u.activo = true
  );
$$;

create or replace function public.es_usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.activo = true
  );
$$;

-- Fecha de hoy en Colombia (el servidor de BD está en UTC)
create or replace function public.hoy_colombia()
returns date
language sql
stable
set search_path = public
as $$
  select (now() at time zone 'America/Bogota')::date;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.get_mi_rol() from public, anon;
revoke all on function public.es_admin() from public, anon;
revoke all on function public.es_usuario_activo() from public, anon;
revoke all on function public.hoy_colombia() from public, anon;
grant execute on function public.get_mi_rol() to authenticated;
grant execute on function public.es_admin() to authenticated;
grant execute on function public.es_usuario_activo() to authenticated;
grant execute on function public.hoy_colombia() to authenticated;

-- =============================================================
-- 2) Configuración del negocio (la tabla no existía tras la migración)
-- =============================================================
create table if not exists public.configuracion_negocio (
  id integer primary key default 1 check (id = 1),
  nombre_negocio text not null default 'Cholao Oscar',
  updated_at timestamptz not null default now()
);
insert into public.configuracion_negocio (id) values (1) on conflict (id) do nothing;
alter table public.configuracion_negocio enable row level security;

-- =============================================================
-- 3) Precio histórico en ventas de comida y variantes
-- =============================================================
alter table public.ventas_comida add column if not exists precio_unitario integer;
alter table public.ventas_variantes add column if not exists precio_unitario integer;

update public.ventas_comida vc
   set precio_unitario = coalesce(p.precio, 0)
  from public.productos p
 where p.id = vc.producto_id and vc.precio_unitario is null;

update public.ventas_variantes vv
   set precio_unitario = coalesce(v.precio, 0)
  from public.variantes_producto v
 where v.id = vv.variante_id and vv.precio_unitario is null;
