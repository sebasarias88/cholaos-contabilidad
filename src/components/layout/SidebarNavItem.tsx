'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { NavLinkConfig } from '@/lib/navigation'
import { isNavActive } from '@/lib/navigation'

interface SidebarNavItemProps {
  link: NavLinkConfig
  pathname: string
  onNavigate?: () => void
}

export function SidebarNavItem({ link, pathname, onNavigate }: SidebarNavItemProps) {
  const active = isNavActive(pathname, link)
  const Icon = link.icon

  return (
    <motion.div whileHover="hover" initial="rest" className="relative">
      {!active && (
        <motion.div
          className="bg-bg-elevated pointer-events-none absolute inset-0 rounded-[var(--radius-md)]"
          variants={{
            rest: { opacity: 0, x: -12 },
            hover: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
      )}
      <Link
        href={link.href}
        onClick={onNavigate}
        className={[
          'relative z-10 flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors duration-150',
          active
            ? 'border-accent-cyan bg-accent-cyan-dim text-accent-cyan border-l-2 pl-[10px]'
            : 'text-text-secondary hover:text-text-primary border-l-2 border-transparent',
        ].join(' ')}
      >
        <Icon size={20} aria-hidden />
        <span className="flex-1">{link.label}</span>
      </Link>
    </motion.div>
  )
}
