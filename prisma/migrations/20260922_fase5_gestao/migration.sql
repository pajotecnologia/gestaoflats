-- Fase 5: dossiê do cliente, documentos e ordens de serviço
CREATE TABLE IF NOT EXISTS "ClienteDocumento" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "locatarioId" TEXT NOT NULL,
  "contratoId" TEXT,
  "tipo" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "arquivoUrl" TEXT,
  "mimeType" TEXT,
  "tamanhoBytes" INTEGER,
  "dataDocumento" TIMESTAMP(3),
  "validade" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ATIVO',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClienteDocumento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrdemServico" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "locatarioId" TEXT,
  "flatId" TEXT,
  "codigo" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "categoria" TEXT NOT NULL DEFAULT 'MANUTENCAO',
  "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
  "status" TEXT NOT NULL DEFAULT 'ABERTA',
  "responsavel" TEXT,
  "fornecedorNome" TEXT,
  "valorEstimado" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "valorReal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "prazo" TIMESTAMP(3),
  "dataConclusao" TIMESTAMP(3),
  "observacao" TEXT,
  "fotosJson" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrdemServico_codigo_key" ON "OrdemServico"("codigo");
CREATE INDEX IF NOT EXISTS "ClienteDocumento_empresaId_locatarioId_idx" ON "ClienteDocumento"("empresaId","locatarioId");
CREATE INDEX IF NOT EXISTS "ClienteDocumento_contratoId_idx" ON "ClienteDocumento"("contratoId");
CREATE INDEX IF NOT EXISTS "ClienteDocumento_validade_idx" ON "ClienteDocumento"("validade");
CREATE INDEX IF NOT EXISTS "OrdemServico_empresaId_status_idx" ON "OrdemServico"("empresaId","status");
CREATE INDEX IF NOT EXISTS "OrdemServico_empresaId_flatId_idx" ON "OrdemServico"("empresaId","flatId");
CREATE INDEX IF NOT EXISTS "OrdemServico_locatarioId_idx" ON "OrdemServico"("locatarioId");
CREATE INDEX IF NOT EXISTS "OrdemServico_prazo_idx" ON "OrdemServico"("prazo");

DO $$ BEGIN
  ALTER TABLE "ClienteDocumento" ADD CONSTRAINT "ClienteDocumento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ClienteDocumento" ADD CONSTRAINT "ClienteDocumento_locatarioId_fkey" FOREIGN KEY ("locatarioId") REFERENCES "Locatario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ClienteDocumento" ADD CONSTRAINT "ClienteDocumento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_locatarioId_fkey" FOREIGN KEY ("locatarioId") REFERENCES "Locatario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
