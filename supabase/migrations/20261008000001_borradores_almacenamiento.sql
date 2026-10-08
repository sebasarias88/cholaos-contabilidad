-- =============================================================
-- Cierres en borrador ("Guardar avance"), fecha elegible por el admin,
-- desglose persistido y página de almacenamiento.
-- =============================================================

-- ---------- 1) Esquema ----------
-- Un borrador puede tener conteos sin final (aún no contados)
alter table public.conteo_vasos alter column cantidad_final drop not null;
-- Reparto de vasos vendidos por producto (para restaurar el formulario)
alter table public.conteo_vasos add column if not exists desglose jsonb;

-- Rellenar desglose de cierres existentes desde detalle_ventas
update public.conteo_vasos cv
   set desglose = sub.desglose
  from (
    select cv2.id,
           jsonb_agg(jsonb_build_object('producto_id', d.producto_id, 'cantidad', d.cantidad)) as desglose
      from public.conteo_vasos cv2
      join public.ventas v on v.cierre_id = cv2.cierre_id
      join public.detalle_ventas d on d.venta_id = v.id
      join public.productos p on p.id = d.producto_id and p.talla_id = cv2.talla_id
     where cv2.talla_id is not null
     group by cv2.id
  ) sub
 where sub.id = cv.id and cv.desglose is null;

-- Historial de tamaño de la BD (una fila por día)
create table if not exists public.uso_almacenamiento_historial (
  fecha date primary key,
  bytes bigint not null,
  registrado_at timestamptz not null default now()
);
alter table public.uso_almacenamiento_historial enable row level security;
drop policy if exists uso_historial_admin_select on public.uso_almacenamiento_historial;
create policy uso_historial_admin_select on public.uso_almacenamiento_historial
  for select to authenticated using (public.es_admin());
revoke all on public.uso_almacenamiento_historial from anon;

create or replace function public._registrar_uso_almacenamiento()
returns void language sql security definer set search_path = public as $$
  insert into public.uso_almacenamiento_historial (fecha, bytes)
  values (public.hoy_colombia(), pg_database_size(current_database()))
  on conflict (fecha) do update set bytes = excluded.bytes, registrado_at = now();
$$;
revoke all on function public._registrar_uso_almacenamiento() from public, anon, authenticated;

-- ---------- 2) Último cierre cerrado ----------
create or replace function public.ultimo_cierre_cerrado()
returns date language sql stable security definer set search_path = public as $$
  select max(fecha) from public.cierres_dia where estado = 'cerrado';
$$;
revoke all on function public.ultimo_cierre_cerrado() from public, anon;
grant execute on function public.ultimo_cierre_cerrado() to authenticated;

