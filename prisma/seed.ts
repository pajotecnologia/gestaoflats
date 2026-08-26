import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingCount = await prisma.empresa.count();
  if (existingCount > 0) {
    console.log("ℹ️ O banco de dados já possui dados cadastrados. O seed foi ignorado para preservar 100% dos seus registros.");
    return;
  }

  console.log("🌱 Populando banco de dados com dados demonstrativos iniciais...");

  // 1. Criar Empresa Padrão (Tenant)
  const empresa = await prisma.empresa.upsert({
    where: { id: "empresa-demo-001" },
    update: {},
    create: {
      id: "empresa-demo-001",
      nomeFantasia: "Residencial & Flats Prime",
      razaoSocial: "Prime Gestão Imobiliária LTDA",
      cnpj: "12.345.678/0001-90",
      email: "contato@primeflats.com.br",
      telefone: "(81) 99988-7766",
      endereco: "Av. Boa Viagem, 1500, Recife - PE",
    },
  });

  // 2. Criar Configuração de Parâmetros (Evolution API)
  await prisma.configuracaoParametros.upsert({
    where: { empresaId: empresa.id },
    update: {},
    create: {
      empresaId: empresa.id,
      evolutionApiUrl: "https://api.evolution.exemplo.com",
      evolutionApiKey: "427329482938492839482394",
      evolutionInstance: "instancia_recife",
      statusConexao: "DESCONECTADO",
    },
  });

  // 3. Criar Usuário Admin (senha: admin123)
  const salt = await bcrypt.genSalt(12);
  const senhaHash = await bcrypt.hash("admin123", salt);

  const usuario = await prisma.usuario.upsert({
    where: { email: "admin@primeflats.com.br" },
    update: {},
    create: {
      id: "user-admin-001",
      empresaId: empresa.id,
      nome: "Carlos Eduardo Architect",
      email: "admin@primeflats.com.br",
      senhaHash,
      cargo: "ADMIN",
    },
  });

  // 4. Criar Locais (Condomínios/Edifícios)
  const local1 = await prisma.local.create({
    data: {
      empresaId: empresa.id,
      nome: "Condomínio Edifício Mar Azul",
      endereco: "Av. Boa Viagem, 1200, Recife - PE",
    },
  });

  const local2 = await prisma.local.create({
    data: {
      empresaId: empresa.id,
      nome: "Flat Residence Garibaldi",
      endereco: "Rua do Sol, 450, Olinda - PE",
    },
  });

  // 5. Criar Flats
  const flat101 = await prisma.flat.create({
    data: {
      empresaId: empresa.id,
      localId: local1.id,
      numero: "101 - Beira Mar",
      status: "OCUPADO",
      descricao: "Flat Studio completo com ar condicionado, TV 50', cama king e vista mar.",
      valorPadrao: 2500.0,
    },
  });

  const flat102 = await prisma.flat.create({
    data: {
      empresaId: empresa.id,
      localId: local1.id,
      numero: "102 - Vista Cidade",
      status: "DISPONIVEL",
      descricao: "Flat 1 quarto totalmente mobiliado e decorado.",
      valorPadrao: 2200.0,
    },
  });

  const flat201 = await prisma.flat.create({
    data: {
      empresaId: empresa.id,
      localId: local2.id,
      numero: "201 - Executive Suite",
      status: "MANUTENCAO",
      descricao: "Em reforma de pintura e troca do ar condicionado.",
      valorPadrao: 2800.0,
    },
  });

  // 6. Criar Locatários
  const locatario1 = await prisma.locatario.create({
    data: {
      empresaId: empresa.id,
      nome: "Dra. Mariana Silva Ribeiro",
      cpf: "123.456.789-00",
      rg: "9.876.543 SDS/PE",
      dataNascimento: "1990-05-14",
      email: "mariana.ribeiro@email.com",
      telefone: "(81) 98765-4321",
      endereco: "Av. Conselheiro Aguiar, 800 - Recife - PE",
    },
  });

  const locatario2 = await prisma.locatario.create({
    data: {
      empresaId: empresa.id,
      nome: "Eng. Roberto Albuquerque",
      cpf: "987.654.321-11",
      rg: "8.123.456 SSP/PE",
      dataNascimento: "1985-11-22",
      email: "roberto.eng@email.com",
      telefone: "(81) 99123-8877",
      endereco: "Rua do Espinheiro, 120 - Recife - PE",
    },
  });

  // 7. Criar Fornecedor
  const fornecedor = await prisma.fornecedor.create({
    data: {
      empresaId: empresa.id,
      razaoSocial: "Manutenção & Climatização Silva LTDA",
      cnpj: "98.765.432/0001-10",
      endereco: "Rua Imperial, 300 - Recife - PE",
      cep: "50000-000",
      telefone: "(81) 3422-1010",
      email: "contato@silvaclimatizacao.com.br",
    },
  });

  // 8. Criar Modelo de Contrato Padrão
  const modeloContrato = await prisma.modeloContrato.create({
    data: {
      empresaId: empresa.id,
      titulo: "Contrato de Locação Residencial de Flat de Temporada / Anual",
      conteudoHtml: `<h2 style="text-align: center; color: #1e3a8a;">CONTRATO DE LOCAÇÃO DE FLAT RESIDENCIAL</h2>
<p>Pelo presente instrumento particular, de um lado <strong>{{empresa_nome}}</strong>, e de outro lado o(a) LOCATÁRIO(A) <strong>{{locatario_nome}}</strong>, inscrito(a) no CPF sob o nº <strong>{{cpf}}</strong>.</p>
<p><strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O objeto do presente contrato é a locação do <strong>Flat nº {{flat_numero}}</strong>, totalmente mobiliado e equipado.</p>
<p><strong>CLÁUSULA SEGUNDA - DO VALOR E PAGAMENTO:</strong> O valor mensal do aluguel ajustado é de <strong>{{valor_mensal}}</strong>, com vencimento todo dia 10 de cada mês.</p>
<p><strong>CLÁUSULA TERCEIRA - DA VIGÊNCIA:</strong> O presente contrato tem vigência com término previsto para <strong>{{data_fim}}</strong>.</p>
<p style="margin-top: 30px;">Recife, {{data_emissao}}.</p>`,
    },
  });

  // 9. Criar Contrato e Parcelas para o Flat 101
  const dataHoje = new Date();
  const dataEmissao = new Date(dataHoje.getFullYear(), dataHoje.getMonth() - 2, 10);
  const dataFinal = new Date(dataEmissao.getFullYear(), dataEmissao.getMonth() + 12, 10);

  const contrato = await prisma.contrato.create({
    data: {
      empresaId: empresa.id,
      locatarioId: locatario1.id,
      flatId: flat101.id,
      modeloContratoId: modeloContrato.id,
      dataEmissao,
      validadeMeses: 12,
      dataFinal,
      valorMensal: 2500.0,
      status: "ATIVO",
    },
  });

  // Gerar N Parcelas (12 meses)
  for (let i = 0; i < 12; i++) {
    const vencimento = new Date(dataEmissao.getFullYear(), dataEmissao.getMonth() + i, 10);
    const mesRef = `${vencimento.getFullYear()}-${String(vencimento.getMonth() + 1).padStart(2, "0")}`;

    let status = "PENDENTE";
    let dataPagamento: Date | null = null;
    let formaPagamento: string | null = null;
    let valorPago: number | null = null;

    if (i < 2) {
      // Duas primeiras parcelas pagas
      status = "PAGO";
      dataPagamento = new Date(vencimento.getTime() - 2 * 86400000);
      formaPagamento = "PIX";
      valorPago = 2500.0;
    } else if (i === 2 && vencimento < new Date()) {
      status = "ATRASADO";
    }

    await prisma.contaReceber.create({
      data: {
        empresaId: empresa.id,
        contratoId: contrato.id,
        locatarioId: locatario1.id,
        mesReferencia: mesRef,
        numeroParcela: i + 1,
        valor: 2500.0,
        dataVencimento: vencimento,
        dataPagamento,
        formaPagamento,
        valorPago,
        status,
        observacao: `Parcela ${i + 1}/12 do contrato de aluguel`,
      },
    });
  }

  // 10. Criar Contas a Pagar de Teste
  await prisma.contaPagar.create({
    data: {
      empresaId: empresa.id,
      fornecedorId: fornecedor.id,
      flatId: flat201.id,
      dataCompra: new Date(),
      dataVencimento: new Date(Date.now() + 5 * 86400000),
      descricao: "Manutenção do Ar Condicionado Split do Flat 201",
      valor: 450.0,
      status: "PENDENTE",
    },
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log("🔑 Credenciais de acesso de teste:");
  console.log("   E-mail: admin@primeflats.com.br");
  console.log("   Senha:  admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
