'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { BarraMovil } from '@/components/cierre/caja/BarraMovil'
import { CajaEnVivo } from '@/components/cierre/caja/CajaEnVivo'
import { PasoCaja } from '@/components/cierre/caja/PasoCaja'
import { CierreEncabezado } from '@/components/cierre/CierreEncabezado'
import { NovedadesDrawer } from '@/components/cierre/NovedadesDrawer'
import { PasoComida } from '@/components/cierre/PasoComida'
import { PasoRevisar } from '@/components/cierre/PasoRevisar'
import { PasosCierre } from '@/components/cierre/PasosCierre'
import { TablaMasas } from '@/components/cierre/TablaMasas'
import { TablaVasos } from '@/components/cierre/TablaVasos'
import { Celebracion } from '@/components/ui/Celebracion'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCierreDia } from '@/hooks/useCierreDia'
import { etiquetaVaso } from '@/lib/cierre/estado'
import { calcularPasos, type IdPaso } from '@/lib/cierre/pasos'
import { hoyColombia } from '@/lib/fechas'
import { toastError } from '@/lib/toast'
import { formatPesos } from '@/lib/utils'
import type { Rol } from '@/types'

const AYUDA: Record<IdPaso, string> = {
  vasos:
    'Cuenta cuántos vasos llegaron y cuántos quedan. Presiona Enter para pasar a la siguiente casilla.',
  comida: 'Bebidas, ventas de comida y adiciones, e insumos del día.',
  masas:
    'Anota con cuántas unidades empezó y terminó cada tamaño y, en Pizzeta, Mediana y Familiar, el número de masas (no suman a las ventas).',
  caja: 'Gastos, transferencias, domicilios, descuentos (fiados, consumos, préstamos) y el dinero de la caja.',
  revisar: 'Revisa el resumen. Si todo está bien, finaliza el cierre.',
}

interface FormCierreDiaProps {
  rol: Rol
  /** Fecha del cierre (hoy en Colombia o la que eligió el admin) */
  fecha: string
}

