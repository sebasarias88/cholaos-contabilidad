-- Vasos activos sin talla_id: crear talla en tallas_vasos y enlazar producto.
-- Ejecutar en Supabase SQL Editor si hay productos que no aparecen en el cierre.

DO $$
DECLARE
  r RECORD;
  new_talla_id uuid;
  v_onzas numeric;
  v_tipo text;
BEGIN
  FOR r IN
    SELECT id, nombre, onzas
    FROM public.productos
    WHERE tipo = 'vaso'
      AND activo = true
      AND talla_id IS NULL
    ORDER BY nombre
  LOOP
    v_onzas := r.onzas;

    IF v_onzas IS NULL OR v_onzas <= 0 THEN
      IF r.nombre ILIKE '%extra grande%' THEN
        v_onzas := 16;
      ELSIF r.nombre ILIKE '%pequeño%' OR r.nombre ILIKE '%12oz%' OR r.nombre ILIKE '%12 oz%' THEN
        v_onzas := 12;
      ELSIF r.nombre ILIKE '%grande%' THEN
        v_onzas := 14;
      ELSE
        v_onzas := 16;
      END IF;

      UPDATE public.productos SET onzas = v_onzas WHERE id = r.id;
    END IF;

    v_tipo := 'normal';
    IF r.nombre ILIKE 'guanabanazo' AND r.nombre NOT ILIKE '%extra%' THEN
      v_tipo := 'angosto';
    ELSIF r.nombre ILIKE 'granizado%' THEN
      v_tipo := 'angosto';
    END IF;

    INSERT INTO public.tallas_vasos (onzas, tipo, descripcion, activo)
    VALUES (v_onzas, v_tipo, r.nombre, true)
    RETURNING id INTO new_talla_id;

    UPDATE public.productos
    SET talla_id = new_talla_id
    WHERE id = r.id;
  END LOOP;
END $$;
