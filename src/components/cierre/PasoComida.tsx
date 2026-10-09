'use client'

import type { ReactNode } from 'react'
import { CupSoda, Package, UtensilsCrossed } from 'lucide-react'
import { SeccionComida } from '@/components/cierre/SeccionComida'
import { TablaBebidas } from '@/components/cierre/TablaBebidas'
import { TablaInsumos } from '@/components/cierre/TablaInsumos'
import type { CierreDiaApi } from '@/hooks/useCierreDia'

function Subtitulo({ icono, titulo, ayuda }: { icono: ReactNode; titulo: string; ayuda: string }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="bg-brand-soft text-brand mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]">
        {icono}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-text-primary text-lg leading-tight font-bold">{titulo}</h3>
        <p className="text-text-secondary text-sm">{ayuda}</p>
      </div>
    </div>
  )
}

/** Paso Comida: bebidas contadas como los vasos, ventas de comida y adiciones, e insumos */
export function PasoComida({
  cierre,
  onAbrirNovedadesBebida,
}: {
  cierre: CierreDiaApi
  onAbrirNovedadesBebida: (productoId: string) => void
}) {
  const { estado, esAdmin, bloqueado } = cierre
  const hayVentas = cierre.productosComida.length > 0

  return (
    <div className="flex flex-col gap-8">
      {estado.bebidas.length > 0 && (
        <section>
          <Subtitulo
            icono={<CupSoda size={18} />}
            titulo="Bebidas"
            ayuda="Igual que los vasos: cuántas llegaron y cuántas quedan. Las vendidas se calculan solas."
          />
          <TablaBebidas
            filas={estado.bebidas}
            esAdmin={esAdmin}
            disabled={bloqueado}
            onChange={cierre.actualizarBebida}
            onAbrirNovedades={onAbrirNovedadesBebida}
          />
        </section>
      )}

      {hayVentas && (
        <section>
          <Subtitulo
            icono={<UtensilsCrossed size={18} />}
            titulo="Pizzas, otros productos y adiciones"
            ayuda="Suma lo que se vendió."
          />
          <SeccionComida
            productos={cierre.productosComida}
            ventasVariantes={estado.ventasVariantes}
            ventasComida={estado.ventasComida}
            esAdmin={esAdmin}
            disabled={bloqueado}
            onVarianteChange={cierre.cambiarVariante}
            onComidaChange={cierre.cambiarComida}
          />
        </section>
      )}

      {estado.insumos.length > 0 && (
        <section>
          <Subtitulo
            icono={<Package size={18} />}
            titulo="Insumos"
            ayuda="Cuenta lo que llegó y lo que queda (no suman a las ventas)."
          />
          <TablaInsumos
            filas={estado.insumos}
            disabled={bloqueado}
            onChange={cierre.actualizarInsumo}
          />
        </section>
      )}
    </div>
  )
}