-- ---------- 3) guardar_cierre con borradores ----------
-- p.finalizar = false → guarda avance (estado 'borrador'), sin exigir conteos completos.
-- p.finalizar = true (por defecto) → cierre definitivo con todas las validaciones.
create or replace function public.guardar_cierre(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_admin boolean;
  v_hoy date := public.hoy_colombia();
  v_finalizar boolean;
  v_fecha date;
  v_ultimo date;
  v_existente public.cierres_dia%rowtype;
  v_existe boolean := false;
  v_es_correccion boolean := false;
  v_cierre_id uuid;
  v_venta_id uuid;
  v_base jsonb;
  v_dinero_base integer;
  v_dinero_final integer;
  v_obs text;
  v_total_gastos integer := 0;
  v_total_trans integer := 0;
  v_total_dom integer := 0;
  v_total_vasos integer := 0;
  v_total_comida integer := 0;
  v_total_var integer := 0;
  v_total integer := 0;
  r jsonb;
  v_talla uuid;
  v_prod_id uuid;
  v_label text;
  v_inicio integer;
  v_nuevos integer;
  v_final integer;
  v_nov integer;
  v_vendidos integer;
  v_suma integer;
  v_nprod integer;
  v_precio integer;
  v_conteo_id uuid;
  v_desglose jsonb;
  v_faltante text;
  rec record;
begin
  if v_uid is null or not public.es_usuario_activo() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  v_admin := public.es_admin();
  v_finalizar := coalesce((p->>'finalizar')::boolean, true);

  -- ---------- Fecha ----------
  v_fecha := nullif(p->>'fecha', '')::date;
  if v_fecha is null then
    raise exception 'La fecha es requerida';
  end if;
  if v_fecha > v_hoy then
    raise exception 'No se puede cerrar un día futuro';
  end if;
  if not v_admin and v_fecha <> v_hoy then
    raise exception 'Solo puedes cerrar el día de hoy';
  end if;

  select * into v_existente from public.cierres_dia where fecha = v_fecha for update;
  v_existe := found;
  v_es_correccion := v_existe and v_existente.estado = 'cerrado';

  if v_es_correccion and not v_admin then
    raise exception 'Este día ya fue cerrado';
  end if;
  if v_es_correccion and not v_finalizar then
    raise exception 'Este día ya está cerrado: usa "Guardar corrección"';
  end if;

  -- Un cierre nuevo (o un borrador que se finaliza) debe ser posterior al último cierre,
  -- si no, se contarían dos veces los movimientos de inventario.
  if not v_es_correccion then
    select max(fecha) into v_ultimo from public.cierres_dia
     where estado = 'cerrado' and fecha <> v_fecha;
    if v_ultimo is not null and v_fecha < v_ultimo then
      raise exception 'No se puede registrar un cierre anterior al último cierre (%)',
        to_char(v_ultimo, 'DD/MM/YYYY');
    end if;
  end if;

  -- ---------- Caja ----------
  v_base := public._base_cierre(v_fecha);
  if v_admin and nullif(p->>'dinero_base_inicio', '') is not null then
    v_dinero_base := (p->>'dinero_base_inicio')::integer;
  else
    v_dinero_base := (v_base->>'dinero_final')::integer;
  end if;
  v_dinero_final := nullif(p->>'dinero_final', '')::integer;
  if v_finalizar and v_dinero_final is null then
    raise exception 'Falta el dinero final contado en caja';
  end if;
  v_dinero_final := coalesce(v_dinero_final, 0);
  if v_dinero_base < 0 or v_dinero_final < 0 then
    raise exception 'Los valores de caja no pueden ser negativos';
  end if;
  v_obs := nullif(trim(coalesce(p->>'observaciones', '')), '');

  -- ---------- Conteos completos (al finalizar un cierre nuevo o un borrador) ----------
  if v_finalizar and not v_es_correccion then
    select string_agg(coalesce(t.descripcion, t.onzas || ' oz'), ', ') into v_faltante
      from public.tallas_vasos t
     where exists (select 1 from public.productos pr
                    where pr.talla_id = t.id and pr.activo and pr.tipo = 'vaso')
       and not exists (select 1 from jsonb_array_elements(coalesce(p->'vasos', '[]'::jsonb)) x
                        where (x->>'talla_id')::uuid = t.id);
    if v_faltante is not null then
      raise exception 'Falta el conteo de: %', v_faltante;
    end if;

    select string_agg(pr.nombre, ', ') into v_faltante
      from public.productos pr
     where pr.activo and pr.tipo = 'insumo'
       and not exists (select 1 from jsonb_array_elements(coalesce(p->'insumos', '[]'::jsonb)) x
                        where (x->>'producto_id')::uuid = pr.id);
    if v_faltante is not null then
      raise exception 'Falta el conteo de: %', v_faltante;
    end if;
  end if;

  -- ---------- Crear / limpiar cierre ----------
  if v_existe then
    v_cierre_id := v_existente.id;
    delete from public.gastos_dia where cierre_id = v_cierre_id;
    delete from public.transferencias_dia where cierre_id = v_cierre_id;
    delete from public.domicilios_dia where cierre_id = v_cierre_id;
    delete from public.conteo_vasos where cierre_id = v_cierre_id;
    delete from public.ventas_comida where cierre_id = v_cierre_id;
    delete from public.ventas_variantes where cierre_id = v_cierre_id;
    delete from public.ventas where cierre_id = v_cierre_id;
  else
    insert into public.cierres_dia (fecha, usuario_id, estado)
    values (v_fecha, v_uid, 'borrador')
    returning id into v_cierre_id;
  end if;

  -- Las ventas solo existen para cierres finalizados (los reportes no ven borradores)
  if v_finalizar then
    insert into public.ventas (fecha, usuario_id, total, cierre_id)
    values (v_fecha, v_uid, 0, v_cierre_id)
    returning id into v_venta_id;
  end if;

  -- ---------- Vasos ----------
  for r in select * from jsonb_array_elements(coalesce(p->'vasos', '[]'::jsonb))
  loop
    v_talla := nullif(r->>'talla_id', '')::uuid;
    select coalesce(t.descripcion, t.onzas || ' oz') into v_label
      from public.tallas_vasos t where t.id = v_talla;
    if not found then
      raise exception 'Vaso físico inválido en el conteo';
    end if;

    v_nuevos := coalesce(nullif(r->>'cantidad_nuevos', '')::integer, 0);
    v_final := nullif(r->>'cantidad_final', '')::integer;
    if v_finalizar and v_final is null then
      raise exception '%: falta el conteo final', v_label;
    end if;
    if v_nuevos < 0 or coalesce(v_final, 0) < 0 then
      raise exception '%: las cantidades no pueden ser negativas', v_label;
    end if;

    select coalesce(max((c->>'cantidad_final')::integer), 0) into v_inicio
      from jsonb_array_elements(v_base->'conteos') c
     where c->>'talla_id' = v_talla::text;

    if v_final is not null and v_final > v_inicio + v_nuevos then
      raise exception '%: el final (%) es mayor que lo disponible (% de inicio + % nuevos)',
        v_label, v_final, v_inicio, v_nuevos;
    end if;

    select coalesce(jsonb_agg(jsonb_build_object('producto_id', x.producto_id, 'cantidad', x.cantidad)), '[]'::jsonb)
      into v_desglose
      from (select x.producto_id, sum(x.cantidad)::integer as cantidad
              from jsonb_to_recordset(coalesce(r->'desglose', '[]'::jsonb))
                   as x(producto_id uuid, cantidad integer)
             where coalesce(x.cantidad, 0) > 0
             group by x.producto_id) x;

    insert into public.conteo_vasos (cierre_id, talla_id, producto_id,
      cantidad_inicio, cantidad_nuevos, cantidad_final, observacion, desglose)
    values (v_cierre_id, v_talla, null, v_inicio, v_nuevos, v_final,
      nullif(trim(coalesce(r->>'observacion', '')), ''), v_desglose)
    returning id into v_conteo_id;

    v_nov := 0;
    for rec in
      select x.motivo_id, max(x.motivo_custom) as motivo_custom, sum(x.cantidad)::integer as cantidad
        from jsonb_to_recordset(coalesce(r->'novedades', '[]'::jsonb))
             as x(motivo_id uuid, motivo_custom text, cantidad integer)
       where coalesce(x.cantidad, 0) > 0
       group by x.motivo_id
    loop
      if not exists (select 1 from public.motivos_novedad m where m.id = rec.motivo_id) then
        raise exception '%: motivo de novedad inválido', v_label;
      end if;
      insert into public.novedades_vasos (conteo_id, motivo_id, motivo_custom, cantidad)
      values (v_conteo_id, rec.motivo_id, nullif(trim(coalesce(rec.motivo_custom, '')), ''), rec.cantidad);
      v_nov := v_nov + rec.cantidad;
    end loop;

    -- Sin final (borrador) no hay vendidos todavía
    continue when v_final is null;

    v_vendidos := v_inicio + v_nuevos - v_final - v_nov;
    if v_vendidos < 0 then
      raise exception '%: hay más novedades (%) que vasos gastados (%)',
        v_label, v_nov, v_inicio + v_nuevos - v_final;
    end if;
    continue when v_vendidos = 0;

    select count(*) into v_nprod from public.productos pr
     where pr.talla_id = v_talla and pr.activo and pr.tipo = 'vaso';

    if v_nprod = 0 then
      if v_finalizar then
        raise exception '%: no hay productos activos ligados a este vaso', v_label;
      end if;
      continue;
    end if;

    if v_nprod = 1 then
      select pr.id, pr.precio into v_prod_id, v_precio from public.productos pr
       where pr.talla_id = v_talla and pr.activo and pr.tipo = 'vaso';
      if v_precio is null then
        raise exception '%: el producto no tiene precio', v_label;
      end if;
      if v_finalizar then
        insert into public.detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
        values (v_venta_id, v_prod_id, v_vendidos, v_precio);
        update public.conteo_vasos
           set desglose = jsonb_build_array(jsonb_build_object('producto_id', v_prod_id, 'cantidad', v_vendidos))
         where id = v_conteo_id;
      end if;
      v_total_vasos := v_total_vasos + v_vendidos * v_precio;
      continue;
    end if;

    -- Varios productos comparten el vaso: el desglose debe sumar lo vendido
    select coalesce(sum((d->>'cantidad')::integer), 0) into v_suma
      from jsonb_array_elements(v_desglose) d;

    for rec in
      select (d->>'producto_id')::uuid as producto_id, (d->>'cantidad')::integer as cantidad
        from jsonb_array_elements(v_desglose) d
    loop
      select pr.precio into v_precio from public.productos pr
       where pr.id = rec.producto_id and pr.talla_id = v_talla
         and pr.activo and pr.tipo = 'vaso';
      if not found or v_precio is null then
        if v_finalizar then
          raise exception '%: hay un producto del desglose que no pertenece a este vaso o no tiene precio', v_label;
        end if;
        continue;
      end if;
      if v_finalizar then
        insert into public.detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
        values (v_venta_id, rec.producto_id, rec.cantidad, v_precio);
      end if;
      if v_suma = v_vendidos then
        v_total_vasos := v_total_vasos + rec.cantidad * v_precio;
      end if;
    end loop;

    if v_finalizar and v_suma <> v_vendidos then
      raise exception '%: el desglose suma % y se vendieron % vasos (deben ser iguales)',
        v_label, v_suma, v_vendidos;
    end if;
  end loop;

  -- ---------- Insumos ----------
  for r in select * from jsonb_array_elements(coalesce(p->'insumos', '[]'::jsonb))
  loop
    v_prod_id := nullif(r->>'producto_id', '')::uuid;
    select pr.nombre into v_label from public.productos pr
     where pr.id = v_prod_id and pr.tipo = 'insumo';
    if not found then
      raise exception 'Insumo inválido en el conteo';
    end if;

    v_nuevos := coalesce(nullif(r->>'cantidad_nuevos', '')::integer, 0);
    v_final := nullif(r->>'cantidad_final', '')::integer;
    if v_finalizar and v_final is null then
      raise exception '%: falta el conteo final', v_label;
    end if;
    if v_nuevos < 0 or coalesce(v_final, 0) < 0 then
      raise exception '%: las cantidades no pueden ser negativas', v_label;
    end if;

    select coalesce(max((c->>'cantidad_final')::integer), 0) into v_inicio
      from jsonb_array_elements(v_base->'conteos') c
     where c->>'producto_id' = v_prod_id::text and c->>'talla_id' is null;

    if v_final is not null and v_final > v_inicio + v_nuevos then
      raise exception '%: el final (%) es mayor que lo disponible (% de inicio + % nuevos)',
        v_label, v_final, v_inicio, v_nuevos;
    end if;

    insert into public.conteo_vasos (cierre_id, talla_id, producto_id,
      cantidad_inicio, cantidad_nuevos, cantidad_final)
    values (v_cierre_id, null, v_prod_id, v_inicio, v_nuevos, v_final);
  end loop;

  -- ---------- Comida sin variantes ----------
  for rec in
    select x.producto_id, sum(x.cantidad)::integer as cantidad
      from jsonb_to_recordset(coalesce(p->'ventas_comida', '[]'::jsonb))
           as x(producto_id uuid, cantidad integer)
     where coalesce(x.cantidad, 0) > 0
     group by x.producto_id
  loop
    select pr.precio, pr.nombre into v_precio, v_label from public.productos pr
     where pr.id = rec.producto_id and pr.tipo = 'comida';
    if not found then
      raise exception 'Producto de comida inválido';
    end if;
    if v_precio is null then
      raise exception '%: no tiene precio', v_label;
    end if;
    insert into public.ventas_comida (cierre_id, producto_id, cantidad, precio_unitario)
    values (v_cierre_id, rec.producto_id, rec.cantidad, v_precio);
    v_total_comida := v_total_comida + rec.cantidad * v_precio;
  end loop;

  -- ---------- Variantes ----------
  for rec in
    select x.variante_id, sum(x.cantidad)::integer as cantidad
      from jsonb_to_recordset(coalesce(p->'ventas_variantes', '[]'::jsonb))
           as x(variante_id uuid, cantidad integer)
     where coalesce(x.cantidad, 0) > 0
     group by x.variante_id
  loop
    select v.precio into v_precio from public.variantes_producto v where v.id = rec.variante_id;
    if not found then
      raise exception 'Variante de producto inválida';
    end if;
    insert into public.ventas_variantes (cierre_id, variante_id, cantidad, precio_unitario)
    values (v_cierre_id, rec.variante_id, rec.cantidad, v_precio);
    v_total_var := v_total_var + rec.cantidad * v_precio;
  end loop;

  -- ---------- Gastos ----------
  for rec in
    select trim(coalesce(x.descripcion, '')) as descripcion, x.monto
      from jsonb_to_recordset(coalesce(p->'gastos', '[]'::jsonb))
           as x(descripcion text, monto integer)
  loop
    if rec.descripcion = '' then
      raise exception 'Hay un gasto sin descripción';
    end if;
    if coalesce(rec.monto, 0) <= 0 then
      raise exception 'El gasto "%" debe tener un monto mayor a 0', rec.descripcion;
    end if;
    insert into public.gastos_dia (cierre_id, descripcion, monto)
    values (v_cierre_id, rec.descripcion, rec.monto);
    v_total_gastos := v_total_gastos + rec.monto;
  end loop;

  -- ---------- Transferencias ----------
  for rec in
    select x.medio_id, x.monto
      from jsonb_to_recordset(coalesce(p->'transferencias', '[]'::jsonb))
           as x(medio_id uuid, monto integer)
  loop
    select m.nombre into v_label from public.medios_transferencia m where m.id = rec.medio_id;
    if not found then
      raise exception 'Hay una transferencia sin medio válido';
    end if;
    if coalesce(rec.monto, 0) <= 0 then
      raise exception 'La transferencia de % debe tener un monto mayor a 0', v_label;
    end if;
    insert into public.transferencias_dia (cierre_id, medio_id, descripcion, monto)
    values (v_cierre_id, rec.medio_id, v_label, rec.monto);
    v_total_trans := v_total_trans + rec.monto;
  end loop;

  -- ---------- Domicilios ----------
  for rec in
    select nullif(trim(coalesce(x.descripcion, '')), '') as descripcion, x.monto
      from jsonb_to_recordset(coalesce(p->'domicilios', '[]'::jsonb))
           as x(descripcion text, monto integer)
  loop
    if coalesce(rec.monto, 0) <= 0 then
      raise exception 'Hay un domicilio con monto 0';
    end if;
    insert into public.domicilios_dia (cierre_id, descripcion, monto)
    values (v_cierre_id, rec.descripcion, rec.monto);
    v_total_dom := v_total_dom + rec.monto;
  end loop;

  -- ---------- Totales ----------
  v_total := v_total_vasos + v_total_comida + v_total_var;

  if v_finalizar then
    update public.ventas set total = v_total where id = v_venta_id;
    if v_total = 0 then
      delete from public.ventas where id = v_venta_id;
    end if;
  end if;

  update public.cierres_dia set
    dinero_base_inicio = v_dinero_base,
    dinero_final = v_dinero_final,
    total_gastos = v_total_gastos,
    total_transferencias = v_total_trans,
    total_domicilios = v_total_dom,
    total_ventas = v_total,
    observaciones = v_obs,
    estado = case when v_finalizar then 'cerrado' else 'borrador' end
  where id = v_cierre_id;

  if v_finalizar then
    perform public._registrar_uso_almacenamiento();
  end if;

  return jsonb_build_object(
    'cierre_id', v_cierre_id,
    'fecha', v_fecha,
    'estado', case when v_finalizar then 'cerrado' else 'borrador' end,
    'creado', not v_existe,
    'total_ventas', v_total,
    'total_gastos', v_total_gastos,
    'total_transferencias', v_total_trans,
    'total_domicilios', v_total_dom,
    'dinero_base_inicio', v_dinero_base,
    'dinero_final', v_dinero_final,
    'efectivo_esperado', v_dinero_base + v_total - v_total_trans - v_total_gastos - v_total_dom,
    'diferencia', v_dinero_final - (v_dinero_base + v_total - v_total_trans - v_total_gastos - v_total_dom)
  );
exception
  when invalid_text_representation or numeric_value_out_of_range or invalid_datetime_format then
    raise exception 'Hay datos inválidos en el cierre (números o fecha mal escritos)';
end;
$$;
revoke all on function public.guardar_cierre(jsonb) from public, anon;
grant execute on function public.guardar_cierre(jsonb) to authenticated;

-- ---------- 4) Almacenamiento ----------
create or replace function public.uso_almacenamiento()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_tablas jsonb := '[]'::jsonb;
  r record;
  v_filas bigint;
