'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarraCierre } from '@/components/cierre/caja/BarraCierre'
import { ResumenCajaModal } from '@/components/cierre/caja/ResumenCajaModal'
import { CierreEncabezado } from '@/components/cierre/CierreEncabezado'
import { ConfirmarCierreModal } from '@/components/cierre/ConfirmarCierreModal'
import { NovedadesDrawer } from '@/components/cierre/NovedadesDrawer'
import { SeccionComida } from '@/components/cierre/SeccionComida'
import { SeccionHeader } from '@/components/cierre/SeccionHeader'
import { TablaInsumos } from '@/components/cierre/TablaInsumos'
import { TablaVasos } from '@/components/cierre/TablaVasos'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCierreDia } from '@/hooks/useCierreDia'
import { fadeUp } from '@/lib/animations'
import { etiquetaVaso } from '@/lib/cierre/estado'
import { calcularItemsVendidos } from '@/lib/cierre/ventas-vasos'
import { hoyColombia } from '@/lib/fechas'
import { toastError } from '@/lib/toast'
import type { Rol } from '@/types'

interface FormCierreDiaProps {
  rol: Rol
  /** Fecha del cierre (hoy en Colombia o la que eligió el admin) */
  fecha: string
}

export function FormCierreDia({ rol, fecha }: FormCierreDiaProps) {
  const cierre = useCierreDia({ fecha, rol })
  const { estado, productos, porTalla, bloqueado, esAdmin, datos } = cierre
  const [resumenAbierto, setResumenAbierto] = useState(false)
  const [confirmarAbierto, setConfirmarAbierto] = useState(false)
  const [novedadesTallaId, setNovedadesTallaId] = useState<string | null>(null)

  // Avisar antes de salir con cambios sin guardar
  useEffect(() => {
    if (!cierre.hayCambios || bloqueado) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [cierre.hayCambios, bloqueado])

  const totalVasosPesos = useMemo(
    () =>
      calcularItemsVendidos(estado.vasos, productos).reduce(
        (s, i) => s + i.cantidad * i.precio_unitario,
        0
      ),
    [estado.vasos, productos]
  )

  const filaNovedades = estado.vasos.find((f) => f.talla_id === novedadesTallaId) ?? null

  function pedirFinalizar() {
    if (datos && fecha === datos.hoy && hoyColombia() !== datos.hoy) {
      toastError('Cambió el día. Recarga la página para cerrar con la fecha correcta.')
      return
    }
    const errores = cierre.validar(true)
    if (errores.length > 0) {
      toastError(errores[0])
      return
    }
    setConfirmarAbierto(true)
  }

  async function confirmar() {
    const ok = await cierre.guardar(true)
    if (ok) setConfirmarAbierto(false)
  }

  if (cierre.loading && !datos) {
    return (
      <div className="min-w-0 space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
      </div>
    )
  }

  if (cierre.error || !datos) {
    return (
      <div className="p-4 sm:p-6">
        <p className="border-accent-red/30 bg-accent-red-dim text-accent-red rounded-[var(--radius-md)] border p-4 text-sm">
          {cierre.error ?? 'No se pudo cargar el cierre'}
        </p>
      </div>
    )
  }

  return (
    <motion.div
      className="flex w-full min-w-0 flex-col gap-6 p-4 sm:p-6"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <CierreEncabezado cierre={cierre} fecha={fecha} />

      <section>
        <SeccionHeader
          emoji="🥤"
          titulo="Vasos"
          cantidad={estado.vasos.length}
          totalVendido={totalVasosPesos}
          esAdmin={esAdmin}
        />
        {estado.vasos.length === 0 ? (
          <p className="text-text-muted text-sm">No hay productos vaso.</p>
        ) : (
          <TablaVasos
            filas={estado.vasos}
            esAdmin={esAdmin}
            disabled={bloqueado}
            productosPorTalla={porTalla}
            onChange={cierre.actualizarVaso}
            onDesgloseChange={cierre.actualizarDesglose}
            onAbrirNovedades={setNovedadesTallaId}
          />
        )}
      </section>

      <SeccionComida
        productos={cierre.productosComida}
        ventasVariantes={estado.ventasVariantes}
        ventasComida={estado.ventasComida}
        esAdmin={esAdmin}
        disabled={bloqueado}
        onVarianteChange={cierre.cambiarVariante}
        onComidaChange={cierre.cambiarComida}
      />

      <section>
        <SeccionHeader
          emoji="🧂"
          titulo="Insumos"
          cantidad={estado.insumos.length}
          esAdmin={esAdmin}
        />
        {estado.insumos.length === 0 ? (
          <p className="text-text-muted text-sm">No hay insumos activos.</p>
        ) : (
          <TablaInsumos
            filas={estado.insumos}
            disabled={bloqueado}
            onChange={cierre.actualizarInsumo}
          />
        )}
      </section>

      <BarraCierre
        cierre={cierre}
        onAbrirResumen={() => setResumenAbierto(true)}
        onFinalizar={pedirFinalizar}
      />

      <ResumenCajaModal
        open={resumenAbierto}
        onClose={() => setResumenAbierto(false)}
        cierre={cierre}
      />

      <ConfirmarCierreModal
        open={confirmarAbierto}
        guardando={cierre.guardando === 'finalizar'}
        esAdmin={esAdmin}
        esCorreccion={cierre.esCorreccion}
        fecha={fecha}
        vasosVendidos={cierre.vasosVendidos}
        itemsComida={
          estado.ventasVariantes.reduce((s, v) => s + (v.cantidad || 0), 0) +
          estado.ventasComida.reduce((s, v) => s + (v.cantidad || 0), 0)
        }
        cuadre={cierre.cuadre}
        dineroBase={estado.dineroBase}
        dineroFinal={estado.dineroFinal}
        onCancel={() => setConfirmarAbierto(false)}
        onConfirm={confirmar}
      />

      <NovedadesDrawer
        open={!!filaNovedades}
        titulo={etiquetaVaso(filaNovedades ?? undefined)}
        novedades={filaNovedades?.novedades ?? []}
        motivos={datos.motivos}
        disabled={bloqueado}
        onClose={() => setNovedadesTallaId(null)}
        onChange={(novedades) => {
          if (novedadesTallaId) cierre.actualizarVaso(novedadesTallaId, 'novedades', novedades)
        }}
      />
    </motion.div>
  )
}
