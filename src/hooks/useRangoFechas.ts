'use client'

import { useMemo, useState } from 'react'
import { hoyColombia } from '@/lib/fechas'
import { getRangoFecha } from '@/lib/utils'

export type PresetRango = 'hoy' | 'semana' | 'quincena' | 'mes' | 'custom'

/** Filtro de período (presets o rango personalizado), en fechas de Colombia */
export function useRangoFechas(inicial: Exclude<PresetRango, 'custom'> = 'semana') {
  const [preset, setPreset] = useState<PresetRango>(inicial)
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')

  const completo =
    preset !== 'custom' || (!!customDesde && !!customHasta && customDesde <= customHasta)

  const rango = useMemo(() => {
    if (preset === 'custom') {
      return completo ? { desde: customDesde, hasta: customHasta } : getRangoFecha(inicial)
    }
    return getRangoFecha(preset)
  }, [preset, completo, customDesde, customHasta, inicial])

  function seleccionar(id: PresetRango) {
    setPreset(id)
    if (id === 'custom') {
      const hoy = hoyColombia()
      setCustomDesde((d) => d || hoy)
      setCustomHasta((h) => h || hoy)
    }
  }

  return {
    preset,
    seleccionar,
    customDesde,
    customHasta,
    setCustomDesde,
    setCustomHasta,
    rango,
    completo,
  }
}

export type RangoFechasApi = ReturnType<typeof useRangoFechas>
