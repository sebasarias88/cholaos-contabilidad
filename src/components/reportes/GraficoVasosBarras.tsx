'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
    return <p className="text-text-muted text-sm">Sin datos para el período seleccionado.</p>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#F0E2D3" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="fecha"
          tickFormatter={tickFecha}
          tick={{ fontSize: 10, fill: '#85695A' }}
          axisLine={{ stroke: '#F0E2D3' }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          width={28}
          tick={{ fontSize: 10, fill: '#85695A' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#2A1A12',
            border: '1px solid #3A2820',
            borderRadius: '10px',
            color: '#F7EDE4',
          }}
          labelFormatter={(f) => tickFecha(String(f))}
          formatter={(value) => [typeof value === 'number' ? value : Number(value), 'Vasos']}
          cursor={{ fill: '#2E8B5714' }}
        />
        <Bar dataKey="total_vasos" fill="#2E8B57" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}
