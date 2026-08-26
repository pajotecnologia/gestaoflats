import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Limpando dados operacionais (Contratos, Financeiro, Vistorias, Flats, Locatários, Fornecedores)...");

  // Apaga apenas dados operacionais e movimentações
  await prisma.contaPagar.deleteMany({});
  await prisma.contaReceber.deleteMany({});
  await prisma.vistoriaChecklist.deleteMany({});
  await prisma.contrato.deleteMany({});
  await prisma.modeloContrato.deleteMany({});
  await prisma.flat.deleteMany({});
  await prisma.local.deleteMany({});
  await prisma.fornecedor.deleteMany({});
  await prisma.locatario.deleteMany({});

  console.log("🔒 Preservando Empresas, Usuários e Configurações de Acesso...");

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
      },
    });
  }

  console.log("✨ Banco de dados limpo com sucesso! Apenas empresas e usuários foram mantidos.");
  console.log("🔑 Usuários ativos e com acesso mantidos no sistema:");
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
