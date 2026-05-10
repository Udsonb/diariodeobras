import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonLink } from '@/lib/button-link'
import { AprovarRdoButton } from '@/components/rdos/aprovar-rdo-button'
import { ArrowLeft, CloudSun, Users, Wrench, ClipboardList, AlertTriangle, Camera, MessageSquare, Check } from 'lucide-react'

const statusColors: Record<string, string> = {
  rascunho: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  enviado: 'bg-blue-100 text-blue-800 border-blue-200',
  aprovado: 'bg-green-100 text-green-800 border-green-200',
}
const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho', enviado: 'Enviado para aprovação', aprovado: 'Aprovado',
}

export default async function RdoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: rdo },
    { data: efetivo },
    { data: maquinario },
    { data: servicos },
    { data: ocorrencias },
    { data: fotos },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('rdos').select('*, obras(*), profiles!rdos_created_by_fkey(full_name)').eq('id', id).single(),
    supabase.from('rdo_efetivo').select('*, recursos(nome, cargo)').eq('rdo_id', id),
    supabase.from('rdo_maquinario').select('*, recursos(nome, modelo, tipo)').eq('rdo_id', id),
    supabase.from('rdo_servicos').select('*').eq('rdo_id', id).order('ordem'),
    supabase.from('rdo_ocorrencias').select('*').eq('rdo_id', id).order('ordem'),
    supabase.from('rdo_fotos').select('*').eq('rdo_id', id).order('ordem'),
    supabase.auth.getUser(),
  ])

  if (!rdo) notFound()

  const obra = (rdo as any).obras as Record<string, string>
  const criador = (rdo as any).profiles as { full_name: string } | null
  const totalEfetivo = efetivo?.reduce((acc: number, e: any) => acc + e.quantidade, 0) ?? 0
  const dataFormatada = new Date((rdo as any).data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">
      <div className="flex items-start gap-3">
        <ButtonLink href={`/obras/${obra?.id ?? ''}`} variant="ghost" size="icon" className="flex-shrink-0 mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </ButtonLink>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-foreground capitalize">{dataFormatada}</h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColors[(rdo as any).status]}`}>
              {statusLabels[(rdo as any).status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{obra?.nome} · {obra?.codigo}</p>
        </div>
        {(rdo as any).status === 'enviado' && (
          <AprovarRdoButton rdoId={(rdo as any).id} userId={user?.id ?? ''} />
        )}
      </div>

      {/* Clima */}
      {((rdo as any).clima_manha || (rdo as any).temperatura_max) && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CloudSun className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Condições Climáticas</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['Manhã', 'Tarde', 'Noite'].map((p, i) => {
                const val = [(rdo as any).clima_manha, (rdo as any).clima_tarde, (rdo as any).clima_noite][i]
                return val ? (
                  <div key={p} className="bg-muted/40 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{p}</p>
                    <p className="text-sm font-medium">{val}</p>
                  </div>
                ) : null
              })}
            </div>
            {((rdo as any).temperatura_max || (rdo as any).temperatura_min || (rdo as any).precipitacao !== null) && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-border text-sm">
                {(rdo as any).temperatura_max && <span>Máx: <strong>{(rdo as any).temperatura_max}°C</strong></span>}
                {(rdo as any).temperatura_min && <span>Mín: <strong>{(rdo as any).temperatura_min}°C</strong></span>}
                {(rdo as any).precipitacao !== null && <span>Chuva: <strong>{(rdo as any).precipitacao}mm</strong></span>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Efetivo */}
      {(efetivo?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Efetivo</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{totalEfetivo} pessoa(s)</span>
            </div>
            <div className="divide-y divide-border">
              {efetivo?.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{e.recursos?.nome}</p>
                    {e.recursos?.cargo && <p className="text-xs text-muted-foreground">{e.recursos.cargo}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{e.quantidade} {e.quantidade === 1 ? 'pessoa' : 'pessoas'}</p>
                    {e.horas_trabalhadas && <p className="text-xs text-muted-foreground">{e.horas_trabalhadas}h</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maquinário */}
      {(maquinario?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Maquinário e Ferramentas</h2>
            </div>
            <div className="divide-y divide-border">
              {maquinario?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{m.recursos?.nome}</p>
                    {m.recursos?.modelo && <p className="text-xs text-muted-foreground">{m.recursos.modelo}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">Qtd: {m.quantidade}</p>
                    {m.horas_utilizadas && <p className="text-xs text-muted-foreground">{m.horas_utilizadas}h</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Serviços */}
      {(servicos?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Serviços Executados</h2>
            </div>
            <div className="space-y-3">
              {servicos?.map((s: any, i: number) => (
                <div key={s.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium mt-0.5">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.descricao}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        {s.localizacao && <span>{s.localizacao}</span>}
                        {s.percentual_executado !== null && (
                          <span className="font-medium text-green-700">{s.percentual_executado}% executado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ocorrências */}
      {(ocorrencias?.length ?? 0) > 0 && (
        <Card className="border-amber-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold">Ocorrências</h2>
            </div>
            <div className="space-y-3">
              {ocorrencias?.map((o: any) => (
                <div key={o.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  {o.tipo && <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">{o.tipo}</span>}
                  <p className="text-sm mt-1">{o.descricao}</p>
                  {o.acao_tomada && (
                    <p className="text-xs text-muted-foreground mt-1.5 pt-1.5 border-t border-amber-200">
                      <strong>Ação:</strong> {o.acao_tomada}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fotos */}
      {(fotos?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Fotos</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{fotos?.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {fotos?.map((foto: any) => (
                <a key={foto.id} href={foto.url ?? '#'} target="_blank" rel="noopener noreferrer">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted hover:opacity-90 transition-opacity">
                    {foto.url && <Image src={foto.url} alt={foto.legenda ?? 'Foto do RDO'} fill className="object-cover" />}
                  </div>
                  {foto.legenda && <p className="text-xs text-muted-foreground mt-1 truncate">{foto.legenda}</p>}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {(rdo as any).observacoes && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Observações Gerais</h2>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(rdo as any).observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Rodapé */}
      <div className="border border-border rounded-xl p-4 bg-muted/20 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <span>Criado por: <strong>{criador?.full_name ?? 'Desconhecido'}</strong></span>
          <span>Em: <strong>{new Date((rdo as any).created_at).toLocaleString('pt-BR')}</strong></span>
          {(rdo as any).aprovado_em && (
            <span className="flex items-center gap-1 text-green-700">
              <Check className="w-3 h-3" /> Aprovado em {new Date((rdo as any).aprovado_em).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
