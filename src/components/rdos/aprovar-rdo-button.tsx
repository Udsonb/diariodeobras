'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

interface Props {
  rdoId: string
  userId: string
}

export function AprovarRdoButton({ rdoId, userId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function aprovar() {
    setLoading(true)
    const { error } = await supabase
      .from('rdos')
      .update({ status: 'aprovado', aprovado_por: userId, aprovado_em: new Date().toISOString() })
      .eq('id', rdoId)

    setLoading(false)
    if (error) {
      toast.error('Erro ao aprovar: ' + error.message)
    } else {
      toast.success('RDO aprovado!')
      router.refresh()
    }
  }

  return (
    <Button
      onClick={aprovar}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
      size="sm"
    >
      <CheckCircle className="w-4 h-4 mr-1" />
      {loading ? 'Aprovando...' : 'Aprovar RDO'}
    </Button>
  )
}
