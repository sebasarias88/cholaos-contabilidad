'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HandCoins, Smartphone, Tags, User, Users } from 'lucide-react'
import { GestionEquipo } from '@/components/configuracion/GestionEquipo'
import { GestionMediosTransferencia } from '@/components/configuracion/GestionMediosTransferencia'
import { GestionPersonas } from '@/components/configuracion/GestionPersonas'
import { GestionMotivosNovedad } from '@/components/configuracion/GestionMotivosNovedad'
import { MiCuenta } from '@/components/configuracion/MiCuenta'
import { fadeUp, staggerContainer } from '@/lib/animations'
import type { Usuario } from '@/types'

type Tab = 'equipo' | 'personas' | 'motivos' | 'transferencias' | 'cuenta'

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'equipo', label: 'Equipo', icon: Users },
  { id: 'personas', label: 'Personas', icon: HandCoins },
  { id: 'motivos', label: 'Motivos', icon: Tags },
  { id: 'transferencias', label: 'Transferencias', icon: Smartphone },
  { id: 'cuenta', label: 'Mi cuenta', icon: User },
]

interface ConfiguracionPanelProps {
  usuario: Usuario
  email: string
}

export function ConfiguracionPanel({ usuario: usuarioInicial, email }: ConfiguracionPanelProps) {
  const [tab, setTab] = useState<Tab>('equipo')
  const [nombrePerfil, setNombrePerfil] = useState(usuarioInicial.nombre)

  const usuario = { ...usuarioInicial, nombre: nombrePerfil }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="min-w-0 space-y-6"
    >
      <motion.div variants={fadeUp} className="-mx-1 overflow-x-auto px-1 pb-1">
        <div
          role="tablist"
          aria-label="Secciones de configuración"
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
                    layoutId="config-tab"
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
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'equipo' && <GestionEquipo usuarioActualId={usuario.id} />}
          {tab === 'personas' && <GestionPersonas />}
          {tab === 'motivos' && <GestionMotivosNovedad />}
          {tab === 'transferencias' && <GestionMediosTransferencia />}
          {tab === 'cuenta' && (
            <MiCuenta usuario={usuario} email={email} onNombreActualizado={setNombrePerfil} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
