-- Cholaos Contabilidad — schema alineado con src/types
-- Ejecutar en el SQL Editor de Supabase

create type rol as enum ('admin', 'empleado');

-- Usuarios del negocio (vinculados a auth.users)
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol rol not null default 'empleado',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Configuración del negocio (fila única)
create table public.configuracion_negocio (
  id int primary key default 1 check (id = 1),
  nombre_negocio text not null default 'Cholao Oscar',
  updated_at timestamptz not null default now()
);

insert into public.configuracion_negocio (id, nombre_negocio)
values (1, 'Cholao Oscar')
on conflict (id) do nothing;

-- Productos del menú
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  onzas numeric(10, 2) not null default 0 check (onzas >= 0),
  precio numeric(10, 2) not null check (precio >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cabecera de venta
create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default (current_date),
  usuario_id uuid not null references auth.users (id) on delete restrict,
  total numeric(10, 2) not null check (total >= 0),
  observaciones text,
  created_at timestamptz not null default now()
);

-- Líneas de detalle por venta
create table public.detalle_ventas (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id) on delete cascade,
  producto_id uuid not null references public.productos (id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0),
  subtotal numeric(10, 2) generated always as (cantidad * precio_unitario) stored
);

-- Trigger: updated_at en productos
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger productos_updated_at
  before update on public.productos
  for each row execute function public.set_updated_at();

-- Trigger: crear usuario al registrarse en auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    'empleado'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.usuarios enable row level security;
alter table public.configuracion_negocio enable row level security;
alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.detalle_ventas enable row level security;

-- Usuarios
create policy "Autenticados leen usuarios"
  on public.usuarios for select
  to authenticated
  using (true);

create policy "Usuario actualiza su perfil"
  on public.usuarios for update
  to authenticated
  using (auth.uid() = id);

create policy "Admin gestiona usuarios"
  on public.usuarios for all
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.rol = 'admin'
    )
  );

-- Configuración negocio
create policy "Autenticados leen configuracion negocio"
  on public.configuracion_negocio for select
  to authenticated
  using (true);

create policy "Admin actualiza configuracion negocio"
  on public.configuracion_negocio for update
  to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.rol = 'admin'
    )
  );

-- Productos
create policy "Autenticados leen productos"
  on public.productos for select
  to authenticated
  using (true);

create policy "Admin gestiona productos"
  on public.productos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.rol = 'admin'
    )
  );

create policy "Admin actualiza productos"
  on public.productos for update
  to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.rol = 'admin'
    )
  );

-- Ventas
create policy "Autenticados leen ventas"
  on public.ventas for select
  to authenticated
  using (true);

create policy "Autenticados crean ventas"
  on public.ventas for insert
  to authenticated
  with check (auth.uid() = usuario_id);

create policy "Admin modifica ventas"
  on public.ventas for update
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.rol = 'admin'
    )
  );

create policy "Admin elimina ventas"
  on public.ventas for delete
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.rol = 'admin'
    )
  );

-- Detalle ventas
create policy "Autenticados leen detalle"
  on public.detalle_ventas for select
  to authenticated
  using (true);

create policy "Autenticados insertan detalle"
  on public.detalle_ventas for insert
  to authenticated
  with check (
    exists (
      select 1 from public.ventas v
      where v.id = venta_id and v.usuario_id = auth.uid()
    )
  );

create policy "Admin gestiona detalle"
  on public.detalle_ventas for all
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.rol = 'admin'
    )
  );

-- Índices
create index ventas_fecha_idx on public.ventas (fecha desc);
create index ventas_usuario_idx on public.ventas (usuario_id);
create index detalle_venta_id_idx on public.detalle_ventas (venta_id);
create index productos_activo_idx on public.productos (activo) where activo = true;
