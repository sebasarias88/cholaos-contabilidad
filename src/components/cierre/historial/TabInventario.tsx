'use client'

import type { ReactNode } from 'react'
import { TabVasos } from '@/components/cierre/historial/TabVasos'
import { masasUsadas } from '@/lib/cierre/estado'
import { tipoProducto } from '@/lib/productos-ui'
import type { CierreDia, ConteoVaso } from '@/types'

function Seccion({
  titulo,
  extra,
  children,
}: {
  titulo: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-text-secondary text-xs font-extrabold tracking-wider uppercase">
          {titulo}
        </h4>
        {extra}
      </div>
      {children}
    </section>
  )
}

/** Tabla simple de conteos por producto (masas e insumos) */
function TablaConteos({
  filas,
  columnas,
}: {
  filas: { id: string; nombre: string; valores: (number | string)[]; resaltado: number | string }[]
  columnas: [string, string, string]
}) {
  return (
    <div className="border-bg-border overflow-hidden rounded-[var(--radius-md)] border">
      <div className="bg-bg-elevated text-text-secondary grid grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] gap-2 px-3 py-2 text-[11px] font-bold tracking-wide uppercase">
        <span>Producto</span>
        {columnas.map((c) => (
          <span key={c} className="text-center last:text-right">
            {c}
          </span>
        ))}
      </div>
      <ul className="divide-bg-border divide-y">
        {filas.map((f) => (
          <li
            key={f.id}
            className="grid grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] items-center gap-2 px-3 py-2.5 text-sm"
          >
            <span className="text-text-primary truncate font-semibold">{f.nombre}</span>
            {f.valores.map((v, i) => (
              <span key={i} className="text-text-secondary text-center tabular-nums">
                {v}
              </span>
            ))}
            <span className="text-text-primary text-right font-extrabold tabular-nums">
              {f.resaltado}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Todo lo contado en el cierre: vasos, masas de pizza e insumos */
export function TabInventario({ cierre }: { cierre: CierreDia }) {
  const conteos: ConteoVaso[] = cierre.conteo_vasos ?? []
  const vasos = conteos.filter((c) => c.talla_id)
  const tipoDe = (c: ConteoVaso) => (c.producto ? tipoProducto(c.producto) : null)
  const masas = conteos
    .filter((c) => !c.talla_id && tipoDe(c) === 'masa')
    .sort((a, b) => (a.producto?.orden ?? 0) - (b.producto?.orden ?? 0))
  const insumos = conteos.filter((c) => !c.talla_id && tipoDe(c) === 'insumo')

  const totalMasas = masas.reduce(
    (s, m) =>
      s + masasUsadas({ cantidad_inicio: m.cantidad_inicio, cantidad_final: m.cantidad_final }),
    0
  )

  return (
    <div className="space-y-6">
      <Seccion titulo="Vasos">
        <TabVasos rows={vasos} />
      </Seccion>

      {masas.length > 0 && (
        <Seccion
          titulo="Masas de pizza"
          extra={
            <span className="badge-warn tabular-nums">
              {totalMasas} usada{totalMasas === 1 ? '' : 's'}
            </span>
          }
        >
          <TablaConteos
            columnas={['Empezó', 'Terminó', 'Usadas']}
            filas={masas.map((m) => ({
              id: m.id,
              nombre: m.producto?.nombre ?? 'Masa',
              valores: [m.cantidad_inicio, m.cantidad_final ?? '—'],
              resaltado: masasUsadas({
                cantidad_inicio: m.cantidad_inicio,
                cantidad_final: m.cantidad_final,
              }),
            }))}
          />
        </Seccion>
      )}

      {insumos.length > 0 && (
        <Seccion titulo="Insumos">
          <TablaConteos
            columnas={['Inicio', 'Quedan', 'Usados']}
            filas={insumos.map((c) => ({
              id: c.id,
              nombre: c.producto?.nombre ?? 'Insumo',
              valores: [c.cantidad_inicio + c.cantidad_nuevos, c.cantidad_final ?? '—'],
              resaltado: Math.max(
                0,
                c.cantidad_inicio + c.cantidad_nuevos - (c.cantidad_final ?? 0)
              ),
            }))}
          />
        </Seccion>
      )}
    </div>
  )
}
