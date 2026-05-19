'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Settings, User, Users } from 'lucide-react'
import { ConfiguracionNegocio } from '@/components/configuracion/ConfiguracionNegocio'
import { GestionEquipo } from '@/components/configuracion/GestionEquipo'
import { MiCuenta } from '@/components/configuracion/MiCuenta'
import { fadeUp, staggerContainer } from '@/lib/animations'
import type { Usuario } from '@/types'

type Tab = 'equipo' | 'cuenta' | 'negocio'

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'equipo', label: 'Equipo', icon: Users },
  { id: 'cuenta', label: 'Mi cuenta', icon: User },
  { id: 'negocio', label: 'Negocio', icon: Building2 },
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
      className="space-y-6"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <Settings size={20} className="text-accent-cyan" />
        <h1 className="font-display text-xl text-text-primary">Configuración</h1>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto border-b border-bg-border pb-px">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors -mb-px',
              tab === id
                ? 'border-accent-cyan text-accent-cyan'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </motion.div>

      {tab === 'equipo' && (
        <GestionEquipo usuarioActualId={usuario.id} />
      )}
      {tab === 'cuenta' && (
        <MiCuenta
          usuario={usuario}
          email={email}
          onNombreActualizado={setNombrePerfil}
        />
      )}
      {tab === 'negocio' && <ConfiguracionNegocio />}
    </motion.div>
  )
}