begin
  if not public.es_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  for r in
    select c.oid, c.relname from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('select count(*) from public.%I', r.relname) into v_filas;
    v_tablas := v_tablas || jsonb_build_object(
      'tabla', r.relname,
      'filas', v_filas,
      'bytes', pg_total_relation_size(r.oid));
  end loop;

  return jsonb_build_object(
    'bytes_total', pg_database_size(current_database()),
    'tablas', v_tablas,
    'cierres', (select count(*) from public.cierres_dia where estado = 'cerrado'),
    'primer_cierre', (select min(fecha) from public.cierres_dia where estado = 'cerrado'),
    'ultimo_cierre', (select max(fecha) from public.cierres_dia where estado = 'cerrado'),
    'historial', coalesce((
      select jsonb_agg(jsonb_build_object('fecha', h.fecha, 'bytes', h.bytes) order by h.fecha)
        from (select * from public.uso_almacenamiento_historial order by fecha desc limit 365) h
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.uso_almacenamiento() from public, anon;
grant execute on function public.uso_almacenamiento() to authenticated;

-- Qué se borraría si se limpia hasta p_hasta (inclusive)
create or replace function public.vista_previa_limpieza(p_hasta date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'hasta', p_hasta,
    'ultimo_cierre', public.ultimo_cierre_cerrado(),
    'cierres', (select count(*) from public.cierres_dia where fecha <= p_hasta),
    'desde', (select min(fecha) from public.cierres_dia where fecha <= p_hasta),
    'ventas', (select count(*) from public.ventas where fecha <= p_hasta),
    'gastos', (select count(*) from public.gastos_dia g join public.cierres_dia c on c.id = g.cierre_id where c.fecha <= p_hasta)
  );
end;
$$;
revoke all on function public.vista_previa_limpieza(date) from public, anon;
grant execute on function public.vista_previa_limpieza(date) to authenticated;

-- Borra cierres (y todo lo que cuelga de ellos) hasta p_hasta inclusive.
-- Siempre conserva el último cierre para no perder el inventario inicial.
create or replace function public.limpiar_datos(p_hasta date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ultimo date := public.ultimo_cierre_cerrado();
  v_cierres integer;
  v_ventas integer;
begin
  if not public.es_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_hasta is null then
    raise exception 'Indica hasta qué fecha borrar';
  end if;
  if v_ultimo is null then
    raise exception 'No hay cierres para borrar';
  end if;
  if p_hasta >= v_ultimo then
    raise exception 'Debes conservar al menos el último cierre (%). Elige una fecha anterior.',
      to_char(v_ultimo, 'DD/MM/YYYY');
  end if;

  select count(*) into v_ventas from public.ventas where fecha <= p_hasta;
  delete from public.ventas where fecha <= p_hasta;
  delete from public.cierres_dia where fecha <= p_hasta;
  get diagnostics v_cierres = row_count;
  delete from public.uso_almacenamiento_historial where fecha <= p_hasta;

  perform public._registrar_uso_almacenamiento();

  return jsonb_build_object('cierres', v_cierres, 'ventas', v_ventas, 'hasta', p_hasta);
end;
$$;
revoke all on function public.limpiar_datos(date) from public, anon;
grant execute on function public.limpiar_datos(date) to authenticated;

-- Primer punto del historial
select public._registrar_uso_almacenamiento();
