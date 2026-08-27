-- ============================================================================
-- DNYL / GESTÃO DE FLATS SaaS — SCRIPT COMPLETO POSTGRESQL (pgAdmin)
-- Banco de Dados: gestaoflats
-- ============================================================================

-- 1. Tabela: Empresa
CREATE TABLE IF NOT EXISTS "Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeFantasia" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "logomarcaUrl" TEXT,
    "assinaturaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela: ConfiguracaoParametros
CREATE TABLE IF NOT EXISTS "ConfiguracaoParametros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL UNIQUE,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_config_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Tabela: Usuario
CREATE TABLE IF NOT EXISTS "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "senhaHash" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'ADMIN',
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "tokenRecuperacaoSenha" TEXT,
    "validadeTokenRecuperacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_usuario_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Tabela: Locatario
CREATE TABLE IF NOT EXISTS "Locatario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "dataNascimento" TEXT,
    "email" TEXT,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT,
    "estadoCivil" TEXT,
    "profissao" TEXT,
    "nacionalidade" TEXT DEFAULT 'Brasileiro(a)',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_locatario_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Tabela: Fornecedor
CREATE TABLE IF NOT EXISTS "Fornecedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "endereco" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_fornecedor_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Tabela: Local
CREATE TABLE IF NOT EXISTS "Local" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_local_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. Tabela: Flat
CREATE TABLE IF NOT EXISTS "Flat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "descricao" TEXT,
    "valorPadrao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fotosUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_flat_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_flat_local" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 8. Tabela: ModeloContrato
CREATE TABLE IF NOT EXISTS "ModeloContrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudoHtml" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_modelocontrato_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 9. Tabela: Contrato
CREATE TABLE IF NOT EXISTS "Contrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "locatarioId" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "modeloContratoId" TEXT,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "tipoValidade" TEXT NOT NULL DEFAULT 'MESES',
    "validadeMeses" INTEGER NOT NULL,
    "validadeDias" INTEGER,
    "dataFinal" TIMESTAMP(3) NOT NULL,
    "valorMensal" DOUBLE PRECISION NOT NULL,
    "diaVencimento" INTEGER DEFAULT 5,
    "formaPagamento" TEXT DEFAULT 'PIX',
    "bancoNome" TEXT,
    "bancoDadosConta" TEXT,
    "multaAtrasoPercentual" DOUBLE PRECISION DEFAULT 2.0,
    "jurosAtrasoPercentual" DOUBLE PRECISION DEFAULT 1.0,
    "valorCaucao" DOUBLE PRECISION DEFAULT 0.0,
    "caucaoParcelas" INTEGER DEFAULT 0,
    "multaRescisaoMeses" INTEGER DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "fotosAnexadasUrl" TEXT,
    "anexoChecklistEntrada" TEXT,
    "anexoChecklistSaida" TEXT,
    "tokenAssinatura" TEXT UNIQUE,
    "statusAssinatura" TEXT NOT NULL DEFAULT 'PENDENTE',
    "assinaturaLocatarioUrl" TEXT,
    "dataAssinaturaLocatario" TIMESTAMP(3),
    "ipAssinaturaLocatario" TEXT,
    "documentoHashSha256" TEXT,
    "otsProofBase64" TEXT,
    "blockchainProtocol" TEXT DEFAULT 'OpenTimestamps / Bitcoin Blockchain',
    "blockchainStatus" TEXT DEFAULT 'STAMPED',
    "dataHashGerado" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_contrato_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_contrato_locatario" FOREIGN KEY ("locatarioId") REFERENCES "Locatario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_contrato_flat" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_contrato_modelo" FOREIGN KEY ("modeloContratoId") REFERENCES "ModeloContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 10. Tabela: VistoriaChecklist
CREATE TABLE IF NOT EXISTS "VistoriaChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "contratoId" TEXT,
    "flatId" TEXT NOT NULL,
    "locatarioId" TEXT,
    "tipoVistoria" TEXT NOT NULL DEFAULT 'ENTRADA',
    "responsavelVistoria" TEXT NOT NULL,
    "dataVistoria" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itensJson" TEXT NOT NULL,
    "tokenAssinatura" TEXT UNIQUE,
    "statusAssinatura" TEXT NOT NULL DEFAULT 'PENDENTE',
    "laudoImpressoUrl" TEXT,
    "assinaturaLocatarioUrl" TEXT,
    "dataAssinaturaLocatario" TIMESTAMP(3),
    "ipAssinaturaLocatario" TEXT,
    "documentoHashSha256" TEXT,
    "otsProofBase64" TEXT,
    "blockchainProtocol" TEXT DEFAULT 'OpenTimestamps / Bitcoin Blockchain',
    "blockchainStatus" TEXT DEFAULT 'STAMPED',
    "dataHashGerado" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_vistoria_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_vistoria_contrato" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_vistoria_flat" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_vistoria_locatario" FOREIGN KEY ("locatarioId") REFERENCES "Locatario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 11. Tabela: ContaReceber
CREATE TABLE IF NOT EXISTS "ContaReceber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "contratoId" TEXT,
    "locatarioId" TEXT NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "numeroParcela" INTEGER NOT NULL DEFAULT 1,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "formaPagamento" TEXT,
    "valorPago" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_contareceber_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_contareceber_contrato" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_contareceber_locatario" FOREIGN KEY ("locatarioId") REFERENCES "Locatario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 12. Tabela: ContaPagar
CREATE TABLE IF NOT EXISTS "ContaPagar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "fornecedorId" TEXT,
    "localId" TEXT,
    "flatId" TEXT,
    "dataCompra" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_contapagar_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_contapagar_fornecedor" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_contapagar_local" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fk_contapagar_flat" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 13. Tabela: FormaPagamento
CREATE TABLE IF NOT EXISTS "FormaPagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_formapagamento_empresa" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================================
-- DADOS INICIAIS (EMPRESA PADRÃO + USUÁRIO ADMIN: admin@primeflats.com.br / admin123)
-- ============================================================================

INSERT INTO "Empresa" ("id", "nomeFantasia", "razaoSocial", "cnpj", "email", "telefone", "endereco", "bairro", "cidade", "estado", "cep", "createdAt", "updatedAt")
VALUES (
    'empresa-demo-001',
    'Residencial & Flats Prime',
    'Prime Gestão Imobiliária LTDA',
    '12.345.678/0001-90',
    'contato@primeflats.com.br',
    '(81) 99988-7766',
    'Av. Boa Viagem, 1500, Recife - PE',
    'Boa Viagem',
    'Recife',
    'PE',
    '51011-000',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Usuário Administrador (Senha: admin123)
INSERT INTO "Usuario" ("id", "empresaId", "nome", "email", "senhaHash", "cargo", "status", "createdAt", "updatedAt")
VALUES (
    'user-admin-001',
    'empresa-demo-001',
    'Administrador Geral',
    'admin@primeflats.com.br',
    '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    'ATIVO',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

COMMIT;
