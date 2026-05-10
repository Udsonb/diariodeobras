'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buscarClima } from '@/lib/clima'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/types'

import { SecaoObra } from './secoes/secao-obra'
import { SecaoClima } from './secoes/secao-clima'
import { SecaoEfetivo } from './secoes/secao-efetivo'
import { SecaoMaquinario } from './secoes/secao-maquinario'
import { SecaoServicos } from './secoes/secao-servicos'
import { SecaoOcorrencias } from './secoes/secao-ocorrencias'
import { SecaoFotos } from './secoes/secao-fotos'
import { SecaoObservacoes } from './secoes/secao-observacoes'

type Obra = { id: string; nome: string; codigo: string; latitude: number | null; longitude: number | null }
type Recurso = Database['public']['Tables']['recursos']['Row'] & {
  grupos_recursos: { nome: string } | null
  terceiro: boolean
  empresa: string | null
}

export type ItemEfetivo = { recurso_id: string; quantidade: number; horas_trabalhadas: number | null; observacao: string }
export type ItemMaquinario = { recurso_id: string; quantidade: number; horas_utilizadas: number | null; observacao: string }
export type ItemServico = { descricao: string; localizacao: string; percentual_executado: number | null; observacao: string }
export type ItemOcorrencia = { descricao: string; tipo: string; acao_tomada: string }
export type FotoUpload = { file: File; legenda: string; preview: string }

export interface ClimaState {
  clima_manha: string
  clima_tarde: string
  clima_noite: string
  temperatura_max: string
  temperatura_min: string
  precipitacao: string
  fonte: 'api' | 'manual'
}

interface RdoFormProps {
  obras: Obra[]
  recursos: Recurso[]
  obraIdInicial?: string
}

