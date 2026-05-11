'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Building2, Users, UserPlus, Copy, Check, Trash2,
  Mail, ShieldCheck, Wrench, Eye, ShoppingCart, BarChart3,
} from 'lucide-react'
import { ROLE_LABELS } from '@/lib/supabase/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://diariodeobras-xi.vercel.app'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador', desc: 'Acesso total, pode convidar', icon: ShieldCheck },
  { value: 'diretor', label: 'Diretor', desc: 'Aprova RDOs, acessa relatórios', icon: BarChart3 },
  { value: 'engenheiro', label: 'Engenheiro', desc: 'Cria e aprova RDOs, gerencia obras', icon: Building2 },
  { value: 'supervisor', label: 'Supervisor de Obra', desc: 'Cria e edita RDOs', icon: Wrench },
  { value: 'tecnico', label: 'Técnico / Operador', desc: 'Cria e edita RDOs', icon: Wrench },
  { value: 'compras', label: 'Compras', desc: 'Somente visualização', icon: ShoppingCart },
  { value: 'financeiro', label: 'Financeiro', desc: 'Somente visualização', icon: BarChart3 },
  { value: 'visualizador', label: 'Visualizador', desc: 'Somente leitura', icon: Eye },
]

interface Props {
  user: User
  profile: any
  empresa: any
  membros: any[]
  convites: any[]
}

