'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { MessageSquare } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
}

export function SecaoObservacoes({ value, onChange }: Props) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Observações Gerais</h2>
        </div>
        <Separator />
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Informe quaisquer observações relevantes sobre o dia de trabalho, visitas, pendências, etc."
          rows={4}
        />
      </CardContent>
    </Card>
  )
}
