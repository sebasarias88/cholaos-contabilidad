'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { getPageTitle } from '@/lib/navigation'

/** Barra superior solo en celular (en escritorio cada página trae su título) */
export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()

  return (
    <header className="border-bg-border bg-bg-base/85 sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-md md:hidden">
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={onMenuClick}
        className="focus-ring border-bg-border bg-bg-surface text-text-primary flex h-11 w-11 items-center justify-center rounded-[12px] border"
      >
        <Menu size={20} />
      </button>
      <Image src="/icons/icon-192.png" alt="" width={34} height={34} />
      <p className="font-display text-text-primary truncate text-lg font-bold">
        {getPageTitle(pathname)}
      </p>
    </header>
  )
}
