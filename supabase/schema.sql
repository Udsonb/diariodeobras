-- =============================================================
-- DIÁRIO DE OBRAS - Schema do Banco de Dados
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================================

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUM: Perfis de usuário (RBAC)
-- =============================================================
CREATE TYPE user_role AS ENUM (
  'admin',
  'engenheiro',
  'supervisor',
  'tecnico',
  'compras',
  'pre_vendas',
  'gerente',
  'gestor'
);

-- =============================================================
-- ENUM: Status do RDO
-- =============================================================
CREATE TYPE rdo_status AS ENUM (
  'rascunho',
  'enviado',
  'aprovado'
);

-- =============================================================
-- ENUM: Tipo de recurso
-- =============================================================
CREATE TYPE recurso_tipo AS ENUM (
  'efetivo',
  'maquinario',
  'ferramenta'
);

-- =============================================================
-- ENUM: Status da obra
-- =============================================================
CREATE TYPE obra_status AS ENUM (
  'planejamento',
  'em_andamento',
  'pausada',
  'concluida',
  'cancelada'
);

-- =============================================================
-- TABELA: Perfis de usuário (estende auth.users do Supabase)
-- =============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'tecnico',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABELA: Obras
-- =============================================================
CREATE TABLE obras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT,
  status obra_status NOT NULL DEFAULT 'em_andamento',
  -- Localização
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  -- Datas
  data_inicio DATE,
  data_previsao_fim DATE,
  data_conclusao DATE,
  -- Responsável
  responsavel_id UUID REFERENCES profiles(id),
  -- Metadados
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABELA: Grupos de recursos (ex: "Pedreiros", "Guindastes")
-- =============================================================
CREATE TABLE grupos_recursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo recurso_tipo NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABELA: Recursos cadastrados (efetivo, maquinário, ferramentas)
-- =============================================================
CREATE TABLE recursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo recurso_tipo NOT NULL,
  grupo_id UUID REFERENCES grupos_recursos(id),
  matricula TEXT,          -- Para efetivo: matrícula do funcionário
  cargo TEXT,              -- Para efetivo: cargo/função
  fabricante TEXT,         -- Para maquinário: fabricante
  modelo TEXT,             -- Para maquinário: modelo
  placa TEXT,              -- Para maquinário: placa/identificação
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABELA: RDO - Relatório Diário de Obras
-- =============================================================
CREATE TABLE rdos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  status rdo_status NOT NULL DEFAULT 'rascunho',
  -- Clima (preenchido automaticamente ou manualmente)
  clima_manha TEXT,
  clima_tarde TEXT,
  clima_noite TEXT,
  temperatura_max DECIMAL(4, 1),
  temperatura_min DECIMAL(4, 1),
  precipitacao DECIMAL(6, 2),  -- em mm
  clima_fonte TEXT DEFAULT 'manual', -- 'api' ou 'manual'
  -- Observações gerais
  observacoes TEXT,
  -- Controle de aprovação
  enviado_em TIMESTAMPTZ,
  enviado_por UUID REFERENCES profiles(id),
  aprovado_em TIMESTAMPTZ,
  aprovado_por UUID REFERENCES profiles(id),
  -- Metadados
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraint: apenas um RDO por obra por dia
  UNIQUE(obra_id, data)
);

