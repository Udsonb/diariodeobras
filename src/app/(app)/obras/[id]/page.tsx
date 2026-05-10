import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonLink } from '@/lib/button-link'
import Link from 'next/link'
import { Plus, MapPin, Calendar, ArrowLeft, ClipboardList } from 'lucide-react'

const statusColors: Record<string, string> = {
  planejamento: 'bg-gray-100 text-gray-700', em_andamento: 'bg-green-100 text-green-700',
  pausada: 'bg-yellow-100 text-yellow-700', concluida: 'bg-blue-100 text-blue-700', cancelada: 'bg-red-100 text-red-700',
}
const statusLabels: Record<string, string> = {
  planejamento: 'Planejamento', em_andamento: 'Em andamento', pausada: 'Pausada', concluida: 'Concluída', cancelada: 'Cancelada',
}
const rdoStatusColors: Record<string, string> = {
  rascunho: 'bg-yellow-100 text-yellow-800', enviado: 'bg-blue-100 text-blue-800', aprovado: 'bg-green-100 text-green-800',
}
const rdoStatusLabels: Record<string, string> = {
  rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado',
}

export default async function ObraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: obra } = await supabase
    .from('obras')
    .select('*, profiles!obras_responsavel_id_fkey(full_name)')
    .eq('id', id)
    .single()

  if (!obra) notFound()

  const { data: rdos } = await supabase
    .from('rdos')
    .select('*, profiles!rdos_created_by_fkey(full_name)')
    .eq('obra_id', id)
    .order('data', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <ButtonLink href="/obras" variant="ghost" size="icon" className="mt-0.5 flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </ButtonLink>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{obra.nome}</h1>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[obra.status]}`}>
              {statusLabels[obra.status]}
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-mono mt-0.5">{obra.codigo}</p>
        </div>
        <ButtonLink href={`/rdos/novo?obra=${obra.id}`} className="bg-primary hover:bg-secondary text-white flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" />Novo RDO
        </ButtonLink>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-5 space-y-3">
            {obra.descricao && <p className="text-sm text-muted-foreground">{obra.descricao}</p>}
            {(obra.endereco || obra.cidade) && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span>{[obra.endereco, obra.cidade, obra.estado].filter(Boolean).join(', ')}{obra.cep && ` - CEP ${obra.cep}`}</span>
              </div>
            )}
            {(obra.data_inicio || obra.data_previsao_fim) && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>
                  {obra.data_inicio && `Início: ${new Date(obra.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                  {obra.data_inicio && obra.data_previsao_fim && ' · '}
                  {obra.data_previsao_fim && `Previsão: ${new Date(obra.data_previsao_fim + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                </span>
              </div>
            )}
            {(obra.profiles as any)?.full_name && (
              <p className="text-sm text-muted-foreground">Responsável: <strong>{(obra.profiles as any).full_name}</strong></p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-4xl font-bold text-primary">{rdos?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">RDO(s) registrado(s)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />Relatórios Diários
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rdos?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">Nenhum RDO para esta obra ainda.</p>
              <ButtonLink href={`/rdos/novo?obra=${obra.id}`} className="mt-3 inline-flex bg-primary hover:bg-secondary text-white" size="sm">
                <Plus className="w-4 h-4 mr-1" />Criar primeiro RDO
              </ButtonLink>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rdos?.map((rdo: any) => (
                <Link key={rdo.id} href={`/rdos/${rdo.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(rdo.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Criado por: {rdo.profiles?.full_name ?? 'Desconhecido'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${rdoStatusColors[rdo.status]}`}>
                    {rdoStatusLabels[rdo.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