export function FormCierreDia({ rol, fecha }: FormCierreDiaProps) {
  const cierre = useCierreDia({ fecha, rol })
  const { estado, porTalla, bloqueado, esAdmin, datos, esCorreccion } = cierre
  const [paso, setPaso] = useState<IdPaso>('vasos')
  const [direccion, setDireccion] = useState(1)
  // Novedades de un vaso (talla) o de una bebida contada (producto)
  const [novedadesDe, setNovedadesDe] = useState<{ tipo: 'vaso' | 'bebida'; id: string } | null>(
    null
  )
  const [celebrar, setCelebrar] = useState<{ detalle: string } | null>(null)

  // Avisar antes de salir con cambios sin guardar
  useEffect(() => {
    if (!cierre.hayCambios || bloqueado) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [cierre.hayCambios, bloqueado])

  const errores = useMemo(() => cierre.validar(true), [cierre])
  const pasos = useMemo(
    () =>
      calcularPasos(estado, {
        hayComida: cierre.productosComida.length > 0,
        porTalla,
        errores: errores.length,
      }),
    [estado, cierre.productosComida.length, porTalla, errores.length]
  )
  const indice = Math.max(
    0,
    pasos.findIndex((p) => p.id === paso)
  )
  const siguiente = pasos[indice + 1] ?? null
  const esRevisar = paso === 'revisar'

  const irA = useCallback(
    (id: IdPaso) => {
      const nuevo = pasos.findIndex((p) => p.id === id)
      setDireccion(nuevo >= indice ? 1 : -1)
      setPaso(id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [pasos, indice]
  )

  async function finalizar() {
    if (datos && fecha === datos.hoy && hoyColombia() !== datos.hoy) {
      toastError('Cambió el día. Recarga la página para cerrar con la fecha correcta.')
      return
    }
    if (errores.length > 0) {
      toastError(errores[0])
      irA('revisar')
      return
    }
    const { diferencia } = cierre.cuadre
    const correccion = esCorreccion
    const ok = await cierre.guardar(true)
    if (ok && !correccion) {
      setCelebrar({
        detalle:
          diferencia === 0
            ? 'La caja cuadró perfecto.'
            : diferencia < 0
              ? `Faltaron ${formatPesos(-diferencia)} en caja.`
              : `Sobraron ${formatPesos(diferencia)} en caja.`,
      })
    }
  }

  const vasoNovedades =
    novedadesDe?.tipo === 'vaso'
      ? (estado.vasos.find((f) => f.talla_id === novedadesDe.id) ?? null)
      : null
  const bebidaNovedades =
    novedadesDe?.tipo === 'bebida'
      ? (estado.bebidas.find((f) => f.producto_id === novedadesDe.id) ?? null)
      : null
  const novedadesAbiertas = vasoNovedades ?? bebidaNovedades

  if (cierre.loading && !datos) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-16 w-full rounded-[16px]" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 rounded-[20px]" />
          <Skeleton className="h-56 rounded-[20px]" />
        </div>
      </div>
    )
  }

  if (cierre.error || !datos) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="border-bad/30 bg-bad-soft text-bad rounded-[var(--radius-lg)] border p-5 font-semibold">
          {cierre.error ?? 'No se pudo cargar el cierre'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <CierreEncabezado cierre={cierre} fecha={fecha} />
      <PasosCierre pasos={pasos} actual={paso} onCambiar={irA} />

      <div className="flex items-start gap-5 xl:gap-6">
        <div className="@container min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-text-secondary max-w-2xl text-[15px]">{AYUDA[paso]}</p>
            {indice > 0 && (
              <button
                type="button"
                onClick={() => irA(pasos[indice - 1].id)}
                className="focus-ring text-text-secondary hover:text-text-primary inline-flex min-h-10 items-center gap-1.5 text-sm font-bold"
              >
                <ArrowLeft size={16} />
                {pasos[indice - 1].titulo}
              </button>
            )}
          </div>

          <AnimatePresence mode="wait" custom={direccion}>
            <motion.div
              key={paso}
              custom={direccion}
              initial={{ opacity: 0, x: direccion * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direccion * -28 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {paso === 'vasos' &&
                (estado.vasos.length === 0 ? (
                  <p className="text-text-secondary">No hay productos tipo vaso activos.</p>
                ) : (
                  <TablaVasos
                    filas={estado.vasos}
                    esAdmin={esAdmin}
                    disabled={bloqueado}
                    productosPorTalla={porTalla}
                    onChange={cierre.actualizarVaso}
                    onDesgloseChange={cierre.actualizarDesglose}
                    onAbrirNovedades={(id) => setNovedadesDe({ tipo: 'vaso', id })}
                  />
                ))}
              {paso === 'comida' && (
                <PasoComida
                  cierre={cierre}
                  onAbrirNovedadesBebida={(id) => setNovedadesDe({ tipo: 'bebida', id })}
                />
              )}
              {paso === 'masas' && (
                <TablaMasas
                  filas={estado.masas}
                  disabled={bloqueado}
                  onChange={cierre.actualizarMasa}
                />
              )}
              {paso === 'caja' && <PasoCaja cierre={cierre} />}
              {paso === 'revisar' && <PasoRevisar cierre={cierre} errores={errores} onIrA={irA} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Se estira a lo alto de la fila para que la caja baje con el scroll (sticky) */}
        <div className="hidden w-[300px] shrink-0 self-stretch lg:block xl:w-[340px]">
          <CajaEnVivo
            cierre={cierre}
            textoSiguiente={siguiente?.titulo ?? null}
            onSiguiente={() => siguiente && irA(siguiente.id)}
            onFinalizar={finalizar}
            esRevisar={esRevisar}
          />
        </div>
      </div>

      <BarraMovil
        cierre={cierre}
        textoBoton={
          esRevisar || esCorreccion ? (esCorreccion ? 'Guardar' : 'Finalizar') : 'Siguiente'
        }
        onBoton={() =>
          esRevisar || esCorreccion ? void finalizar() : siguiente && irA(siguiente.id)
        }
      />

      <NovedadesDrawer
        open={!!novedadesAbiertas}
        titulo={
          bebidaNovedades
            ? bebidaNovedades.producto.nombre
            : etiquetaVaso(vasoNovedades ?? undefined)
        }
        unidad={bebidaNovedades ? 'unidades' : 'vasos'}
        novedades={novedadesAbiertas?.novedades ?? []}
        motivos={datos.motivos}
        disabled={bloqueado}
        onClose={() => setNovedadesDe(null)}
        onChange={(novedades) => {
          if (novedadesDe?.tipo === 'vaso')
            cierre.actualizarVaso(novedadesDe.id, 'novedades', novedades)
          if (novedadesDe?.tipo === 'bebida')
            cierre.actualizarBebida(novedadesDe.id, 'novedades', novedades)
        }}
      />

      <Celebracion
        abierta={!!celebrar}
        titulo="¡Día cerrado!"
        detalle={celebrar?.detalle}
        onCerrar={() => setCelebrar(null)}
      />
    </div>
  )
}
