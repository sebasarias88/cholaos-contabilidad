'use client'

import { useState } from 'react'
import { FileSpreadsheet, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmarModal } from '@/components/ui/ConfirmarModal'
import { useApiGet } from '@/hooks/useApiGet'
import { TEXTO_CONFIRMACION, type VistaPreviaLimpieza } from '@/lib/almacenamiento'
import { exportarPeriodo } from '@/lib/exportar-periodo'
import { sumarDias } from '@/lib/fechas'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import { formatFecha } from '@/lib/utils'

/**
 * Borra cierres antiguos (y todo lo que depende de ellos) hasta una fecha.
 * Siempre se conserva el último cierre para no perder el inventario inicial.
 */
export function LimpiezaDatos({
  primerCierre,
  ultimoCierre,
  nombreNegocio,
  onLimpiado,
}: {
  primerCierre: string | null
  ultimoCierre: string | null
  nombreNegocio: string
  onLimpiado: () => void
}) {
  const maximo = ultimoCierre ? sumarDias(ultimoCierre, -1) : null
  const [hasta, setHasta] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [texto, setTexto] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [exportando, setExportando] = useState(false)

  const valido = !!hasta && !!maximo && hasta <= maximo
  const preview = useApiGet<VistaPreviaLimpieza>(
    valido ? `/api/almacenamiento/limpieza?hasta=${hasta}` : null
  )
  const datos = valido ? preview.data : null

  if (!primerCierre || !maximo || primerCierre > maximo) {
    return (
      <p className="text-text-muted text-sm">
        Todavía no hay datos antiguos para limpiar. Siempre se conserva el último cierre.
      </p>
    )
  }

  async function exportar() {
    if (!datos?.desde) return
    setExportando(true)
    const id = toastLoading('Generando Excel del período...')
    try {
      const nombre = await exportarPeriodo('excel', { desde: datos.desde, hasta, nombreNegocio })
      toastSuccess(`Descargado: ${nombre}`, id)
    } catch (e) {
      toastError((e as Error).message, id)
    } finally {
      setExportando(false)
    }
  }

  async function borrar() {
    setBorrando(true)
    const id = toastLoading('Borrando datos...')
    try {
      const res = await fetch('/api/almacenamiento/limpieza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasta, confirmacion: texto.trim().toUpperCase() }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toastError(body.error ?? 'No se pudo borrar', id)
        return
      }
      toastSuccess(`Se borraron ${body.cierres} cierres`, id)
      setConfirmando(false)
      setTexto('')
      setHasta('')
      onLimpiado()
    } catch {
      toastError('Sin conexión. Intenta de nuevo.', id)
    } finally {
      setBorrando(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">
        Elige hasta qué fecha borrar. Se eliminan los cierres de ese período con sus ventas, gastos,
        transferencias y conteos. Los productos, empleados y configuración no se tocan. Descarga el
        Excel antes de borrar para conservar el respaldo.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-secondary">Borrar desde el inicio hasta</span>
          <input
            type="date"
            value={hasta}
            min={primerCierre}
            max={maximo}
            onChange={(e) => setHasta(e.target.value)}
            className="select-field"
          />
        </label>
        <p className="text-text-muted text-xs sm:pb-2.5">
          Datos desde el {formatFecha(primerCierre)} · Último cierre (se conserva):{' '}
          {ultimoCierre ? formatFecha(ultimoCierre) : '—'}
        </p>
      </div>

      {valido && (
        <div className="border-bg-border bg-bg-elevated/40 rounded-[var(--radius-md)] border p-4 text-sm">
          {preview.loading && !datos ? (
            <p className="text-text-secondary">Calculando…</p>
          ) : datos && datos.cierres > 0 ? (
            <>
              <p className="text-text-primary">
                Se borrarán <strong>{datos.cierres}</strong> cierres
                {datos.desde
                  ? ` (del ${formatFecha(datos.desde)} al ${formatFecha(hasta)})`
                  : ''}, {datos.ventas} ventas y {datos.gastos} gastos.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="secondary" loading={exportando} onClick={exportar}>
                  <FileSpreadsheet size={16} className="mr-2" aria-hidden />
                  Descargar respaldo en Excel
                </Button>
                <Button type="button" variant="danger" onClick={() => setConfirmando(true)}>
                  <Trash2 size={16} className="mr-2" aria-hidden />
                  Borrar estos datos
                </Button>
              </div>
            </>
          ) : (
            <p className="text-text-secondary">No hay cierres hasta esa fecha.</p>
          )}
        </div>
      )}

      <ConfirmarModal
        open={confirmando}
        titulo="Borrar datos antiguos"
        textoConfirmar="Borrar definitivamente"
        cargando={borrando}
        deshabilitado={texto.trim().toUpperCase() !== TEXTO_CONFIRMACION}
        onCancelar={() => {
          setConfirmando(false)
          setTexto('')
        }}
        onConfirmar={borrar}
      >
        <p>
          Se borrarán {datos?.cierres ?? 0} cierres hasta el {hasta ? formatFecha(hasta) : ''}. Esta
          acción <strong className="text-text-primary">no se puede deshacer</strong>.
        </p>
        <label className="mt-4 flex flex-col gap-1.5">
          <span>
            Escribe <strong className="text-text-primary">{TEXTO_CONFIRMACION}</strong> para
            confirmar
          </span>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="input"
            autoComplete="off"
            autoFocus
          />
        </label>
      </ConfirmarModal>
    </div>
  )
}
