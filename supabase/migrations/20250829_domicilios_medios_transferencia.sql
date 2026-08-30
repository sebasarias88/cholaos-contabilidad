-- Domicilios del día + medios de transferencia configurables
-- (referencia; ya aplicado en Supabase)

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and u.rol = 'admin'
      and u.activo = true
  );
$$;
