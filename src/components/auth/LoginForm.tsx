'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'

const contenedor = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function ingresar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    }).catch(() => null)

    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {}
      setError((data as { error?: string }).error ?? 'Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    toast.success('¡Bienvenido!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-bg-base min-h-dvh md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-6 md:p-6">
      {/* Imagen: arriba en móvil, panel izquierdo en PC */}
      <motion.div
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-[34dvh] min-h-[220px] overflow-hidden rounded-b-[32px] md:h-auto md:min-h-0 md:rounded-[28px]"
      >
        <Image
          src="/images/cholao-hero.jpg"
          alt="Cholao Oscar"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-[center_35%]"
        />
        <div className="from-cocoa/85 via-cocoa/25 absolute inset-0 bg-gradient-to-t to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="absolute right-6 bottom-12 left-6 hidden md:block lg:right-10 lg:bottom-10 lg:left-10"
        >
          <p className="font-display text-[40px] leading-[1.05] font-extrabold text-white lg:text-5xl">
            Refrescante,
            <br />
            colorido y
            <br />
            delicioso.
          </p>
          <p className="mt-3 text-sm font-semibold text-white/70">Armenia, Quindío</p>
        </motion.div>
      </motion.div>

      {/* Formulario */}
      <div className="relative -mt-10 flex flex-col px-4 pb-8 md:mt-0 md:justify-center md:px-8 md:pb-0">
        <motion.form
          onSubmit={ingresar}
          variants={contenedor}
          initial="hidden"
          animate="visible"
          noValidate
          className="bg-bg-surface shadow-pop border-bg-border mx-auto w-full max-w-[400px] rounded-[28px] border p-6 sm:p-8 md:border-0 md:bg-transparent md:shadow-none"
        >
          <motion.div variants={item} className="mb-7 flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: -8, scale: 1.05 }}
              className="bg-brand-soft flex h-14 w-14 items-center justify-center rounded-[18px]"
            >
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11"
              />
            </motion.div>
            <div>
              <p className="font-display text-text-primary text-lg leading-tight font-extrabold">
                Cholao Oscar
              </p>
              <p className="text-text-muted text-sm font-semibold">Contabilidad del negocio</p>
            </div>
          </motion.div>

          <motion.div variants={item} className="mb-6">
            <h1 className="font-display text-text-primary text-[30px] leading-tight font-extrabold">
              ¡Hola de nuevo!
            </h1>
            <p className="text-text-secondary mt-1">Ingresa para registrar el día.</p>
          </motion.div>

          <motion.div variants={item} className="mb-4 flex flex-col gap-1.5">
            <label htmlFor="email" className="text-text-primary text-sm font-bold">
              Correo
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="text-text-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
                aria-hidden
              />
              <input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="input min-h-12 w-full pl-11 text-base"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </motion.div>

          <motion.div variants={item} className="mb-2 flex flex-col gap-1.5">
            <label htmlFor="password" className="text-text-primary text-sm font-bold">
              Contraseña
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="text-text-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
                aria-hidden
              />
              <input
                id="password"
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                placeholder="••••••••"
                className="input min-h-12 w-full pr-12 pl-11 text-base"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                className="focus-ring text-text-muted hover:bg-bg-elevated hover:text-text-primary absolute top-1/2 right-1.5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[10px]"
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          <div className="min-h-7" aria-live="polite">
            {error && (
              <motion.p
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
                className="text-bad pt-1 text-sm font-bold"
              >
                {error}
              </motion.p>
            )}
          </div>

          <motion.div variants={item}>
            <Button type="submit" size="lg" loading={loading} className="w-full">
              {!loading && <LogIn size={18} aria-hidden />}
              {loading ? 'Entrando…' : 'Ingresar'}
            </Button>
          </motion.div>

          <motion.p
            variants={item}
            className="text-text-muted mt-6 text-center text-xs font-semibold"
          >
            Sistema interno · solo personal autorizado
          </motion.p>
        </motion.form>
      </div>
    </div>
  )
}
