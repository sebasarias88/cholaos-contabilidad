"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/ventas", label: "Nueva venta" },
  { href: "/dashboard/ventas/historial", label: "Historial" },
  { href: "/dashboard/productos", label: "Productos" },
  { href: "/dashboard/reportes", label: "Reportes" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-5 dark:border-zinc-800">
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Cholaos
        </span>
        <p className="text-xs text-zinc-500">Contabilidad</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
