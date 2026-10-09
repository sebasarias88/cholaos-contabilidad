'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { calcularCuadre } from '@/lib/cierre/cuadre'
import {
  construirPayload,
  ESTADO_VACIO,
  estadoDesdeDatos,
  idTemporal,
  itemsVendidos,
  productosPorTalla,
  validarCierre,
  type EstadoCierreForm,
  type FilaBebida,
  type FilaInsumo,
  type FilaMasa,
  type FilaVaso,
} from '@/lib/cierre/estado'
import { vendidosReales } from '@/lib/cierre/ventas-vasos'
import { esBebidaContada, tipoProducto } from '@/lib/productos-ui'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import type { DatosCierre, GuardarCierreResponse, Rol } from '@/types'

type ModoGuardado = 'avance' | 'finalizar'

/**
 * Estado y acciones del cierre de un día.
 * - Guardar avance: estado 'borrador' (se puede seguir editando todo el día).
 * - Finalizar: cierre definitivo (el empleado ya no puede editarlo).
 */
export function useCierreDia({ fecha, rol }: { fecha: string; rol: Rol }) {
  const esAdmin = rol === 'admin'
  const [datos, setDatos] = useState<DatosCierre | null>(null)
  const [estado, setEstado] = useState<EstadoCierreForm>(ESTADO_VACIO)
  const [guardadoJson, setGuardadoJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState<ModoGuardado | null>(null)
  const [corrigiendo, setCorrigiendo] = useState(false)
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null)
  const [version, setVersion] = useState(0)
  const [cargadoClave, setCargadoClave] = useState<string | null>(null)

  const clave = `${fecha}#${version}`
  const loading = cargadoClave !== clave

  useEffect(() => {
    let cancelado = false
    fetch(`/api/cierres/prellenado?fecha=${fecha}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error ?? 'Error cargando el cierre')
        return body as DatosCierre
      })
      .then((d) => {
        if (cancelado) return
        const inicial = estadoDesdeDatos(d)
        setDatos(d)
        setEstado(inicial)
        setGuardadoJson(JSON.stringify(inicial))
        setCorrigiendo(false)
        setError(null)
      })
      .catch((e: Error) => {
        if (cancelado) return
        setDatos(null)
        setError(e.message)
      })
      .finally(() => {
        if (!cancelado) setCargadoClave(clave)
      })
    return () => {
      cancelado = true
    }
  }, [fecha, clave])

  const productos = useMemo(() => datos?.productos ?? [], [datos])
  const cierre = datos?.cierre ?? null
  const estadoCierre = cierre?.estado ?? null
  const esCorreccion = estadoCierre === 'cerrado'
  const bloqueado = esCorreccion && !(esAdmin && corrigiendo)
  const hayCambios = !loading && JSON.stringify(estado) !== guardadoJson

  const porTalla = useMemo(() => productosPorTalla(productos), [productos])
  const productosComida = useMemo(
    // Las bebidas que se cuentan como los vasos van en su propio paso
    () => productos.filter((p) => p.activo && tipoProducto(p) === 'comida' && !esBebidaContada(p)),
    [productos]
  )
  const items = useMemo(() => itemsVendidos(estado, productos), [estado, productos])
  const cuadre = useMemo(
    () =>
      calcularCuadre({
        dineroBaseInicio: estado.dineroBase,
        dineroFinal: estado.dineroFinal,
        itemsVendidos: items,
        transferencias: estado.transferencias,
        gastos: estado.gastos,
        domicilios: estado.domicilios,
      }),
    [estado, items]
  )
  const vasosVendidos = useMemo(
    () => estado.vasos.reduce((s, f) => s + vendidosReales(f), 0),
    [estado.vasos]
  )
  const bebidasVendidas = useMemo(
    () => estado.bebidas.reduce((s, f) => s + vendidosReales(f), 0),
    [estado.bebidas]
  )

  // ---------- Mutaciones ----------
  const actualizar = useCallback(
    (cambios: Partial<EstadoCierreForm>) => setEstado((e) => ({ ...e, ...cambios })),
    []
  )

  const actualizarVaso = useCallback(
    <K extends keyof FilaVaso>(tallaId: string, campo: K, valor: FilaVaso[K]) =>
      setEstado((e) => ({
        ...e,
        vasos: e.vasos.map((f) => (f.talla_id === tallaId ? { ...f, [campo]: valor } : f)),
      })),
    []
  )

  const actualizarDesglose = useCallback(
    (tallaId: string, productoId: string, cantidad: number) =>
      setEstado((e) => ({
        ...e,
        vasos: e.vasos.map((f) => {
          if (f.talla_id !== tallaId) return f
          const resto = f.desglose.filter((d) => d.producto_id !== productoId)
          const qty = Math.max(0, cantidad)
          return {
            ...f,
            desglose: qty > 0 ? [...resto, { producto_id: productoId, cantidad: qty }] : resto,
          }
        }),
      })),
    []
  )

  const actualizarInsumo = useCallback(
    <K extends keyof FilaInsumo>(productoId: string, campo: K, valor: FilaInsumo[K]) =>
      setEstado((e) => ({
        ...e,
        insumos: e.insumos.map((f) =>
          f.producto_id === productoId ? { ...f, [campo]: valor } : f
        ),
      })),
    []
  )

  const actualizarBebida = useCallback(
    <K extends keyof FilaBebida>(productoId: string, campo: K, valor: FilaBebida[K]) =>
      setEstado((e) => ({
        ...e,
        bebidas: e.bebidas.map((f) =>
          f.producto_id === productoId ? { ...f, [campo]: valor } : f
        ),
      })),
    []
  )

  const actualizarMasa = useCallback(
    (
      productoId: string,
      campo: 'cantidad_inicio' | 'cantidad_final',
      valor: FilaMasa[typeof campo]
    ) =>
      setEstado((e) => ({
        ...e,
        masas: e.masas.map((f) => (f.producto_id === productoId ? { ...f, [campo]: valor } : f)),
      })),
    []
  )

  const cambiarVariante = useCallback(
    (varianteId: string, cantidad: number) =>
      setEstado((e) => ({
        ...e,
        ventasVariantes: [
          ...e.ventasVariantes.filter((v) => v.variante_id !== varianteId),
          { variante_id: varianteId, cantidad },
        ],
      })),
    []
  )

  const cambiarComida = useCallback(
    (productoId: string, cantidad: number) =>
      setEstado((e) => ({
        ...e,
        ventasComida: [
          ...e.ventasComida.filter((v) => v.producto_id !== productoId),
          { producto_id: productoId, cantidad },
        ],
      })),
    []
  )

  const movimientos = useMemo(
    () => ({
      agregarGasto: (descripcion: string, monto: number) =>
        setEstado((e) => ({
          ...e,
          gastos: [...e.gastos, { id: idTemporal(), descripcion, monto }],
        })),
      editarGasto: (id: string, descripcion: string, monto: number) =>
        setEstado((e) => ({
          ...e,
          gastos: e.gastos.map((g) => (g.id === id ? { ...g, descripcion, monto } : g)),
        })),
      quitarGasto: (id: string) =>
        setEstado((e) => ({ ...e, gastos: e.gastos.filter((g) => g.id !== id) })),

      agregarTransferencia: (medioId: string, nombre: string, monto: number) =>
        setEstado((e) => ({
          ...e,
          transferencias: [
            ...e.transferencias,
            { id: idTemporal(), medio_id: medioId, descripcion: nombre, monto },
          ],
        })),
      editarTransferencia: (id: string, medioId: string, nombre: string, monto: number) =>
        setEstado((e) => ({
          ...e,
          transferencias: e.transferencias.map((t) =>
            t.id === id ? { ...t, medio_id: medioId, descripcion: nombre, monto } : t
          ),
        })),
      quitarTransferencia: (id: string) =>
        setEstado((e) => ({ ...e, transferencias: e.transferencias.filter((t) => t.id !== id) })),

      agregarDomicilio: (descripcion: string, monto: number) =>
        setEstado((e) => ({
          ...e,
          domicilios: [...e.domicilios, { id: idTemporal(), descripcion, monto }],
        })),
      editarDomicilio: (id: string, descripcion: string, monto: number) =>
        setEstado((e) => ({
          ...e,
          domicilios: e.domicilios.map((d) => (d.id === id ? { ...d, descripcion, monto } : d)),
        })),
      quitarDomicilio: (id: string) =>
        setEstado((e) => ({ ...e, domicilios: e.domicilios.filter((d) => d.id !== id) })),
    }),
    []
  )

  // ---------- Guardar ----------
  /** Devuelve los errores que impiden guardar (vacío = se puede) */
  const validar = useCallback(
    (finalizar: boolean) => validarCierre(estado, productos, finalizar),
    [estado, productos]
  )

  const guardar = useCallback(
    async (finalizar: boolean): Promise<boolean> => {
      const errores = validar(finalizar)
      if (errores.length > 0) {
        toastError(errores[0])
        return false
      }

      setGuardando(finalizar ? 'finalizar' : 'avance')
      const mensaje = esCorreccion
        ? 'Guardando corrección...'
        : finalizar
          ? 'Cerrando día...'
          : 'Guardando avance...'
      const toastId = toastLoading(mensaje)

      try {
        const res = await fetch('/api/cierres', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(construirPayload(estado, { fecha, esAdmin, finalizar })),
        })
        const body = (await res.json().catch(() => ({}))) as Partial<GuardarCierreResponse> & {
          error?: string
        }
        if (!res.ok) {
          toastError(body.error ?? 'No se pudo guardar', toastId)
          return false
        }

        toastSuccess(
          esCorreccion ? 'Corrección guardada' : finalizar ? 'Día cerrado' : 'Avance guardado',
          toastId
        )
        setUltimoGuardado(new Date())
        // Recargar desde la BD para mostrar exactamente lo guardado
        setVersion((v) => v + 1)
        return true
      } catch {
        toastError('Sin conexión. Revisa internet e intenta de nuevo.', toastId)
        return false
      } finally {
        setGuardando(null)
      }
    },
    [esAdmin, esCorreccion, estado, fecha, validar]
  )

  return {
    esAdmin,
    datos,
    estado,
    error,
    loading,
    guardando,
    corrigiendo,
    setCorrigiendo,
    ultimoGuardado,
    estadoCierre,
    esCorreccion,
    bloqueado,
    hayCambios,
    productos,
    productosComida,
    porTalla,
    cuadre,
    vasosVendidos,
    bebidasVendidas,
    actualizar,
    actualizarVaso,
    actualizarDesglose,
    actualizarInsumo,
    actualizarBebida,
    actualizarMasa,
    cambiarVariante,
    cambiarComida,
    movimientos,
    validar,
    guardar,
  }
}

export type CierreDiaApi = ReturnType<typeof useCierreDia>
