export type UserRole =
  | 'admin'
  | 'engenheiro'
  | 'supervisor'
  | 'tecnico'
  | 'compras'
  | 'pre_vendas'
  | 'gerente'
  | 'gestor'

export type RdoStatus = 'rascunho' | 'enviado' | 'aprovado'
export type RecursoTipo = 'efetivo' | 'maquinario' | 'ferramenta'
export type ObraStatus =
  | 'planejamento'
  | 'em_andamento'
  | 'pausada'
  | 'concluida'
  | 'cancelada'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      obras: {
        Row: {
          id: string
          nome: string
          codigo: string
          descricao: string | null
          status: ObraStatus
          endereco: string | null
          cidade: string | null
          estado: string | null
          cep: string | null
          latitude: number | null
          longitude: number | null
          data_inicio: string | null
          data_previsao_fim: string | null
          data_conclusao: string | null
          responsavel_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['obras']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['obras']['Insert']>
      }
      grupos_recursos: {
        Row: {
          id: string
          nome: string
          tipo: RecursoTipo
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['grupos_recursos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['grupos_recursos']['Insert']>
      }
      recursos: {
        Row: {
          id: string
          nome: string
          tipo: RecursoTipo
          grupo_id: string | null
          matricula: string | null
          cargo: string | null
          fabricante: string | null
          modelo: string | null
          placa: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['recursos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['recursos']['Insert']>
      }
      rdos: {
        Row: {
          id: string
          obra_id: string
          data: string
          status: RdoStatus
          clima_manha: string | null
          clima_tarde: string | null
          clima_noite: string | null
          temperatura_max: number | null
          temperatura_min: number | null
          precipitacao: number | null
          clima_fonte: string | null
          observacoes: string | null
          enviado_em: string | null
          enviado_por: string | null
          aprovado_em: string | null
          aprovado_por: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rdos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rdos']['Insert']>
      }
      rdo_efetivo: {
        Row: {
          id: string
          rdo_id: string
          recurso_id: string
          quantidade: number
          horas_trabalhadas: number | null
          observacao: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rdo_efetivo']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rdo_efetivo']['Insert']>
      }
      rdo_maquinario: {
        Row: {
          id: string
          rdo_id: string
          recurso_id: string
          quantidade: number
          horas_utilizadas: number | null
          observacao: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rdo_maquinario']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rdo_maquinario']['Insert']>
      }
      rdo_servicos: {
        Row: {
          id: string
          rdo_id: string
          descricao: string
          localizacao: string | null
          percentual_executado: number | null
          observacao: string | null
          ordem: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rdo_servicos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rdo_servicos']['Insert']>
      }
      rdo_ocorrencias: {
        Row: {
          id: string
          rdo_id: string
          descricao: string
          tipo: string | null
          acao_tomada: string | null
          ordem: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rdo_ocorrencias']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rdo_ocorrencias']['Insert']>
      }
      rdo_fotos: {
        Row: {
          id: string
          rdo_id: string
          storage_path: string
          url: string | null
          legenda: string | null
          ordem: number
          uploaded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rdo_fotos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rdo_fotos']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      rdo_status: RdoStatus
      recurso_tipo: RecursoTipo
      obra_status: ObraStatus
    }
  }
}
