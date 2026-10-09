'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, HandCoins } from 'lucide-react'
import { ReporteDescuentos } from '@/components/reportes/ReporteDescuentos'
import { ReportesDashboard } from '@/components/reportes/ReportesDashboard'
import { useApiGet } from '@/hooks/useApiGet'

type Tab = 'ventas' | 'descuentos'

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'ventas', label: 'Ventas', icon: BarChart3 },
  { id: 'descuentos', label: 'Descuentos por persona', icon: HandCoins },
]

export function ReportesPanel() {
  const [tab, setTab] = useState<Tab>('ventas')
  const configApi = useApiGet<{ nombre_negocio: string }>('/api/configuracion')
  const nombreNegocio = configApi.data?.nombre_negocio ?? 'Cholao Oscar'

  return (
    <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div
          role="tablist"
          aria-label="Tipo de reporte"
          className="bg-bg-elevated border-bg-border inline-flex gap-1 rounded-[16px] border p-1"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const activa = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => setTab(id)}
                className={`focus-ring relative flex min-h-11 shrink-0 items-center gap-2 rounded-[12px] px-4 text-sm font-bold transition-colors ${
                  activa ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {activa && (
                  <motion.span
                    layoutId="reportes-tab"
                    className="bg-bg-surface shadow-soft absolute inset-0 rounded-[12px]"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon size={17} className={`relative ${activa ? 'text-brand' : ''}`} aria-hidden />
                <span className="relative">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="min-w-0"
        >
          {tab === 'ventas' ? (
            <ReportesDashboard />
          ) : (
            <ReporteDescuentos nombreNegocio={nombreNegocio} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
