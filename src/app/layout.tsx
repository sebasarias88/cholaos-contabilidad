import type { Metadata, Viewport } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import { LenisProvider } from '@/components/providers/LenisProvider'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'Cholao Oscar — Sistema de Gestión',
    template: '%s — Cholao Oscar',
  },
  description:
    'Sistema interno de gestión y contabilidad para Cholao Oscar Armenia, Quindío.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  applicationName: 'Cholao Oscar',
  authors: [{ name: 'Cholao Oscar' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Cholao Oscar — Sistema de Gestión',
    description: 'Sistema interno de gestión para Cholao Oscar Armenia',
    type: 'website',
    locale: 'es_CO',
    siteName: 'Cholao Oscar',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#080C10',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${syne.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg-base font-sans text-text-primary">
        <LenisProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0F1520',
                color: '#E8EDF5',
                border: '1px solid #1E2D45',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#00E5A0', secondary: '#0F1520' },
              },
              error: {
                iconTheme: { primary: '#FF4566', secondary: '#0F1520' },
              },
            }}
          />
        </LenisProvider>
      </body>
    </html>
  )
}
