-- =============================================================
-- Funciones del cierre del día
-- =============================================================

-- Base para un cierre: dinero final y conteos finales del ÚLTIMO cierre
-- anterior a p_fecha (no necesariamente "ayer").
create or replace function public._base_cierre(p_fecha date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ultimo as (
    select c.id, c.fecha, c.dinero_final
      from public.cierres_dia c
     where c.fecha < p_fecha and c.estado = 'cerrado'
     order by c.fecha desc
     limit 1
  )
  select jsonb_build_object(
    'fecha_anterior', (select fecha from ultimo),
    'dinero_final', coalesce((select dinero_final from ultimo), 0),
    'conteos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'talla_id', cv.talla_id,
               'producto_id', cv.producto_id,
               'cantidad_final', cv.cantidad_final))
        from public.conteo_vasos cv
       where cv.cierre_id = (select id from ultimo)
    ), '[]'::jsonb)
  );
$$;
revoke all on function public._base_cierre(date) from public, anon, authenticated;

-- Versión expuesta: empleado solo puede pedir la base de hoy
create or replace function public.base_cierre(p_fecha date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_usuario_activo() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not public.es_admin() and p_fecha <> public.hoy_colombia() then
    raise exception 'Solo puedes consultar el cierre de hoy' using errcode = '42501';
  end if;
  return public._base_cierre(p_fecha);
end;
$$;
revoke all on function public.base_cierre(date) from public, anon;
grant execute on function public.base_cierre(date) to authenticated;

-- -------------------------------------------------------------
-- guardar_cierre: guarda el cierre completo en UNA transacción.
-- Precios e inventario inicial se toman de la BD, nunca del cliente.
--
-- Payload:
-- {
--   fecha, dinero_base_inicio (solo admin), dinero_final, observaciones,
--   gastos: [{descripcion, monto}],
--   transferencias: [{medio_id, monto}],
--   domicilios: [{descripcion, monto}],
--   vasos: [{talla_id, cantidad_nuevos, cantidad_final,
--            novedades: [{motivo_id, motivo_custom, cantidad}],
--            desglose: [{producto_id, cantidad}]}],
--   insumos: [{producto_id, cantidad_nuevos, cantidad_final}],
--   ventas_comida: [{producto_id, cantidad}],
--   ventas_variantes: [{variante_id, cantidad}]
-- }
-- -------------------------------------------------------------
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
  v_fecha date;
  v_existente public.cierres_dia%rowtype;
  v_existe boolean := false;
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
  v_faltante text;
  rec record;
begin
  if v_uid is null or not public.es_usuario_activo() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  v_admin := public.es_admin();

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

  -- Bloquea la fila del día para evitar dos cierres simultáneos
  select * into v_existente from public.cierres_dia where fecha = v_fecha for update;
  v_existe := found;
  if v_existe and v_existente.estado = 'cerrado' and not v_admin then
    raise exception 'Este día ya fue cerrado';
  end if;

  -- ---------- Caja ----------
  v_base := public._base_cierre(v_fecha);
  if v_admin and nullif(p->>'dinero_base_inicio', '') is not null then
    v_dinero_base := (p->>'dinero_base_inicio')::integer;
  else
    v_dinero_base := (v_base->>'dinero_final')::integer;
  end if;
  v_dinero_final := nullif(p->>'dinero_final', '')::integer;
  if v_dinero_final is null then
    raise exception 'Falta el dinero final contado en caja';
  end if;
  if v_dinero_base < 0 or v_dinero_final < 0 then
    raise exception 'Los valores de caja no pueden ser negativos';
  end if;
  v_obs := nullif(trim(coalesce(p->>'observaciones', '')), '');

  -- ---------- Conteos completos (solo para el día de hoy) ----------
  if v_fecha = v_hoy then
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
    delete from public.conteo_vasos where cierre_id = v_cierre_id;      -- novedades en cascada
    delete from public.ventas_comida where cierre_id = v_cierre_id;
    delete from public.ventas_variantes where cierre_id = v_cierre_id;
    delete from public.ventas where cierre_id = v_cierre_id;            -- detalle en cascada
  else
    insert into public.cierres_dia (fecha, usuario_id, estado)
    values (v_fecha, v_uid, 'borrador')
    returning id into v_cierre_id;
  end if;

  insert into public.ventas (fecha, usuario_id, total, cierre_id)
  values (v_fecha, v_uid, 0, v_cierre_id)
  returning id into v_venta_id;

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
    if v_final is null then
      raise exception '%: falta el conteo final', v_label;
    end if;
    if v_nuevos < 0 or v_final < 0 then
      raise exception '%: las cantidades no pueden ser negativas', v_label;
    end if;

    select coalesce(max((c->>'cantidad_final')::integer), 0) into v_inicio
      from jsonb_array_elements(v_base->'conteos') c
     where c->>'talla_id' = v_talla::text;

    if v_final > v_inicio + v_nuevos then
      raise exception '%: el final (%) es mayor que lo disponible (% de inicio + % nuevos)',
        v_label, v_final, v_inicio, v_nuevos;
    end if;

    insert into public.conteo_vasos (cierre_id, talla_id, producto_id,
      cantidad_inicio, cantidad_nuevos, cantidad_final, observacion)
    values (v_cierre_id, v_talla, null, v_inicio, v_nuevos, v_final,
      nullif(trim(coalesce(r->>'observacion', '')), ''))
    returning id into v_conteo_id;

    -- Novedades
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

    v_vendidos := v_inicio + v_nuevos - v_final - v_nov;
    if v_vendidos < 0 then
      raise exception '%: hay más novedades (%) que vasos gastados (%)',
        v_label, v_nov, v_inicio + v_nuevos - v_final;
    end if;

    -- Desglose por producto
    select count(*) into v_nprod from public.productos pr
     where pr.talla_id = v_talla and pr.activo and pr.tipo = 'vaso';

    if v_vendidos > 0 then
      if v_nprod = 0 then
        raise exception '%: no hay productos activos ligados a este vaso', v_label;
      elsif v_nprod = 1 then
        select pr.id, pr.precio into v_prod_id, v_precio from public.productos pr
         where pr.talla_id = v_talla and pr.activo and pr.tipo = 'vaso';
        if v_precio is null then
          raise exception '%: el producto no tiene precio', v_label;
        end if;
        insert into public.detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
        values (v_venta_id, v_prod_id, v_vendidos, v_precio);
        v_total_vasos := v_total_vasos + v_vendidos * v_precio;
      else
        v_suma := 0;
        for rec in
          select x.producto_id, sum(x.cantidad)::integer as cantidad
            from jsonb_to_recordset(coalesce(r->'desglose', '[]'::jsonb))
                 as x(producto_id uuid, cantidad integer)
           where coalesce(x.cantidad, 0) > 0
           group by x.producto_id
        loop
          select pr.precio into v_precio from public.productos pr
           where pr.id = rec.producto_id and pr.talla_id = v_talla
             and pr.activo and pr.tipo = 'vaso';
          if not found then
            raise exception '%: hay un producto en el desglose que no pertenece a este vaso', v_label;
          end if;
          if v_precio is null then
            raise exception '%: un producto del desglose no tiene precio', v_label;
          end if;
          insert into public.detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
          values (v_venta_id, rec.producto_id, rec.cantidad, v_precio);
          v_total_vasos := v_total_vasos + rec.cantidad * v_precio;
          v_suma := v_suma + rec.cantidad;
        end loop;
        if v_suma <> v_vendidos then
          raise exception '%: el desglose suma % y se vendieron % vasos (deben ser iguales)',
            v_label, v_suma, v_vendidos;
        end if;
      end if;
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
    if v_final is null then
      raise exception '%: falta el conteo final', v_label;
    end if;
    if v_nuevos < 0 or v_final < 0 then
      raise exception '%: las cantidades no pueden ser negativas', v_label;
    end if;

    select coalesce(max((c->>'cantidad_final')::integer), 0) into v_inicio
      from jsonb_array_elements(v_base->'conteos') c
     where c->>'producto_id' = v_prod_id::text and c->>'talla_id' is null;

    if v_final > v_inicio + v_nuevos then
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

  update public.ventas set total = v_total where id = v_venta_id;
  if v_total = 0 then
    delete from public.ventas where id = v_venta_id;
  end if;

  update public.cierres_dia set
    dinero_base_inicio = v_dinero_base,
    dinero_final = v_dinero_final,
    total_gastos = v_total_gastos,
    total_transferencias = v_total_trans,
    total_domicilios = v_total_dom,
    total_ventas = v_total,
    observaciones = v_obs,
    estado = 'cerrado'
  where id = v_cierre_id;

  return jsonb_build_object(
    'cierre_id', v_cierre_id,
    'fecha', v_fecha,
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
