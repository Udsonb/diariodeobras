'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { HardHat } from 'lucide-react'

interface Obra { id: string; nome: string; codigo: string }

interface Props {
  obras: Obra[]
  obraId: string
  data: string
  onObraChange: (id: string) => void
  onDataChange: (data: string) => void
}

export function SecaoObra({ obras, obraId, data, onObraChange, onDataChange }: Props) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <HardHat className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Obra e Data</h2>
        </div>
        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Obra *</Label>
            <Select value={obraId} onValueChange={(val) => { if (val) onObraChange(val) }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a obra..." />
              </SelectTrigger>
              <SelectContent>
                {obras.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    [{o.codigo}] {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data">Data do relatório *</Label>
            <Input
              id="data"
              type="date"
              value={data}
              onChange={e => onDataChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
