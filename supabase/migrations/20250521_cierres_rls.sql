-- Políticas RLS para cierres del día y tablas relacionadas.
-- Ejecutar en Supabase SQL Editor si POST /api/cierres falla con:
-- "new row violates row-level security policy for table cierres_dia"
--
-- Nota: la API ya envía usuario_id = auth.uid() en el INSERT.
-- Este error suele significar que RLS está activo pero falta la policy de INSERT
-- (o exige solo admin / otro campo distinto).

-- ── Helper: ¿usuario actual es admin activo? ────────────────────────────────
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

-- ── cierres_dia ─────────────────────────────────────────────────────────────
alter table public.cierres_dia enable row level security;

drop policy if exists "Autenticados leen cierres" on public.cierres_dia;
drop policy if exists "Autenticados crean cierres" on public.cierres_dia;
drop policy if exists "Autor o admin actualiza cierres" on public.cierres_dia;
drop policy if exists "Admin elimina cierres" on public.cierres_dia;

create policy "Autenticados leen cierres"
  on public.cierres_dia for select
  to authenticated
  using (true);

-- Empleado y admin: crear cierre asignado a sí mismo
create policy "Autenticados crean cierres"
  on public.cierres_dia for insert
  to authenticated
  with check (auth.uid() = usuario_id);

-- Borrador: lo edita quien lo creó; admin puede editar cualquiera
create policy "Autor o admin actualiza cierres"
  on public.cierres_dia for update
  to authenticated
  using (
    public.es_admin()
    or (auth.uid() = usuario_id and estado = 'borrador')
  )
  with check (
    public.es_admin()
    or (auth.uid() = usuario_id and estado in ('borrador', 'cerrado'))
  );

create policy "Admin elimina cierres"
  on public.cierres_dia for delete
  to authenticated
  using (public.es_admin());

-- ── gastos_dia ──────────────────────────────────────────────────────────────
alter table public.gastos_dia enable row level security;

drop policy if exists "Autenticados leen gastos_dia" on public.gastos_dia;
drop policy if exists "Autenticados insertan gastos_dia" on public.gastos_dia;
drop policy if exists "Autor o admin gestiona gastos_dia" on public.gastos_dia;

create policy "Autenticados leen gastos_dia"
  on public.gastos_dia for select to authenticated using (true);

create policy "Autenticados insertan gastos_dia"
  on public.gastos_dia for insert to authenticated
  with check (
    exists (
      select 1 from public.cierres_dia c
      where c.id = cierre_id
        and (c.usuario_id = auth.uid() or public.es_admin())
        and c.estado = 'borrador'
    )
  );

create policy "Autor o admin gestiona gastos_dia"
  on public.gastos_dia for all to authenticated
  using (
    exists (
      select 1 from public.cierres_dia c
      where c.id = cierre_id
        and (c.usuario_id = auth.uid() or public.es_admin())
    )
  );

-- ── transferencias_dia ──────────────────────────────────────────────────────
alter table public.transferencias_dia enable row level security;

drop policy if exists "Autenticados leen transferencias_dia" on public.transferencias_dia;
drop policy if exists "Autenticados insertan transferencias_dia" on public.transferencias_dia;
drop policy if exists "Autor o admin gestiona transferencias_dia" on public.transferencias_dia;

create policy "Autenticados leen transferencias_dia"
  on public.transferencias_dia for select to authenticated using (true);

create policy "Autenticados insertan transferencias_dia"
  on public.transferencias_dia for insert to authenticated
  with check (
    exists (
      select 1 from public.cierres_dia c
      where c.id = cierre_id
        and (c.usuario_id = auth.uid() or public.es_admin())
        and c.estado = 'borrador'
    )
  );

create policy "Autor o admin gestiona transferencias_dia"
  on public.transferencias_dia for all to authenticated
  using (
    exists (
      select 1 from public.cierres_dia c
      where c.id = cierre_id
        and (c.usuario_id = auth.uid() or public.es_admin())
    )
  );

-- ── conteo_vasos ────────────────────────────────────────────────────────────
alter table public.conteo_vasos enable row level security;

drop policy if exists "Autenticados leen conteo_vasos" on public.conteo_vasos;
drop policy if exists "Autenticados insertan conteo_vasos" on public.conteo_vasos;
drop policy if exists "Autor o admin gestiona conteo_vasos" on public.conteo_vasos;

create policy "Autenticados leen conteo_vasos"
  on public.conteo_vasos for select to authenticated using (true);

create policy "Autenticados insertan conteo_vasos"
  on public.conteo_vasos for insert to authenticated
  with check (
    exists (
      select 1 from public.cierres_dia c
      where c.id = cierre_id
        and (c.usuario_id = auth.uid() or public.es_admin())
        and c.estado = 'borrador'
    )
  );

create policy "Autor o admin gestiona conteo_vasos"
  on public.conteo_vasos for all to authenticated
  using (
    exists (
      select 1 from public.cierres_dia c
      where c.id = cierre_id
        and (c.usuario_id = auth.uid() or public.es_admin())
    )
  );

-- ── novedades_vasos (si existe) ─────────────────────────────────────────────
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'novedades_vasos'
  ) then
    execute 'alter table public.novedades_vasos enable row level security';

    execute 'drop policy if exists "Autenticados leen novedades_vasos" on public.novedades_vasos';
    execute 'drop policy if exists "Autenticados insertan novedades_vasos" on public.novedades_vasos';
    execute 'drop policy if exists "Autor o admin gestiona novedades_vasos" on public.novedades_vasos';

    execute $p$
      create policy "Autenticados leen novedades_vasos"
        on public.novedades_vasos for select to authenticated using (true)
    $p$;

    execute $p$
      create policy "Autenticados insertan novedades_vasos"
        on public.novedades_vasos for insert to authenticated
        with check (
          exists (
            select 1
            from public.conteo_vasos cv
            join public.cierres_dia c on c.id = cv.cierre_id
            where cv.id = conteo_id
              and (c.usuario_id = auth.uid() or public.es_admin())
              and c.estado = 'borrador'
          )
        )
    $p$;

    execute $p$
      create policy "Autor o admin gestiona novedades_vasos"
        on public.novedades_vasos for all to authenticated
        using (
          exists (
            select 1
            from public.conteo_vasos cv
            join public.cierres_dia c on c.id = cv.cierre_id
            where cv.id = conteo_id
              and (c.usuario_id = auth.uid() or public.es_admin())
          )
        )
    $p$;
  end if;
end $$;

-- ── ventas.cierre_id (columna opcional en ventas del cierre) ──────────────────
-- Si agregaste cierre_id a ventas, el INSERT de ventas en cierres ya cumple
-- auth.uid() = usuario_id (policy existente en schema.sql).
