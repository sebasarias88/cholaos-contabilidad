"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPesos } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Producto } from "@/types";

interface TablaProductosProps {
  productos: Producto[];
}

export function TablaProductos({ productos: initial }: TablaProductosProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, precio: Number(precio) }),
    });
    setNombre("");
    setPrecio("");
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/productos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <Input
          label="Precio"
          type="number"
          step="0.01"
          min={0}
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          Agregar
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {initial.map((p) => (
              <tr
                key={p.id}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="px-4 py-3">{p.nombre}</td>
                <td className="px-4 py-3">{formatPesos(p.precio)}</td>
                <td className="px-4 py-3">
                  {p.activo ? "Activo" : "Inactivo"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(p.id)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
