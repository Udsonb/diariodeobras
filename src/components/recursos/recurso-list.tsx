'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, PowerOff, Power, Building2, User, Trash2 } from 'lucide-react'

type Recurso = {
  id: string; nome: string; tipo: string; grupo_id: string | null
  matricula: string | null; cargo: string | null; fabricante: string | null
  modelo: string | null; placa: string | null; ativo: boolean
  terceiro: boolean; empresa: string | null
  grupos_recursos: { nome: string } | null
}
type Tipo = 'efetivo' | 'maquinario' | 'ferramenta'

interface Props {
  recursos: Recurso[]
  grupos: { id: string; nome: string; tipo: string }[]
  tipo: Tipo
}

const config: Record<Tipo, { singular: string; nomePlaceholder: string }> = {
  efetivo:    { singular: 'Função', nomePlaceholder: 'Ex: Pedreiro, Engenheiro, Técnico...' },
  maquinario: { singular: 'Equipamento', nomePlaceholder: 'Ex: Retroescavadeira, Perfuratriz...' },
  ferramenta: { singular: 'Ferramenta', nomePlaceholder: 'Ex: Furadeira, Esmerilhadeira...' },
}

export function RecursoList({ recursos, tipo }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    terceiro: false,
    empresa: '',
    modelo: '',   // marca (maquinário/ferramenta)
    placa: '',    // nº patrimônio
  })

  const filtrados = recursos.filter(r =>
    r.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (r.empresa ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  function resetForm() {
    setForm({ nome: '', terceiro: false, empresa: '', modelo: '', placa: '' })
  }

  async function salvar() {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    const { error } = await supabase.from('recursos').insert({
      nome: form.nome.trim(),
      tipo,
      terceiro: form.terceiro,
      empresa: form.empresa.trim() || null,
      modelo: form.modelo.trim() || null,
      placa: form.placa.trim() || null,
    } as any)
    setSaving(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Cadastrado com sucesso!')
    setOpen(false)
    resetForm()
    router.refresh()
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('recursos').update({ ativo: !ativo } as any).eq('id', id)
    router.refresh()
  }

  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}" permanentemente? Essa ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('recursos').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir: ' + error.message); return }
    toast.success('Excluído com sucesso!')
    router.refresh()
  }

  const { singular, nomePlaceholder } = config[tipo]

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="max-w-xs"
        />

        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger>
            <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-secondary text-white">
              <Plus className="w-4 h-4 mr-2" />Nova {singular}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar {singular}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">

              {/* Nome */}
              <div className="space-y-1.5">
                <Label>
                  {tipo === 'efetivo' ? 'Nome da Função *' : `Nome do ${singular} *`}
                </Label>
                <Input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder={nomePlaceholder}
                />
              </div>

              {/* Marca / Modelo (maquinário e ferramenta) */}
              {tipo !== 'efetivo' && (
                <div className="space-y-1.5">
                  <Label>{tipo === 'ferramenta' ? 'Marca' : 'Marca / Modelo'}</Label>
                  <Input
                    value={form.modelo}
                    onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                    placeholder="Ex: Caterpillar, Bosch..."
                  />
                </div>
              )}

              {/* Nº Patrimônio (maquinário e ferramenta) */}
              {tipo !== 'efetivo' && (
                <div className="space-y-1.5">
                  <Label>Nº Patrimônio (opcional)</Label>
                  <Input
                    value={form.placa}
                    onChange={e => setForm(f => ({ ...f, placa: e.target.value }))}
                    placeholder="Ex: PAT-001"
                  />
                </div>
              )}

              {/* Próprio / Terceiro */}
              <div className="space-y-1.5">
                <Label>Vínculo</Label>
                <Select
                  value={form.terceiro ? 'terceiro' : 'proprio'}
                  onValueChange={val => setForm(f => ({ ...f, terceiro: val === 'terceiro', empresa: val === 'proprio' ? '' : f.empresa }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proprio">Próprio</SelectItem>
                    <SelectItem value="terceiro">Terceiro (subcontratado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Empresa (só se terceiro) */}
              {form.terceiro && (
                <div className="space-y-1.5">
                  <Label>Empresa / Empreiteira (opcional)</Label>
                  <Input
                    value={form.empresa}
                    onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                    placeholder="Nome da empresa contratada"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button className="flex-1 bg-primary hover:bg-secondary text-white" onClick={salvar} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhum cadastro encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {filtrados.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {r.terceiro
                    ? <Building2 className="w-4 h-4 text-primary" />
                    : <User className="w-4 h-4 text-primary" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${!r.ativo ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {r.nome}
                    </p>
                    <Badge variant="outline" className={`text-xs ${r.terceiro ? 'border-amber-400 text-amber-700' : 'border-green-400 text-green-700'}`}>
                      {r.terceiro ? 'Terceiro' : 'Próprio'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    {r.empresa && <span>{r.empresa}</span>}
                    {r.modelo && <span>· {r.modelo}</span>}
                    {r.placa && <span>· Pat: {r.placa}</span>}
                  </div>
                </div>
                {!r.ativo && <Badge variant="outline" className="text-xs text-muted-foreground">Inativo</Badge>}
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                  onClick={() => toggleAtivo(r.id, r.ativo)}
                  title={r.ativo ? 'Desativar' : 'Ativar'}
                >
                  {r.ativo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => excluir(r.id, r.nome)}
                  title="Excluir permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
