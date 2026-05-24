'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { CierrePanelSticky } from '@/components/cierre/CierrePanelSticky'
import {
  ConteoVasoCard,
  type ConteoVasoValor,
} from '@/components/cierre/ConteoVasoCard'
import { ProductoVentaCard } from '@/components/cierre/ProductoVentaCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCuadre } from '@/hooks/useCuadre'
import { fadeUp } from '@/lib/animations'
import {
  calcularItemsVendidos,
  vendidosReales,
} from '@/lib/ventas-desde-vasos'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type {
  CierreDia,
  CierreDiaEmpleado,
  ConteoVaso,
  ConteoVasoPrellenado,
  EstadoCierre,
  GastoDia,
  GuardarCierrePayload,
  GuardarCierreResponse,
  MotivoNovedad,
  PrellenadoCierreResponse,
  Producto,
  Rol,
  TallaVaso,
  TransferenciaDia,
} from '@/types'

const HOY = format(new Date(), 'yyyy-MM-dd')

type ConteoRow = ConteoVasoValor & {
  talla_id: string
  talla?: TallaVaso
}

type LineaMonto = {
  id: string
  descripcion: string
  monto: number
}

function tempId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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

  const [conteoRows, setConteoRows] = useState<ConteoRow[]>([])
  const [motivos, setMotivos] = useState<MotivoNovedad[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')

  const [gastos, setGastos] = useState<LineaMonto[]>([])
  const [transferencias, setTransferencias] = useState<LineaMonto[]>([])

  const [dineroBase, setDineroBase] = useState(0)
  const [dineroFinal, setDineroFinal] = useState(0)

  const bloqueado = estado === 'cerrado'

  const aplicarCierre = useCallback(
    (cierre: CierreDia | CierreDiaEmpleado) => {
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
          descripcion: t.descripcion,
          monto: t.monto,
        }))
      )
      setConteoRows(
        (cierre.conteo_vasos ?? []).map((c: ConteoVaso) => ({
          talla_id: c.talla_id,
          talla: c.talla,
          cantidad_inicio: c.cantidad_inicio,
          cantidad_nuevos: c.cantidad_nuevos,
          cantidad_final: c.cantidad_final,
          novedades: (c.novedades ?? []).map((n) => ({
            motivo_id: n.motivo_id,
            motivo_custom: n.motivo_custom,
            cantidad: n.cantidad,
          })),
        }))
      )
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
        const [preRes, prodRes, motivosRes] = await Promise.all([
          fetch('/api/cierres/prellenado'),
          fetch('/api/productos'),
          fetch('/api/motivos-novedad'),
        ])

        if (!preRes.ok) throw new Error('prellenado')
        const pre = (await preRes.json()) as PrellenadoCierreResponse
        const prods: Producto[] = prodRes.ok ? await prodRes.json() : []
        const motivosData: MotivoNovedad[] = motivosRes.ok
          ? await motivosRes.json()
          : []
        if (cancelled) return
        setProductos(prods)
        setMotivos(motivosData)

        if (pre.tipo === 'cierre_existente' && pre.cierre) {
          aplicarCierre(pre.cierre)
        } else if (pre.tipo === 'nuevo') {
          setDineroBase(pre.dinero_base_inicio ?? 0)
          setConteoRows(
            pre.conteo_vasos.map((c: ConteoVasoPrellenado) => ({
              talla_id: c.talla_id,
              talla: c.talla,
              cantidad_inicio: c.cantidad_inicio,
              cantidad_nuevos: c.cantidad_nuevos,
              cantidad_final: c.cantidad_final,
              novedades: c.novedades ?? [],
            }))
          )
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

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return productos
      .filter((p) => !q || p.nombre.toLowerCase().includes(q))
      .sort((a, b) => {
        const n = a.nombre.localeCompare(b.nombre)
        return n !== 0 ? n : a.onzas - b.onzas
      })
  }, [productos, busqueda])

  const itemsVendidos = useMemo(
    () => calcularItemsVendidos(conteoRows, productos),
    [conteoRows, productos]
  )

  const cantidadesDesdeVasos = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of itemsVendidos) {
      map[item.producto_id] = item.cantidad
    }
    return map
  }, [itemsVendidos])

  const productosConVenta = itemsVendidos.length

  const totalVasosVendidos = useMemo(
    () => conteoRows.reduce((s, r) => s + vendidosReales(r), 0),
    [conteoRows]
  )

  const cuadre = useCuadre({
    dineroBaseInicio: dineroBase,
    dineroFinal,
    itemsVendidos,
    transferencias,
    gastos,
    esAdmin,
  })

  function updateConteo<K extends keyof ConteoVasoValor>(
    tallaId: string,
    campo: K,
    value: ConteoVasoValor[K]
  ) {
    setConteoRows((rows) =>
      rows.map((r) =>
        r.talla_id === tallaId ? { ...r, [campo]: value } : r
      )
    )
  }

  function agregarGasto(descripcion: string, monto: number) {
    setGastos((g) => [...g, { id: tempId(), descripcion, monto }])
  }

  function agregarTransferencia(descripcion: string, monto: number) {
    setTransferencias((t) => [...t, { id: tempId(), descripcion, monto }])
  }

  function buildPayload(): GuardarCierrePayload {
    return {
      fecha: HOY,
      dinero_base_inicio: dineroBase,
      dinero_final: dineroFinal,
      gastos: gastos.map(({ descripcion, monto }) => ({ descripcion, monto })),
      transferencias: transferencias.map(({ descripcion, monto }) => ({
        descripcion,
        monto,
      })),
      conteo_vasos: conteoRows.map((r) => ({
        talla_id: r.talla_id,
        cantidad_inicio: r.cantidad_inicio,
        cantidad_nuevos: r.cantidad_nuevos ?? 0,
        cantidad_final: r.cantidad_final ?? 0,
        novedades: r.novedades,
      })),
      items_vendidos: itemsVendidos,
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

    setCierreId(data.cierre_id ?? null)
    setEstado('cerrado')
    toastSuccess('Día cerrado', toastId)
  }

  if (loading) {
    return (
      <div className="space-y-4 px-4 py-4 md:px-6 md:py-5">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
          </div>
          <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex min-w-0 w-full flex-col gap-4 px-4 py-4 md:px-6 md:py-5"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
        {/* Columna izquierda: scroll de página (no panel atrapado) */}
        <div className="flex min-w-0 flex-col gap-3">
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-text-primary">
                Conteo de vasos
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {estado === 'cerrado' && (
                  <span className="badge-green">Cerrado</span>
                )}
                {bloqueado && (
                  <span className="text-xs text-text-muted">Sin edición</span>
                )}
                <p className="text-sm text-text-secondary">
                  Total:{' '}
                  <span className="font-medium text-accent-cyan tabular-nums">
                    {totalVasosVendidos} vendidos
                  </span>
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {conteoRows.map((row) => (
                <ConteoVasoCard
                  key={row.talla_id}
                  talla={{
                    id: row.talla_id,
                    onzas: row.talla?.onzas ?? 0,
                    descripcion: row.talla?.descripcion,
                    tipo: row.talla?.tipo ?? 'normal',
                  }}
                  valor={row}
                  motivos={motivos}
                  disabled={bloqueado}
                  compact
                  onChange={(campo, valor) =>
                    updateConteo(row.talla_id, campo, valor)
                  }
                />
              ))}
            </div>
          </section>

          <section className="space-y-2.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-semibold text-text-primary lg:text-base">
                  Productos vendidos
                </h2>
                <p className="text-xs text-text-muted">
                  Calculado desde el conteo de vasos (solo lectura)
                </p>
              </div>
              {productosConVenta > 0 && (
                <span className="badge-cyan tabular-nums">
                  {productosConVenta} producto{productosConVenta !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                disabled={bloqueado}
                className="select-field select-field--with-icon w-full min-w-0"
              />
            </div>
            {productosFiltrados.length === 0 ? (
              <p className="text-sm text-text-muted">
                No hay productos que coincidan.
              </p>
            ) : itemsVendidos.length === 0 ? (
              <p className="text-sm text-text-muted">
                Registra el conteo de vasos arriba para calcular lo vendido.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 lg:gap-2.5">
                {productosFiltrados
                  .filter((p) => (cantidadesDesdeVasos[p.id] ?? 0) > 0)
                  .map((p) => (
                    <ProductoVentaCard
                      key={p.id}
                      producto={p}
                      cantidad={cantidadesDesdeVasos[p.id] ?? 0}
                      disabled
                      esAdmin={esAdmin}
                      compact
                      onChange={() => {}}
                    />
                  ))}
              </div>
            )}
          </section>
        </div>

        {/* Panel derecho: sticky en desktop; scroll interno con Lenis desactivado */}
        <div className="flex min-w-0 flex-col border-t border-bg-border pt-6 lg:border-t-0 lg:pt-0 lg:sticky lg:top-[var(--dashboard-header-h)] lg:h-[calc(100dvh-var(--dashboard-header-h))] lg:min-h-0 lg:self-start">
          <CierrePanelSticky
          bloqueado={bloqueado}
          esAdmin={esAdmin}
          guardando={guardando}
          cuadre={cuadre}
          dineroFinal={dineroFinal}
          dineroBase={dineroBase}
          gastos={gastos}
          transferencias={transferencias}
          onDineroBaseChange={setDineroBase}
          onDineroFinalChange={setDineroFinal}
          onRemoveGasto={(id) =>
            setGastos((list) => list.filter((x) => x.id !== id))
          }
          onRemoveTransferencia={(id) =>
            setTransferencias((list) => list.filter((x) => x.id !== id))
          }
          onAgregarGasto={agregarGasto}
          onAgregarTransferencia={agregarTransferencia}
          onCerrarDia={handleCerrarDia}
        />
        </div>
      </div>
    </motion.div>
  )
}
