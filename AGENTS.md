<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cholaos Contabilidad — convenciones

## Stack

- Next.js 16.4 App Router (`src/proxy.ts`, antes middleware), TypeScript, Tailwind 4
- Supabase (auth + DB + RLS), Framer Motion, react-hot-toast, Lucide, Recharts, ExcelJS + jsPDF (exportes)
- Fuentes: Bricolage Grotesque (`font-display`), Manrope (`font-sans`) vía `next/font`

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
4. `motion.div` con `staggerContainer` + `fadeUp` (`@/lib/animations`). Si un bloque usa `variants`, su contenedor debe tener `initial="hidden" animate="visible"` (si no, queda invisible)
5. `Skeleton` / `SkeletonTabla` mientras `loading`
6. Clases utilitarias de `globals.css`: `.card`, `.card-hover`, `.input`, `.select-field`, `.badge-*`, `.data-table`, `.focus-ring`
7. Iconos Lucide import individual (`import { Package } from 'lucide-react'`)
8. Tipos desde `@/types`, formato con `@/lib/utils` (`formatPesos`, `getRangoFecha`, etc.)

## Componentes UI

Preferir `@/components/ui/*` sobre clases sueltas: `Button`, `Input`, `InputPeso`, `Select`, `Card`, `Badge`, `Modal` (en celular sale desde abajo), `ConfirmarModal`, `EncabezadoPagina` (título de cada página), `PildorasFiltro`, `FiltroRango`, `EstadoVacio`, `Skeleton`, `NumeroAnimado`, `BarraProgreso`, `Stepper`, `Celebracion`.

## Diseño "Fresco"

- Colores como tokens en `globals.css` (`bg-base` crema, `brand` naranja, `cocoa` café oscuro, `ok` / `bad` / `warn`). No usar hex sueltos salvo en gráficas (Recharts).
- Pensado primero para celular y para un monitor pequeño: probar en 390 px y 1366×768.
- Fechas en español: usar `capitalizar()` de `@/lib/utils`, no la clase `capitalize` (pone mayúscula a cada palabra).

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
- RLS (configurado en Supabase): anon sin acceso; empleado solo lee catálogo activo y el cierre de **hoy**; ventas e historial solo admin.
- El cierre se guarda con la función `guardar_cierre(p jsonb)` (una transacción). **Precios e inventario inicial los pone la BD**, nunca el cliente.
- Validar body con whitelist (no hacer `.insert(body)`).

## Fechas

Siempre `hoyColombia()` / `fechaColombia()` de `@/lib/fechas` (America/Bogota). Nunca `format(new Date(), 'yyyy-MM-dd')`: en Vercel es UTC y después de las 7 p.m. sería "mañana".

## Base de datos

- El esquema (tablas, RLS y funciones) vive en el proyecto de Supabase; los cambios de base de datos se aplican desde el SQL Editor.
- Funciones: `guardar_cierre` (borrador o definitivo), `base_cierre` (último cierre anterior: dinero y conteos finales), `ultimo_cierre_cerrado`, `uso_almacenamiento`, `vista_previa_limpieza`, `limpiar_datos`, `hoy_colombia`, `es_admin`, `es_usuario_activo`, `puede_ver_cierre`.
- Reglas del cierre: un cierre nuevo (o un borrador que se finaliza) debe ser **posterior al último cierre cerrado**; corregir un día cerrado no cambia su fecha ni recalcula los días siguientes; un cierre cerrado no vuelve a borrador.
- `limpiar_datos` siempre conserva el último cierre (es la base del inventario).
- Tipos de producto: `vaso`, `comida`, `insumo`, `masa`. Insumo y masa son solo conteo (sin precio, `esSoloConteo()`).
- Adiciones: comida sin variantes con `productos.es_adicion` → sección Adiciones del paso Comida.
- Insumos por cajas: `productos.unidades_por_caja` (ej. Barquillo = 24). En el cierre se escribe cajas + unidades; en la BD todo se guarda en unidades (`lib/cajas.ts`).
- Masas y unidades: `productos.lleva_masas` agrega el campo "Masas" (`conteo_vasos.numero_masas`), obligatorio al finalizar.
- Base de caja: `cierres_dia.base_anterior` (la de anoche) y `base_nueva` (si el dueño sacó o metió plata). `dinero_base_inicio` es la base usada en el cuadre = `coalesce(base_nueva, base_anterior)`. Retiro = anterior − nueva (`lib/cierre/base.ts`). El empleado escribe la base nueva una sola vez; después solo el admin la cambia.
- Bebidas contadas (`productos.conteo_inventario`, solo comida sin variantes; ej. agua y gaseosas): en el cierre se cuentan igual que los vasos (inicio = final del cierre anterior, llegaron, quedan, novedades) en el paso Bebidas. `guardar_cierre` (`p->'bebidas'`) guarda el conteo en `conteo_vasos` y la venta (vendidas × precio) en `ventas_comida`; no se pueden sumar a mano en Comida.
- Masas de pizza: en el cierre se escribe con cuántas **empezó** y con cuántas **terminó** cada masa (el inicio se sugiere con el final del cierre anterior y se puede cambiar). Se guardan en `conteo_vasos` (con `producto_id`, sin talla) vía `guardar_cierre` (`p->'masas'`). No suman a ventas ni a la caja.
- `ventas_comida` y `ventas_variantes` guardan `precio_unitario` del día (precio histórico).

