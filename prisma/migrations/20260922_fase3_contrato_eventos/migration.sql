-- Fase 3 - Histórico e auditoria de contratos
CREATE TABLE IF NOT EXISTS "ContratoEvento" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "contratoId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "dadosJson" TEXT,
  "usuarioId" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContratoEvento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContratoEvento_empresaId_contratoId_criadoEm_idx"
  ON "ContratoEvento"("empresaId","contratoId","criadoEm");

DO $$ BEGIN
  ALTER TABLE "ContratoEvento"
    ADD CONSTRAINT "ContratoEvento_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ContratoEvento"
    ADD CONSTRAINT "ContratoEvento_contratoId_fkey"
    FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
