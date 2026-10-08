'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, Snowflake } from 'lucide-react'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevHtmlHeight = html.style.height
    const prevBodyHeight = body.style.height
    const mq = window.matchMedia('(max-width: 767px)')

    function applyScrollLock() {
      if (mq.matches) {
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
        html.style.height = '100%'
        body.style.height = '100%'
      } else {
        html.style.overflow = ''
        body.style.overflow = ''
        html.style.height = ''
        body.style.height = ''
      }
    }

    applyScrollLock()
    mq.addEventListener('change', applyScrollLock)

    return () => {
      mq.removeEventListener('change', applyScrollLock)
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      html.style.height = prevHtmlHeight
      body.style.height = prevBodyHeight
    }
  }, [])

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault()

    if (!email.trim() || !password) {
      toast.error('Completa todos los campos')
      return
    }

    setLoading(true)
    const id = toast.loading('Verificando...')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(
        (data as { error?: string }).error ?? 'Credenciales incorrectas',
        { id }
      )
      setLoading(false)
      return
    }

    toast.success('¡Bienvenido!', { id })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <motion.div
     
      className="relative h-dvh max-h-dvh overflow-hidden bg-bg-base md:h-auto md:min-h-screen md:max-h-none md:grid md:grid-cols-2 md:overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Fondo mobile — hero difuminado */}
      <div className="absolute inset-0 overflow-hidden md:hidden" aria-hidden>
        <Image
          src="/images/cholao-hero.jpg"
          alt=""
          fill
          className="object-cover object-[center_30%]"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-bg-base/68 backdrop-blur-[3px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-base/30 via-bg-base/75 to-bg-base" />
      </div>

      {/* Panel formulario */}
      <div className="relative flex h-full min-h-0 flex-col justify-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:px-6 md:min-h-screen md:justify-between md:bg-bg-base md:px-12 md:py-10 lg:px-16">
        <div className="relative mx-auto w-full max-w-sm md:flex md:flex-1 md:flex-col md:justify-center">
          <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleLogin}
            className={[
              'relative w-full shrink-0',
              'max-md:overflow-hidden max-md:rounded-[var(--radius-xl)] max-md:border max-md:border-bg-border/80',
              'max-md:bg-bg-surface/95 max-md:px-5 max-md:py-5 max-md:shadow-glow-cyan max-md:backdrop-blur-md',
              'max-md:before:absolute max-md:before:inset-x-0 max-md:before:top-0 max-md:before:h-0.5',
              'max-md:before:bg-gradient-to-r max-md:before:from-transparent max-md:before:via-accent-cyan max-md:before:to-transparent max-md:before:content-[""]',
            ].join(' ')}
          >
          <motion.div variants={itemVariants} className="mb-5 space-y-2.5 md:mb-8 md:space-y-1.5">
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-cyan-dim shadow-glow-cyan">
                <Snowflake size={18} className="text-accent-cyan" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold tracking-tight text-text-primary">
                  Cholao Oscar
                </p>
                <p className="text-[11px] text-text-secondary">Contabilidad · Armenia</p>
              </div>
            </div>
            <div className="space-y-0.5">
              <h1 className="font-display text-lg font-semibold text-text-primary sm:text-xl md:text-3xl">
                Bienvenido de nuevo
              </h1>
              <p className="text-xs text-text-secondary sm:text-sm">
                Ingresa tus credenciales para continuar
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3.5 md:space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[13px] font-medium text-text-secondary"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="usuario@cholaooscar.com"
                className="input min-h-10 w-full text-base md:min-h-0 md:text-sm"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-[13px] font-medium text-text-secondary"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  placeholder="••••••••"
                  className="input min-h-10 w-full pr-11 text-base md:min-h-0 md:pr-10 md:text-sm"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[var(--radius-md)] text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-0.5 flex min-h-10 w-full items-center justify-center gap-2 py-2 text-base md:min-h-0 md:py-2.5 md:text-sm"
            >
              {loading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-flex"
                >
                  <Snowflake size={16} />
                </motion.span>
              ) : (
                <>
                  <LogIn size={16} />
                  Ingresar
                </>
              )}
            </button>

            <p className="max-md:pt-2 max-md:text-center max-md:text-[10px] max-md:leading-snug text-text-muted md:hidden">
              Sistema interno · solo personal autorizado
            </p>
          </motion.div>
        </motion.form>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative mx-auto mt-5 hidden w-full max-w-sm shrink-0 text-xs text-text-muted md:mx-0 md:mt-0 md:block md:max-w-none"
        >
          v1.0 · Cholao Oscar Armenia · Sistema interno
        </motion.p>
      </div>

      {/* Panel hero — solo desktop */}
      <div className="relative hidden overflow-hidden md:block">
        <Image
          src="/images/cholao-hero.jpg"
          alt="Cholao Oscar"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-bg-base/70 via-bg-base/20 to-transparent" />
        <div className="absolute right-10 bottom-12 left-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <p className="font-display text-4xl leading-tight text-white">
              Refrescante,
              <br />
              colorido
              <br />y delicioso.
            </p>
            <p className="mt-2 text-sm text-white/60">Armenia, Quindío</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
