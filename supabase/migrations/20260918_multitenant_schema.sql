-- ==============================================================================
-- SISTEMA DE AUTENTICAÇÃO MULTITENANT & PRIMEIRO USUÁRIO ADMIN COM SUPABASE RLS
-- ==============================================================================

-- 1. Tabela de Organizações / Empresas (Tenants)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Membros da Organização (Tenant Members)
-- Roles aceitas: 'admin', 'member'
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Índices de alta performance para consultas e RLS
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- REGRAS DE RLS (ROW LEVEL SECURITY)
-- ==============================================================================

-- Regra 1: Usuário só visualiza e altera organizações às quais pertence
DROP POLICY IF EXISTS "Acesso por tenant_members" ON public.tenants;
CREATE POLICY "Acesso por tenant_members" ON public.tenants
  FOR ALL USING (
    id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  );

-- Regra 2: Usuários autenticados podem criar novas organizações
DROP POLICY IF EXISTS "Criar nova organizacao" ON public.tenants;
CREATE POLICY "Criar nova organizacao" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Regra 3: Membros só visualizam os registros de membros dos seus próprios tenants
DROP POLICY IF EXISTS "Membros visualizam membros do mesmo tenant" ON public.tenant_members;
CREATE POLICY "Membros visualizam membros do mesmo tenant" ON public.tenant_members
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())
  );

-- Regra 4: Apenas Admins do tenant podem adicionar, atualizar ou remover membros
DROP POLICY IF EXISTS "Admins gerenciam membros" ON public.tenant_members;
CREATE POLICY "Admins gerenciam membros" ON public.tenant_members
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- TRIGGER: PRIMEIRO MEMBRO CADASTRADO NO TENANT RECEBE ROLE 'ADMIN'
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_first_member_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for o primeiro membro inserido para a organização, força o role como 'admin'
  IF (SELECT count(*) FROM public.tenant_members WHERE tenant_id = NEW.tenant_id) = 0 THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_first_member_admin ON public.tenant_members;
CREATE TRIGGER tr_first_member_admin
  BEFORE INSERT ON public.tenant_members
  FOR EACH ROW EXECUTE FUNCTION public.set_first_member_as_admin();
