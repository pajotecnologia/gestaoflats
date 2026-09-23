-- Fase 4 - Financeiro: pagamentos parciais, estados e auditoria
ALTER TABLE "ContaPagar" ADD COLUMN IF NOT EXISTS "valorPago" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "ContaPagar" ADD COLUMN IF NOT EXISTS "formaPagamento" TEXT;
ALTER TABLE "ContaPagar" ADD COLUMN IF NOT EXISTS "observacao" TEXT;

CREATE TABLE IF NOT EXISTS "FinanceiroEvento" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "contaReceberId" TEXT,
  "contaPagarId" TEXT,
  "valor" DOUBLE PRECISION,
  "descricao" TEXT NOT NULL,
  "dadosJson" TEXT,
  "usuarioId" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinanceiroEvento_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinanceiroEvento_empresaId_criadoEm_idx" ON "FinanceiroEvento"("empresaId","criadoEm");
CREATE INDEX IF NOT EXISTS "FinanceiroEvento_contaReceberId_idx" ON "FinanceiroEvento"("contaReceberId");
CREATE INDEX IF NOT EXISTS "FinanceiroEvento_contaPagarId_idx" ON "FinanceiroEvento"("contaPagarId");
DO $$ BEGIN ALTER TABLE "FinanceiroEvento" ADD CONSTRAINT "FinanceiroEvento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "FinanceiroEvento" ADD CONSTRAINT "FinanceiroEvento_contaReceberId_fkey" FOREIGN KEY ("contaReceberId") REFERENCES "ContaReceber"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "FinanceiroEvento" ADD CONSTRAINT "FinanceiroEvento_contaPagarId_fkey" FOREIGN KEY ("contaPagarId") REFERENCES "ContaPagar"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;