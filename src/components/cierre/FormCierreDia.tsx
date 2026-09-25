'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { CierreCajaShell } from '@/components/cierre/CierrePanelSticky'
import type { ConteoProductoValor, ConteoVasoValor } from '@/types'
import { NovedadesDrawer } from '@/components/cierre/NovedadesDrawer'
import { SeccionComida } from '@/components/cierre/SeccionComida'
import { SeccionHeader } from '@/components/cierre/SeccionHeader'
import { TablaProductos, TablaVasos } from '@/components/cierre/TablasConteo'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCuadre } from '@/hooks/useCuadre'
import { fadeUp } from '@/lib/animations'
import { tipoProducto } from '@/lib/productos-ui'
import {
  calcularItemsVendidos,
  erroresDesgloseVasos,
  vendidosReales,
} from '@/lib/ventas-desde-vasos'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import { formatFecha } from '@/lib/utils'
import type {
  CierreDia,
  CierreDiaEmpleado,
  ConteoProductoInput,
  ConteoProductoPrellenado,
  ConteoVaso,
  EstadoCierre,
  DomicilioDia,
  GastoDia,
  GuardarCierrePayload,
  GuardarCierreResponse,
  MedioTransferencia,
  MotivoNovedad,
  PrellenadoCierreResponse,
  DetalleVenta,
  Producto,
  Rol,
  TallaVaso,
  TransferenciaDia,
  VentaComidaInput,
  VentaVarianteInput,
} from '@/types'

const HOY = format(new Date(), 'yyyy-MM-dd')

type ConteoVasoRow = ConteoVasoValor & {
  talla_id: string
  talla?: TallaVaso
}

type ConteoProductoRow = ConteoProductoValor & {
  producto_id: string
  producto: Producto
}

type LineaGasto = {
  id: string
  descripcion: string
  monto: number
}

type LineaTransferencia = {
  id: string
  medio_id: string
  descripcion: string
  monto: number
}

type LineaDomicilio = {
  id: string
  descripcion: string
  monto: number
}

function tempId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 0 del prellenado nuevo = aún sin registrar → null en UI */
function vacíoSiCero(n: number): number | null {
  return n === 0 ? null : n
}

function tallaDesdeProducto(producto: Producto, tallaId: string): TallaVaso {
  if (producto.talla) return producto.talla
  return {
    id: tallaId,
    onzas: producto.onzas ?? 0,
    descripcion: producto.nombre,
    tipo: 'normal',
    activo: true,
    created_at: producto.created_at,
  }
}

function aplicarPrellenadoProductos(filas: ConteoProductoPrellenado[]) {
  const vasos: ConteoVasoRow[] = []
  const insumos: ConteoProductoRow[] = []
  const tallasVistas = new Set<string>()

  for (const c of filas) {
    if (c.tipo === 'vaso') {
      if (!c.talla_id || tallasVistas.has(c.talla_id)) continue
      tallasVistas.add(c.talla_id)
      vasos.push({
        talla_id: c.talla_id,
        talla: tallaDesdeProducto(c.producto, c.talla_id),
        cantidad_inicio: c.cantidad_inicio,
        cantidad_nuevos: vacíoSiCero(c.cantidad_nuevos),
        cantidad_final: vacíoSiCero(c.cantidad_final),
        novedades: c.novedades ?? [],
        desglose: [],
      })
      continue
    }

    if (c.tipo !== 'insumo') continue

    insumos.push({
      producto_id: c.producto_id,
      producto: c.producto,
      cantidad_inicio: c.cantidad_inicio,
      cantidad_nuevos: vacíoSiCero(c.cantidad_nuevos),
      cantidad_final: vacíoSiCero(c.cantidad_final),
    })
  }

  return { vasos, insumos }
}

