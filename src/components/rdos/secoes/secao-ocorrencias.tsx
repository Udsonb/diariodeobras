'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import type { ItemOcorrencia } from '../rdo-form'

interface Props {
  itens: ItemOcorrencia[]
  onChange: (itens: ItemOcorrencia[]) => void
}

const tipos = [
  { value: 'seguranca', label: 'Segurança' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'prazo', label: 'Prazo' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'material', label: 'Material / Insumo' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'clima', label: 'Condição climática' },
  { value: 'outro', label: 'Outro' },
]

const vazio: ItemOcorrencia = { descricao: '', tipo: '', acao_tomada: '' }

export function SecaoOcorrencias({ itens, onChange }: Props) {
  function adicionar() { onChange([...itens, { ...vazio }]) }
  function remover(idx: number) { onChange(itens.filter((_, i) => i !== idx)) }
  function atualizar(idx: number, campo: keyof ItemOcorrencia, val: string) {
    onChange(itens.map((item, i) => i === idx ? { ...item, [campo]: val } : item))
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-foreground">Ocorrências</h2>
            {itens.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{itens.length}</span>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={adicionar}>
            <Plus className="w-3.5 h-3.5 mr-1" />Adicionar ocorrência
          </Button>
        </div>
        <Separator />

        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sem ocorrências para registrar. Clique em "Adicionar" se houver algum problema.
          </p>
        ) : (
          <div className="space-y-3">
            {itens.map((item, idx) => (
              <div key={idx} className="border border-amber-200 rounded-lg p-4 space-y-3 bg-amber-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Ocorrência {idx + 1}</span>
                  <Button type="button" variant="ghost" size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => remover(idx)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={item.tipo || undefined} onValueChange={val => { if (val) atualizar(idx, 'tipo', val) }}>
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tipos.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Descrição da ocorrência *</Label>
                  <Textarea value={item.descricao} onChange={e => atualizar(idx, 'descricao', e.target.value)}
                    placeholder="Descreva o que ocorreu..." rows={2} className="text-sm" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Ação tomada</Label>
                  <Textarea value={item.acao_tomada} onChange={e => atualizar(idx, 'acao_tomada', e.target.value)}
                    placeholder="Como foi resolvido ou o que foi feito..." rows={2} className="text-sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
