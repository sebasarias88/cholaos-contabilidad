'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { formatPesos } from '@/lib/utils'
import type { Producto } from '@/types'

interface FormVentaProps {
  productos: Producto[]
}

export function FormVenta({ productos }: FormVentaProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const productoId = form.get('producto_id') as string
    const producto = productos.find((p) => p.id === productoId)
    const cantidad = Number(form.get('cantidad'))

    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        observaciones: (form.get('observaciones') as string) || undefined,
        items: [
          {
            producto_id: productoId,
            cantidad,
            precio_unitario: producto?.precio ?? 0,
          },
        ],
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al registrar la venta')
      return
    }

    router.push('/dashboard/ventas/historial')
    router.refresh()
  }

  return (
    <Card title="Registrar venta">
      <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="producto_id" className="text-sm font-medium">
            Producto
          </label>
          <select
            id="producto_id"
            name="producto_id"
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Selecciona un producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.onzas} oz) — {formatPesos(p.precio)}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Cantidad"
          name="cantidad"
          type="number"
          min={1}
          defaultValue={1}
          required
        />
        <Input label="Observaciones (opcional)" name="observaciones" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar venta'}
        </Button>
      </form>
    </Card>
  )
}
