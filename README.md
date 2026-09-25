# Cholaos Contabilidad

Sistema interno de contabilidad para Cholao Oscar (Next.js 16 + Supabase).

## Requisitos

- Node.js 20+
- Proyecto Supabase configurado

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores (Supabase → Settings → API):

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto |
| `SUPABASE_ANON_KEY` | Anon key (solo servidor) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (crear/eliminar usuarios) |

En Vercel, marca las tres como **Sensitive**.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servir build
- `npm run lint` — ESLint

Convenciones del código: ver [`AGENTS.md`](AGENTS.md).
