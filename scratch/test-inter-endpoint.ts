import https from "https";

async function testEndpoint() {
  console.log("Testando resolução DNS e conectividade com Banco Inter...");
  const hosts = [
    "cdpj.partners.bancointer.com.br",
    "cdpj-sandbox.partners.uatinter.co",
  ];

  for (const host of hosts) {
    console.log(`\n--- Testando ${host} ---`);
    try {
      await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: host,
          port: 443,
          path: "/oauth/v2/token",
          method: "GET",
          timeout: 10000,
        }, (res) => {
          console.log(`✅ ${host} respondeu HTTP ${res.statusCode} (Status Message: ${res.statusMessage})`);
          resolve(true);
        });

        req.on("error", (err) => {
          console.log(`⚠️ ${host} erro de handshake (esperado se não houver mTLS client cert): ${err.message}`);
          resolve(true);
        });

        req.on("timeout", () => {
          req.destroy();
          console.log(`❌ ${host} timeout`);
          resolve(true);
        });

        req.end();
      });
    } catch (e: any) {
      console.error(`Erro ao testar ${host}:`, e.message);
    }
  }
}

testEndpoint();
