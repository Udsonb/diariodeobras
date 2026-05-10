'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import type { ItemServico } from '../rdo-form'

interface Props {
  itens: ItemServico[]
  onChange: (itens: ItemServico[]) => void
}

const vazio: ItemServico = { descricao: '', localizacao: '', percentual_executado: null, observacao: '' }

export function SecaoServicos({ itens, onChange }: Props) {
  function adicionar() {
    onChange([...itens, { ...vazio }])
  }

  function remover(idx: number) {
    onChange(itens.filter((_, i) => i !== idx))
  }

  function atualizar(idx: number, campo: keyof ItemServico, val: string | number | null) {
    onChange(itens.map((item, i) => i === idx ? { ...item, [campo]: val } : item))
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Serviços Executados</h2>
            {itens.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {itens.length}
              </span>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={adicionar}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Adicionar serviço
          </Button>
        </div>
        <Separator />

        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Clique em "Adicionar serviço" para registrar o que foi executado hoje.
          </p>
        ) : (
          <div className="space-y-3">
            {itens.map((item, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Serviço {idx + 1}</span>
                  <Button
                    type="button" variant="ghost" size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => remover(idx)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Descrição do serviço *</Label>
                  <Textarea
                    value={item.descricao}
                    onChange={e => atualizar(idx, 'descricao', e.target.value)}
                    placeholder="Ex: Concretagem da laje do 3º pavimento"
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Localização / Pavimento</Label>
                    <Input
                      value={item.localizacao}
                      onChange={e => atualizar(idx, 'localizacao', e.target.value)}
                      placeholder="Ex: Bloco A, 3º andar"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">% Executado</Label>
                    <Input
                      type="number" min={0} max={100} step={5}
                      value={item.percentual_executado ?? ''}
                      onChange={e => atualizar(idx, 'percentual_executado', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0–100"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
