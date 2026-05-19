-- Ejecutar en Supabase si el proyecto ya existe sin esta tabla

create table if not exists public.configuracion_negocio (
  id int primary key default 1 check (id = 1),
  nombre_negocio text not null default 'Cholao Oscar',
  updated_at timestamptz not null default now()
);

insert into public.configuracion_negocio (id, nombre_negocio)
values (1, 'Cholao Oscar')
on conflict (id) do nothing;

alter table public.configuracion_negocio enable row level security;

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
