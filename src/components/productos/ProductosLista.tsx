'use client'

import { BotonAcciones } from '@/components/ui/BotonAcciones'
import { BadgeTipo, ProductoEstado, ProductoPrecio } from '@/components/productos/ProductoCeldas'
import { medidaProducto, tipoProducto } from '@/lib/productos-ui'
import type { Producto } from '@/types'

export type EdicionPrecio = {
  editandoId: string | null
  borrador: string
  iniciar: (p: Producto) => void
  cambiar: (valor: string) => void
  guardar: (id: string) => void
  cancelar: () => void
}

/** Productos: tarjetas en móvil, tabla en escritorio */
export function ProductosLista({
  productos: filtrados,
  precio,
  menuAbierto,
  onToggleMenu,
  onToggleActivo,
}: {
  productos: Producto[]
  precio: EdicionPrecio
  menuAbierto: (id: string) => boolean
  onToggleMenu: (id: string, e: React.MouseEvent<HTMLButtonElement>) => void
  onToggleActivo: (p: Producto) => void
}) {
  return (
    <>
      {/* Vista móvil: tarjetas */}
      <ul className="flex flex-col gap-3 md:hidden">
        {filtrados.map((p) => {
          const tipo = tipoProducto(p)
          return (
            <li
              key={p.id}
              className="border-bg-border bg-bg-surface overflow-hidden rounded-[var(--radius-lg)] border"
            >
              <div className="p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary leading-snug font-medium">{p.nombre}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <BadgeTipo tipo={tipo} />
                      <span className="text-text-secondary text-xs tabular-nums">
                        {medidaProducto(p)}
                      </span>
                    </div>
                  </div>
                  <BotonAcciones
                    abierto={menuAbierto(p.id)}
                    onClick={(e) => onToggleMenu(p.id, e)}
                  />
                </div>

                <div className="border-bg-border mt-4 space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-muted text-sm">Precio</span>
                    <ProductoPrecio
                      producto={p}
                      editingPrecioId={precio.editandoId}
                      precioDraft={precio.borrador}
                      onStartEdit={() => precio.iniciar(p)}
                      onDraftChange={precio.cambiar}
                      onSave={() => precio.guardar(p.id)}
                      onCancel={precio.cancelar}
                      inputClassName="select-field w-full max-w-[10rem] tabular-nums sm:max-w-none sm:w-28"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-muted text-sm">Estado</span>
                    <ProductoEstado producto={p} onToggle={() => onToggleActivo(p)} />
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Vista escritorio: tabla */}
      <div className="table-surface hidden max-w-full min-w-0 md:block">
        <table className="data-table">
          <colgroup>
            <col style={{ minWidth: '10rem' }} />
            <col style={{ minWidth: '7.5rem' }} />
            <col style={{ minWidth: '6.5rem' }} />
            <col style={{ minWidth: '9rem' }} />
            <col style={{ minWidth: '5.5rem' }} />
            <col style={{ minWidth: '4.5rem' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="col-name">Nombre</th>
              <th className="col-compact">Tipo</th>
              <th className="col-compact">Onzas / Unidad</th>
              <th className="col-compact">Precio</th>
              <th className="col-compact">Estado</th>
              <th className="col-compact text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => {
              const tipo = tipoProducto(p)
              return (
                <tr key={p.id}>
                  <td className="col-name text-text-primary font-medium">{p.nombre}</td>
                  <td className="col-compact">
                    <BadgeTipo tipo={tipo} />
                  </td>
                  <td className="col-compact text-text-secondary tabular-nums">
                    {medidaProducto(p)}
                  </td>
                  <td className="col-compact">
                    <ProductoPrecio
                      producto={p}
                      editingPrecioId={precio.editandoId}
                      precioDraft={precio.borrador}
                      onStartEdit={() => precio.iniciar(p)}
                      onDraftChange={precio.cambiar}
                      onSave={() => precio.guardar(p.id)}
                      onCancel={precio.cancelar}
                    />
                  </td>
                  <td className="col-compact">
                    <ProductoEstado producto={p} onToggle={() => onToggleActivo(p)} />
                  </td>
                  <td className="col-compact text-right">
                    <BotonAcciones
                      abierto={menuAbierto(p.id)}
                      onClick={(e) => onToggleMenu(p.id, e)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
