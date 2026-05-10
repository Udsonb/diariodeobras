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
import { Plus, PowerOff, Power } from 'lucide-react'

type Recurso = {
  id: string; nome: string; tipo: string; grupo_id: string | null; matricula: string | null;
  cargo: string | null; fabricante: string | null; modelo: string | null; placa: string | null; ativo: boolean;
  grupos_recursos: { nome: string } | null
}
type Grupo = { id: string; nome: string; tipo: string }
type Tipo = 'efetivo' | 'maquinario' | 'ferramenta'

interface Props {
  recursos: Recurso[]
  grupos: Grupo[]
  tipo: Tipo
}

const camposPorTipo: Record<Tipo, { label: string; campo: 'matricula' | 'cargo' | 'fabricante' | 'modelo' | 'placa' }[]> = {
  efetivo: [{ label: 'Matrícula', campo: 'matricula' }, { label: 'Cargo / Função', campo: 'cargo' }],
  maquinario: [{ label: 'Fabricante', campo: 'fabricante' }, { label: 'Modelo', campo: 'modelo' }, { label: 'Placa / ID', campo: 'placa' }],
  ferramenta: [{ label: 'Modelo / Ref.', campo: 'modelo' }],
}

export function RecursoList({ recursos, grupos, tipo }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [grupoSelecionado, setGrupoSelecionado] = useState('')
  const [form, setForm] = useState({
    nome: '', matricula: '', cargo: '', fabricante: '', modelo: '', placa: '',
  })

  const filtrados = recursos.filter(r => r.nome.toLowerCase().includes(busca.toLowerCase()))

  function resetForm() {
    setForm({ nome: '', matricula: '', cargo: '', fabricante: '', modelo: '', placa: '' })
    setGrupoSelecionado('')
  }

  async function salvar() {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    const { error } = await supabase.from('recursos').insert({
      nome: form.nome.trim(),
      tipo,
      grupo_id: grupoSelecionado || null,
      matricula: form.matricula || null,
      cargo: form.cargo || null,
      fabricante: form.fabricante || null,
      modelo: form.modelo || null,
      placa: form.placa || null,
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

  const campos = camposPorTipo[tipo]
  const nomeTipo = tipo === 'efetivo' ? 'Colaborador' : tipo === 'maquinario' ? 'Equipamento' : 'Ferramenta'

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs" />

        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger>
            <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-secondary text-white">
              <Plus className="w-4 h-4 mr-2" />Novo cadastro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo {nomeTipo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder={tipo === 'efetivo' ? 'Nome completo' : 'Nome do equipamento'} />
              </div>
              <div className="space-y-1.5">
                <Label>Grupo</Label>
                <Select value={grupoSelecionado} onValueChange={val => { if (val) setGrupoSelecionado(val) }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um grupo..." /></SelectTrigger>
                  <SelectContent>
                    {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {campos.map(({ label, campo }) => (
                <div key={campo} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input value={form[campo] ?? ''} onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))}
                    placeholder={label} />
                </div>
              ))}
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
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!r.ativo ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {r.nome}
                  </p>
                  <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                    {r.grupos_recursos && <span>{r.grupos_recursos.nome}</span>}
                    {r.cargo && <span>· {r.cargo}</span>}
                    {r.modelo && <span>· {r.modelo}</span>}
                    {r.matricula && <span>· Matr: {r.matricula}</span>}
                  </div>
                </div>
                {!r.ativo && <Badge variant="outline" className="text-xs text-muted-foreground">Inativo</Badge>}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                  onClick={() => toggleAtivo(r.id, r.ativo)} title={r.ativo ? 'Desativar' : 'Ativar'}>
                  {r.ativo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
