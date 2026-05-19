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
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatPesos } from '@/lib/utils'
import type { ResumenDia } from '@/types'

interface GraficoIngresosLineaProps {
  data: ResumenDia[]
}

function tickFecha(fecha: string) {
  return format(parseISO(fecha), 'd MMM', { locale: es })
}

export function GraficoIngresosLinea({ data }: GraficoIngresosLineaProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Sin datos para el período seleccionado.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1E2D45" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="fecha"
          tickFormatter={tickFecha}
          tick={{ fontSize: 12, fill: '#7A8BA3' }}
          axisLine={{ stroke: '#1E2D45' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#7A8BA3' }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          contentStyle={{
            background: '#0F1520',
            border: '1px solid #1E2D45',
            borderRadius: '10px',
            color: '#E8EDF5',
          }}
          labelFormatter={(f) => tickFecha(String(f))}
          formatter={(value) =>
            formatPesos(typeof value === 'number' ? value : Number(value))
          }
        />
        <Area
          type="monotone"
          dataKey="ingresos"
          stroke="#00D4FF"
          strokeWidth={2}
          fill="url(#ingresosGradient)"
          dot={{ fill: '#00D4FF', r: 3 }}
          activeDot={{ r: 5, fill: '#00D4FF' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
