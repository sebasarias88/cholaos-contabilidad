'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ResumenDia } from '@/types'

interface GraficoVasosBarrasProps {
  data: ResumenDia[]
}

function tickFecha(fecha: string) {
  return format(parseISO(fecha), 'd MMM', { locale: es })
}

export function GraficoVasosBarras({ data }: GraficoVasosBarrasProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Sin datos para el período seleccionado.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
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
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#0F1520',
            border: '1px solid #1E2D45',
            borderRadius: '10px',
            color: '#E8EDF5',
          }}
          labelFormatter={(f) => tickFecha(String(f))}
          formatter={(value) => [
            typeof value === 'number' ? value : Number(value),
            'Vasos',
          ]}
          cursor={{ fill: '#00E5A010' }}
        />
        <Bar
          dataKey="total_vasos"
          fill="#00E5A0"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
