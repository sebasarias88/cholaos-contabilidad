import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="bg-bg-base flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="bg-brand-soft mb-6 flex h-20 w-20 items-center justify-center rounded-[24px]">
        <Image src="/icons/icon-192.png" alt="" width={60} height={60} className="h-15 w-15" />
      </div>
      <p className="text-brand font-display text-sm font-extrabold tracking-wider uppercase">
        Error 404
      </p>
      <h1 className="font-display text-text-primary mt-1 text-3xl font-extrabold">
        Esta página no existe
      </h1>
      <p className="text-text-secondary mt-2 max-w-sm">
        Puede que el enlace esté mal escrito o que la página se haya movido.
      </p>
      <Link
        href="/dashboard"
        className="focus-ring bg-brand shadow-brand hover:bg-brand-strong mt-8 inline-flex min-h-12 items-center gap-2 rounded-[14px] px-6 font-bold text-white transition-colors"
      >
        <ArrowLeft size={18} aria-hidden />
        Volver al inicio
      </Link>
    </main>
  )
}
