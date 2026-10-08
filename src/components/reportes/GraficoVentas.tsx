'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatPesos } from '@/lib/utils'
import type { ResumenDia } from '@/types'

interface GraficoVentasProps {
  data: ResumenDia[]
}

function tickFecha(fecha: string) {
  return format(parseISO(fecha), 'EEE', { locale: es })
}

export function GraficoVentas({ data }: GraficoVentasProps) {
  if (data.length === 0) {
    return <p className="text-text-muted text-sm">Sin datos para el período seleccionado.</p>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#1E2D45" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="fecha"
          tickFormatter={tickFecha}
          tick={{ fontSize: 11, fill: '#7A8BA3' }}
          axisLine={{ stroke: '#1E2D45' }}
          tickLine={false}
        />
        <YAxis
          width={40}
          tick={{ fontSize: 10, fill: '#7A8BA3' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            typeof v === 'number' && v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
          }
        />
        <Tooltip
          contentStyle={{
            background: '#0F1520',
            border: '1px solid #1E2D45',
            borderRadius: '10px',
            color: '#E8EDF5',
          }}
          labelFormatter={(f) => format(parseISO(String(f)), 'EEEE d MMM', { locale: es })}
          formatter={(value) => formatPesos(typeof value === 'number' ? value : Number(value))}
          cursor={{ fill: '#00D4FF10' }}
        />
        <Bar dataKey="ingresos" fill="#00D4FF" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}
