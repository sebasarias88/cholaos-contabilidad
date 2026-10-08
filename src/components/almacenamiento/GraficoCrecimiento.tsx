'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatBytes, type PuntoUso } from '@/lib/almacenamiento'
import { fechaComoDate } from '@/lib/fechas'

const tickFecha = (fecha: string) => format(fechaComoDate(fecha), 'd MMM', { locale: es })

/** Evolución del tamaño de la base de datos (un punto por día con cierre) */
export function GraficoCrecimiento({ historial }: { historial: PuntoUso[] }) {
  if (historial.length < 2) {
    return (
      <p className="text-text-muted text-sm">
        La gráfica aparece cuando haya al menos dos días registrados. Se guarda un punto cada vez
        que se finaliza un cierre.
      </p>
    )
  }

  const datos = historial.map((p) => ({ fecha: p.fecha, mb: p.bytes / (1024 * 1024) }))

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="usoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D14A1F" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#D14A1F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#F0E2D3" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="fecha"
            tickFormatter={tickFecha}
            tick={{ fontSize: 10, fill: '#85695A' }}
            axisLine={{ stroke: '#F0E2D3' }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            width={56}
            tick={{ fontSize: 11, fill: '#85695A' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Number(v).toFixed(0)} MB`}
          />
          <Tooltip
            contentStyle={{
              background: '#2A1A12',
              border: '1px solid #3A2820',
              borderRadius: '10px',
              color: '#F7EDE4',
            }}
            labelFormatter={(f) => tickFecha(String(f))}
            formatter={(v) => [formatBytes(Number(v) * 1024 * 1024), 'Tamaño']}
          />
          <Area
            type="monotone"
            dataKey="mb"
            stroke="#D14A1F"
            strokeWidth={2}
            fill="url(#usoGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
