'use client'

import { useCallback, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Camera, Upload, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import type { FotoUpload } from '../rdo-form'

interface Props {
  fotos: FotoUpload[]
  onChange: (fotos: FotoUpload[]) => void
}

const MAX_MB = 10

export function SecaoFotos({ fotos, onChange }: Props) {
  const [dragging, setDragging] = useState(false)

  const processarArquivos = useCallback((files: FileList | File[]) => {
    const novos: FotoUpload[] = []
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      if (file.size > MAX_MB * 1024 * 1024) {
        alert(`"${file.name}" excede ${MAX_MB}MB e foi ignorada.`)
        return
      }
      const preview = URL.createObjectURL(file)
      novos.push({ file, legenda: '', preview })
    })
    onChange([...fotos, ...novos])
  }, [fotos, onChange])

  function remover(idx: number) {
    URL.revokeObjectURL(fotos[idx].preview)
    onChange(fotos.filter((_, i) => i !== idx))
  }

  function atualizarLegenda(idx: number, legenda: string) {
    onChange(fotos.map((f, i) => i === idx ? { ...f, legenda } : f))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    processarArquivos(e.dataTransfer.files)
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Fotos</h2>
          {fotos.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {fotos.length} foto(s)
            </span>
          )}
        </div>
        <Separator />

        {/* Zona de upload */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
          onClick={() => document.getElementById('foto-input')?.click()}
        >
          <input
            id="foto-input"
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={e => e.target.files && processarArquivos(e.target.files)}
          />
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">
            Arraste fotos aqui ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Câmera ou galeria · Sem limite de quantidade · Máx. {MAX_MB}MB por foto
          </p>
        </div>

        {/* Grade de fotos */}
        {fotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {fotos.map((foto, idx) => (
              <div key={idx} className="group relative space-y-1.5">
                <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                  <Image
                    src={foto.preview}
                    alt={foto.legenda || `Foto ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => remover(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  value={foto.legenda}
                  onChange={e => atualizarLegenda(idx, e.target.value)}
                  placeholder="Legenda (opcional)"
                  className="h-7 text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
