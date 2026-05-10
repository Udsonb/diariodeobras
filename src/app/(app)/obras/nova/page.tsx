import { ObraForm } from '@/components/obras/obra-form'

export default function NovaObraPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Obra</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Preencha os dados da obra. A localização será usada para buscar o clima nos RDOs.
        </p>
      </div>
      <ObraForm />
    </div>
  )
}
