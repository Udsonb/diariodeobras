'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import type { ItemEfetivo } from '../rdo-form'

type Recurso = Database['public']['Tables']['recursos']['Row'] & {
  grupos_recursos: { nome: string } | null
}

interface Props {
  recursos: Recurso[]
  itens: ItemEfetivo[]
  onChange: (itens: ItemEfetivo[]) => void
}

export function SecaoEfetivo({ recursos, itens, onChange }: Props) {
  const [busca, setBusca] = useState('')
  const [showBusca, setShowBusca] = useState(false)

  const grupos = Array.from(
    new Set(recursos.map(r => r.grupos_recursos?.nome ?? 'Sem grupo'))
  )

  const recursosFiltrados = recursos.filter(r =>
    r.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (r.cargo ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  function adicionar(recurso: Recurso) {
    if (itens.some(i => i.recurso_id === recurso.id)) {
      return // já está na lista
    }
    onChange([...itens, {
      recurso_id: recurso.id,
      quantidade: 1,
      horas_trabalhadas: 8,
      observacao: '',
    }])
  }

  function adicionarGrupo(nomeGrupo: string) {
    const grupo = recursos.filter(r => (r.grupos_recursos?.nome ?? 'Sem grupo') === nomeGrupo)
    const novos = grupo.filter(r => !itens.some(i => i.recurso_id === r.id))
    onChange([...itens, ...novos.map(r => ({
      recurso_id: r.id,
      quantidade: 1,
      horas_trabalhadas: 8,
      observacao: '',
    }))])
  }

  function remover(idx: number) {
    onChange(itens.filter((_, i) => i !== idx))
  }

  function atualizar(idx: number, campo: keyof ItemEfetivo, val: string | number) {
    onChange(itens.map((item, i) => i === idx ? { ...item, [campo]: val } : item))
  }

  const totalEfetivo = itens.reduce((acc, i) => acc + i.quantidade, 0)

  const nomeRecurso = (id: string) => recursos.find(r => r.id === id)?.nome ?? 'Desconhecido'

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Efetivo</h2>
            {totalEfetivo > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {totalEfetivo} {totalEfetivo === 1 ? 'pessoa' : 'pessoas'}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowBusca(v => !v)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Adicionar
            {showBusca ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>
        <Separator />

        {/* Painel de seleção */}
        {showBusca && (
          <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-3">
            <Input
              placeholder="Buscar por nome ou cargo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="h-8 text-sm"
            />

            {/* Botões de grupo */}
            {!busca && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Adicionar por grupo:</p>
                <div className="flex flex-wrap gap-2">
                  {grupos.map(g => (
                    <Button
                      key={g}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => adicionarGrupo(g)}
                    >
                      + {g}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de recursos */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {recursosFiltrados.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum efetivo encontrado. Cadastre em Efetivo &gt; Cadastros.
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
                      jaAdicionado
                        ? 'text-muted-foreground cursor-default'
                        : 'hover:bg-primary/10 hover:text-primary cursor-pointer'
                    }`}
                  >
                    <span>{r.nome}</span>
                    <span className="text-xs text-muted-foreground">{r.cargo ?? r.grupos_recursos?.nome}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Itens adicionados */}
        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum efetivo adicionado. Clique em "Adicionar" para selecionar.
          </p>
        ) : (
          <div className="space-y-2">
            {itens.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center border border-border rounded-lg px-3 py-2 bg-white">
                <div className="col-span-5 text-sm font-medium text-foreground truncate">
                  {nomeRecurso(item.recurso_id)}
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Qtd</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={e => atualizar(idx, 'quantidade', parseInt(e.target.value) || 1)}
                    className="h-7 text-sm px-2"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs text-muted-foreground">Horas</Label>
                  <Input
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={item.horas_trabalhadas ?? ''}
                    onChange={e => atualizar(idx, 'horas_trabalhadas', parseFloat(e.target.value) || 0)}
                    className="h-7 text-sm px-2"
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
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
