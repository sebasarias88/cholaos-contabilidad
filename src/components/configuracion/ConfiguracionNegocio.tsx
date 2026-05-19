'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { fadeUp } from '@/lib/animations'
import type { ConfiguracionNegocio } from '@/types'

export function ConfiguracionNegocio() {
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch('/api/configuracion')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data: ConfiguracionNegocio) => setNombre(data.nombre_negocio))
      .catch(() => toast.error('Error cargando configuración'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const nombreTrim = nombre.trim()
    if (!nombreTrim) {
      toast.error('El nombre del negocio es requerido')
      return
    }

    setGuardando(true)
    const id = toast.loading('Guardando...')

    const res = await fetch('/api/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_negocio: nombreTrim }),
    })

    setGuardando(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Error al guardar', { id })
      return
    }

    toast.success('Nombre del negocio actualizado', { id })
  }

  if (loading) {
    return (
      <div className="max-w-md space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="max-w-md space-y-4">
      <div>
        <h2 className="font-display text-lg text-text-primary">Negocio</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Este nombre aparece en los reportes y exportaciones del sistema.
        </p>
      </div>

      <form onSubmit={guardar} className="card space-y-4 p-4">
        <Input
          label="Nombre del negocio"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Cholao Oscar"
          required
          disabled={guardando}
        />
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </motion.div>
  )
}
