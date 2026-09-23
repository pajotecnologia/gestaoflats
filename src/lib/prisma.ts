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

  // Em SQLite local, o esquema é gerenciado pelo prisma db push
  if (process.env.DATABASE_URL?.startsWith("file:") || process.env.DATABASE_URL?.includes(".db")) {
    return;
  }

  try {
    // 1. Campos em Empresa
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

    // 3. Colunas do Banco Inter em ConfiguracaoParametros
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfiguracaoParametros" ADD COLUMN IF NOT EXISTS "bancoInterClientId" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfiguracaoParametros" ADD COLUMN IF NOT EXISTS "bancoInterClientSecret" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfiguracaoParametros" ADD COLUMN IF NOT EXISTS "bancoInterCertCrt" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfiguracaoParametros" ADD COLUMN IF NOT EXISTS "bancoInterCertKey" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfiguracaoParametros" ADD COLUMN IF NOT EXISTS "bancoInterContaCorrente" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfiguracaoParametros" ADD COLUMN IF NOT EXISTS "bancoInterAmbiente" TEXT DEFAULT 'PRODUCAO';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfiguracaoParametros" ADD COLUMN IF NOT EXISTS "bancoInterChavePix" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfiguracaoParametros" ADD COLUMN IF NOT EXISTS "bancoInterAtivo" BOOLEAN DEFAULT FALSE;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfiguracaoParametros" ADD COLUMN IF NOT EXISTS "bancoInterWebhookUrl" TEXT;`).catch(() => {});

    // 4. Colunas do Banco Inter em ContaReceber
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterCodigoSolicitacao" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterNossoNumero" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterLinhaDigitavel" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterCodigoBarras" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterPixCopiaECola" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterPixQrCode" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterPdfUrl" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterStatus" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterDataEmissao" TIMESTAMP(3);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaReceber" ADD COLUMN IF NOT EXISTS "bancoInterMensagemErro" TEXT;`).catch(() => {});

    // 5. Colunas em VistoriaChecklist (Fase 1 e 2)
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "reservaId" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "modeloId" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "documentoHashSha256" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "otsProofBase64" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "blockchainProtocol" TEXT DEFAULT 'OpenTimestamps / Bitcoin Blockchain';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "blockchainStatus" TEXT DEFAULT 'STAMPED';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "dataHashGerado" TIMESTAMP(3);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "laudoImpressoUrl" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "assinaturaLocatarioUrl" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "dataAssinaturaLocatario" TIMESTAMP(3);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "VistoriaChecklist" ADD COLUMN IF NOT EXISTS "ipAssinaturaLocatario" TEXT;`).catch(() => {});

    // 6. Colunas em ContaPagar (Fase 4)
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaPagar" ADD COLUMN IF NOT EXISTS "valorPago" DOUBLE PRECISION DEFAULT 0;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaPagar" ADD COLUMN IF NOT EXISTS "formaPagamento" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "ContaPagar" ADD COLUMN IF NOT EXISTS "observacao" TEXT;`).catch(() => {});

    // 7. Colunas em Contrato (Fase 3)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "tipoValidade" TEXT DEFAULT 'MESES';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "validadeDias" INTEGER;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "diaVencimento" INTEGER DEFAULT 5;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "formaPagamento" TEXT DEFAULT 'PIX';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "bancoNome" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "bancoDadosConta" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "multaAtrasoPercentual" DOUBLE PRECISION DEFAULT 2.0;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "jurosAtrasoPercentual" DOUBLE PRECISION DEFAULT 1.0;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "valorCaucao" DOUBLE PRECISION DEFAULT 0.0;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "caucaoParcelas" INTEGER DEFAULT 0;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "multaRescisaoMeses" INTEGER DEFAULT 3;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "anexoChecklistEntrada" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "anexoChecklistSaida" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "fotosAnexadasUrl" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "documentoHashSha256" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "otsProofBase64" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "blockchainProtocol" TEXT DEFAULT 'OpenTimestamps / Bitcoin Blockchain';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "blockchainStatus" TEXT DEFAULT 'STAMPED';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "dataHashGerado" TIMESTAMP(3);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "tokenAssinatura" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "statusAssinatura" TEXT DEFAULT 'PENDENTE';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "assinaturaLocatarioUrl" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "dataAssinaturaLocatario" TIMESTAMP(3);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Contrato" ADD COLUMN IF NOT EXISTS "ipAssinaturaLocatario" TEXT;`).catch(() => {});

    // 8. Colunas em Flat
    await prisma.$executeRawUnsafe(`ALTER TABLE "Flat" ADD COLUMN IF NOT EXISTS "proprietarioId" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Flat" ADD COLUMN IF NOT EXISTS "taxaAdministracao" DOUBLE PRECISION DEFAULT 10.0;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Flat" ADD COLUMN IF NOT EXISTS "tipoImovel" TEXT DEFAULT 'FLAT';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Flat" ADD COLUMN IF NOT EXISTS "modalidadeLocacao" TEXT DEFAULT 'MENSAL';`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Flat" ADD COLUMN IF NOT EXISTS "valorDiaria" DOUBLE PRECISION DEFAULT 0;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Flat" ADD COLUMN IF NOT EXISTS "valorCondominio" DOUBLE PRECISION DEFAULT 0;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Flat" ADD COLUMN IF NOT EXISTS "valorIptu" DOUBLE PRECISION DEFAULT 0;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Flat" ADD COLUMN IF NOT EXISTS "fotosUrl" TEXT;`).catch(() => {});

    // 9. Colunas em Local
    await prisma.$executeRawUnsafe(`ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "cnpj" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "email" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "telefone" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "bairro" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "cidade" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "estado" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "cep" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "logomarcaUrl" TEXT;`).catch(() => {});

    // 10. Colunas em Locatario
    await prisma.$executeRawUnsafe(`ALTER TABLE "Locatario" ADD COLUMN IF NOT EXISTS "rg" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Locatario" ADD COLUMN IF NOT EXISTS "dataNascimento" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Locatario" ADD COLUMN IF NOT EXISTS "endereco" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Locatario" ADD COLUMN IF NOT EXISTS "estadoCivil" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Locatario" ADD COLUMN IF NOT EXISTS "profissao" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE "Locatario" ADD COLUMN IF NOT EXISTS "nacionalidade" TEXT DEFAULT 'Brasileiro(a)';`).catch(() => {});

    // 11. Novas Tabelas das Fases 1 a 5 (CREATE TABLE IF NOT EXISTS)
    await prisma.$executeRawUnsafe(`
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
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
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
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
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
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
        "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ClienteDocumento_pkey" PRIMARY KEY ("id")
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
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
        "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ModeloChecklist" (
        "id" TEXT NOT NULL,
        "empresaId" TEXT NOT NULL,
        "titulo" TEXT NOT NULL,
        "tipoImovel" TEXT NOT NULL DEFAULT 'FLAT',
        "descricao" TEXT,
        "topicosJson" TEXT NOT NULL,
        "padrao" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ModeloChecklist_pkey" PRIMARY KEY ("id")
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Proprietario" (
        "id" TEXT NOT NULL,
        "empresaId" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "cpfCnpj" TEXT NOT NULL,
        "rgIe" TEXT,
        "email" TEXT,
        "telefone" TEXT NOT NULL,
        "endereco" TEXT,
        "bairro" TEXT,
        "cidade" TEXT,
        "estado" TEXT,
        "cep" TEXT,
        "chavePix" TEXT,
        "tipoChavePix" TEXT DEFAULT 'CPF',
        "banco" TEXT,
        "agencia" TEXT,
        "conta" TEXT,
        "taxaAdministracaoPadrao" DOUBLE PRECISION DEFAULT 10.0,
        "observacoes" TEXT,
        "status" TEXT NOT NULL DEFAULT 'ATIVO',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Proprietario_pkey" PRIMARY KEY ("id")
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RepasseProprietario" (
        "id" TEXT NOT NULL,
        "empresaId" TEXT NOT NULL,
        "proprietarioId" TEXT NOT NULL,
        "flatId" TEXT,
        "contratoId" TEXT,
        "contaReceberId" TEXT,
        "mesReferencia" TEXT NOT NULL,
        "valorBrutoAluguel" DOUBLE PRECISION NOT NULL,
        "taxaAdminPercentual" DOUBLE PRECISION NOT NULL,
        "valorTaxaAdmin" DOUBLE PRECISION NOT NULL,
        "valorDescontos" DOUBLE PRECISION DEFAULT 0.0,
        "valorLiquidoRepasse" DOUBLE PRECISION NOT NULL,
        "dataVencimento" TIMESTAMP(3) NOT NULL,
        "dataPagamento" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'PENDENTE',
        "formaPagamento" TEXT DEFAULT 'PIX',
        "comprovanteUrl" TEXT,
        "observacoes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RepasseProprietario_pkey" PRIMARY KEY ("id")
      );
    `).catch(() => {});
  } catch (err) {
    // Silencia erros se já existirem ou se for outro dialeto
  }
}

// Dispara a verificação em background na inicialização
ensureDatabaseSchema().catch(() => {});


