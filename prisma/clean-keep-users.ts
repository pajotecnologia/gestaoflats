import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Limpando todos os dados operacionais do sistema...");
  console.log("📌 Preservando estritamente: Logins de acesso (Usuários), Empresas e Modelos de Contrato.");

  // Apaga dados operacionais na ordem correta de dependência de chaves estrangeiras
  console.log("1. Limpando eventos e auditorias operacionais...");
  await prisma.financeiroEvento.deleteMany({});
  await prisma.contratoEvento.deleteMany({});
  await prisma.clienteDocumento.deleteMany({});
  await prisma.ordemServico.deleteMany({});

  console.log("2. Limpando financeiro, repasses e cobranças...");
  await prisma.repasseProprietario.deleteMany({});
  await prisma.contaReceber.deleteMany({});
  await prisma.contaPagar.deleteMany({});
  await prisma.cobrancaAssinaturaSaaS.deleteMany({});

  console.log("3. Limpando vistorias, checklists e reservas...");
  await prisma.vistoriaChecklist.deleteMany({});
  await prisma.reserva.deleteMany({});

  console.log("4. Limpando contratos de locação...");
  await prisma.contrato.deleteMany({});

  console.log("5. Limpando imóveis (flats), condomínios (locais), locatários, proprietários e fornecedores...");
  await prisma.flat.deleteMany({});
  await prisma.local.deleteMany({});
  await prisma.locatario.deleteMany({});
  await prisma.proprietario.deleteMany({});
  await prisma.fornecedor.deleteMany({});

  console.log("🔒 Preservando Empresas, Usuários, Configurações e Modelos de Contratos...");

  // Verifica se existe ao menos 1 Empresa cadastrada
  let empresa = await prisma.empresa.findFirst();
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        id: "empresa-demo-001",
        nomeFantasia: "Prime Gestão Imobiliária",
        razaoSocial: "Prime Gestão e Empreendimentos LTDA",
        cnpj: "12.345.678/0001-90",
        email: "contato@primegestao.com.br",
        telefone: "(81) 99988-7766",
        endereco: "Av. Boa Viagem, 1500",
        statusAssinatura: "ATIVO",
        planoAtual: "EMPRESARIAL",
        isMestre: true,
      },
    });
  }

  // Verifica se existe ao menos 1 Usuário Admin cadastrado
  const countUsuarios = await prisma.usuario.count();
  if (countUsuarios === 0) {
    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash("admin123", salt);
    await prisma.usuario.create({
      data: {
        id: "user-admin-001",
        empresaId: empresa.id,
        nome: "Administrador Sistema",
        email: "admin@primeflats.com.br",
        senhaHash,
        cargo: "ADMIN",
        status: "ATIVO",
      },
    });
  }

  const countModelos = await prisma.modeloContrato.count();
  console.log(`📄 Modelos de Contrato mantidos no sistema: ${countModelos}`);

  console.log("✨ Sistema limpo com 100% de sucesso para início dos novos testes do zero!");
  console.log("🔑 Logins ativos mantidos no sistema:");
  const usuarios = await prisma.usuario.findMany({ select: { email: true, nome: true, cargo: true } });
  usuarios.forEach((u) => console.log(`   - ${u.nome} (${u.email}) [${u.cargo}]`));
}

main()
  .catch((e) => {
    console.error("❌ Erro ao limpar o banco de dados:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
