import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConfiguracoesClient } from './configuracoes-client'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const empresa = profile?.empresa_id
    ? (await supabase.from('empresas').select('*').eq('id', profile.empresa_id).single()).data
    : null

  const membros = empresa
    ? (await supabase.from('profiles').select('id, full_name, avatar_url, role, active, created_at').eq('empresa_id', empresa.id)).data ?? []
    : []

  const convites = empresa && profile?.role === 'admin'
    ? (await supabase.from('convites').select('*').eq('empresa_id', empresa.id).eq('status', 'pendente').order('created_at', { ascending: false })).data ?? []
    : []

  return (
    <ConfiguracoesClient
      user={user}
      profile={profile}
      empresa={empresa}
      membros={membros}
      convites={convites}
    />
  )
}
