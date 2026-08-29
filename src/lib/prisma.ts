import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  dbSchemaEnsured?: boolean;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Auto-recuperação (Self-Healing) do banco de dados PostgreSQL
 * Garante que tabelas e colunas novas existam mesmo antes de rodar o prisma db push
 */
export async function ensureDatabaseSchema() {
  if (globalForPrisma.dbSchemaEnsured) return;
  globalForPrisma.dbSchemaEnsured = true;

  try {
    // 1. Colunas da Empresa
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "statusAssinatura" TEXT DEFAULT 'TRIAL';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "dataInicioTrial" TIMESTAMP(3);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "dataFimTrial" TIMESTAMP(3);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "dataFimAcesso" TIMESTAMP(3);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "planoAtual" TEXT DEFAULT 'MENSAL';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "ultimoAvisoWhatsAppEm" TIMESTAMP(3);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "chavePix" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "tipoChavePix" TEXT DEFAULT 'CNPJ';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "nomeBeneficiarioPix" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "cidadePix" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "isMestre" BOOLEAN DEFAULT FALSE;`).catch(() => {});

    // 1.1 Preenche registros existentes que estejam com dataInicioTrial ou statusAssinatura nulos
    await prisma.$executeRawUnsafe(`UPDATE "Empresa" SET "dataInicioTrial" = COALESCE("createdAt", NOW()) WHERE "dataInicioTrial" IS NULL;`).catch(() => {});
    await prisma.$executeRawUnsafe(`UPDATE "Empresa" SET "statusAssinatura" = 'TRIAL' WHERE "statusAssinatura" IS NULL;`).catch(() => {});

    // 1.2 Identifica e consagra a Empresa Mestre com Acesso Vitalício
    await prisma.$executeRawUnsafe(`
      UPDATE "Empresa" 
      SET "isMestre" = TRUE, "statusAssinatura" = 'ATIVO', "planoAtual" = 'VITALICIO', "dataFimAcesso" = NULL 
      WHERE "id" IN (SELECT "empresaId" FROM "Usuario" WHERE LOWER("email") IN ('pajotecnologia@gmail.com', 'admin@primeflats.com.br', 'contato@pajotech.com.br'))
         OR "id" = (SELECT "id" FROM "Empresa" ORDER BY "createdAt" ASC LIMIT 1);
    `).catch(() => {});

    // 2. Tabela ConfiguracaoSaaS
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ConfiguracaoSaaS" (
        "id" TEXT NOT NULL,
        "diasTrialPadrao" INTEGER NOT NULL DEFAULT 7,
        "chavePix" TEXT,
        "tipoChavePix" TEXT DEFAULT 'CHAVE_ALEATORIA',
        "nomeBeneficiarioPix" TEXT,
        "cidadePix" TEXT,
        "valorMensal" DOUBLE PRECISION NOT NULL DEFAULT 97,
        "valorTrimestral" DOUBLE PRECISION NOT NULL DEFAULT 260,
        "valorSemestral" DOUBLE PRECISION NOT NULL DEFAULT 490,
        "valorAnual" DOUBLE PRECISION NOT NULL DEFAULT 890,
        "diasAvisoAntesExpirar" INTEGER NOT NULL DEFAULT 3,
        "telefoneSuporteWhatsApp" TEXT,
        "mensagemAvisoWhatsApp" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ConfiguracaoSaaS_pkey" PRIMARY KEY ("id")
      );
    `).catch(() => {});
  } catch (err) {
    // Silencia erros se já existirem ou se for outro dialeto
  }
}

// Dispara a verificação em background na inicialização
ensureDatabaseSchema().catch(() => {});


