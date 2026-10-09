'use client'

import { useCallback, useMemo } from 'react'
import { useApiGet } from '@/hooks/useApiGet'
import type { PersonaDescuento, TipoPersonaDescuento } from '@/types'

/** Personas activas para elegir en un descuento; permite crear una nueva al vuelo */
export function usePersonasDescuento(habilitado = true) {
  const api = useApiGet<PersonaDescuento[]>(habilitado ? '/api/personas-descuento' : null)
  const { recargar } = api

  const crear = useCallback(
    async (nombre: string, tipo: TipoPersonaDescuento): Promise<PersonaDescuento> => {
      const res = await fetch('/api/personas-descuento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, tipo }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'No se pudo crear la persona')
      recargar()
      return body as PersonaDescuento
    },
    [recargar]
  )

  const personas = useMemo(() => api.data ?? [], [api.data])
  return { personas, cargando: api.loading && !api.data, crear }
}
