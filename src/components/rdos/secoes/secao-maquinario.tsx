'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Wrench, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { ItemMaquinario } from '../rdo-form'

type Recurso = {
  id: string; nome: string; tipo: string; ativo: boolean
  terceiro: boolean; empresa: string | null
  modelo: string | null; placa: string | null
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
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'maquinario' | 'ferramenta'>('todos')

  const maquinarios = recursos.filter(r => r.tipo === 'maquinario' && r.ativo)
  const ferramentas = recursos.filter(r => r.tipo === 'ferramenta' && r.ativo)

  const recursosFiltrados = recursos
    .filter(r => r.ativo)
    .filter(r => filtroTipo === 'todos' || r.tipo === filtroTipo)
    .filter(r =>
      r.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (r.modelo ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (r.empresa ?? '').toLowerCase().includes(busca.toLowerCase())
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

  const recurso = (id: string) => recursos.find(r => r.id === id)

  function renderLista(lista: Recurso[], titulo?: string) {
    if (lista.length === 0) return null
    return (
      <div className="space-y-1">
        {titulo && <p className="text-xs font-medium text-muted-foreground px-1">{titulo}</p>}
        {lista.map(r => {
          const jaAdicionado = itens.some(i => i.recurso_id === r.id)
          return (
            <button
              key={r.id} type="button" onClick={() => adicionar(r)} disabled={jaAdicionado}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between gap-2 ${
                jaAdicionado ? 'text-muted-foreground cursor-default opacity-50' : 'hover:bg-primary/10 hover:text-primary cursor-pointer'
              }`}
            >
              <div>
                <span>{r.nome}</span>
                {r.modelo && <span className="text-xs text-muted-foreground ml-2">{r.modelo}</span>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.placa && <span className="text-xs text-muted-foreground">Pat: {r.placa}</span>}
                <Badge variant="outline" className={`text-xs ${r.terceiro ? 'border-amber-400 text-amber-600' : 'border-green-400 text-green-600'}`}>
                  {r.terceiro ? 'Terceiro' : 'Próprio'}
                </Badge>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

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
            <Plus className="w-3.5 h-3.5 mr-1" />Adicionar
            {showBusca ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>
        <Separator />

        {showBusca && (
          <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar equipamento..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="h-8 text-sm flex-1"
              />
              <div className="flex gap-1">
                {(['todos', 'maquinario', 'ferramenta'] as const).map(v => (
                  <button
                    key={v} type="button"
                    onClick={() => setFiltroTipo(v)}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      filtroTipo === v ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary'
                    }`}
                  >
                    {v === 'todos' ? 'Todos' : v === 'maquinario' ? 'Maquinário' : 'Ferramentas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2">
              {recursosFiltrados.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum equipamento encontrado. Cadastre em Maquinário.
                </p>
              )}
              {busca
                ? renderLista(recursosFiltrados)
                : (
                  <>
                    {renderLista(maquinarios.filter(r => recursosFiltrados.includes(r)), maquinarios.length > 0 ? 'Maquinário' : undefined)}
                    {maquinarios.length > 0 && ferramentas.length > 0 && <div className="border-t border-border my-1" />}
                    {renderLista(ferramentas.filter(r => recursosFiltrados.includes(r)), ferramentas.length > 0 ? 'Ferramentas' : undefined)}
                  </>
                )
              }
            </div>
          </div>
        )}

        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum equipamento adicionado.
          </p>
        ) : (
          <div className="space-y-2">
            {itens.map((item, idx) => {
              const r = recurso(item.recurso_id)
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center border border-border rounded-lg px-3 py-2 bg-white">
                  <div className="col-span-5">
                    <p className="text-sm font-medium text-foreground">{r?.nome ?? '—'}</p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${r?.terceiro ? 'border-amber-400 text-amber-600' : 'border-green-400 text-green-600'}`}>
                        {r?.terceiro ? 'Terceiro' : 'Próprio'}
                      </Badge>
                      {r?.empresa && <span className="text-xs text-muted-foreground">{r.empresa}</span>}
                      {r?.placa && <span className="text-xs text-muted-foreground">· Pat: {r.placa}</span>}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs text-muted-foreground">Quantidade</Label>
                    <Input
                      type="number" min={1}
                      value={item.quantidade}
                      onChange={e => atualizar(idx, 'quantidade', parseInt(e.target.value) || 1)}
                      className="h-7 text-sm px-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Horas</Label>
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
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
