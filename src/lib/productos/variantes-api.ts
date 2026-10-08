import type { VarianteFormDraft } from '@/lib/productos/formulario'
import type { VarianteProducto } from '@/types'

async function verificar(res: Response) {
  if (res.ok) return
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  throw new Error(data.error ?? 'Error guardando variantes')
}

export async function sincronizarVariantes(
  productoId: string,
  drafts: VarianteFormDraft[],
  existentes: VarianteProducto[] | undefined,
  tieneVariantes: boolean
) {
  const prev = (existentes ?? []).filter((v) => v.activo)

  if (!tieneVariantes) {
    const resps = await Promise.all(
      prev.map((v) => fetch(`/api/variantes/${v.id}`, { method: 'DELETE' }))
    )
    for (const r of resps) await verificar(r)
    return
  }

  const keepIds = new Set(drafts.map((d) => d.id).filter(Boolean) as string[])

  const borrados = await Promise.all(
    prev
      .filter((v) => !keepIds.has(v.id))
      .map((v) => fetch(`/api/variantes/${v.id}`, { method: 'DELETE' }))
  )
  for (const r of borrados) await verificar(r)

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i]
    const body = {
      nombre: d.nombre.trim(),
      precio: Number(d.precio),
      orden: i + 1,
      activo: true,
    }

    const res = d.id
      ? await fetch(`/api/variantes/${d.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/variantes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, producto_id: productoId }),
        })
    await verificar(res)
  }
}
