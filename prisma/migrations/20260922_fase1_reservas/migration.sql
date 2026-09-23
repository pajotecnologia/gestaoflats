-- Fase 1 e 2: Reservas, temporadas e vinculação com checklists
CREATE TABLE IF NOT EXISTS "Reserva" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "locatarioId" TEXT NOT NULL,
  "flatId" TEXT NOT NULL,
  "contratoId" TEXT,
  "codigo" TEXT NOT NULL,
  "dataEntrada" TIMESTAMP(3) NOT NULL,
  "dataSaida" TIMESTAMP(3) NOT NULL,
  "horaEntrada" TEXT,
  "horaSaida" TEXT,
  "quantidadePessoas" INTEGER NOT NULL DEFAULT 1,
  "valorDiaria" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "quantidadeDiarias" INTEGER NOT NULL DEFAULT 1,
  "desconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxas" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "caucao" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "valorRecebido" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "valorPendente" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "origem" TEXT,
  "observacao" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SOLICITADA',
  "dataCheckIn" TIMESTAMP(3),
  "dataCheckOut" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Reserva_codigo_key" ON "Reserva"("codigo");
CREATE INDEX IF NOT EXISTS "Reserva_empresaId_dataEntrada_dataSaida_idx" ON "Reserva"("empresaId", "dataEntrada", "dataSaida");
CREATE INDEX IF NOT EXISTS "Reserva_flatId_dataEntrada_dataSaida_idx" ON "Reserva"("flatId", "dataEntrada", "dataSaida");
CREATE INDEX IF NOT EXISTS "Reserva_locatarioId_idx" ON "Reserva"("locatarioId");

-- Adiciona reservaId na tabela VistoriaChecklist se ainda não existir
ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "reservaId" TEXT;
CREATE INDEX IF NOT EXISTS "VistoriaChecklist_reservaId_idx" ON "VistoriaChecklist"("reservaId");

DO $$ BEGIN
  ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_locatarioId_fkey" FOREIGN KEY ("locatarioId") REFERENCES "Locatario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "VistoriaChecklist" ADD CONSTRAINT "VistoriaChecklist_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
