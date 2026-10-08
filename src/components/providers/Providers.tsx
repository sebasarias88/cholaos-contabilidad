'use client'

import { MotionConfig } from 'framer-motion'
import { Toaster } from 'react-hot-toast'

/** Animaciones que respetan "reducir movimiento" + notificaciones con el estilo de la marca */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
      {children}
      <Toaster
        position="top-center"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#2A1A12',
            color: '#F7EDE4',
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 10px 40px rgb(42 26 18 / 0.25)',
          },
          success: { iconTheme: { primary: '#2E8B57', secondary: '#F7EDE4' } },
          error: { iconTheme: { primary: '#FF6B6E', secondary: '#2A1A12' }, duration: 5000 },
          loading: { iconTheme: { primary: '#F5A524', secondary: '#3A2820' } },
        }}
      />
    </MotionConfig>
  )
}
