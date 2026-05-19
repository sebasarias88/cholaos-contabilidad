'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, Snowflake } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault()

    if (!email.trim() || !password) {
      toast.error('Completa todos los campos')
      return
    }

    setLoading(true)
    const id = toast.loading('Verificando...')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      toast.error('Credenciales incorrectas', { id })
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Credenciales incorrectas', { id })
      setLoading(false)
      return
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('activo')
      .eq('id', user.id)
      .single()

    if (perfilError || !perfil) {
      await supabase.auth.signOut()
      toast.error('No se encontró tu perfil. Contacta al administrador.', { id })
      setLoading(false)
      return
    }

    if (!perfil.activo) {
      await supabase.auth.signOut()
      toast.error('Tu cuenta está desactivada. Contacta al dueño.', { id })
      setLoading(false)
      return
    }

    toast.success('¡Bienvenido!', { id })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <motion.div
      className="grid min-h-screen md:grid-cols-2"
      style={{ background: 'var(--bg-base)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Panel izquierdo — formulario */}
      <div className="flex min-h-screen flex-col justify-between p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <Image
            src="/images/logo.JPG"
            alt="Cholao Oscar"
            width={60}
            height={60}
            className="rounded-lg object-cover"
          />
          <span
            className="font-display text-lg"
            style={{ color: 'var(--text-primary)' }}
          >
            Cholao Oscar
          </span>
        </motion.div>

        <motion.form
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleLogin}
          className="mx-auto w-full max-w-sm space-y-6"
        >
          <motion.div variants={itemVariants} className="space-y-1">
            <h1
              className="font-display text-3xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Bienvenido de nuevo
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Ingresa tus credenciales para continuar
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <motion.div className="space-y-1.5">
              <label
                htmlFor="email"
                style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="usuario@cholaooscar.com"
                className="input w-full"
                autoComplete="email"
                disabled={loading}
              />
            </motion.div>

            <motion.div className="space-y-1.5">
              <label
                htmlFor="password"
                style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
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
                  className="input w-full pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 py-2.5"
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
          </motion.div>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ fontSize: '12px', color: 'var(--text-muted)' }}
        >
          v1.0 · Cholao Oscar Armenia · Sistema interno
        </motion.p>
      </div>

      {/* Panel derecho — imagen (solo desktop) */}
      <div className="relative hidden overflow-hidden md:block">
        <Image
          src="/images/cholao-hero.jpg"
          alt="Cholao Oscar"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(8,12,16,0.7) 0%, rgba(8,12,16,0.3) 100%)',
          }}
        />
        <div className="absolute right-10 bottom-12 left-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
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