export function RdoForm({ obras, recursos, obraIdInicial }: RdoFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [obraId, setObraId] = useState(obraIdInicial ?? '')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [clima, setClima] = useState<ClimaState>({
    clima_manha: '', clima_tarde: '', clima_noite: '',
    temperatura_max: '', temperatura_min: '', precipitacao: '',
    fonte: 'manual',
  })
  const [efetivo, setEfetivo] = useState<ItemEfetivo[]>([])
  const [maquinario, setMaquinario] = useState<ItemMaquinario[]>([])
  const [servicos, setServicos] = useState<ItemServico[]>([])
  const [ocorrencias, setOcorrencias] = useState<ItemOcorrencia[]>([])
  const [fotos, setFotos] = useState<FotoUpload[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingClima, setLoadingClima] = useState(false)

  const obraSelecionada = obras.find(o => o.id === obraId)

  async function copiarDiaAnterior(obraIdParam: string, dataParam: string) {
    const dataAnterior = new Date(dataParam)
    dataAnterior.setDate(dataAnterior.getDate() - 1)
    const dataAnteriorStr = dataAnterior.toISOString().split('T')[0]

    const { data: rdoAnterior } = await supabase
      .from('rdos')
      .select('id')
      .eq('obra_id', obraIdParam)
      .eq('data', dataAnteriorStr)
      .single()

    if (!rdoAnterior) return

    const [{ data: efe }, { data: maq }] = await Promise.all([
      supabase.from('rdo_efetivo').select('recurso_id, quantidade, horas_trabalhadas').eq('rdo_id', rdoAnterior.id),
      supabase.from('rdo_maquinario').select('recurso_id, quantidade, horas_utilizadas').eq('rdo_id', rdoAnterior.id),
    ])

    if ((efe && efe.length > 0) || (maq && maq.length > 0)) {
      if (efe && efe.length > 0) {
        setEfetivo(efe.map(e => ({ recurso_id: e.recurso_id, quantidade: e.quantidade, horas_trabalhadas: e.horas_trabalhadas, observacao: '' })))
      }
      if (maq && maq.length > 0) {
        setMaquinario(maq.map(m => ({ recurso_id: m.recurso_id, quantidade: m.quantidade, horas_utilizadas: m.horas_utilizadas, observacao: '' })))
      }
      toast.success('Efetivo e maquinário copiados do dia anterior!')
    }
  }

  const handleBuscarClima = useCallback(async (dataParam?: string) => {
    if (!obraSelecionada?.latitude || !obraSelecionada?.longitude) {
      toast.info('A obra não possui coordenadas. Preencha o clima manualmente.')
      return
    }
    setLoadingClima(true)
    const climaData = await buscarClima(
      obraSelecionada.latitude,
      obraSelecionada.longitude,
      dataParam ?? data
    )
    setLoadingClima(false)
    if (climaData) {
      setClima({
        clima_manha: climaData.clima_manha,
        clima_tarde: climaData.clima_tarde,
        clima_noite: climaData.clima_noite,
        temperatura_max: String(climaData.temperatura_max),
        temperatura_min: String(climaData.temperatura_min),
        precipitacao: String(climaData.precipitacao),
        fonte: 'api',
      })
      toast.success('Dados de clima carregados')
    } else {
      toast.error('Não foi possível obter o clima. Preencha manualmente.')
    }
  }, [obraSelecionada, data])

  async function handleSave(status: 'rascunho' | 'enviado') {
    if (!obraId) { toast.error('Selecione uma obra'); return }
    if (!data) { toast.error('Informe a data'); return }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada')

      // 1. Criar o RDO
      const rdoPayload = {
        obra_id: obraId,
        data,
        status,
        clima_manha: clima.clima_manha || null,
        clima_tarde: clima.clima_tarde || null,
        clima_noite: clima.clima_noite || null,
        temperatura_max: clima.temperatura_max ? parseFloat(clima.temperatura_max) : null,
        temperatura_min: clima.temperatura_min ? parseFloat(clima.temperatura_min) : null,
        precipitacao: clima.precipitacao ? parseFloat(clima.precipitacao) : null,
        clima_fonte: clima.fonte,
        observacoes: observacoes || null,
        created_by: user.id,
        enviado_por: status === 'enviado' ? user.id : null,
        enviado_em: status === 'enviado' ? new Date().toISOString() : null,
      }

      const { data: rdo, error: rdoError } = await supabase
        .from('rdos')
        .insert(rdoPayload)
        .select()
        .single()

      if (rdoError) {
        if (rdoError.code === '23505') throw new Error('Já existe um RDO para esta obra nesta data.')
        throw new Error(rdoError.message)
      }

      // 2. Efetivo
      if (efetivo.length > 0) {
        const { error } = await supabase.from('rdo_efetivo').insert(
          efetivo.map(e => ({ rdo_id: rdo.id, ...e, observacao: e.observacao || null }))
        )
        if (error) throw new Error('Erro ao salvar efetivo: ' + error.message)
      }

      // 3. Maquinário
      if (maquinario.length > 0) {
        const { error } = await supabase.from('rdo_maquinario').insert(
          maquinario.map((m, i) => ({ rdo_id: rdo.id, ...m, observacao: m.observacao || null, ordem: i }))
        )
        if (error) throw new Error('Erro ao salvar maquinário: ' + error.message)
      }

      // 4. Serviços
      if (servicos.length > 0) {
        const { error } = await supabase.from('rdo_servicos').insert(
          servicos.map((s, i) => ({
            rdo_id: rdo.id,
            descricao: s.descricao,
            localizacao: s.localizacao || null,
            percentual_executado: s.percentual_executado,
            observacao: s.observacao || null,
            ordem: i,
          }))
        )
        if (error) throw new Error('Erro ao salvar serviços: ' + error.message)
      }

      // 5. Ocorrências
      if (ocorrencias.length > 0) {
        const { error } = await supabase.from('rdo_ocorrencias').insert(
          ocorrencias.map((o, i) => ({
            rdo_id: rdo.id,
            descricao: o.descricao,
            tipo: o.tipo || null,
            acao_tomada: o.acao_tomada || null,
            ordem: i,
          }))
        )
        if (error) throw new Error('Erro ao salvar ocorrências: ' + error.message)
      }

      // 6. Upload de fotos
      if (fotos.length > 0) {
        for (let i = 0; i < fotos.length; i++) {
          const foto = fotos[i]
          const ext = foto.file.name.split('.').pop()
          const path = `${rdo.id}/${Date.now()}-${i}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('rdo-fotos')
            .upload(path, foto.file, { cacheControl: '3600' })

          if (uploadError) {
            toast.warning(`Erro no upload da foto ${i + 1}: ${uploadError.message}`)
            continue
          }

          const { data: { publicUrl } } = supabase.storage.from('rdo-fotos').getPublicUrl(path)

          await supabase.from('rdo_fotos').insert({
            rdo_id: rdo.id,
            storage_path: path,
            url: publicUrl,
            legenda: foto.legenda || null,
            ordem: i,
            uploaded_by: user.id,
          })
        }
      }

      toast.success(status === 'enviado' ? 'RDO enviado com sucesso!' : 'RDO salvo como rascunho!')
      router.push(`/rdos/${rdo.id}`)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Obra e Data */}
      <SecaoObra
        obras={obras}
        obraId={obraId}
        data={data}
        onObraChange={id => { setObraId(id); if (id && data) copiarDiaAnterior(id, data) }}
        onDataChange={d => { setData(d); if (obraSelecionada?.latitude) handleBuscarClima(d); if (obraId) copiarDiaAnterior(obraId, d) }}
      />

      {/* 2. Clima */}
      <SecaoClima
        clima={clima}
        onChange={setClima}
        onBuscarClima={() => handleBuscarClima()}
        loading={loadingClima}
        temCoordenadas={!!obraSelecionada?.latitude}
      />

      {/* 3. Efetivo */}
      <SecaoEfetivo
        recursos={recursos.filter(r => r.tipo === 'efetivo')}
        itens={efetivo}
        onChange={setEfetivo}
      />

      {/* 4. Maquinário e Ferramentas */}
      <SecaoMaquinario
        recursos={recursos.filter(r => r.tipo === 'maquinario' || r.tipo === 'ferramenta')}
        itens={maquinario}
        onChange={setMaquinario}
      />

      {/* 5. Serviços */}
      <SecaoServicos itens={servicos} onChange={setServicos} />

      {/* 6. Ocorrências */}
      <SecaoOcorrencias itens={ocorrencias} onChange={setOcorrencias} />

      {/* 7. Fotos */}
      <SecaoFotos fotos={fotos} onChange={setFotos} />

      {/* 8. Observações gerais */}
      <SecaoObservacoes value={observacoes} onChange={setObservacoes} />

      {/* Ações */}
      <div className="flex gap-3 justify-end pt-2 pb-8">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave('rascunho')}
          disabled={saving}
          className="border-primary text-primary hover:bg-primary hover:text-white"
        >
          {saving ? 'Salvando...' : 'Salvar rascunho'}
        </Button>
        <Button
          onClick={() => handleSave('enviado')}
          disabled={saving}
          className="bg-primary hover:bg-secondary text-white px-6"
        >
          {saving ? 'Enviando...' : 'Enviar RDO'}
        </Button>
      </div>
    </div>
  )
}
