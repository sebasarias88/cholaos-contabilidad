'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CierreCajaShell } from '@/components/cierre/CierrePanelSticky'
import type { ConteoProductoValor } from '@/components/cierre/ConteoComidaCard'
import type { ConteoVasoValor } from '@/components/cierre/ConteoVasoCard'
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
  vendidosReales,
} from '@/lib/ventas-desde-vasos'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
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

interface FormCierreDiaProps {
  rol: Rol
}

export function FormCierreDia({ rol }: FormCierreDiaProps) {
  const esAdmin = rol === 'admin'
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cierreId, setCierreId] = useState<string | null>(null)
  const [estado, setEstado] = useState<EstadoCierre | null>(null)

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

  const bloqueado = estado === 'cerrado'

  const aplicarCierre = useCallback(
    (cierre: CierreDia | CierreDiaEmpleado, prods: Producto[]) => {
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

      setConteoVasos(vasos)
      setConteoInsumos(insumos)
    },
    []
  )

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/api-tests').then((m) => m.registerCierreApiTestsInBrowser())
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      try {
        const [preRes, prodRes, motivosRes, mediosRes] = await Promise.all([
          fetch('/api/cierres/prellenado'),
          fetch('/api/productos'),
          fetch('/api/motivos-novedad'),
          fetch('/api/medios-transferencia'),
        ])

        if (!preRes.ok) throw new Error('prellenado')
        const pre = (await preRes.json()) as PrellenadoCierreResponse
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

        if (pre.tipo === 'cierre_existente' && pre.cierre) {
          aplicarCierre(pre.cierre, prods)
        } else if (pre.tipo === 'nuevo') {
          setDineroBase(pre.dinero_base_inicio ?? 0)
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
  }, [aplicarCierre])

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
    const map: Record<string, Producto | undefined> = {}
    for (const p of productos) {
      if (p.talla_id && p.activo && tipoProducto(p) === 'vaso') {
        map[p.talla_id] = p
      }
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
    const prod = productosPorTalla[vasoNovedadesActivo.talla_id]
    const nombre = t?.descripcion ?? prod?.nombre
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

  function buildPayload(): GuardarCierrePayload {
    const vasos: ConteoProductoInput[] = conteoVasos.map((r) => {
      const producto = productos.find(
        (p) => p.activo && p.talla_id === r.talla_id
      )
      return {
        tipo: 'vaso',
        talla_id: r.talla_id,
        producto_id: producto?.id,
        cantidad_inicio: r.cantidad_inicio,
        cantidad_nuevos: r.cantidad_nuevos ?? 0,
        cantidad_final: r.cantidad_final ?? 0,
        novedades: r.novedades,
        precio_unitario: producto?.precio,
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
      fecha: HOY,
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
    toastSuccess('Día cerrado', toastId)
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
        {estado === 'cerrado' && <span className="badge-green">Cerrado</span>}
        {bloqueado && (
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
        onCerrarDia={handleCerrarDia}
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
