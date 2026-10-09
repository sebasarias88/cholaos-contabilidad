'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  FileText,
  Gift,
  HandCoins,
  Undo2,
  Wallet,
} from 'lucide-react'
import { TarjetaKpi } from '@/components/dashboard/TarjetaKpi'
import { BadgeTipoPersona } from '@/components/descuentos/BadgeTipoPersona'
import { Button } from '@/components/ui/Button'
import { ConfirmarModal } from '@/components/ui/ConfirmarModal'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { PildorasFiltro } from '@/components/ui/PildorasFiltro'
import { Skeleton } from '@/components/ui/Skeleton'
import { useApiGet } from '@/hooks/useApiGet'
import { fadeUp, staggerContainer } from '@/lib/animations'
import {
  PRESETS_NOMINA,
  rangoNomina,
  resumirPorPersona,
  textosCuenta,
  totalesResumen,
  type PresetNomina,
  type ResumenPersona,
} from '@/lib/descuentos'
import type { FormatoExport } from '@/lib/export-reportes'
import { fechaColombia, hoyColombia } from '@/lib/fechas'
import { toastError, toastLoading, toastSuccess } from '@/lib/toast'
import { formatFecha, formatPesos } from '@/lib/utils'
import type { DescuentoReporte, ReporteDescuentos, TipoPersonaDescuento } from '@/types'

const FILTRO_TIPO: { id: TipoPersonaDescuento | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'empleado', label: 'Empleados' },
  { id: 'familia', label: 'Familia' },
  { id: 'cliente', label: 'Clientes' },
]

const fechaCortaUi = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7)