export function ConfiguracoesClient({ user, profile, empresa, membros, convites: convitesIniciais }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [aba, setAba] = useState<'empresa' | 'equipe'>('equipe')
  const [saving, setSaving] = useState(false)

  // Empresa form
  const [nomeEmpresa, setNomeEmpresa] = useState(empresa?.nome ?? '')
  const [cnpj, setCnpj] = useState(empresa?.cnpj ?? '')

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('tecnico')
  const [convites, setConvites] = useState(convitesIniciais)
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'

  async function criarEmpresa() {
    if (!nomeEmpresa.trim()) { toast.error('Nome da empresa é obrigatório'); return }
    setSaving(true)
    const { data, error } = await supabase.rpc('criar_empresa', {
      p_nome: nomeEmpresa.trim(),
      p_cnpj: cnpj.trim() || null,
    } as any)
    setSaving(false)
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message)
      return
    }
    toast.success('Empresa criada! Você é o administrador.')
    router.refresh()
  }

  async function salvarEmpresa() {
    if (!empresa?.id) return
    setSaving(true)
    const { error } = await supabase.from('empresas').update({
      nome: nomeEmpresa.trim(),
      cnpj: cnpj.trim() || null,
    }).eq('id', empresa.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Empresa atualizada!')
    router.refresh()
  }

  async function gerarConvite() {
    if (!empresa?.id) { toast.error('Crie sua empresa primeiro'); return }
    setSaving(true)
    const { data, error } = await supabase
      .from('convites')
      .insert({
        empresa_id: empresa.id,
        email: inviteEmail.trim() || null,
        role: inviteRole,
        created_by: user.id,
      } as any)
      .select()
      .single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setConvites(prev => [data, ...prev])
    setInviteEmail('')
    const link = `${APP_URL}/convite/${(data as any).token}`
    await copiarLink(link)
    toast.success('Convite gerado e link copiado!')
  }

  async function copiarLink(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setLinkCopiado(link)
      setTimeout(() => setLinkCopiado(null), 3000)
    } catch {
      toast.info(`Link: ${link}`)
    }
  }

  async function cancelarConvite(id: string) {
    await supabase.from('convites').delete().eq('id', id)
    setConvites(prev => prev.filter(c => c.id !== id))
    toast.success('Convite cancelado')
  }

  async function removerMembro(membroId: string) {
    if (membroId === user.id) { toast.error('Você não pode se remover'); return }
    if (!confirm('Remover este membro da empresa?')) return
    await supabase.from('profiles').update({ empresa_id: null } as any).eq('id', membroId)
    toast.success('Membro removido')
    router.refresh()
  }

  async function alterarRole(membroId: string, novoRole: string) {
    if (membroId === user.id) { toast.error('Você não pode alterar seu próprio perfil'); return }
    await supabase.from('profiles').update({ role: novoRole } as any).eq('id', membroId)
    toast.success('Perfil atualizado')
    router.refresh()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua empresa e equipe</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'equipe', label: 'Equipe', icon: Users },
          { key: 'empresa', label: 'Empresa', icon: Building2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              aba === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Aba Empresa */}
      {aba === 'empresa' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">{empresa ? 'Dados da Empresa' : 'Cadastrar Empresa'}</h2>
            </div>
            <Separator />

            {!empresa && !isAdmin && (
              <p className="text-sm text-muted-foreground">
                Você foi convidado para uma empresa. Peça ao administrador para ajustar os dados.
              </p>
            )}

            {(!empresa || isAdmin) && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome da empresa *</Label>
                  <Input
                    value={nomeEmpresa}
                    onChange={e => setNomeEmpresa(e.target.value)}
                    placeholder="Ex: Construtora Silva Ltda"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CNPJ (opcional)</Label>
                  <Input
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={empresa ? salvarEmpresa : criarEmpresa}
                    disabled={saving}
                    className="bg-primary hover:bg-secondary text-white"
                  >
                    {saving ? 'Salvando...' : empresa ? 'Salvar alterações' : 'Criar empresa'}
                  </Button>
                </div>
              </div>
            )}

            {empresa && !isAdmin && (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Nome:</span> <strong>{empresa.nome}</strong></p>
                {empresa.cnpj && <p><span className="text-muted-foreground">CNPJ:</span> <strong>{empresa.cnpj}</strong></p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aba Equipe */}
      {aba === 'equipe' && (
        <div className="space-y-4">
          {/* Sem empresa ainda */}
          {!empresa && (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="font-medium">Você ainda não tem uma empresa cadastrada</p>
                <p className="text-sm text-muted-foreground">
                  Cadastre sua empresa na aba "Empresa" para poder convidar membros.
                </p>
                <Button variant="outline" onClick={() => setAba('empresa')}>
                  Cadastrar empresa
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Convidar novo membro */}
          {empresa && isAdmin && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold">Convidar membro</h2>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>E-mail (opcional)</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Perfil de acesso</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map(r => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Descrição do papel selecionado */}
                {(() => {
                  const opt = ROLE_OPTIONS.find(r => r.value === inviteRole)
                  return opt ? (
                    <p className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-md">
                      <strong>{opt.label}:</strong> {opt.desc}
                    </p>
                  ) : null
                })()}

                <div className="flex justify-end">
                  <Button onClick={gerarConvite} disabled={saving} className="bg-primary hover:bg-secondary text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    {saving ? 'Gerando...' : 'Gerar link de convite'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Convites pendentes */}
          {convites.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <h2 className="font-semibold">Convites pendentes</h2>
                  <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">{convites.length}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  {convites.map(c => {
                    const link = `${APP_URL}/convite/${c.token}`
                    const copiado = linkCopiado === link
                    return (
                      <div key={c.id} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2.5 bg-white">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.email || 'Qualquer pessoa com o link'}</p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABELS[c.role] ?? c.role} · Expira em {new Date(c.expires_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          variant="outline" size="sm" className="h-7 text-xs flex-shrink-0"
                          onClick={() => copiarLink(link)}
                        >
                          {copiado ? <Check className="w-3.5 h-3.5 mr-1 text-green-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                          {copiado ? 'Copiado!' : 'Copiar'}
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => cancelarConvite(c.id)}
                          title="Cancelar convite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de membros */}
          {membros.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold">Membros da equipe</h2>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{membros.length}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  {membros.map(m => (
                    <div key={m.id} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2.5 bg-white">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {m.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {m.full_name ?? 'Sem nome'}
                          {m.id === user.id && <span className="text-xs text-muted-foreground ml-1">(você)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{ROLE_LABELS[m.role] ?? m.role}</p>
                      </div>
                      {isAdmin && m.id !== user.id && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Select
                            value={m.role}
                            onValueChange={v => alterarRole(m.id, v)}
                          >
                            <SelectTrigger className="h-7 text-xs w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map(r => (
                                <SelectItem key={r.value} value={r.value} className="text-xs">
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removerMembro(m.id)}
                            title="Remover membro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                      {(!isAdmin || m.id === user.id) && (
                        <Badge variant="outline" className="text-xs">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {empresa && membros.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum membro ainda. Gere um convite acima!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
