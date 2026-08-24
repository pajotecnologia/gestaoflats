const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const empresa = await prisma.empresa.findFirst();
  console.log("Empresa data:", empresa);
  const vistorias = await prisma.vistoriaChecklist.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: { empresa: true, locatario: true, flat: true }
  });
  console.log("Vistorias count:", vistorias.length);
  vistorias.forEach(v => {
    console.log("Vistoria ID:", v.id, "Tipo:", v.tipoVistoria, "Status:", v.statusAssinatura, "AssinaturaLocatario:", Boolean(v.assinaturaLocatarioUrl), "EmpresaAssinatura:", v.empresa?.assinaturaUrl);
  });
  await prisma.$disconnect();
}

check();