/** Cuánto se ha descontado (o falta descontar) a cada persona en el periodo */
export function ReporteDescuentos({ nombreNegocio }: { nombreNegocio: string }) {
  const [preset, setPreset] = useState<PresetNomina>('quincena')
  const [custom, setCustom] = useState(() => ({ desde: hoyColombia(), hasta: hoyColombia() }))
  const [tipo, setTipo] = useState<TipoPersonaDescuento | 'todos'>('todos')
  const [abierta, setAbierta] = useState<string | null>(null)
  const [liquidar, setLiquidar] = useState<ResumenPersona | null>(null)
  const [incluirAnterior, setIncluirAnterior] = useState(true)
  const [deshacer, setDeshacer] = useState<{
    id: string
    persona: string
    total: number
    tipo: TipoPersonaDescuento
  } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [exportando, setExportando] = useState<FormatoExport | null>(null)

  const customValido = !!custom.desde && !!custom.hasta && custom.desde <= custom.hasta
  const rango = preset === 'custom' ? custom : rangoNomina(preset)
  const listo = preset !== 'custom' || customValido

  const api = useApiGet<ReporteDescuentos>(
    listo ? `/api/reportes/descuentos?desde=${rango.desde}&hasta=${rango.hasta}` : null
  )

  const resumen = useMemo(
    () =>
      api.data
        ? resumirPorPersona(
            api.data.personas,
            api.data.descuentos,
            api.data.pendienteAnterior,
            tipo
          )
        : [],
    [api.data, tipo]
  )
  const totales = totalesResumen(resumen)
  const cargando = api.loading && !api.data

  async function exportar(formato: FormatoExport) {
    if (exportando) return
    setExportando(formato)
    const id = toastLoading(formato === 'excel' ? 'Generando Excel...' : 'Generando PDF...')
    try {
      const { exportarDescuentos } = await import('@/lib/export-descuentos')
      const nombre = await exportarDescuentos(formato, {
        nombreNegocio,
        desde: rango.desde,
        hasta: rango.hasta,
        resumen,
      })
      toastSuccess(`Descargado: ${nombre}`, id)
    } catch (e) {
      toastError((e as Error).message || 'No se pudo generar el archivo', id)
    } finally {
      setExportando(null)
    }
  }

  async function confirmarLiquidar() {
    if (!liquidar) return
    const desde =
      incluirAnterior && liquidar.pendienteAnteriorDesde
        ? liquidar.pendienteAnteriorDesde
        : rango.desde
    const textos = textosCuenta(liquidar.persona.tipo)
    if (!textos) return
    setOcupado(true)
    const id = toastLoading('Guardando...')
    try {
      const res = await fetch('/api/liquidaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: liquidar.persona.id, desde, hasta: rango.hasta }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'No se pudo marcar')
      toastSuccess(
        `${liquidar.persona.nombre}: ${formatPesos(body.total)} ${textos.saldado.toLowerCase()}`,
        id
      )
      setLiquidar(null)
      api.recargar()
    } catch (e) {
      toastError((e as Error).message, id)
    } finally {
      setOcupado(false)
    }
  }

  async function confirmarDeshacer() {
    if (!deshacer) return
    setOcupado(true)
    const id = toastLoading('Deshaciendo...')
    try {
      const res = await fetch(`/api/liquidaciones/${deshacer.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'No se pudo deshacer')
      toastSuccess('Listo: esos descuentos vuelven a estar pendientes', id)
      setDeshacer(null)
      api.recargar()
    } catch (e) {
      toastError((e as Error).message, id)
    } finally {
      setOcupado(false)
    }
  }

  const textosLiquidar = textosCuenta(liquidar?.persona.tipo)
  const textosDeshacer = textosCuenta(deshacer?.tipo)
  const montoLiquidar = liquidar
    ? liquidar.pendiente + (incluirAnterior ? liquidar.pendienteAnterior : 0)
    : 0

  return (
    <motion.div
      className="flex min-w-0 flex-col gap-5 sm:gap-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <PildorasFiltro
            opciones={PRESETS_NOMINA}
            valor={preset}
            onChange={setPreset}
            id="descuentos-periodo"
            etiqueta="Período"
          />
          {preset === 'custom' && (
            <div className="border-bg-border bg-bg-surface grid gap-3 rounded-[var(--radius-lg)] border p-4 sm:grid-cols-2">
              {(['desde', 'hasta'] as const).map((campo) => (
                <label key={campo} className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-text-primary text-sm font-bold capitalize">{campo}</span>
                  <input
                    type="date"
                    value={custom[campo]}
                    onChange={(e) => setCustom((c) => ({ ...c, [campo]: e.target.value }))}
                    className="select-field w-full min-w-0"
                  />
                </label>
              ))}
            </div>
          )}
          <PildorasFiltro
            opciones={FILTRO_TIPO}
            valor={tipo}
            onChange={setTipo}
            id="descuentos-tipo"
            etiqueta="Tipo de persona"
          />
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          {(['excel', 'pdf'] as const).map((f) => (
            <Button
              key={f}
              type="button"
              variant="secondary"
              className="flex-1 sm:flex-none"
              disabled={cargando || exportando !== null || resumen.length === 0}
              loading={exportando === f}
              onClick={() => exportar(f)}
            >
              {f === 'excel' ? (
                <FileSpreadsheet size={18} aria-hidden />
              ) : (
                <FileText size={18} aria-hidden />
              )}
              {f === 'excel' ? 'Excel' : 'PDF'}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-text-secondary -mt-2 text-sm">
        {formatFecha(rango.desde)} — {formatFecha(rango.hasta)} · solo días cerrados
      </p>

      {cargando ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[122px] rounded-[20px]" />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
          variants={staggerContainer}
        >
          <TarjetaKpi
            titulo="Total del periodo"
            valor={totales.total}
            icono={Wallet}
            detalle={
              totales.familia > 0
                ? `Incluye ${formatPesos(totales.familia)} de familia (no se cobra)`
                : undefined
            }
          />
          <TarjetaKpi
            titulo="Pendiente (sueldo y cobros)"
            valor={totales.pendiente}
            icono={Clock}
            tono="warn"
          />
          <TarjetaKpi
            titulo="Ya descontado o cobrado"
            valor={totales.descontado}
            icono={BadgeCheck}
            tono="ok"
            className="col-span-2 sm:col-span-1"
          />
        </motion.div>
      )}

      {api.error && !api.data ? (
        <EstadoVacio titulo="No se pudo cargar" descripcion={api.error} />
      ) : cargando ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[20px]" />
          ))}
        </div>
      ) : resumen.length === 0 ? (
        <EstadoVacio
          icono={<HandCoins size={26} />}
          titulo="Sin descuentos en este periodo"
          descripcion="Los descuentos se registran en el paso Caja del cierre, eligiendo a la persona."
        />
      ) : (
        <motion.ul variants={staggerContainer} className="flex flex-col gap-3">
          {resumen.map((r) => (
            <TarjetaPersona
              key={r.persona.id}
              r={r}
              abierta={abierta === r.persona.id}
              onAbrir={() => setAbierta((a) => (a === r.persona.id ? null : r.persona.id))}
              onLiquidar={() => {
                setIncluirAnterior(true)
                setLiquidar(r)
              }}
              onDeshacer={(id, total) =>
                setDeshacer({ id, persona: r.persona.nombre, total, tipo: r.persona.tipo })
              }
            />
          ))}
        </motion.ul>
      )}

      <ConfirmarModal
        open={liquidar !== null}
        titulo={textosLiquidar?.tituloAccion(liquidar?.persona.nombre ?? '') ?? ''}
        textoConfirmar={textosLiquidar?.accion ?? ''}
        variante="primary"
        cargando={ocupado}
        onCancelar={() => setLiquidar(null)}
        onConfirmar={confirmarLiquidar}
      >
        <p className="font-display text-text-primary mb-2 text-2xl font-extrabold">
          {formatPesos(montoLiquidar)}
        </p>
        <p>
          Se marcan como {textosLiquidar?.participio} los{' '}
          <b className="text-text-primary">{formatPesos(liquidar?.pendiente ?? 0)}</b>{' '}
          {textosLiquidar?.pendiente.toLowerCase()} del {formatFecha(rango.desde)} al{' '}
          {formatFecha(rango.hasta)}. Después ya no se pueden cambiar en el cierre (se puede
          deshacer aquí si fue un error).
        </p>
        {liquidar && liquidar.pendienteAnterior > 0 && (
          <label className="bg-warn-soft mt-3 flex cursor-pointer items-start gap-2.5 rounded-[12px] p-3">
            <input
              type="checkbox"
              checked={incluirAnterior}
              onChange={(e) => setIncluirAnterior(e.target.checked)}
              className="accent-brand mt-0.5 h-4 w-4"
            />
            <span>
              Incluir también{' '}
              <b className="text-text-primary">{formatPesos(liquidar.pendienteAnterior)}</b> que
              quedaron pendientes de antes de este periodo.
            </span>
          </label>
        )}
      </ConfirmarModal>

      <ConfirmarModal
        open={deshacer !== null}
        titulo={`Deshacer: ${textosDeshacer?.saldadoLargo.toLowerCase() ?? ''}`}
        textoConfirmar="Deshacer"
        cargando={ocupado}
        onCancelar={() => setDeshacer(null)}
        onConfirmar={confirmarDeshacer}
      >
        Los {formatPesos(deshacer?.total ?? 0)} de{' '}
        <b className="text-text-primary">{deshacer?.persona}</b> vuelven a quedar{' '}
        {textosDeshacer?.pendiente.toLowerCase()}.
      </ConfirmarModal>
    </motion.div>
  )
}

function TarjetaPersona({
  r,
  abierta,
  onAbrir,
  onLiquidar,
  onDeshacer,
}: {
  r: ResumenPersona
  abierta: boolean
  onAbrir: () => void
  onLiquidar: () => void
  onDeshacer: (liquidacionId: string, total: number) => void
}) {
  // Liquidaciones que aparecen en el periodo (para poder deshacerlas)
  const liquidaciones = new Map<string, NonNullable<DescuentoReporte['liquidacion']>>()
  for (const d of r.descuentos) {
    if (d.liquidacion) liquidaciones.set(d.liquidacion.id, d.liquidacion)
  }
  const porLiquidar = r.pendiente + r.pendienteAnterior
  const textos = textosCuenta(r.persona.tipo)
  const n = r.descuentos.length

  return (
    <motion.li variants={fadeUp} className="card min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={onAbrir}
          aria-expanded={abierta}
          className="focus-ring flex min-w-0 flex-1 basis-56 items-center gap-3 rounded-[12px] text-left"
        >
          <ChevronDown
            size={18}
            aria-hidden
            className={`text-text-secondary shrink-0 transition-transform ${abierta ? 'rotate-180' : ''}`}
          />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-text-primary truncate text-lg font-bold">
                {r.persona.nombre}
              </span>
              <BadgeTipoPersona tipo={r.persona.tipo} />
            </span>
            <span className="text-text-secondary text-xs">
              {textos
                ? `${n} descuento${n === 1 ? '' : 's'} · total ${formatPesos(r.total)}`
                : `${n} consumo${n === 1 ? '' : 's'} · no se cobra`}
            </span>
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {textos ? (
            <>
              <Cifra
                label={textos.pendiente}
                valor={r.pendiente}
                tono={r.pendiente > 0 ? 'warn' : 'muted'}
              />
              <Cifra
                label={textos.saldado}
                valor={r.descontado}
                tono={r.descontado > 0 ? 'ok' : 'muted'}
              />
              {porLiquidar > 0 ? (
                <Button type="button" size="sm" onClick={onLiquidar}>
                  <BadgeCheck size={16} aria-hidden />
                  {textos.accion}
                </Button>
              ) : (
                r.total > 0 && (
                  <span className="badge-green inline-flex items-center gap-1">
                    <BadgeCheck size={13} aria-hidden />
                    Al día
                  </span>
                )
              )}
            </>
          ) : (
            <>
              <Cifra label="Total" valor={r.total} tono="neutro" />
              <span className="bg-ok-soft text-ok inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold">
                <Gift size={14} aria-hidden />
                No se cobra
              </span>
            </>
          )}
        </div>
      </div>

      {r.pendienteAnterior > 0 && (
        <p className="bg-warn-soft text-text-primary mx-4 mb-4 rounded-[12px] px-3 py-2 text-xs sm:mx-5">
          Además tiene <b>{formatPesos(r.pendienteAnterior)}</b> {textos?.pendiente.toLowerCase()}{' '}
          de antes de este periodo.
        </p>
      )}

      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="border-bg-border border-t"
          >
            <ul className="divide-bg-border divide-y px-4 sm:px-5">
              {r.descuentos.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="text-text-secondary w-12 shrink-0 tabular-nums">
                    {fechaCortaUi(d.fecha)}
                  </span>
                  <span className="text-text-primary min-w-0 flex-1 truncate">
                    {d.descripcion.trim() || <span className="text-text-muted">Sin concepto</span>}
                  </span>
                  {!textos ? null : d.liquidacion ? (
                    <span className="badge-green shrink-0">
                      {textos.saldado}{' '}
                      {fechaCortaUi(fechaColombia(new Date(d.liquidacion.created_at)))}
                    </span>
                  ) : (
                    <span className="badge-warn shrink-0">{textos.pendiente}</span>
                  )}
                  <span className="text-text-primary w-24 shrink-0 text-right font-bold tabular-nums">
                    {formatPesos(d.monto)}
                  </span>
                </li>
              ))}
            </ul>
            {textos && liquidaciones.size > 0 && (
              <div className="bg-bg-elevated/50 flex flex-col gap-2 px-4 py-3 sm:px-5">
                {[...liquidaciones.values()].map((info) => (
                  <div
                    key={info.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-text-secondary">
                      {textos.saldadoLargo} el{' '}
                      {formatFecha(fechaColombia(new Date(info.created_at)))} (
                      {fechaCortaUi(info.desde)} al {fechaCortaUi(info.hasta)})
                      {` · ${formatPesos(info.total)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeshacer(info.id, info.total)}
                      className="text-text-secondary hover:text-bad inline-flex items-center gap-1 font-bold transition-colors"
                    >
                      <Undo2 size={13} aria-hidden />
                      Deshacer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

function Cifra({
  label,
  valor,
  tono,
}: {
  label: string
  valor: number
  tono: 'warn' | 'ok' | 'muted' | 'neutro'
}) {
  const color = {
    warn: 'text-warn',
    ok: 'text-ok',
    muted: 'text-text-muted',
    neutro: 'text-text-primary',
  }[tono]
  return (
    <div className="flex flex-col items-start leading-tight">
      <span className="text-text-secondary text-[11px] font-bold tracking-wide uppercase">
        {label}
      </span>
      <span className={`font-display text-base font-extrabold tabular-nums ${color}`}>
        {formatPesos(valor)}
      </span>
    </div>
  )
}
