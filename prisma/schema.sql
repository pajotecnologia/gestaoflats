-- Estrutura do Banco de Dados SQLite (Sistema de Gestão de Locações e Flats)
-- Gerado via Prisma ORM

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeFantasia" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "logomarcaUrl" TEXT,
    "assinaturaUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConfiguracaoParametros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "evolutionApiUrl" TEXT,
    "evolutionApiKey" TEXT,
    "evolutionInstance" TEXT,
    "statusConexao" TEXT NOT NULL DEFAULT 'DESCONECTADO',
    "smtpHost" TEXT DEFAULT 'smtp.gmail.com',
    "smtpPort" INTEGER DEFAULT 465,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "smtpFromEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConfiguracaoParametros_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'ADMIN',
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "tokenRecuperacaoSenha" TEXT,
    "validadeTokenRecuperacao" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Locatario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "dataNascimento" TEXT,
    "email" TEXT,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Locatario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "endereco" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fornecedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Local" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Local_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Flat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "descricao" TEXT,
    "valorPadrao" REAL NOT NULL DEFAULT 0,
    "fotosUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Flat_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Flat_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModeloContrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudoHtml" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModeloContrato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "locatarioId" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "modeloContratoId" TEXT,
    "dataEmissao" DATETIME NOT NULL,
    "tipoValidade" TEXT NOT NULL DEFAULT 'MESES',
    "validadeMeses" INTEGER NOT NULL,
    "validadeDias" INTEGER,
    "dataFinal" DATETIME NOT NULL,
    "valorMensal" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "fotosAnexadasUrl" TEXT,
    "anexoChecklistEntrada" TEXT,
    "anexoChecklistSaida" TEXT,
    "tokenAssinatura" TEXT,
    "statusAssinatura" TEXT NOT NULL DEFAULT 'PENDENTE',
    "assinaturaLocatarioUrl" TEXT,
    "dataAssinaturaLocatario" DATETIME,
    "ipAssinaturaLocatario" TEXT,
    "documentoHashSha256" TEXT,
    "otsProofBase64" TEXT,
    "blockchainProtocol" TEXT DEFAULT 'OpenTimestamps / Bitcoin Blockchain',
    "blockchainStatus" TEXT DEFAULT 'STAMPED',
    "dataHashGerado" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contrato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contrato_locatarioId_fkey" FOREIGN KEY ("locatarioId") REFERENCES "Locatario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contrato_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contrato_modeloContratoId_fkey" FOREIGN KEY ("modeloContratoId") REFERENCES "ModeloContrato" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VistoriaChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "contratoId" TEXT,
    "flatId" TEXT NOT NULL,
    "locatarioId" TEXT,
    "tipoVistoria" TEXT NOT NULL DEFAULT 'ENTRADA',
    "responsavelVistoria" TEXT NOT NULL,
    "dataVistoria" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itensJson" TEXT NOT NULL,
    "tokenAssinatura" TEXT NOT NULL,
    "statusAssinatura" TEXT NOT NULL DEFAULT 'PENDENTE',
    "laudoImpressoUrl" TEXT,
    "assinaturaLocatarioUrl" TEXT,
    "dataAssinaturaLocatario" DATETIME,
    "ipAssinaturaLocatario" TEXT,
    "documentoHashSha256" TEXT,
    "otsProofBase64" TEXT,
    "blockchainProtocol" TEXT DEFAULT 'OpenTimestamps / Bitcoin Blockchain',
    "blockchainStatus" TEXT DEFAULT 'STAMPED',
    "dataHashGerado" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VistoriaChecklist_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VistoriaChecklist_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VistoriaChecklist_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VistoriaChecklist_locatarioId_fkey" FOREIGN KEY ("locatarioId") REFERENCES "Locatario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContaReceber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "contratoId" TEXT,
    "locatarioId" TEXT NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "numeroParcela" INTEGER NOT NULL DEFAULT 1,
    "valor" REAL NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "dataPagamento" DATETIME,
    "formaPagamento" TEXT,
    "valorPago" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContaReceber_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContaReceber_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContaReceber_locatarioId_fkey" FOREIGN KEY ("locatarioId") REFERENCES "Locatario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContaPagar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "fornecedorId" TEXT,
    "localId" TEXT,
    "flatId" TEXT,
    "dataCompra" DATETIME NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "dataPagamento" DATETIME,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContaPagar_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContaPagar_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContaPagar_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContaPagar_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormaPagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormaPagamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoParametros_empresaId_key" ON "ConfiguracaoParametros"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_tokenAssinatura_key" ON "Contrato"("tokenAssinatura");

-- CreateIndex
CREATE UNIQUE INDEX "VistoriaChecklist_tokenAssinatura_key" ON "VistoriaChecklist"("tokenAssinatura");
