import { createClient } from '@/lib/supabase/server'
import { ButtonLink } from '@/lib/button-link'
import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'

const statusColors: Record<string, string> = {
  rascunho: 'bg-yellow-100 text-yellow-800',
  enviado: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-green-100 text-green-800',
}
const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado',
}

export default async function RdosPage() {
  const supabase = await createClient()
  const { data: rdos } = await supabase
    .from('rdos')
    .select('*, obras(nome, codigo), profiles!rdos_created_by_fkey(full_name)')
    .order('data', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Diários de Obras (RDO)</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{rdos?.length ?? 0} relatório(s) registrado(s)</p>
        </div>
        <ButtonLink href="/rdos/novo" className="bg-primary hover:bg-secondary text-white">
          <Plus className="w-4 h-4 mr-2" />Novo RDO
        </ButtonLink>
      </div>

      {rdos?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhum RDO registrado</p>
          <ButtonLink href="/rdos/novo" className="mt-4 inline-flex bg-primary hover:bg-secondary text-white">
            <Plus className="w-4 h-4 mr-2" />Criar RDO
          </ButtonLink>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {rdos?.map((rdo: any) => (
              <Link key={rdo.id} href={`/rdos/${rdo.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors">
                <div className="flex-shrink-0 w-12 text-center bg-primary rounded-lg py-1.5">
                  <p className="text-white text-xl font-bold leading-none">
                    {new Date(rdo.data + 'T12:00:00').getDate().toString().padStart(2, '0')}
                  </p>
                  <p className="text-white/70 text-xs uppercase">
                    {new Date(rdo.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {rdo.obras?.nome ?? 'Obra desconhecida'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rdo.obras?.codigo} · {rdo.profiles?.full_name ?? 'Desconhecido'}
                  </p>
                </div>
                {rdo.clima_manha && (
                  <p className="hidden sm:block text-xs text-muted-foreground truncate max-w-32">{rdo.clima_manha}</p>
                )}
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${statusColors[rdo.status]}`}>
                  {statusLabels[rdo.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