function desgloseGuardado(
  vasos: ConteoVasoRow[],
  prods: Producto[],
  detalle: DetalleVenta[]
): ConteoVasoRow[] {
  return vasos.map((row) => {
    const delTalla = prods
      .filter(
        (p) =>
          p.activo &&
          p.talla_id === row.talla_id &&
          tipoProducto(p) === 'vaso'
      )
      .sort(
        (a, b) =>
          (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre, 'es')
      )
    if (delTalla.length < 2) return row

    const desglose = delTalla.flatMap((p) => {
      const line = detalle.find(
        (d) => d.producto_id === p.id && (d.origen ?? 'vaso') === 'vaso'
      )
      if (!line || line.cantidad <= 0) return []
      return [
        {
          producto_id: p.id,
          cantidad: line.cantidad,
          precio_unitario: line.precio_unitario,
        },
      ]
    })
    return { ...row, desglose }
  })
}

interface FormCierreDiaProps {
  rol: Rol
  /** Admin corrige un día ya cerrado. Nunca es hoy. */
  fechaCorreccion?: string | null
}

export function FormCierreDia({
  rol,
  fechaCorreccion = null,
}: FormCierreDiaProps) {
  const esAdmin = rol === 'admin'
  const fechaTrabajo = fechaCorreccion ?? HOY
  const esOtraFecha = Boolean(fechaCorreccion)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cierreId, setCierreId] = useState<string | null>(null)
  const [estado, setEstado] = useState<EstadoCierre | null>(null)
  const [corrigiendo, setCorrigiendo] = useState(false)

  const [conteoVasos, setConteoVasos] = useState<ConteoVasoRow[]>([])
  const [conteoInsumos, setConteoInsumos] = useState<ConteoProductoRow[]>([])
  const [motivos, setMotivos] = useState<MotivoNovedad[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [ventasVariantes, setVentasVariantes] = useState<VentaVarianteInput[]>(
    []
  )
  const [ventasComida, setVentasComida] = useState<VentaComidaInput[]>([])

  const [gastos, setGastos] = useState<LineaGasto[]>([])
  const [transferencias, setTransferencias] = useState<LineaTransferencia[]>(
    []
  )
  const [domicilios, setDomicilios] = useState<LineaDomicilio[]>([])
  const [mediosTransferencia, setMediosTransferencia] = useState<
    MedioTransferencia[]
  >([])

  const [dineroBase, setDineroBase] = useState(0)
  const [dineroFinal, setDineroFinal] = useState(0)
  const [novedadesTallaId, setNovedadesTallaId] = useState<string | null>(null)

  const bloqueado = estado === 'cerrado' && !(esAdmin && corrigiendo)

  const aplicarCierre = useCallback(
    (
      cierre: CierreDia | CierreDiaEmpleado,
      prods: Producto[],
      detalle: DetalleVenta[] = []
    ) => {
      setCierreId(cierre.id)
      setEstado(cierre.estado)
      setDineroBase(cierre.dinero_base_inicio)
      setDineroFinal(cierre.dinero_final)
      setGastos(
        (cierre.gastos ?? []).map((g: GastoDia) => ({
          id: g.id,
          descripcion: g.descripcion,
          monto: g.monto,
        }))
      )
      setTransferencias(
        (cierre.transferencias ?? []).map((t: TransferenciaDia) => ({
          id: t.id,
          medio_id: t.medio_id ?? '',
          descripcion: t.medio?.nombre ?? t.descripcion,
          monto: t.monto,
        }))
      )
      setDomicilios(
        (cierre.domicilios ?? []).map((d: DomicilioDia) => ({
          id: d.id,
          descripcion: d.descripcion?.trim() ?? '',
          monto: d.monto,
        }))
      )

      setVentasVariantes(
        (cierre.ventas_variantes ?? []).map((v) => ({
          variante_id: v.variante_id,
          cantidad: v.cantidad,
        }))
      )
      setVentasComida(
        (cierre.ventas_comida ?? []).map((v) => ({
          producto_id: v.producto_id,
          cantidad: v.cantidad,
        }))
      )

      const vasos: ConteoVasoRow[] = []
      const insumos: ConteoProductoRow[] = []

      for (const c of cierre.conteo_vasos ?? []) {
        const row = c as ConteoVaso
        if (row.talla_id) {
          vasos.push({
            talla_id: row.talla_id,
            talla: row.talla,
            cantidad_inicio: row.cantidad_inicio,
            cantidad_nuevos: row.cantidad_nuevos,
            cantidad_final: row.cantidad_final,
            novedades: (row.novedades ?? []).map((n) => ({
              motivo_id: n.motivo_id,
              motivo_custom: n.motivo_custom,
              cantidad: n.cantidad,
            })),
            desglose: [],
          })
          continue
        }

        if (!row.producto_id) continue
        const producto =
          row.producto ?? prods.find((p) => p.id === row.producto_id)
        if (!producto) continue
        if (tipoProducto(producto) !== 'insumo') continue

        insumos.push({
          producto_id: row.producto_id,
          producto,
          cantidad_inicio: row.cantidad_inicio,
          cantidad_nuevos: row.cantidad_nuevos,
          cantidad_final: row.cantidad_final,
        })
      }

      setConteoVasos(
        detalle.length > 0 ? desgloseGuardado(vasos, prods, detalle) : vasos
      )
      setConteoInsumos(insumos)
    },
    []
  )

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      setCorrigiendo(false)
      try {
        const [preRes, prodRes, motivosRes, mediosRes] = await Promise.all([
          esOtraFecha
            ? fetch(`/api/cierres?fecha=${fechaTrabajo}`)
            : fetch('/api/cierres/prellenado'),
          fetch('/api/productos'),
          fetch('/api/motivos-novedad'),
          fetch('/api/medios-transferencia'),
        ])

        if (!preRes.ok) throw new Error('prellenado')
        const pre = esOtraFecha
          ? null
          : ((await preRes.json()) as PrellenadoCierreResponse)
        const cierreOtraFecha = esOtraFecha
          ? ((await preRes.json()) as CierreDia | null)
          : null
        const prods: Producto[] = prodRes.ok ? await prodRes.json() : []
        const motivosData: MotivoNovedad[] = motivosRes.ok
          ? await motivosRes.json()
          : []
        const mediosData: MedioTransferencia[] = mediosRes.ok
          ? await mediosRes.json()
          : []
        if (cancelled) return
        setProductos(prods)
        setMotivos(motivosData)
        setMediosTransferencia(
          mediosData.filter((m) => m.activo).sort((a, b) => a.orden - b.orden)
        )

        async function detalleDelDia(fecha: string) {
          const res = await fetch(`/api/ventas?desde=${fecha}&hasta=${fecha}`)
          if (!res.ok) return [] as DetalleVenta[]
          const ventas = (await res.json()) as { detalle?: DetalleVenta[] }[]
          return ventas.flatMap((v) => v.detalle ?? [])
        }

        if (esOtraFecha) {
          if (!cierreOtraFecha) {
            toastError('No hay cierre en esa fecha')
          } else {
            const detalle = await detalleDelDia(fechaTrabajo)
            if (cancelled) return
            aplicarCierre(cierreOtraFecha, prods, detalle)
          }
        } else if (pre?.tipo === 'cierre_existente' && pre.cierre) {
          const detalle = await detalleDelDia(HOY)
          if (cancelled) return
          aplicarCierre(pre.cierre, prods, detalle)
        } else if (pre?.tipo === 'nuevo') {
          setCierreId(null)
          setEstado(null)
          setCorrigiendo(false)
          setNovedadesTallaId(null)
          setDineroBase(pre.dinero_base_inicio ?? 0)
          setDineroFinal(0)
          const { vasos, insumos } = aplicarPrellenadoProductos(
            pre.conteo_productos ?? []
          )
          setConteoVasos(vasos)
          setConteoInsumos(insumos)
          setVentasVariantes([])
          setVentasComida([])
          setGastos([])
          setTransferencias([])
          setDomicilios([])
        }
      } catch {
        toastError('Error cargando el cierre del día')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [aplicarCierre, esOtraFecha, fechaTrabajo])

  const itemsVendidosVasos = useMemo(
    () => calcularItemsVendidos(conteoVasos, productos),
    [conteoVasos, productos]
  )

  const itemsVendidos = useMemo(() => {
    const variantes = ventasVariantes
      .filter((v) => v.cantidad > 0)
      .map((v) => {
        const variante = productos
          .flatMap((p) => p.variantes ?? [])
          .find((va) => va.id === v.variante_id)
        return {
          cantidad: v.cantidad,
          precio_unitario: variante?.precio ?? 0,
        }
      })
    const comida = ventasComida
      .filter((v) => v.cantidad > 0)
      .map((v) => {
        const producto = productos.find((p) => p.id === v.producto_id)
        return {
          cantidad: v.cantidad,
          precio_unitario: producto?.precio ?? 0,
        }
      })
    return [...itemsVendidosVasos, ...variantes, ...comida]
  }, [itemsVendidosVasos, ventasVariantes, ventasComida, productos])

  const totalVasosPesos = useMemo(
    () =>
      itemsVendidosVasos.reduce(
        (s, i) => s + i.cantidad * i.precio_unitario,
        0
      ),
    [itemsVendidosVasos]
  )

  const totalVasosVendidos = useMemo(
    () => conteoVasos.reduce((s, r) => s + vendidosReales(r), 0),
    [conteoVasos]
  )

  const productosComida = useMemo(
    () =>
      productos.filter(
        (p) => p.activo && tipoProducto(p) === 'comida'
      ),
    [productos]
  )

  const productosPorTalla = useMemo(() => {
    const map: Record<string, Producto[]> = {}
    for (const p of productos) {
      if (p.talla_id && p.activo && tipoProducto(p) === 'vaso') {
        if (!map[p.talla_id]) map[p.talla_id] = []
        map[p.talla_id].push(p)
      }
    }
    for (const id of Object.keys(map)) {
      map[id].sort(
        (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre)
      )
    }
    return map
  }, [productos])

  const vasoNovedadesActivo = useMemo(
    () => conteoVasos.find((r) => r.talla_id === novedadesTallaId) ?? null,
    [conteoVasos, novedadesTallaId]
  )

  const tituloNovedades = useMemo(() => {
    if (!vasoNovedadesActivo) return ''
    const t = vasoNovedadesActivo.talla
    const prods = productosPorTalla[vasoNovedadesActivo.talla_id] ?? []
    const nombre = t?.descripcion ?? prods[0]?.nombre
    const oz = t ? `${t.onzas} oz` : ''
    return nombre ? `${nombre}${oz ? ` · ${oz}` : ''}` : oz || 'Vaso'
  }, [vasoNovedadesActivo, productosPorTalla])

  const cuadre = useCuadre({
    dineroBaseInicio: dineroBase,
    dineroFinal,
    itemsVendidos,
    transferencias,
    gastos,
    domicilios,
    esAdmin,
  })

  function updateConteoVaso<K extends keyof ConteoVasoValor>(
    tallaId: string,
    campo: K,
    value: ConteoVasoValor[K]
  ) {
    setConteoVasos((rows) =>
      rows.map((r) => (r.talla_id === tallaId ? { ...r, [campo]: value } : r))
    )
  }

  function updateDesgloseVaso(
    tallaId: string,
    productoId: string,
    cantidad: number
  ) {
    setConteoVasos((rows) =>
      rows.map((r) => {
        if (r.talla_id !== tallaId) return r
        const qty = Math.max(0, cantidad)
        const resto = r.desglose.filter((d) => d.producto_id !== productoId)
        const desglose =
          qty > 0
            ? [...resto, { producto_id: productoId, cantidad: qty }]
            : resto
        return { ...r, desglose }
      })
    )
  }

  function updateConteoInsumo<K extends keyof ConteoProductoValor>(
    productoId: string,
    campo: K,
    value: ConteoProductoValor[K]
  ) {
    setConteoInsumos((rows) =>
      rows.map((r) =>
        r.producto_id === productoId ? { ...r, [campo]: value } : r
      )
    )
  }

  function handleVarianteChange(varianteId: string, cantidad: number) {
    setVentasVariantes((prev) => {
      const existe = prev.find((v) => v.variante_id === varianteId)
      if (existe) {
        return prev.map((v) =>
          v.variante_id === varianteId ? { ...v, cantidad } : v
        )
      }
      return [...prev, { variante_id: varianteId, cantidad }]
    })
  }

  function handleComidaChange(productoId: string, cantidad: number) {
    setVentasComida((prev) => {
      const existe = prev.find((v) => v.producto_id === productoId)
      if (existe) {
        return prev.map((v) =>
          v.producto_id === productoId ? { ...v, cantidad } : v
        )
      }
      return [...prev, { producto_id: productoId, cantidad }]
    })
  }

  function agregarGasto(descripcion: string, monto: number) {
    setGastos((g) => [...g, { id: tempId(), descripcion, monto }])
  }

  function agregarTransferencia(medioId: string, nombre: string, monto: number) {
    setTransferencias((t) => [
      ...t,
      { id: tempId(), medio_id: medioId, descripcion: nombre, monto },
    ])
  }

  function agregarDomicilio(descripcion: string, monto: number) {
    setDomicilios((d) => [
      ...d,
      { id: tempId(), descripcion, monto },
    ])
  }

  function editarGasto(id: string, descripcion: string, monto: number) {
    setGastos((list) =>
      list.map((g) => (g.id === id ? { ...g, descripcion, monto } : g))
    )
  }

  function editarTransferencia(
    id: string,
    medioId: string,
    nombre: string,
    monto: number
  ) {
    setTransferencias((list) =>
      list.map((t) =>
        t.id === id
          ? { ...t, medio_id: medioId, descripcion: nombre, monto }
          : t
      )
    )
  }

  function editarDomicilio(id: string, descripcion: string, monto: number) {
    setDomicilios((list) =>
      list.map((d) => (d.id === id ? { ...d, descripcion, monto } : d))
    )
  }

  function buildPayload(): GuardarCierrePayload {
    const vasos: ConteoProductoInput[] = conteoVasos.map((r) => {
      const prods = productos.filter(
        (p) => p.activo && p.talla_id === r.talla_id
      )
      const vendidos = vendidosReales(r)
      const desglose =
        r.desglose.length > 0
          ? r.desglose
              .filter((d) => d.cantidad > 0)
              .map((d) => {
                const producto = prods.find((p) => p.id === d.producto_id)
                return {
                  producto_id: d.producto_id,
                  cantidad: d.cantidad,
                  precio_unitario: producto?.precio ?? 0,
                }
              })
          : prods.length === 1 && vendidos > 0
            ? [
                {
                  producto_id: prods[0].id,
                  cantidad: vendidos,
                  precio_unitario: prods[0].precio ?? 0,
                },
              ]
            : []

      return {
        tipo: 'vaso' as const,
        talla_id: r.talla_id,
        producto_id: desglose[0]?.producto_id ?? prods[0]?.id,
        cantidad_inicio: r.cantidad_inicio,
        cantidad_nuevos: r.cantidad_nuevos ?? 0,
        cantidad_final: r.cantidad_final ?? 0,
        novedades: r.novedades,
        desglose,
        precio_unitario: desglose[0]?.precio_unitario,
      }
    })

    const insumos: ConteoProductoInput[] = conteoInsumos.map((r) => ({
      tipo: 'insumo',
      producto_id: r.producto_id,
      cantidad_inicio: r.cantidad_inicio,
      cantidad_nuevos: r.cantidad_nuevos ?? 0,
      cantidad_final: r.cantidad_final ?? 0,
    }))

    return {
      fecha: fechaTrabajo,
      dinero_base_inicio: dineroBase,
      dinero_final: dineroFinal,
      gastos: gastos.map(({ descripcion, monto }) => ({ descripcion, monto })),
      transferencias: transferencias.map(({ medio_id, descripcion, monto }) => ({
        medio_id,
        descripcion,
        monto,
      })),
      domicilios: domicilios.map(({ descripcion, monto }) => ({
        descripcion: descripcion.trim() || undefined,
        monto,
      })),
      conteo_productos: [...vasos, ...insumos],
      ventas_variantes: ventasVariantes
        .filter((v) => v.cantidad > 0)
        .map((v) => {
          const variante = productos
            .flatMap((p) => p.variantes ?? [])
            .find((va) => va.id === v.variante_id)
          return { ...v, precio_unitario: variante?.precio ?? 0 }
        }),
      ventas_comida: ventasComida
        .filter((v) => v.cantidad > 0)
        .map((v) => {
          const producto = productos.find((p) => p.id === v.producto_id)
          return { ...v, precio_unitario: producto?.precio ?? 0 }
        }),
    }
  }

  async function handleCerrarDia() {
    const errores = erroresDesgloseVasos(
      conteoVasos,
      productos,
      (tallaId) => {
        const row = conteoVasos.find((r) => r.talla_id === tallaId)
        const t = row?.talla
        if (t?.descripcion) return t.descripcion
        if (t) return `${t.onzas} oz`
        return 'Vaso'
      }
    )
    if (errores.length > 0) {
      toastError(errores[0])
      return
    }

    setGuardando(true)
    const toastId = toastLoading('Cerrando día...')

    const payload = buildPayload()
    if (process.env.NODE_ENV === 'development') {
      console.log('[Cerrar día] POST /api/cierres — payload:', payload)
    }

    const res = await fetch('/api/cierres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = (await res.json().catch(() => ({}))) as GuardarCierreResponse & {
      error?: string
    }

    setGuardando(false)

    if (!res.ok) {
      console.error('[Cerrar día] POST /api/cierres falló:', {
        status: res.status,
        error: data.error,
        data,
      })
      toastError(data.error ?? 'Error al cerrar el día', toastId)
      return
    }

    setCierreId(data.cierre_id ?? cierreId)
    setEstado('cerrado')
    setCorrigiendo(false)
    toastSuccess(
      corrigiendo || esOtraFecha ? 'Cierre actualizado' : 'Día cerrado',
      toastId
    )
  }

  if (loading) {
    return (
      <div className="min-w-0 space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
      </div>
    )
  }

  return (
    <motion.div
      className="flex min-w-0 w-full flex-col gap-5 p-4 sm:p-6"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-wrap items-center gap-2">
        {esOtraFecha && (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-text-secondary">
              Corrección del {formatFecha(fechaTrabajo)}. La fecha del cierre no
              cambia.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.assign('/dashboard/cierre')
              }}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-bg-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft size={14} aria-hidden />
              Volver al cierre de hoy
            </button>
          </div>
        )}
        {estado === 'cerrado' && <span className="badge-green">Cerrado</span>}
        {esAdmin && estado === 'cerrado' && !corrigiendo && (
          <button
            type="button"
            className="rounded-[var(--radius-md)] border border-bg-border px-3 py-1 text-xs font-medium text-text-secondary hover:text-text-primary"
            onClick={() => setCorrigiendo(true)}
          >
            Corregir cierre
          </button>
        )}
        {corrigiendo && (
          <span className="text-xs text-amber-400">
            Editando. Al guardar se reemplaza la información de este día.
          </span>
        )}
        {bloqueado && !esAdmin && (
          <span className="text-xs text-text-muted">Sin edición</span>
        )}
        {totalVasosVendidos > 0 && (
          <span className="text-xs text-text-secondary">
            Vasos vendidos:{' '}
            <span className="font-medium text-accent-cyan tabular-nums">
              {totalVasosVendidos}
            </span>
          </span>
        )}
      </div>

      {/* Conteo a ancho completo — caja en barra + drawer */}
      <div className="flex min-w-0 flex-col gap-6">
        <section>
          <SeccionHeader
            emoji="🥤"
            titulo="Vasos"
            cantidad={conteoVasos.length}
            totalVendido={totalVasosPesos}
            esAdmin={esAdmin}
          />
          {conteoVasos.length === 0 ? (
            <p className="text-sm text-text-muted">No hay productos vaso.</p>
          ) : (
            <TablaVasos
              rows={conteoVasos}
              esAdmin={esAdmin}
              disabled={bloqueado}
              productosPorTalla={productosPorTalla}
              onChange={updateConteoVaso}
              onDesgloseChange={updateDesgloseVaso}
              onAbrirNovedades={setNovedadesTallaId}
            />
          )}
        </section>

        <SeccionComida
          productos={productosComida}
          ventasVariantes={ventasVariantes}
          ventasComida={ventasComida}
          esAdmin={esAdmin}
          disabled={bloqueado}
          onVarianteChange={handleVarianteChange}
          onComidaChange={handleComidaChange}
        />

        <section>
          <SeccionHeader
            emoji="🧂"
            titulo="Insumos"
            cantidad={conteoInsumos.length}
            esAdmin={esAdmin}
          />
          {conteoInsumos.length === 0 ? (
            <p className="text-sm text-text-muted">No hay insumos activos.</p>
          ) : (
            <TablaProductos
              rows={conteoInsumos}
              esAdmin={esAdmin}
              disabled={bloqueado}
              modo="insumo"
              onChange={updateConteoInsumo}
            />
          )}
        </section>
      </div>

      <CierreCajaShell
        bloqueado={bloqueado}
        esAdmin={esAdmin}
        guardando={guardando}
        cuadre={cuadre}
        dineroFinal={dineroFinal}
        dineroBase={dineroBase}
        gastos={gastos}
        transferencias={transferencias}
        domicilios={domicilios}
        mediosTransferencia={mediosTransferencia}
        onDineroBaseChange={setDineroBase}
        onDineroFinalChange={setDineroFinal}
        onRemoveGasto={(id) =>
          setGastos((list) => list.filter((x) => x.id !== id))
        }
        onRemoveTransferencia={(id) =>
          setTransferencias((list) => list.filter((x) => x.id !== id))
        }
        onRemoveDomicilio={(id) =>
          setDomicilios((list) => list.filter((x) => x.id !== id))
        }
        onAgregarGasto={agregarGasto}
        onAgregarTransferencia={agregarTransferencia}
        onAgregarDomicilio={agregarDomicilio}
        onEditarGasto={editarGasto}
        onEditarTransferencia={editarTransferencia}
        onEditarDomicilio={editarDomicilio}
        onCerrarDia={handleCerrarDia}
        textoCerrar={
          corrigiendo || esOtraFecha ? 'Guardar corrección' : 'Cerrar día'
        }
      />

      <NovedadesDrawer
        open={!!vasoNovedadesActivo}
        titulo={tituloNovedades}
        novedades={vasoNovedadesActivo?.novedades ?? []}
        motivos={motivos}
        disabled={bloqueado}
        onClose={() => setNovedadesTallaId(null)}
        onChange={(novedades) => {
          if (!novedadesTallaId) return
          updateConteoVaso(novedadesTallaId, 'novedades', novedades)
        }}
      />
    </motion.div>
  )
}
