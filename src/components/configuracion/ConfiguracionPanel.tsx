'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Users } from 'lucide-react'
import { GestionEquipo } from '@/components/configuracion/GestionEquipo'
import { fadeUp, staggerContainer } from '@/lib/animations'

type Tab = 'equipo'

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'equipo', label: 'Equipo', icon: Users },
]

export function ConfiguracionPanel() {
  const [tab, setTab] = useState<Tab>('equipo')

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

      <motion.div variants={fadeUp} className="flex gap-2 border-b border-bg-border pb-px">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors -mb-px',
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

      {tab === 'equipo' && <GestionEquipo />}
    </motion.div>
  )
}
