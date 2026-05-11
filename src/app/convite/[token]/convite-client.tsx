'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, UserCheck, LogIn } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  token: string
  empresaNome: string
  roleLabel: string
  email: string | null
  isLoggedIn: boolean
  currentUserEmpresaId: string | null
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://diariodeobras-xi.vercel.app'

export function ConviteClient({ token, empresaNome, roleLabel, email, isLoggedIn }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function aceitarConvite() {
    setLoading(true)
    const { data, error } = await supabase.rpc('accept_invite', { p_token: token } as any)
    setLoading(false)

    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message)
      return
    }
    toast.success(`Bem-vindo à ${empresaNome}!`)
    router.push('/dashboard')
    router.refresh()
  }

  async function loginComGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${APP_URL}/auth/callback?next=/convite/${token}`,
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Você foi convidado!</h1>
          <p className="text-muted-foreground text-sm">
            Para entrar na equipe da empresa abaixo, clique em aceitar.
          </p>
        </div>

        {/* Card do convite */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Empresa</p>
              <p className="text-xl font-bold text-foreground">{empresaNome}</p>
            </div>

            <div className="flex items-center justify-center gap-2 bg-primary/5 rounded-lg py-3">
              <UserCheck className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-primary">Perfil: {roleLabel}</p>
            </div>

            {email && (
              <p className="text-xs text-center text-muted-foreground">
                Convite para: <strong>{email}</strong>
              </p>
            )}

            <div className="pt-2">
              {isLoggedIn ? (
                <Button
                  className="w-full bg-primary hover:bg-secondary text-white"
                  onClick={aceitarConvite}
                  disabled={loading}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  {loading ? 'Aceitando...' : 'Aceitar convite e entrar'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-center text-muted-foreground">
                    Faça login para aceitar o convite
                  </p>
                  <Button
                    className="w-full bg-primary hover:bg-secondary text-white"
                    onClick={loginComGoogle}
                    disabled={loading}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {loading ? 'Redirecionando...' : 'Entrar com Google e aceitar'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Diário de Obras · Sistema de RDO
        </p>
      </div>
    </div>
  )
}