## APIs

- Productos activos: `GET /api/productos` (sesión) · gestión: `?todos=true` (admin)
- Cierre: `GET /api/cierres/prellenado?fecha=` (todo lo del formulario en una petición; empleado solo hoy), `GET /api/cierres?desde=&hasta=` (admin), `POST /api/cierres` (`finalizar: false` = guardar avance / borrador, `true` = cerrar)
- Almacenamiento (admin): `GET /api/almacenamiento`, `GET|POST /api/almacenamiento/limpieza` (POST exige `confirmacion: "BORRAR"`)
- Ventas (solo lectura, admin): `GET /api/ventas?desde=&hasta=` — se generan solo al cerrar el día
- Reportes (admin): `GET /api/reportes?desde=&hasta=`; exportación Excel/PDF en el cliente (`@/lib/export-reportes`)
- Usuarios (admin):
  - `GET /api/usuarios` → `Usuario[]` con `email`
  - `POST /api/usuarios` `{ email, nombre, password }` → crea Auth + perfil (si falla el perfil, revierte)
  - `PUT /api/usuarios/[id]` `{ nombre?, activo?, password? }` (desactivar bloquea la sesión en Auth)
  - `DELETE /api/usuarios/[id]` → solo si no tiene cierres

## Estructura

- `src/lib/cierre/` — lógica pura del cierre (estado del formulario, cuadre, ventas de vasos, historial) + `api.ts` (servidor)
- `src/hooks/useCierreDia.ts` — estado y acciones del cierre (guardar avance / finalizar)
- `src/hooks/useApiGet.ts`, `useRangoFechas.ts`, `useMenuAcciones.ts` — datos, filtros de período y menús
- `src/components/cierre/` — `FormCierreDia` compone `CierreEncabezado`, `TablaVasos`, `SeccionComida`, `TablaInsumos`, `caja/PasoCaja`, `PasoRevisar`; historial en `historial/`
- `src/components/cierre/` — el cierre es un asistente por pasos (`lib/cierre/pasos.ts` + `PasosCierre`): Vasos, Bebidas, Comida, Masas y unidades, Insumos, Caja, Revisar; a un lado `caja/CajaEnVivo` y en celular `caja/BarraMovil`
- `src/components/dashboard/` — Inicio (estado del cierre de hoy, KPIs, barras de 7 días)
- `src/components/ui/` — componentes base (ver arriba) y `MenuAccionesPortal` (+ `MenuItem`), `BotonAcciones`

## Calidad

- `npm test` (Vitest, `src/lib/__tests__`), `npm run typecheck`, `npm run lint`, `npm run format`
- La lógica de negocio va en `src/lib` (pura y con prueba); los componentes solo pintan.

## Empleados

El admin crea cuentas en `/dashboard/configuracion` → pestaña Equipo (contraseña sugerida: inicio del correo + 4 números). No hay registro público: en Supabase Auth debe estar desactivado "Allow new users to sign up".

## Assets del negocio (`public/images/`)

Imágenes del negocio para UI, marketing o branding. **Ruta en código:** `/images/<archivo>` (carpeta `public/images/`, no `src/public`).

| Archivo | Uso típico |
|---------|------------|
| `icons/icon-512.png`, `icons/icon-192.png` | PWA, favicon |
| `cholao-hero.jpg` | Login: arriba en celular, panel izquierdo en PC |

```tsx
import Image from 'next/image'

<Image src="/icons/icon-512.png" alt="Cholao Oscar" width={64} height={64} />
```


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
