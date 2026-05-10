import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RdoForm } from '@/components/rdos/rdo-form'

interface Props {
  searchParams: Promise<{ obra?: string }>
}

export default async function NovoRdoPage({ searchParams }: Props) {
  const { obra: obraId } = await searchParams
  const supabase = await createClient()

  const { data: obras } = await supabase
    .from('obras')
    .select('id, nome, codigo, latitude, longitude')
    .eq('status', 'em_andamento')
    .order('nome')

  const { data: recursos } = await supabase
    .from('recursos')
    .select('*, grupos_recursos(nome)')
    .eq('ativo', true)
    .order('tipo')
    .order('nome')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo RDO</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Relatório Diário de Obras — preencha todas as seções e salve ao final.
        </p>
      </div>
      <RdoForm obras={obras ?? []} recursos={recursos ?? []} obraIdInicial={obraId} />
    </div>
  )
}
