"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPesos } from "@/lib/utils";

interface GraficoVentasProps {
  data: { fecha: string; total: number }[];
}

export function GraficoVentas({ data }: GraficoVentasProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Sin datos para el período seleccionado.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
        <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) =>
            formatPesos(typeof value === "number" ? value : Number(value))
          }
          labelStyle={{ color: "#171717" }}
        />
        <Bar dataKey="total" fill="#18181b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
