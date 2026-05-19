<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cholaos Contabilidad — convenciones

## Stack

- Next.js 16 App Router, TypeScript, Tailwind 4
- Supabase (auth + DB), Framer Motion, react-hot-toast, Lucide, Recharts
- Fuentes: Syne (`font-display`), DM Sans (`font-body` / `font-sans`)

## Rutas protegidas

```typescript
import { requireDueno } from '@/lib/auth'   // solo dueño → redirect /dashboard
import { requireAuth } from '@/lib/auth'   // sesión → redirect /login

export default async function ProductosPage() {
  await requireDueno()
  return <GestionProductos />
}
```

## Fetching en Client Components

Patrón estándar:

```typescript
const [data, setData] = useState<Producto[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  fetch('/api/productos')
    .then((r) => r.json())
    .then(setData)
    .catch(() => toast.error('Error cargando productos'))
    .finally(() => setLoading(false))
}, [])
```

Alternativa con helper: `fetchJson<Producto[]>('/api/productos', 'Error cargando productos')` en `@/lib/api-client`.

## Mutations

```typescript
import toast from 'react-hot-toast'

async function guardarVenta(payload: NuevaVentaPayload) {
  const id = toast.loading('Registrando venta...')
  try {
    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error()
    toast.success('Venta registrada', { id })
  } catch {
    toast.error('Error al registrar', { id })
  }
}
```

Alternativa: `mutateJson()` en `@/lib/api-client`.

## Página cliente (estructura)

1. `'use client'` arriba
2. Estados: `data`, `loading`, `error?`, filtros UI
3. `useEffect` para GET inicial
4. `motion.div` con `staggerContainer` + `fadeUp` / `listItem` (`@/lib/animations`)
5. `SkeletonTabla` o `SkeletonStat` mientras `loading`
6. Clases utilitarias: `.input`, `.btn-primary`, `.card`, `.card-hover`
7. Iconos Lucide import individual (`import { Package } from 'lucide-react'`)
8. Tipos desde `@/types`, formato con `@/lib/utils` (`formatPesos`, `getRangoFecha`, etc.)

## Componentes UI

Preferir `@/components/ui/*` (Button, Input, Card, Badge, Modal, StatCard, Skeleton) sobre clases sueltas cuando aplique.

## APIs

- Productos activos: `GET /api/productos`
- Gestión productos (dueño): `GET /api/productos?todos=true`
- Ventas: `GET/POST /api/ventas`, detalle en joins
- Reportes: `GET /api/reportes?desde=&hasta=` (ambos requeridos)
