/**
 * Pruebas manuales POST /api/cierres (requiere sesión activa en el navegador).
 *
 * En consola (desarrollo), estando logueado en /dashboard/cierre:
 *
 *   await window.__cierreApiTests.runAll()
 *   await window.__cierreApiTests.prueba1()
 *   await window.__cierreApiTests.prueba2()
 *   await window.__cierreApiTests.prueba3()
 *   await window.__cierreApiTests.prueba4()
 *   await window.__cierreApiTests.prueba5()
 *   await window.__cierreApiTests.prueba6()
 *   await window.__cierreApiTests.prueba7()
 *   await window.__cierreApiTests.prueba8()
 *   await window.__cierreApiTests.prueba9()
 *   await window.__cierreApiTests.prueba10()
 *
 * O pega cada bloque fetch de este archivo en la consola.
 *
 * Notas:
 * - Prueba 7/9 usan fechas reales (hoy/ayer del servidor), no FECHA_PRUEBA.
 * - Prueba 8 requiere rol admin y debe ir al final de runAll() (cierra el cierre de prueba).
 */

import type { CierreDia, PrellenadoNuevo, Producto, TallaVaso } from '@/types'

const FECHA_PRUEBA = '2026-05-21'

const INICIOS_PRUEBA = [7, 4, 9, 16, 9, 19]
const FINALES_PRUEBA = [5, 3, 8, 14, 7, 16]

export type CierrePostResponse = {
  ok?: boolean
  cierre_id?: string
  total_ventas?: number
  total_gastos?: number
  total_transferencias?: number
  error?: string
}

export type PruebaResultado = {
  nombre: string
  ok: boolean
  status: number
  data: unknown
  checks: string[]
}

