import { createClient } from '@/lib/supabase/server'
import { RecursoList } from '@/components/recursos/recurso-list'

export default async function EfetivoPage() {
  const supabase = await createClient()

  const [{ data: recursos }, { data: grupos }] = await Promise.all([
    supabase.from('recursos').select('*, grupos_recursos(nome)').eq('tipo', 'efetivo').order('nome'),
    supabase.from('grupos_recursos').select('*').eq('tipo', 'efetivo').order('nome'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Efetivo</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Cadastre colaboradores e equipes para usar nos diários de obra.
        </p>
      </div>
      <RecursoList recursos={recursos ?? []} grupos={grupos ?? []} tipo="efetivo" />
    </div>
  )
}
