import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/lib/button-link'
import Link from 'next/link'
import { HardHat, ClipboardList, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusColors: Record<string, string> = {
  rascunho: 'bg-yellow-100 text-yellow-800',
  enviado: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-green-100 text-green-800',
}
const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalObras },
    { count: obrasAtivas },
    { count: totalRdos },
    { data: rdosRecentes },
    { data: obrasList },
  ] = await Promise.all([
    supabase.from('obras').select('*', { count: 'exact', head: true }),
    supabase.from('obras').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    supabase.from('rdos').select('*', { count: 'exact', head: true }),
    supabase.from('rdos').select('*, obras(nome, codigo)').order('created_at', { ascending: false }).limit(5),
    supabase.from('obras').select('*').eq('status', 'em_andamento').order('updated_at', { ascending: false }).limit(6),
  ])

  const hoje = new Date().toISOString().split('T')[0]
  const rdosHoje = rdosRecentes?.filter((r: any) => r.data === hoje).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Visão geral das obras e relatórios</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/obras/nova" variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />Nova Obra
          </ButtonLink>
          <ButtonLink href="/rdos/novo" size="sm" className="bg-primary hover:bg-secondary text-white">
            <Plus className="w-4 h-4 mr-1" />Novo RDO
          </ButtonLink>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Obras', value: totalObras ?? 0, icon: HardHat, color: 'border-l-primary' },
          { label: 'Em Andamento', value: obrasAtivas ?? 0, icon: TrendingUp, color: 'border-l-green-500' },
          { label: 'Total de RDOs', value: totalRdos ?? 0, icon: ClipboardList, color: 'border-l-blue-500' },
          { label: 'RDOs Hoje', value: rdosHoje, icon: ClipboardList, color: 'border-l-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos RDOs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Últimos RDOs</CardTitle>
            <ButtonLink href="/rdos" variant="ghost" size="sm" className="text-primary h-8">
              Ver todos <ArrowRight className="w-3 h-3 ml-1" />
            </ButtonLink>
          </CardHeader>
          <CardContent className="space-y-2">
            {(!rdosRecentes || rdosRecentes.length === 0) && (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhum RDO registrado ainda.</p>
            )}
            {rdosRecentes?.map((rdo: any) => (
              <Link key={rdo.id} href={`/rdos/${rdo.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{rdo.obras?.nome ?? 'Obra desconhecida'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(rdo.data + 'T12:00:00').toLocaleDateString('pt-BR')} ·{' '}
                    {formatDistanceToNow(new Date(rdo.created_at), { locale: ptBR, addSuffix: true })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${statusColors[rdo.status]}`}>
                  {statusLabels[rdo.status]}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Obras ativas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Obras Ativas</CardTitle>
            <ButtonLink href="/obras" variant="ghost" size="sm" className="text-primary h-8">
              Ver todas <ArrowRight className="w-3 h-3 ml-1" />
            </ButtonLink>
          </CardHeader>
          <CardContent className="space-y-2">
            {(!obrasList || obrasList.length === 0) && (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhuma obra ativa no momento.</p>
            )}
            {obrasList?.map((obra: any) => (
              <Link key={obra.id} href={`/obras/${obra.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{obra.nome}</p>
                  <p className="text-xs text-muted-foreground">{obra.codigo} · {obra.cidade ?? 'Localização não informada'}</p>
                </div>
                {obra.data_previsao_fim && (
                  <Badge variant="outline" className="flex-shrink-0 ml-2 text-xs">
                    até {new Date(obra.data_previsao_fim + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                  </Badge>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
