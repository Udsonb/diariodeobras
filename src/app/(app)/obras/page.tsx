import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ButtonLink } from '@/lib/button-link'
import Link from 'next/link'
import { Plus, MapPin, Calendar, ArrowRight } from 'lucide-react'

const statusColors: Record<string, string> = {
  planejamento: 'bg-gray-100 text-gray-700',
  em_andamento: 'bg-green-100 text-green-700',
  pausada: 'bg-yellow-100 text-yellow-700',
  concluida: 'bg-blue-100 text-blue-700',
  cancelada: 'bg-red-100 text-red-700',
}
const statusLabels: Record<string, string> = {
  planejamento: 'Planejamento', em_andamento: 'Em andamento', pausada: 'Pausada',
  concluida: 'Concluída', cancelada: 'Cancelada',
}

export default async function ObrasPage() {
  const supabase = await createClient()
  const { data: obras } = await supabase
    .from('obras')
    .select('*, profiles!obras_responsavel_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Obras</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{obras?.length ?? 0} obra(s) cadastrada(s)</p>
        </div>
        <ButtonLink href="/obras/nova" className="bg-primary hover:bg-secondary text-white">
          <Plus className="w-4 h-4 mr-2" />Nova Obra
        </ButtonLink>
      </div>

      {obras?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma obra cadastrada</p>
          <ButtonLink href="/obras/nova" className="mt-4 inline-flex bg-primary hover:bg-secondary text-white">
            <Plus className="w-4 h-4 mr-2" />Cadastrar obra
          </ButtonLink>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {obras?.map((obra: any) => (
          <Card key={obra.id} className="hover:shadow-md transition-shadow border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-base leading-tight truncate">{obra.nome}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{obra.codigo}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[obra.status]}`}>
                  {statusLabels[obra.status]}
                </span>
              </div>

              {(obra.cidade || obra.estado) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{[obra.cidade, obra.estado].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {obra.data_previsao_fim && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Previsão: {new Date(obra.data_previsao_fim + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground truncate">
                  {obra.profiles?.full_name ?? 'Sem responsável'}
                </p>
                <Link href={`/obras/${obra.id}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
                  Ver <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
