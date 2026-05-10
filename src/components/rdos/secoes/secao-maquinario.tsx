'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Wrench, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import type { ItemMaquinario } from '../rdo-form'

type Recurso = Database['public']['Tables']['recursos']['Row'] & {
  grupos_recursos: { nome: string } | null
}

interface Props {
  recursos: Recurso[]
  itens: ItemMaquinario[]
  onChange: (itens: ItemMaquinario[]) => void
}

export function SecaoMaquinario({ recursos, itens, onChange }: Props) {
  const [busca, setBusca] = useState('')
  const [showBusca, setShowBusca] = useState(false)

  const recursosFiltrados = recursos.filter(r =>
    r.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (r.modelo ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  function adicionar(recurso: Recurso) {
    if (itens.some(i => i.recurso_id === recurso.id)) return
    onChange([...itens, { recurso_id: recurso.id, quantidade: 1, horas_utilizadas: null, observacao: '' }])
  }

  function remover(idx: number) {
    onChange(itens.filter((_, i) => i !== idx))
  }

  function atualizar(idx: number, campo: keyof ItemMaquinario, val: string | number | null) {
    onChange(itens.map((item, i) => i === idx ? { ...item, [campo]: val } : item))
  }

  const nomeRecurso = (id: string) => recursos.find(r => r.id === id)?.nome ?? 'Desconhecido'
  const tipoRecurso = (id: string) => recursos.find(r => r.id === id)?.tipo === 'ferramenta' ? 'Ferramenta' : 'Maquinário'

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Maquinário e Ferramentas</h2>
            {itens.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {itens.length} item(s)
              </span>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowBusca(v => !v)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Adicionar
            {showBusca ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>
        <Separator />

        {showBusca && (
          <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-2">
            <Input
              placeholder="Buscar por nome ou modelo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {recursosFiltrados.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum equipamento encontrado. Cadastre em Maquinário &gt; Cadastros.
                </p>
              )}
              {recursosFiltrados.map(r => {
                const jaAdicionado = itens.some(i => i.recurso_id === r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => adicionar(r)}
                    disabled={jaAdicionado}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                      jaAdicionado ? 'text-muted-foreground cursor-default' : 'hover:bg-primary/10 hover:text-primary cursor-pointer'
                    }`}
                  >
                    <span>{r.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.tipo === 'ferramenta' ? 'Ferramenta' : r.modelo ?? 'Maquinário'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum equipamento adicionado.
          </p>
        ) : (
          <div className="space-y-2">
            {itens.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center border border-border rounded-lg px-3 py-2 bg-white">
                <div className="col-span-5">
                  <p className="text-sm font-medium text-foreground truncate">{nomeRecurso(item.recurso_id)}</p>
                  <p className="text-xs text-muted-foreground">{tipoRecurso(item.recurso_id)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Qtd</Label>
                  <Input
                    type="number" min={1}
                    value={item.quantidade}
                    onChange={e => atualizar(idx, 'quantidade', parseInt(e.target.value) || 1)}
                    className="h-7 text-sm px-2"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs text-muted-foreground">Horas uso</Label>
                  <Input
                    type="number" min={0} max={24} step={0.5}
                    value={item.horas_utilizadas ?? ''}
                    onChange={e => atualizar(idx, 'horas_utilizadas', parseFloat(e.target.value) || null)}
                    placeholder="—"
                    className="h-7 text-sm px-2"
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    type="button" variant="ghost" size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => remover(idx)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
