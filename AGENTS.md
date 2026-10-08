<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cholaos Contabilidad — convenciones

## Stack

- Next.js 16.4 App Router (`src/proxy.ts`, antes middleware), TypeScript, Tailwind 4
- Supabase (auth + DB + RLS), Framer Motion, react-hot-toast, Lucide, Recharts, ExcelJS + jsPDF (exportes)
- Fuentes: Syne (`font-display`), DM Sans (`font-body` / `font-sans`)

## Rutas protegidas

```typescript
import { requireAdmin } from '@/lib/auth'   // solo admin → redirect /dashboard
import { requireAuth } from '@/lib/auth'   // sesión → redirect /login

export default async function ProductosPage() {
  await requireAdmin()
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

## Variables de entorno (Vercel: tipo **Sensitive**, sin prefijo `NEXT_PUBLIC_`)

| Variable | Uso |
|----------|-----|
| `SUPABASE_URL` | URL del proyecto — solo servidor |
| `SUPABASE_ANON_KEY` | Anon key — proxy, SSR, API routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo `/api/usuarios` (crear, bloquear, eliminar cuentas de Auth) |

Copia `.env.example` → `.env` en local. Auth del navegador va por `/api/auth` (POST login, PATCH contraseña, DELETE logout).

## Seguridad (reglas)

- **Toda ruta API** empieza con `requireAuthApi()` o `requireAdminApi()` (`@/lib/api-auth`). Nunca confiar solo en el proxy.
- Las API usan el cliente con la sesión del usuario (RLS activo). `createAdminClient()` solo en `/api/usuarios`.
- RLS (ver `supabase/migrations`): anon sin acceso; empleado solo lee catálogo activo y el cierre de **hoy**; ventas e historial solo admin.
- El cierre se guarda con la función `guardar_cierre(p jsonb)` (una transacción). **Precios e inventario inicial los pone la BD**, nunca el cliente.
- Validar body con whitelist (no hacer `.insert(body)`).

## Fechas

Siempre `hoyColombia()` / `fechaColombia()` de `@/lib/fechas` (America/Bogota). Nunca `format(new Date(), 'yyyy-MM-dd')`: en Vercel es UTC y después de las 7 p.m. sería "mañana".

## Base de datos

- Migraciones en `supabase/migrations/` (fuente de verdad del esquema nuevo).
- Funciones: `guardar_cierre`, `base_cierre` (último cierre anterior: dinero y conteos finales), `hoy_colombia`, `es_admin`, `es_usuario_activo`, `puede_ver_cierre`.
- `ventas_comida` y `ventas_variantes` guardan `precio_unitario` del día (precio histórico).

## APIs

- Productos activos: `GET /api/productos` (sesión) · gestión: `?todos=true` (admin)
- Cierre: `GET /api/cierres/prellenado`, `GET /api/cierres?fecha=` (empleado solo hoy), `GET /api/cierres?desde=&hasta=` (admin), `POST /api/cierres`
- Ventas (solo lectura, admin): `GET /api/ventas?desde=&hasta=` — se generan solo al cerrar el día
- Reportes (admin): `GET /api/reportes?desde=&hasta=`; exportación Excel/PDF en el cliente (`@/lib/export-reportes`)
- Usuarios (admin):
  - `GET /api/usuarios` → `Usuario[]` con `email`
  - `POST /api/usuarios` `{ email, nombre, password }` → crea Auth + perfil (si falla el perfil, revierte)
  - `PUT /api/usuarios/[id]` `{ nombre?, activo?, password? }` (desactivar bloquea la sesión en Auth)
  - `DELETE /api/usuarios/[id]` → solo si no tiene cierres

## Empleados

El admin crea cuentas en `/dashboard/configuracion` → pestaña Equipo (contraseña sugerida: inicio del correo + 4 números). No hay registro público: en Supabase Auth debe estar desactivado "Allow new users to sign up".

## Assets del negocio (`public/images/`)

Imágenes del negocio para UI, marketing o branding. **Ruta en código:** `/images/<archivo>` (carpeta `public/images/`, no `src/public`).

| Archivo | Uso típico |
|---------|------------|
| `icons/icon-512.png`, `icons/icon-192.png` | PWA, favicon |
| `cholao-hero.jpg` | Fondo login (mobile) y panel derecho (desktop) |

```tsx
import Image from 'next/image'

<Image src="/icons/icon-512.png" alt="Cholao Oscar" width={64} height={64} />
```

Login: fondo `cholao-hero.jpg` en mobile; formulario sin logo PNG (icono copo en mobile, panel hero en desktop).

### Favicon e iconos PWA (desde `logo.JPG`)

1. Ir a [favicon.io](https://favicon.io) → **PNG to Favicon** (o subir el logo del negocio)
2. Generar paquete desde el icono base (`public/icons/icon-512.png`)
3. Descargar el paquete
4. Copiar a `public/`:
   - `favicon.ico`
   - `apple-touch-icon.png`
   - `favicon-16x16.png`, `favicon-32x32.png` (si vienen)
5. Iconos PWA 192/512 → `public/icons/icon-192.png` y `icon-512.png`
6. `manifest.json` ya apunta a esas rutas; `layout.tsx` usa `icons.icon` y `icons.apple`

Los iconos actuales en `public/` se generaron con `sips` desde el logo; reemplázalos con el paquete de favicon.io para mejor calidad.
