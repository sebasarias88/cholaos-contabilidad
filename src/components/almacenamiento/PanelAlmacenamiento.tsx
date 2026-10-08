'use client'

import { motion } from 'framer-motion'
import { GraficoCrecimiento } from '@/components/almacenamiento/GraficoCrecimiento'
import { LimpiezaDatos } from '@/components/almacenamiento/LimpiezaDatos'
import { MedidorUso } from '@/components/almacenamiento/MedidorUso'
import { TablaUso } from '@/components/almacenamiento/TablaUso'
import { Skeleton } from '@/components/ui/Skeleton'
import { useApiGet } from '@/hooks/useApiGet'
import { fadeUp, staggerContainer } from '@/lib/animations'
import {
  crecimientoDiario,
  diasHastaLlenar,
  formatBytes,
  type UsoAlmacenamiento,
} from '@/lib/almacenamiento'

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <motion.section variants={fadeUp} className="card space-y-4 p-5 sm:p-6">
      <h2 className="font-display text-text-primary text-lg font-bold">{titulo}</h2>
      {children}
    </motion.section>
  )
}

export function PanelAlmacenamiento() {
  const uso = useApiGet<UsoAlmacenamiento>('/api/almacenamiento')
  const config = useApiGet<{ nombre_negocio: string }>('/api/configuracion')

  if (uso.loading && !uso.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      </div>
    )
  }

  if (!uso.data) {
    return <p className="text-bad text-sm">{uso.error ?? 'No se pudo cargar el almacenamiento'}</p>
  }

  const d = uso.data
  const porDia = crecimientoDiario(d.historial)

  return (
    <motion.div
      className="flex flex-col gap-5"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp}>
        <MedidorUso bytes={d.bytes_total} diasRestantes={diasHastaLlenar(d.bytes_total, porDia)} />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Bloque titulo="Crecimiento">
          <GraficoCrecimiento historial={d.historial} />
          <p className="text-text-secondary text-xs">
            {d.cierres} cierres guardados
            {porDia !== null ? ` · crece unos ${formatBytes(porDia * 30)} al mes` : ''}
          </p>
        </Bloque>

        <Bloque titulo="¿Qué ocupa espacio?">
          <TablaUso tablas={d.tablas} />
        </Bloque>
      </div>

      <Bloque titulo="Limpieza de datos">
        <LimpiezaDatos
          primerCierre={d.primer_cierre}
          ultimoCierre={d.ultimo_cierre}
          nombreNegocio={config.data?.nombre_negocio ?? 'Cholao Oscar'}
          onLimpiado={uso.recargar}
        />
      </Bloque>
    </motion.div>
  )
}
