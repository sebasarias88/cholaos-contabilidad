import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: { absolute: 'Ingresar — Cholao Oscar' },
  description: 'Sistema de gestión interno de Cholao Oscar Armenia',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginForm />
}
