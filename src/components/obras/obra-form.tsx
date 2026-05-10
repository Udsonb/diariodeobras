'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { MapPin, Navigation } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  codigo: z.string().min(2, 'Código obrigatório'),
  descricao: z.string().optional(),
  status: z.enum(['planejamento', 'em_andamento', 'pausada', 'concluida', 'cancelada']),
  endereco: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  data_inicio: z.string().optional(),
  data_previsao_fim: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ObraForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loadingCep, setLoadingCep] = useState(false)
  const [loadingGps, setLoadingGps] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'em_andamento' },
  })

  async function buscarCep(cep: string) {
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setValue('endereco', data.logradouro)
        setValue('cidade', data.localidade)
        setValue('estado', data.uf)
        toast.success('Endereço preenchido pelo CEP')
      } else {
        toast.error('CEP não encontrado')
      }
    } catch {
      toast.error('Erro ao buscar CEP')
    } finally {
      setLoadingCep(false)
    }
  }

  async function usarLocalizacaoAtual() {
    if (!navigator.geolocation) { toast.error('Geolocalização não suportada'); return }
    setLoadingGps(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ lat: latitude, lng: longitude })
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`
          )
          const data = await res.json()
          if (data.address) {
            setValue('cidade', data.address.city || data.address.town || data.address.village || '')
            setValue('estado', data.address.state_district || data.address.state || '')
            if (data.address.postcode) setValue('cep', data.address.postcode.replace('-', ''))
            toast.success('Localização obtida com sucesso')
          }
        } catch {
          toast.success(`Coordenadas capturadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        } finally {
          setLoadingGps(false)
        }
      },
      () => { toast.error('Não foi possível obter a localização'); setLoadingGps(false) }
    )
  }

  async function onSubmit(data: FormData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sessão expirada.'); return }

    const { error } = await supabase.from('obras').insert({
      ...data,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      created_by: user.id,
      responsavel_id: user.id,
      data_inicio: data.data_inicio || null,
      data_previsao_fim: data.data_previsao_fim || null,
      descricao: data.descricao || null,
      endereco: data.endereco || null,
      cep: data.cep || null,
      cidade: data.cidade || null,
      estado: data.estado || null,
    } as any)

    if (error) {
      toast.error(error.code === '23505' ? 'Já existe uma obra com este código.' : 'Erro: ' + error.message)
      return
    }

    toast.success('Obra cadastrada com sucesso!')
    router.push('/obras')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Dados da Obra</h2>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="nome">Nome da obra *</Label>
              <Input id="nome" {...register('nome')} placeholder="Ex: Residencial São Paulo" />
              {errors.nome && <p className="text-destructive text-xs">{errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" {...register('codigo')} placeholder="Ex: OB-2024-001" />
              {errors.codigo && <p className="text-destructive text-xs">{errors.codigo.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register('descricao')} placeholder="Descreva brevemente a obra..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select defaultValue="em_andamento" onValueChange={val => { if (val) setValue('status', val as FormData['status']) }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planejamento">Planejamento</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Localização</h2>
            <Button type="button" variant="outline" size="sm" onClick={usarLocalizacaoAtual} disabled={loadingGps} className="text-xs">
              <Navigation className="w-3.5 h-3.5 mr-1" />
              {loadingGps ? 'Obtendo...' : 'Usar minha localização'}
            </Button>
          </div>
          <Separator />
          {coords && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-green-600" />
              Coordenadas: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" {...register('cep')} placeholder="00000-000"
                onBlur={e => buscarCep(e.target.value)} disabled={loadingCep} />
            </div>
            <div className="col-span-2 sm:col-span-3 space-y-1.5">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" {...register('endereco')} placeholder="Rua, número, bairro" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...register('cidade')} placeholder="Cidade" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estado">Estado</Label>
              <Input id="estado" {...register('estado')} placeholder="UF" maxLength={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Datas</h2>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="data_inicio">Data de início</Label>
              <Input id="data_inicio" type="date" {...register('data_inicio')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data_previsao_fim">Previsão de conclusão</Label>
              <Input id="data_previsao_fim" type="date" {...register('data_previsao_fim')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-secondary text-white px-8">
          {isSubmitting ? 'Salvando...' : 'Cadastrar Obra'}
        </Button>
      </div>
    </form>
  )
}
