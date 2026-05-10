import { createClient } from '@/lib/supabase/server'
import { RecursoList } from '@/components/recursos/recurso-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function MaquinarioPage() {
  const supabase = await createClient()

  const [{ data: maquinario }, { data: ferramentas }, { data: gruposMaq }, { data: gruposFerr }] = await Promise.all([
    supabase.from('recursos').select('*, grupos_recursos(nome)').eq('tipo', 'maquinario').order('nome'),
    supabase.from('recursos').select('*, grupos_recursos(nome)').eq('tipo', 'ferramenta').order('nome'),
    supabase.from('grupos_recursos').select('*').eq('tipo', 'maquinario').order('nome'),
    supabase.from('grupos_recursos').select('*').eq('tipo', 'ferramenta').order('nome'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Maquinário e Ferramentas</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Cadastre equipamentos e ferramentas para usar nos diários de obra.
        </p>
      </div>

      <Tabs defaultValue="maquinario">
        <TabsList>
          <TabsTrigger value="maquinario">Maquinário</TabsTrigger>
          <TabsTrigger value="ferramenta">Ferramentas</TabsTrigger>
        </TabsList>
        <TabsContent value="maquinario" className="mt-4">
          <RecursoList recursos={maquinario ?? []} grupos={gruposMaq ?? []} tipo="maquinario" />
        </TabsContent>
        <TabsContent value="ferramenta" className="mt-4">
          <RecursoList recursos={ferramentas ?? []} grupos={gruposFerr ?? []} tipo="ferramenta" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
