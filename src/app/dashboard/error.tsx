'use client'

import { useEffect } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/** Se muestra si una página del panel falla al cargar (ej. sin conexión con la base de datos) */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center p-6 text-center">
      <span className="bg-bad-soft text-bad mb-5 flex h-16 w-16 items-center justify-center rounded-[20px]">
        <TriangleAlert size={30} aria-hidden />
      </span>
      <h1 className="font-display text-text-primary text-2xl font-extrabold">Algo salió mal</h1>
      <p className="text-text-secondary mt-2 max-w-sm">
        No pudimos cargar esta sección. Revisa tu conexión a internet e inténtalo de nuevo.
      </p>
      <Button type="button" size="lg" className="mt-7" onClick={reset}>
        <RotateCcw size={18} aria-hidden />
        Reintentar
      </Button>
    </div>
  )
}
