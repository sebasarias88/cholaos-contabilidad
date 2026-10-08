'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * GET con estado de carga. Mantiene los datos anteriores mientras recarga
 * (sin parpadeos). url = null no hace la petición.
 */
export function useApiGet<T>(url: string | null) {
  const [version, setVersion] = useState(0)
  const [estado, setEstado] = useState<{
    clave: string | null
    data: T | null
    error: string | null
  }>({
    clave: null,
    data: null,
    error: null,
  })
  const clave = url ? `${url}#${version}` : null

  useEffect(() => {
    if (!url || !clave) return
    let cancelado = false
    fetch(url)
      .then(async (res) => {
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Error cargando datos')
        return body as T
      })
      .then((data) => {
        if (!cancelado) setEstado({ clave, data, error: null })
      })
      .catch((e: Error) => {
        if (!cancelado) setEstado((prev) => ({ clave, data: prev.data, error: e.message }))
      })
    return () => {
      cancelado = true
    }
  }, [url, clave])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return {
    data: estado.data,
    error: estado.error,
    loading: clave !== null && estado.clave !== clave,
    recargar,
  }
}
