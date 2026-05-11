import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConviteClient } from './convite-client'
import { ROLE_LABELS } from '@/lib/supabase/types'

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // Buscar o convite
  const { data: convite } = await supabase
    .from('convites')
    .select('*, empresas(nome)')
    .eq('token', token)
    .single()

  if (!convite || convite.status !== 'pendente') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-bold">Convite inválido ou expirado</h1>
          <p className="text-muted-foreground text-sm">
            Este link de convite não é mais válido. Peça um novo convite ao administrador.
          </p>
          <a href="/login" className="text-primary text-sm underline">Ir para o login</a>
        </div>
      </div>
    )
  }

  const expirado = new Date(convite.expires_at) < new Date()
  if (expirado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">⏰</div>
          <h1 className="text-xl font-bold">Convite expirado</h1>
          <p className="text-muted-foreground text-sm">
            Este convite expirou em {new Date(convite.expires_at).toLocaleDateString('pt-BR')}.
            Peça um novo convite ao administrador.
          </p>
        </div>
      </div>
    )
  }

  // Verificar se já está logado
  const { data: { user } } = await supabase.auth.getUser()

  const empresaNome = (convite as any).empresas?.nome ?? 'Empresa'
  const roleLabel = ROLE_LABELS[convite.role] ?? convite.role

  if (convite.status === 'aceito') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-bold">Convite já utilizado</h1>
          <p className="text-muted-foreground text-sm">Este convite já foi aceito.</p>
          <a href="/dashboard" className="text-primary text-sm underline">Ir para o painel</a>
        </div>
      </div>
    )
  }

  return (
    <ConviteClient
      token={token}
      empresaNome={empresaNome}
      roleLabel={roleLabel}
      email={convite.email}
      isLoggedIn={!!user}
      currentUserEmpresaId={null}
    />
  )
}
