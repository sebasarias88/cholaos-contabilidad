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

const DESCRIPCION =
  'Cierre del día, ventas, inventario y reportes de Cholao Oscar · Armenia, Quindío.'

// URL pública para que la vista previa (opengraph-image) tenga link absoluto.
// En Vercel sale sola; en otro hosting se puede fijar NEXT_PUBLIC_SITE_URL.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

/**
 * Íconos y vista previa salen de los archivos de src/app:
 * favicon.ico, icon.png, apple-icon.png y opengraph-image.png (Next los enlaza solo).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Cholao Oscar — Sistema de Gestión',
    template: '%s — Cholao Oscar',
  },
  description: DESCRIPCION,
  applicationName: 'Cholao Oscar',
  // Sistema interno: que no aparezca en Google
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Cholao Oscar', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  // Vista previa al compartir el link (WhatsApp, Facebook, X…)
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'Cholao Oscar',
    title: 'Cholao Oscar — Sistema de Gestión',
    description: DESCRIPCION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cholao Oscar — Sistema de Gestión',
    description: DESCRIPCION,
  },
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
