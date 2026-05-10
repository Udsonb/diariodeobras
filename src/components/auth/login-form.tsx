'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<'google' | 'email' | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const supabase = createClient()

  async function handleGoogle() {
    setLoading('google')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(`Erro ao entrar: ${error.message}`)
      setLoading(null)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading('email')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(null)
    if (error) {
      toast.error('Erro: ' + error.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Verifique seu e-mail</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enviamos um link de acesso para <strong>{email}</strong>
        </p>
        <button onClick={() => setMagicLinkSent(false)} className="text-sm text-blue-600 hover:underline">
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Entrar no sistema</h2>
        <p className="text-sm text-gray-500 mt-1">Use sua conta corporativa</p>
      </div>

      {/* Google */}
      <Button
        onClick={handleGoogle}
        disabled={!!loading}
        variant="outline"
        className="w-full h-11 border-2 font-medium"
      >
        <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading === 'google' ? 'Redirecionando...' : 'Entrar com Google'}
      </Button>

      <div className="relative py-1">
        <Separator />
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-400">
          ou acesse com e-mail
        </span>
      </div>

      {/* Magic Link por e-mail */}
      <form onSubmit={handleMagicLink} className="space-y-3">
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail corporativo</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@empresa.com.br"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <Button
          type="submit"
          disabled={!!loading || !email}
          className="w-full h-11 bg-primary hover:bg-secondary text-white font-medium"
        >
          {loading === 'email' ? 'Enviando...' : 'Enviar link de acesso'}
        </Button>
      </form>
    </div>
  )
}
