import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Manrope } from 'next/font/google'
import { Providers } from '@/components/providers/Providers'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
})

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: {
    default: 'Cholao Oscar — Sistema de Gestión',
    template: '%s — Cholao Oscar',
  },
  description: 'Sistema interno de gestión y contabilidad para Cholao Oscar Armenia, Quindío.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  applicationName: 'Cholao Oscar',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#FFF8F1',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${bricolage.variable} ${manrope.variable} h-full antialiased`}>
      <body className="bg-bg-base text-text-primary min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
