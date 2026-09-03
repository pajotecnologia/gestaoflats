import { execSSH } from "./ssh-client";

async function run() {
  const containerName = "0zjvjpka0chlxt6vtggshz9k-170505355325";
  
  // Script a ser executado dentro do container
  const nodeCode = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO DADOS NO POSTGRESQL ===');
  const configs = await prisma.configuracaoParametros.findMany();
  console.log('Configs encontradas:', configs.length);
  for (const c of configs) {
    console.log({
      id: c.id,
      empresaId: c.empresaId,
      clientId: c.bancoInterClientId,
      clientSecretLen: c.bancoInterClientSecret ? c.bancoInterClientSecret.length : 0,
      clientSecretStart: c.bancoInterClientSecret ? c.bancoInterClientSecret.substring(0, 5) : null,
      certCrtLen: c.bancoInterCertCrt ? c.bancoInterCertCrt.length : 0,
      certCrtHeader: c.bancoInterCertCrt ? c.bancoInterCertCrt.substring(0, 30) : null,
      certKeyLen: c.bancoInterCertKey ? c.bancoInterCertKey.length : 0,
      certKeyHeader: c.bancoInterCertKey ? c.bancoInterCertKey.substring(0, 30) : null,
      ambiente: c.bancoInterAmbiente,
      ativo: c.bancoInterAtivo,
      webhookUrl: c.bancoInterWebhookUrl
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

  const b64 = Buffer.from(nodeCode, "utf-8").toString("base64");
  const cmd = `echo "${b64}" | base64 -d | docker exec -i ${containerName} node -`;
  const res = await execSSH(cmd);
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);
}

run();