/** Fecha local YYYY-MM-DD (hoy + offset en días) */
export function fechaRelativa(diasDesdeHoy = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + diasDesdeHoy)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function postCierre(body: Record<string, unknown>): Promise<{
  status: number
  data: CierrePostResponse
}> {
  const res = await fetch('/api/cierres', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as CierrePostResponse
  return { status: res.status, data }
}

function check(
  cond: boolean,
  label: string,
  checks: string[]
): boolean {
  checks.push(cond ? `✓ ${label}` : `✗ ${label}`)
  return cond
}

async function fetchTallas(): Promise<TallaVaso[]> {
  const res = await fetch('/api/tallas-vasos', { credentials: 'include' })
  if (!res.ok) throw new Error('No se pudieron cargar tallas')
  const tallas = (await res.json()) as TallaVaso[]
  console.log('Tallas disponibles:', tallas)
  return tallas
}

async function fetchProductos(): Promise<Producto[]> {
  const res = await fetch('/api/productos', { credentials: 'include' })
  if (!res.ok) throw new Error('No se pudieron cargar productos')
  return (await res.json()) as Producto[]
}

async function fetchCierrePorFecha(fecha: string): Promise<CierreDia | null> {
  const res = await fetch(`/api/cierres?fecha=${fecha}`, {
    credentials: 'include',
  })
  if (!res.ok) return null
  return res.json() as Promise<CierreDia>
}

async function fetchPrellenado() {
  const res = await fetch('/api/cierres/prellenado', { credentials: 'include' })
  const data = await res.json()
  return { status: res.status, data }
}

type ConteoInput = {
  talla_id: string
  cantidad_inicio: number
  cantidad_nuevos: number
  cantidad_final: number
  observacion: string | null
}

function buildConteoDesdeTallas(
  tallas: TallaVaso[],
  opts?: {
    inicioPorIndice?: number[]
    nuevosPorIndice?: (i: number) => number
    finalPorIndice?: number[]
    observacionEnIndice?: number
    observacionTexto?: string
    finalFijo?: number
  }
): ConteoInput[] {
  return tallas.map((t, i) => ({
    talla_id: t.id,
    cantidad_inicio: opts?.inicioPorIndice?.[i] ?? 0,
    cantidad_nuevos: opts?.nuevosPorIndice?.(i) ?? 0,
    cantidad_final: opts?.finalPorIndice?.[i] ?? opts?.finalFijo ?? 5,
    observacion:
      opts?.observacionEnIndice === i
        ? (opts.observacionTexto ?? null)
        : null,
  }))
}

/** PRUEBA 1: solo fecha y caja — arrays opcionales ausentes */
export async function prueba1CierreMinimo(
  fecha = FECHA_PRUEBA
): Promise<PruebaResultado> {
  const checks: string[] = []
  const { status, data } = await postCierre({
    fecha,
    dinero_base_inicio: 441850,
    dinero_final: 500000,
  })

  console.log('PRUEBA 1 (mínimo):', { status, data })

  const ok =
    check(status === 200 || status === 201, `status ${status}`, checks) &&
    check(data.ok === true, 'ok: true', checks) &&
    check(Boolean(data.cierre_id), 'cierre_id presente', checks) &&
    check(data.total_ventas === 0, 'total_ventas === 0', checks) &&
    check(data.total_gastos === 0, 'total_gastos === 0', checks) &&
    check(data.total_transferencias === 0, 'total_transferencias === 0', checks)

  return { nombre: 'PRUEBA 1 — cierre mínimo', ok, status, data, checks }
}

/** PRUEBA 2: gastos sí, transferencias ausentes */
export async function prueba2GastosSinTransferencias(
  fecha = FECHA_PRUEBA
): Promise<PruebaResultado> {
  const checks: string[] = []
  const { status, data } = await postCierre({
    fecha,
    dinero_base_inicio: 441850,
    dinero_final: 500000,
    gastos: [
      { descripcion: 'D1', monto: 35250 },
      { descripcion: 'Desecho', monto: 60000 },
      { descripcion: 'Leche de Juanjo', monto: 0 },
    ],
  })

  console.log('PRUEBA 2 (gastos sin trans):', { status, data })

  const ok =
    check(status === 200 || status === 201, `status ${status}`, checks) &&
    check(data.ok === true, 'ok: true', checks) &&
    check(data.total_gastos === 95250, 'total_gastos === 95250', checks) &&
    check(data.total_transferencias === 0, 'total_transferencias === 0', checks)

  return { nombre: 'PRUEBA 2 — gastos sin transferencias', ok, status, data, checks }
}

/** PRUEBA 3: transferencias sí, gastos ausentes */
export async function prueba3TransferenciasSinGastos(
  fecha = FECHA_PRUEBA
): Promise<PruebaResultado> {
  const checks: string[] = []
  const { status, data } = await postCierre({
    fecha,
    dinero_base_inicio: 441850,
    dinero_final: 500000,
    transferencias: [
      { descripcion: 'Nequi', monto: 181000 },
      { descripcion: 'QR', monto: 39000 },
    ],
  })

  console.log('PRUEBA 3 (trans sin gastos):', { status, data })

  const ok =
    check(status === 200 || status === 201, `status ${status}`, checks) &&
    check(data.ok === true, 'ok: true', checks) &&
    check(data.total_transferencias === 220000, 'total_transferencias === 220000', checks) &&
    check(data.total_gastos === 0, 'total_gastos === 0', checks)

  return {
    nombre: 'PRUEBA 3 — transferencias sin gastos',
    ok,
    status,
    data,
    checks,
  }
}

/** PRUEBA 4: conteo de vasos para todas las tallas activas */
export async function prueba4ConteoVasosCompleto(
  fecha = FECHA_PRUEBA
): Promise<PruebaResultado> {
  const checks: string[] = []
  const tallas = await fetchTallas()

  const { status, data } = await postCierre({
    fecha,
    dinero_base_inicio: 441850,
    dinero_final: 500000,
    conteo_vasos: buildConteoDesdeTallas(tallas, { finalFijo: 5 }),
  })

  console.log('PRUEBA 4 (conteo vasos):', { status, data })

  const cierre = await fetchCierrePorFecha(fecha)
  const conteoGuardado = (cierre as { conteo_vasos?: unknown[] })?.conteo_vasos

  const ok =
    check(status === 200 || status === 201, `status ${status}`, checks) &&
    check(data.ok === true, 'ok: true', checks) &&
    check(Boolean(data.cierre_id), 'cierre_id presente', checks) &&
    check(
      Array.isArray(conteoGuardado) && conteoGuardado.length === tallas.length,
      `conteo_vasos guardado (${conteoGuardado?.length ?? 0} filas)`,
      checks
    )

  return { nombre: 'PRUEBA 4 — conteo vasos completo', ok, status, data, checks }
}

const OBS_PRUEBA_5 = '1 vaso se cayó y se dañó durante el servicio'

/** PRUEBA 5: observación en un vaso */
export async function prueba5ConteoConObservacion(
  fecha = FECHA_PRUEBA
): Promise<PruebaResultado> {
  const checks: string[] = []
  const tallas = await fetchTallas()
  const primera = tallas[0]
  if (!primera) {
    checks.push('✗ No hay tallas activas')
    return {
      nombre: 'PRUEBA 5 — conteo con observación',
      ok: false,
      status: 0,
      data: { error: 'Sin tallas' },
      checks,
    }
  }

  const { status, data } = await postCierre({
    fecha,
    dinero_base_inicio: 441850,
    dinero_final: 500000,
    conteo_vasos: [
      {
        talla_id: primera.id,
        cantidad_inicio: 10,
        cantidad_nuevos: 0,
        cantidad_final: 7,
        observacion: OBS_PRUEBA_5,
      },
    ],
  })

  console.log('PRUEBA 5 (con observación):', { status, data })

  const cierre = await fetchCierrePorFecha(fecha)
  const fila = (
    cierre as { conteo_vasos?: { talla_id: string; observacion?: string }[] }
  )?.conteo_vasos?.find((c) => c.talla_id === primera.id)

  const ok =
    check(status === 200 || status === 201, `status ${status}`, checks) &&
    check(data.ok === true, 'ok: true', checks) &&
    check(fila?.observacion === OBS_PRUEBA_5, 'observación guardada', checks)

  return { nombre: 'PRUEBA 5 — conteo con observación', ok, status, data, checks }
}

/** PRUEBA 6: cierre completo (gastos, transferencias, conteo, ventas) */
export async function prueba6CierreCompleto(
  fecha = FECHA_PRUEBA
): Promise<PruebaResultado> {
  const checks: string[] = []
  const tallas = await fetchTallas()
  const productos = await fetchProductos()

  const items = productos.slice(0, 5).map((p) => ({
    producto_id: p.id,
    cantidad: Math.floor(Math.random() * 10) + 1,
    precio_unitario: p.precio,
  }))
  const total_ventas_esperado = items.reduce(
    (s, i) => s + i.cantidad * i.precio_unitario,
    0
  )

  const { status, data } = await postCierre({
    fecha,
    dinero_base_inicio: 441850,
    dinero_final: 600000,
    observaciones: 'Día normal, buen clima',
    gastos: [
      { descripcion: 'D1', monto: 35250 },
      { descripcion: 'Desecho', monto: 60000 },
      { descripcion: 'Copas', monto: 37000 },
      { descripcion: 'Queso', monto: 40000 },
      { descripcion: 'Leche de Juanjo', monto: 0 },
    ],
    transferencias: [
      { descripcion: 'Nequi', monto: 181000 },
      { descripcion: 'QR', monto: 39000 },
      { descripcion: 'Datafono', monto: 33500 },
      { descripcion: 'Rappi', monto: 97000 },
      { descripcion: 'Domicilios', monto: 19000 },
    ],
    conteo_vasos: buildConteoDesdeTallas(tallas, {
      inicioPorIndice: INICIOS_PRUEBA,
      nuevosPorIndice: (i) => (i === 0 ? 50 : 0),
      finalPorIndice: FINALES_PRUEBA,
      observacionEnIndice: 2,
      observacionTexto: '1 vaso se dañó al caerse',
    }),
    items_vendidos: items,
  })

  console.log('PRUEBA 6 (completo):', { status, data })

  const ok =
    check(status === 200 || status === 201, `status ${status}`, checks) &&
    check(data.ok === true, 'ok: true', checks) &&
    check(data.total_gastos === 172250, 'total_gastos === 172250', checks) &&
    check(data.total_transferencias === 369500, 'total_transferencias === 369500', checks) &&
    check(
      data.total_ventas === total_ventas_esperado,
      `total_ventas === ${total_ventas_esperado}`,
      checks
    )

  return { nombre: 'PRUEBA 6 — cierre completo', ok, status, data, checks }
}

/** PRUEBA 7: pre-llenado — dinero y vasos desde el cierre de ayer */
export async function prueba7Prellenado(): Promise<PruebaResultado> {
  const checks: string[] = []
  const ayer = fechaRelativa(-1)
  const { status, data: pre } = await fetchPrellenado()

  console.log('PRUEBA 7 (prellenado):', pre)

  const cierreAyer = await fetchCierrePorFecha(ayer)

  if ((pre as { tipo?: string }).tipo === 'cierre_existente') {
    const ok =
      check(status === 200, `status ${status}`, checks) &&
      check(true, 'cierre_existente hoy (sin comparar con ayer)', checks)
    return {
      nombre: 'PRUEBA 7 — prellenado (cierre hoy)',
      ok,
      status,
      data: pre,
      checks,
    }
  }

  const nuevo = pre as PrellenadoNuevo
  let ok =
    check(status === 200, `status ${status}`, checks) &&
    check(nuevo.tipo === 'nuevo', "tipo === 'nuevo'", checks) &&
    check(Array.isArray(nuevo.conteo_vasos), 'conteo_vasos es array', checks)

  if (cierreAyer) {
    ok =
      ok &&
      check(
        nuevo.dinero_base_inicio === cierreAyer.dinero_final,
        `dinero_base_inicio (${nuevo.dinero_base_inicio}) = dinero_final ayer (${cierreAyer.dinero_final})`,
        checks
      )

    for (const cv of nuevo.conteo_vasos) {
      const filaAyer = cierreAyer.conteo_vasos?.find(
        (c) => c.talla_id === cv.talla_id
      )
      const esperado = filaAyer?.cantidad_final ?? 0
      ok =
        ok &&
        check(
          cv.cantidad_inicio === esperado,
          `cantidad_inicio talla ${cv.talla?.onzas ?? cv.talla_id} = ${esperado}`,
          checks
        )
      ok =
        ok &&
        check(
          cv.cantidad_nuevos === 0 || cv.cantidad_nuevos === null,
          'cantidad_nuevos sin registrar',
          checks
        )
      ok = ok && check(Boolean(cv.talla), 'talla embebida', checks)
    }
  } else {
    checks.push(`⚠ Sin cierre en ${ayer} — no se validó dinero/vasos vs ayer`)
  }

  return { nombre: 'PRUEBA 7 — prellenado', ok, status, data: pre, checks }
}

/** PRUEBA 8: un cierre cerrado no acepta otro POST */
export async function prueba8CierreCerradoNoEditable(
  fecha = FECHA_PRUEBA
): Promise<PruebaResultado> {
  const checks: string[] = []

  const primero = await postCierre({
    fecha,
    dinero_base_inicio: 441850,
    dinero_final: 500000,
  })
  console.log('PRUEBA 8 (primer POST, cierra el día):', primero)

  if (primero.status === 403) {
    checks.push('✗ Requiere sesión admin para POST /api/cierres')
    return {
      nombre: 'PRUEBA 8 — cierre cerrado no editable',
      ok: false,
      status: primero.status,
      data: primero.data,
      checks,
    }
  }

  const { status, data } = await postCierre({
    fecha,
    dinero_base_inicio: 999999,
    dinero_final: 999999,
  })

  console.log('PRUEBA 8 (segundo POST, debe rechazar):', { status, data })

  const err = (data as CierrePostResponse).error ?? ''
  const ok =
    check(
      primero.status >= 200 && primero.status < 300,
      'primer POST cerró el día',
      checks
    ) &&
    check(status === 400, `POST rechazado status ${status}`, checks) &&
    check(err.includes('cerrado'), 'mensaje día cerrado', checks)

  return {
    nombre: 'PRUEBA 8 — cierre cerrado no editable',
    ok,
    status,
    data,
    checks,
  }
}

/** PRUEBA 9: GET cierre por fecha (ayer) */
export async function prueba9GetCierrePorFecha(): Promise<PruebaResultado> {
  const checks: string[] = []
  const ayer = fechaRelativa(-1)

  const res = await fetch(`/api/cierres?fecha=${ayer}`, {
    credentials: 'include',
  })
  const data = (await res.json()) as CierreDia & { error?: string }

  const resumen = {
    fecha: data?.fecha,
    gastos: data?.gastos?.length,
    transferencias: data?.transferencias?.length,
    conteo_vasos: data?.conteo_vasos?.length,
    total_transferencias: data?.total_transferencias,
    total_gastos: data?.total_gastos,
  }
  console.log('PRUEBA 9 (GET por fecha):', resumen, data)

  if (!res.ok) {
    checks.push(`✗ GET ${res.status}: ${data?.error ?? 'sin cierre ayer'}`)
    return {
      nombre: 'PRUEBA 9 — GET por fecha',
      ok: false,
      status: res.status,
      data,
      checks,
    }
  }

  const tallas = await fetchTallas().catch(() => [] as TallaVaso[])
  const conteoEsperado = tallas.length > 0 ? tallas.length : undefined

  let ok =
    check(data.fecha === ayer, `fecha === ${ayer}`, checks) &&
    check((data.gastos?.length ?? 0) > 0, `gastos: ${data.gastos?.length ?? 0}`, checks) &&
    check(
      (data.transferencias?.length ?? 0) > 0,
      `transferencias: ${data.transferencias?.length ?? 0}`,
      checks
    ) &&
    check(
      (data.conteo_vasos?.length ?? 0) > 0,
      `conteo_vasos: ${data.conteo_vasos?.length ?? 0}`,
      checks
    ) &&
    check(typeof data.total_gastos === 'number', 'total_gastos numérico', checks) &&
    check(
      typeof data.total_transferencias === 'number',
      'total_transferencias numérico',
      checks
    )

  if (conteoEsperado !== undefined) {
    ok =
      ok &&
      check(
        data.conteo_vasos?.length === conteoEsperado,
        `conteo_vasos (${data.conteo_vasos?.length}) = tallas activas (${conteoEsperado})`,
        checks
      )
  }

  return { nombre: 'PRUEBA 9 — GET por fecha', ok, status: res.status, data, checks }
}

/** PRUEBA 10: primer POST parcial y segundo POST completo (200 al actualizar) */
export async function prueba10ActualizarCierre(
  fecha = FECHA_PRUEBA
): Promise<PruebaResultado> {
  const checks: string[] = []

  const paso1 = await postCierre({
    fecha,
    dinero_base_inicio: 441850,
    dinero_final: 0,
    gastos: [{ descripcion: 'D1', monto: 35250 }],
  })
  console.log('PRUEBA 10 paso 1:', paso1)

  const paso2 = await postCierre({
    fecha,
    dinero_base_inicio: 441850,
    dinero_final: 600000,
    gastos: [
      { descripcion: 'D1', monto: 35250 },
      { descripcion: 'Leche de Juanjo', monto: 0 },
    ],
    transferencias: [{ descripcion: 'Nequi', monto: 181000 }],
  })
  console.log('PRUEBA 10 (actualizar cierre):', paso2)

  const cierre = await fetchCierrePorFecha(fecha)
  const gastosCount = cierre?.gastos?.length ?? 0

  const ok =
    check(paso1.status === 200 || paso1.status === 201, `paso1 status ${paso1.status}`, checks) &&
    check(paso2.status === 200, `paso2 status 200 (fue ${paso2.status})`, checks) &&
    check(paso2.data.ok === true, 'ok: true', checks) &&
    check(paso2.data.total_gastos === 35250, 'total_gastos === 35250', checks) &&
    check(
      paso2.data.total_transferencias === 181000,
      'total_transferencias === 181000',
      checks
    ) &&
    check(gastosCount === 2, `sin duplicar gastos (${gastosCount} filas)`, checks)

  return {
    nombre: 'PRUEBA 10 — actualizar cierre',
    ok,
    status: paso2.status,
    data: paso2.data,
    checks,
  }
}

export async function runAllCierreApiTests(fecha = FECHA_PRUEBA) {
  console.group('🧪 Pruebas API cierres')
  const results = [
    await prueba1CierreMinimo(fecha),
    await prueba2GastosSinTransferencias(fecha),
    await prueba3TransferenciasSinGastos(fecha),
    await prueba4ConteoVasosCompleto(fecha),
    await prueba5ConteoConObservacion(fecha),
    await prueba6CierreCompleto(fecha),
    await prueba7Prellenado(),
    await prueba9GetCierrePorFecha(),
    await prueba10ActualizarCierre(fecha),
    await prueba8CierreCerradoNoEditable(fecha),
  ]

  for (const r of results) {
    console.log(`\n${r.nombre}`)
    r.checks.forEach((c) => console.log(' ', c))
    if (!r.ok) {
      const err = (r.data as { error?: string })?.error
      console.warn('Falló:', err ?? r.data)
    }
  }

  const allOk = results.every((r) => r.ok)
  console.log(allOk ? '\n✅ Todas pasaron' : '\n❌ Hay fallos')
  console.groupEnd()
  return { allOk, results }
}

/** Registra helpers en window (solo llamar en desarrollo desde un client component) */
export function registerCierreApiTestsInBrowser() {
  if (typeof window === 'undefined') return

  const api = {
    runAll: runAllCierreApiTests,
    prueba1: prueba1CierreMinimo,
    prueba2: prueba2GastosSinTransferencias,
    prueba3: prueba3TransferenciasSinGastos,
    prueba4: prueba4ConteoVasosCompleto,
    prueba5: prueba5ConteoConObservacion,
    prueba6: prueba6CierreCompleto,
    prueba7: prueba7Prellenado,
    prueba8: prueba8CierreCerradoNoEditable,
    prueba9: prueba9GetCierrePorFecha,
    prueba10: prueba10ActualizarCierre,
    fecha: FECHA_PRUEBA,
    fechaHoy: () => fechaRelativa(0),
    fechaAyer: () => fechaRelativa(-1),
  }

  ;(window as Window & { __cierreApiTests?: typeof api }).__cierreApiTests = api
  console.info(
    '[cierre tests] window.__cierreApiTests — runAll(), prueba1()…prueba10()'
  )
}
