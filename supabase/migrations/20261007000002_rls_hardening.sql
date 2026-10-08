-- =============================================================
-- RLS endurecido
-- - anon: sin acceso a ninguna tabla
-- - empleado activo: solo lectura de catálogo activo y del cierre de HOY
-- - escrituras de cierres/ventas: solo vía función guardar_cierre (security definer)
-- - admin activo: todo
-- =============================================================

-- Borrar todas las políticas existentes del esquema public
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- anon no necesita nada (el login usa la API de Auth)
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- Asegurar RLS en todas las tablas
alter table public.usuarios enable row level security;
alter table public.productos enable row level security;
alter table public.tallas_vasos enable row level security;
alter table public.variantes_producto enable row level security;
alter table public.motivos_novedad enable row level security;
alter table public.medios_transferencia enable row level security;
alter table public.cierres_dia enable row level security;
alter table public.conteo_vasos enable row level security;
alter table public.novedades_vasos enable row level security;
alter table public.gastos_dia enable row level security;
alter table public.transferencias_dia enable row level security;
alter table public.domicilios_dia enable row level security;
alter table public.ventas_comida enable row level security;
alter table public.ventas_variantes enable row level security;
alter table public.ventas enable row level security;
alter table public.detalle_ventas enable row level security;
alter table public.configuracion_negocio enable row level security;

-- ¿Puede el usuario actual ver este cierre? (admin: todos; empleado: solo el de hoy)
create or replace function public.puede_ver_cierre(p_cierre_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.es_admin()
      or (public.es_usuario_activo() and exists (
            select 1 from public.cierres_dia c
            where c.id = p_cierre_id and c.fecha = public.hoy_colombia()
          ));
$$;
revoke all on function public.puede_ver_cierre(uuid) from public, anon;
grant execute on function public.puede_ver_cierre(uuid) to authenticated;

-- ---------- usuarios ----------
create policy usuarios_select on public.usuarios for select to authenticated
  using (id = auth.uid() or public.es_admin());
create policy usuarios_admin_all on public.usuarios for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ---------- catálogo ----------
create policy productos_select on public.productos for select to authenticated
  using (public.es_admin() or (public.es_usuario_activo() and activo = true));
create policy productos_admin_all on public.productos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy tallas_select on public.tallas_vasos for select to authenticated
  using (public.es_admin() or (public.es_usuario_activo() and activo = true));
create policy tallas_admin_all on public.tallas_vasos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy variantes_select on public.variantes_producto for select to authenticated
  using (public.es_admin() or (public.es_usuario_activo() and activo = true));
create policy variantes_admin_all on public.variantes_producto for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy motivos_select on public.motivos_novedad for select to authenticated
  using (public.es_admin() or (public.es_usuario_activo() and activo = true));
create policy motivos_admin_all on public.motivos_novedad for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy medios_select on public.medios_transferencia for select to authenticated
  using (public.es_admin() or (public.es_usuario_activo() and activo = true));
create policy medios_admin_all on public.medios_transferencia for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy config_select on public.configuracion_negocio for select to authenticated
  using (public.es_usuario_activo());
create policy config_admin_update on public.configuracion_negocio for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ---------- cierres ----------
create policy cierres_select on public.cierres_dia for select to authenticated
  using (public.es_admin() or (public.es_usuario_activo() and fecha = public.hoy_colombia()));
create policy cierres_admin_all on public.cierres_dia for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy conteo_select on public.conteo_vasos for select to authenticated
  using (public.puede_ver_cierre(cierre_id));
create policy conteo_admin_all on public.conteo_vasos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy novedades_select on public.novedades_vasos for select to authenticated
  using (exists (select 1 from public.conteo_vasos c
                 where c.id = conteo_id and public.puede_ver_cierre(c.cierre_id)));
create policy novedades_admin_all on public.novedades_vasos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy gastos_select on public.gastos_dia for select to authenticated
  using (public.puede_ver_cierre(cierre_id));
create policy gastos_admin_all on public.gastos_dia for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy transferencias_select on public.transferencias_dia for select to authenticated
  using (public.puede_ver_cierre(cierre_id));
create policy transferencias_admin_all on public.transferencias_dia for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy domicilios_select on public.domicilios_dia for select to authenticated
  using (public.puede_ver_cierre(cierre_id));
create policy domicilios_admin_all on public.domicilios_dia for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy ventas_comida_select on public.ventas_comida for select to authenticated
  using (public.puede_ver_cierre(cierre_id));
create policy ventas_comida_admin_all on public.ventas_comida for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy ventas_variantes_select on public.ventas_variantes for select to authenticated
  using (public.puede_ver_cierre(cierre_id));
create policy ventas_variantes_admin_all on public.ventas_variantes for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ---------- ventas (solo admin) ----------
create policy ventas_admin_all on public.ventas for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy detalle_admin_all on public.detalle_ventas for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
