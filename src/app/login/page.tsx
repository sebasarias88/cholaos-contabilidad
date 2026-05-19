'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { fadeUp } from '@/lib/animations'
import { toastError, toastLoading, toast } from '@/lib/toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    const toastId = toastLoading('Iniciando sesión...')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (authError) {
      toastError(authError.message || 'Error al guardar. Intenta de nuevo.', toastId)
      return
    }

    toast.dismiss(toastId)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <motion.div
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,#00D4FF12,transparent)]"
      />
      <Card
        title="Cholaos"
        description="Inicia sesión para continuar"
        glow
        className="relative w-full max-w-sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Correo"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </motion.div>
  )
}