-- =============================================================
-- TABELA: Efetivo no RDO (presença diária)
-- =============================================================
CREATE TABLE rdo_efetivo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rdo_id UUID NOT NULL REFERENCES rdos(id) ON DELETE CASCADE,
  recurso_id UUID NOT NULL REFERENCES recursos(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  horas_trabalhadas DECIMAL(4, 2),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABELA: Maquinário/ferramentas no RDO
-- =============================================================
CREATE TABLE rdo_maquinario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rdo_id UUID NOT NULL REFERENCES rdos(id) ON DELETE CASCADE,
  recurso_id UUID NOT NULL REFERENCES recursos(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  horas_utilizadas DECIMAL(4, 2),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABELA: Serviços executados no RDO
-- =============================================================
CREATE TABLE rdo_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rdo_id UUID NOT NULL REFERENCES rdos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  localizacao TEXT,    -- ex: "Bloco A, 3º andar"
  percentual_executado DECIMAL(5, 2),
  observacao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABELA: Ocorrências no RDO
-- =============================================================
CREATE TABLE rdo_ocorrencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rdo_id UUID NOT NULL REFERENCES rdos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  tipo TEXT,     -- ex: 'segurança', 'qualidade', 'prazo', 'outro'
  acao_tomada TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABELA: Fotos do RDO
-- =============================================================
CREATE TABLE rdo_fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rdo_id UUID NOT NULL REFERENCES rdos(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,   -- caminho no Supabase Storage
  url TEXT,                     -- URL pública (gerada na hora do upload)
  legenda TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES para performance
-- =============================================================
CREATE INDEX idx_rdos_obra_id ON rdos(obra_id);
CREATE INDEX idx_rdos_data ON rdos(data);
CREATE INDEX idx_rdos_status ON rdos(status);
CREATE INDEX idx_rdo_efetivo_rdo_id ON rdo_efetivo(rdo_id);
CREATE INDEX idx_rdo_maquinario_rdo_id ON rdo_maquinario(rdo_id);
CREATE INDEX idx_rdo_servicos_rdo_id ON rdo_servicos(rdo_id);
CREATE INDEX idx_rdo_ocorrencias_rdo_id ON rdo_ocorrencias(rdo_id);
CREATE INDEX idx_rdo_fotos_rdo_id ON rdo_fotos(rdo_id);
CREATE INDEX idx_recursos_tipo ON recursos(tipo);
CREATE INDEX idx_recursos_grupo_id ON recursos(grupo_id);

-- =============================================================
-- TRIGGERS: updated_at automático
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER obras_updated_at BEFORE UPDATE ON obras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recursos_updated_at BEFORE UPDATE ON recursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rdos_updated_at BEFORE UPDATE ON rdos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- TRIGGER: Criar profile automaticamente ao registrar usuário
-- =============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================
-- RLS (Row Level Security) - Políticas de acesso
-- =============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdo_efetivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdo_maquinario ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdo_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdo_ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdo_fotos ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: obter role do usuário logado
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função auxiliar: verificar se usuário pode editar
CREATE OR REPLACE FUNCTION can_edit()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('admin', 'engenheiro', 'supervisor', 'tecnico');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função auxiliar: verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES: todos autenticados leem, cada um edita o próprio, admin edita todos
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated USING (is_admin());

-- OBRAS: todos autenticados leem, apenas editores escrevem
CREATE POLICY "obras_select" ON obras FOR SELECT TO authenticated USING (true);
CREATE POLICY "obras_insert" ON obras FOR INSERT TO authenticated WITH CHECK (can_edit());
CREATE POLICY "obras_update" ON obras FOR UPDATE TO authenticated USING (can_edit());
CREATE POLICY "obras_delete" ON obras FOR DELETE TO authenticated USING (is_admin());

-- RECURSOS e GRUPOS: todos leem, editores escrevem, admin deleta
CREATE POLICY "grupos_select" ON grupos_recursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "grupos_insert" ON grupos_recursos FOR INSERT TO authenticated WITH CHECK (can_edit());
CREATE POLICY "grupos_update" ON grupos_recursos FOR UPDATE TO authenticated USING (can_edit());
CREATE POLICY "grupos_delete" ON grupos_recursos FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "recursos_select" ON recursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "recursos_insert" ON recursos FOR INSERT TO authenticated WITH CHECK (can_edit());
CREATE POLICY "recursos_update" ON recursos FOR UPDATE TO authenticated USING (can_edit());
CREATE POLICY "recursos_delete" ON recursos FOR DELETE TO authenticated USING (is_admin());

-- RDOs: todos leem, editores criam/editam os próprios
CREATE POLICY "rdos_select" ON rdos FOR SELECT TO authenticated USING (true);
CREATE POLICY "rdos_insert" ON rdos FOR INSERT TO authenticated WITH CHECK (can_edit());
CREATE POLICY "rdos_update" ON rdos FOR UPDATE TO authenticated
  USING (can_edit() AND (created_by = auth.uid() OR is_admin() OR get_user_role() = 'engenheiro'));
CREATE POLICY "rdos_delete" ON rdos FOR DELETE TO authenticated USING (is_admin());

-- Detalhes do RDO: acompanham as permissões do RDO pai
CREATE POLICY "rdo_efetivo_select" ON rdo_efetivo FOR SELECT TO authenticated USING (true);
CREATE POLICY "rdo_efetivo_insert" ON rdo_efetivo FOR INSERT TO authenticated WITH CHECK (can_edit());
CREATE POLICY "rdo_efetivo_update" ON rdo_efetivo FOR UPDATE TO authenticated USING (can_edit());
CREATE POLICY "rdo_efetivo_delete" ON rdo_efetivo FOR DELETE TO authenticated USING (can_edit());

CREATE POLICY "rdo_maquinario_select" ON rdo_maquinario FOR SELECT TO authenticated USING (true);
CREATE POLICY "rdo_maquinario_insert" ON rdo_maquinario FOR INSERT TO authenticated WITH CHECK (can_edit());
CREATE POLICY "rdo_maquinario_update" ON rdo_maquinario FOR UPDATE TO authenticated USING (can_edit());
CREATE POLICY "rdo_maquinario_delete" ON rdo_maquinario FOR DELETE TO authenticated USING (can_edit());

CREATE POLICY "rdo_servicos_select" ON rdo_servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "rdo_servicos_insert" ON rdo_servicos FOR INSERT TO authenticated WITH CHECK (can_edit());
CREATE POLICY "rdo_servicos_update" ON rdo_servicos FOR UPDATE TO authenticated USING (can_edit());
CREATE POLICY "rdo_servicos_delete" ON rdo_servicos FOR DELETE TO authenticated USING (can_edit());

CREATE POLICY "rdo_ocorrencias_select" ON rdo_ocorrencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "rdo_ocorrencias_insert" ON rdo_ocorrencias FOR INSERT TO authenticated WITH CHECK (can_edit());
CREATE POLICY "rdo_ocorrencias_update" ON rdo_ocorrencias FOR UPDATE TO authenticated USING (can_edit());
CREATE POLICY "rdo_ocorrencias_delete" ON rdo_ocorrencias FOR DELETE TO authenticated USING (can_edit());

CREATE POLICY "rdo_fotos_select" ON rdo_fotos FOR SELECT TO authenticated USING (true);
CREATE POLICY "rdo_fotos_insert" ON rdo_fotos FOR INSERT TO authenticated WITH CHECK (can_edit());
CREATE POLICY "rdo_fotos_update" ON rdo_fotos FOR UPDATE TO authenticated USING (can_edit());
CREATE POLICY "rdo_fotos_delete" ON rdo_fotos FOR DELETE TO authenticated USING (can_edit());

-- =============================================================
-- STORAGE: Execute este bloco SEPARADAMENTE após criar o bucket
-- via Dashboard > Storage > New Bucket > nome: "rdo-fotos" (público)
-- =============================================================
-- CREATE POLICY "rdo_fotos_storage_select" ON storage.objects
--   FOR SELECT USING (bucket_id = 'rdo-fotos');
--
-- CREATE POLICY "rdo_fotos_storage_insert" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'rdo-fotos' AND can_edit());
--
-- CREATE POLICY "rdo_fotos_storage_delete" ON storage.objects
--   FOR DELETE TO authenticated USING (bucket_id = 'rdo-fotos' AND can_edit());
