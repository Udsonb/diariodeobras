'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { CloudSun, RefreshCw } from 'lucide-react'
import type { ClimaState } from '../rdo-form'

const condicoes = [
  'Céu limpo', 'Parcialmente nublado', 'Nublado', 'Encoberto',
  'Garoa leve', 'Garoa moderada', 'Chuva leve', 'Chuva moderada', 'Chuva forte',
  'Pancadas de chuva leves', 'Pancadas de chuva moderadas', 'Pancadas de chuva fortes',
  'Trovoada', 'Nevoeiro',
]

interface Props {
  clima: ClimaState
  onChange: (c: ClimaState) => void
  onBuscarClima: () => void
  loading: boolean
  temCoordenadas: boolean
}

type PeriodoKey = 'clima_manha' | 'clima_tarde' | 'clima_noite'

export function SecaoClima({ clima, onChange, onBuscarClima, loading, temCoordenadas }: Props) {
  const set = (key: keyof ClimaState, val: string) => onChange({ ...clima, [key]: val, fonte: 'manual' })

  const periodos: { key: PeriodoKey; label: string }[] = [
    { key: 'clima_manha', label: 'Manhã' },
    { key: 'clima_tarde', label: 'Tarde' },
    { key: 'clima_noite', label: 'Noite' },
  ]

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Condições Climáticas</h2>
            {clima.fonte === 'api' && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Automático</span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBuscarClima}
            disabled={loading || !temCoordenadas}
            title={!temCoordenadas ? 'A obra não tem coordenadas cadastradas' : undefined}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Buscando...' : 'Buscar clima'}
          </Button>
        </div>
        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {periodos.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Select
                value={clima[key] || undefined}
                onValueChange={val => { if (val) set(key, val) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {condicoes.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="temp_max">Temp. Máx. (°C)</Label>
            <Input id="temp_max" type="number" step="0.1" value={clima.temperatura_max}
              onChange={e => set('temperatura_max', e.target.value)} placeholder="Ex: 32" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temp_min">Temp. Mín. (°C)</Label>
            <Input id="temp_min" type="number" step="0.1" value={clima.temperatura_min}
              onChange={e => set('temperatura_min', e.target.value)} placeholder="Ex: 18" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="precipitacao">Chuva (mm)</Label>
            <Input id="precipitacao" type="number" step="0.1" min="0" value={clima.precipitacao}
              onChange={e => set('precipitacao', e.target.value)} placeholder="Ex: 0" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
