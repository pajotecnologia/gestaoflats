# 🏦 Guia Completo de Integração: Banco Inter API Cobrança v3 (Boleto com Pix / Bolepix)

Este guia documenta detalhadamente como a integração com a **API Cobrança v3 do Banco Inter** foi projetada e implementada, fornecendo o passo a passo, a arquitetura técnica, os endpoints e o código modular para ser facilmente replicado em qualquer outro projeto Node.js / TypeScript / Next.js.

---

## 📌 Visão Geral da Arquitetura

```mermaid
graph TD
    A[Sistema / Aplicação] -->|1. mTLS + OAuth 2.0| B[Banco Inter Auth /oauth/v2/token]
    B -->|Token Bearer temporário| A
    A -->|2. POST /cobranca/v3/cobrancas| C[Banco Inter API Cobrança]
    C -->|codigoSolicitacao + Pix + Linha Digitável| A
    A -->|3. GET /cobranca/v3/cobrancas/id/pdf| C
    C -->|PDF Oficial do Boleto| A
    A -->|4. WhatsApp / E-mail| D[Locatário / Pagador]
    D -->|5. Pagamento via Pix ou Boleto| E[Banco Inter Liquidação]
    E -->|6. Webhook POST em tempo real| F[Endpoint /api/webhooks/banco-inter]
    F -->|7. Baixa Automática no Banco| G[Tabela ContaReceber]
    A -.->|Fallback: Sincronização Periódica| C
```

---

## 🔑 1. Obtenção de Credenciais no Internet Banking do Banco Inter

1. Acesse o **Internet Banking PJ do Banco Inter** (`https://cdpj.bancointer.com.br`) pelo computador.
2. No menu lateral, acesse **Conta Digital &gt; Integrações &gt; Nova Integração**.
3. Escolha um nome para sua aplicação (ex: `Sistema_Locacoes_GestaoFlats`).
4. Selecione obrigatoriamente a permissão: **API Cobrança (Boleto com Pix)** para *Leitura* e *Emissão/Escrita*.
5. Confirme a operação via autenticação no aplicativo do celular.
6. Baixe o arquivo `.zip` gerado. Ele contém:
   - `*.crt`: Certificado digital público.
   - `*.key`: Chave privada correspondente.
7. Copie na tela o **Client ID** e o **Client Secret**.

---

## 🛡️ 2. Autenticação OAuth 2.0 com mTLS em Node.js

O Banco Inter exige autenticação mTLS (Mutual TLS). O módulo deve carregar os arquivos `.crt` e `.key` e passá-los para um `https.Agent`.

### URLs Base do Banco Inter
- **Produção**: `https://cdpj.partners.bancointer.com.br`
- **Sandbox (Testes)**: `https://cdpj-sandbox.partners.uatinter.co`

### Criação do Agente HTTPS (mTLS)
```typescript
import https from "https";

export function createInterHttpsAgent(certCrt: string, certKey: string): https.Agent {
  return new https.Agent({
    cert: certCrt,
    key: certKey,
    rejectUnauthorized: true,
    keepAlive: true,
  });
}
```

### Obtenção do Token de Acesso (Bearer Token)
- **Endpoint**: `POST /oauth/v2/token`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body**:
  ```
  client_id=SEU_CLIENT_ID&client_secret=SEU_CLIENT_SECRET&grant_type=client_credentials&scope=boleto-cobranca.read boleto-cobranca.write
  ```

---

## 📄 3. Emissão de Boleto com Pix (Bolepix)

- **Endpoint**: `POST /cobranca/v3/cobrancas`
- **Headers**:
  - `Authorization: Bearer <ACCESS_TOKEN>`
  - `Content-Type: application/json`
  - `x-conta-corrente: <NUMERO_CONTA>` (opcional se houver mais de uma conta)

### Exemplo de Payload JSON de Emissão:
```json
{
  "seuNumero": "LOC_0012983",
  "valorNominal": 1500.00,
  "dataVencimento": "2026-09-10",
  "numDiasAgendaRecebimento": 60,
  "pagador": {
    "cpfCnpj": "12345678909",
    "tipoPessoa": "FISICA",
    "nome": "João da Silva",
    "endereco": "Rua Exemplo, 100",
    "bairro": "Centro",
    "cidade": "Recife",
    "uf": "PE",
    "cep": "50000000",
    "email": "joao@email.com",
    "telefone": "81999998888"
  },
  "mensagem": {
    "linha1": "Aluguel Ref: 2026-09",
    "linha2": "Imovel: Flat 101 - Edificio Central"
  },
  "multa": {
    "codigoMulta": "PERCENTUAL",
    "taxa": 2.0
  },
  "mora": {
    "codigoMora": "TAXAMENSAL",
    "taxa": 1.0
  }
}
```

### Retorno do Banco Inter:
```json
{
  "codigoSolicitacao": "c4b3a1a0-1234-5678-9abc-def012345678"
}
```

---

## 🔍 4. Consulta de Cobrança e Detalhes

- **Endpoint**: `GET /cobranca/v3/cobrancas/{codigoSolicitacao}`
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`

### Retorno com Pix Copia e Cola e Linha Digitável:
```json
{
  "cobranca": {
    "codigoSolicitacao": "c4b3a1a0-1234-5678-9abc-def012345678",
    "seuNumero": "LOC_0012983",
    "situacao": "EMABERTO",
    "dataVencimento": "2026-09-10",
    "valorNominal": 1500.00
  },
  "boleto": {
    "nossoNumero": "00012345678",
    "codigoBarras": "07791234567890123456789012345678901234567890",
    "linhaDigitavel": "07790.00011 23456.789012 34567.890123 4 12340000150000"
  },
  "pix": {
    "pixCopiaECola": "00020101021226870014br.gov.bcb.pix2565qrcodes-pix.bancointer.com.br/v2/cobv/..."
  }
}
```

---

## 📥 5. Download do PDF Oficial do Boleto

- **Endpoint**: `GET /cobranca/v3/cobrancas/{codigoSolicitacao}/pdf`
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Retorno**: Base64 do PDF ou arquivo binário `application/pdf`.

---

## ⚡ 6. Webhook e Conciliação Automática em Tempo Real

### Configuração do Webhook no Banco Inter
- **Endpoint**: `PUT /cobranca/v3/cobrancas/webhook`
- **Body**: `{ "webhookUrl": "https://seu-dominio.com.br/api/webhooks/banco-inter" }`

### Recepção do Disparo de Notificação (Callback)
Quando o cliente realiza o pagamento do Boleto ou via Pix, o Inter faz um `POST` no endpoint do seu sistema:
```json
[
  {
    "codigoSolicitacao": "c4b3a1a0-1234-5678-9abc-def012345678",
    "nossoNumero": "00012345678",
    "seuNumero": "LOC_0012983",
    "situacao": "RECEBIDO",
    "dataHoraSituacao": "2026-09-03T14:35:00.000Z",
    "valorTotalRecebido": 1500.00,
    "origemRecebimento": "PIX"
  }
]
```

### Processamento da Baixa no Sistema:
1. Localiza a parcela pelo `codigoSolicitacao` ou `nossoNumero`.
2. Altera `status` para `"PAGO"`.
3. Registra `valorPago`, `dataPagamento` e `formaPagamento = "BOLETO"`.
4. Responde HTTP `200 OK` ao Banco Inter.

---

## 📁 7. Estrutura de Arquivos no Projeto

```
src/
├── lib/
│   └── bancoInter.ts                 # Módulo centralizador mTLS, OAuth 2.0, Emissão, Consulta, PDF e Webhook
├── app/
│   ├── api/
│   │   ├── banco-inter/
│   │   │   ├── config/route.ts       # GET/POST credenciais e certificados
│   │   │   ├── testar/route.ts       # POST teste de conexão mTLS
│   │   │   ├── emitir/route.ts       # POST emissão do Bolepix
│   │   │   ├── consultar/route.ts    # GET consulta individual / POST sincronização em lote
│   │   │   ├── cancelar/route.ts     # POST cancelamento de cobrança
│   │   │   ├── pdf/route.ts          # GET download do PDF oficial
│   │   │   └── webhook-config/route.ts # GET/POST registro de webhook no Inter
│   │   └── webhooks/
│   │       └── banco-inter/route.ts  # POST endpoint público receptor de notificações
│   ├── parametros/
│   │   └── page.tsx                  # Aba "Banco Inter (Bolepix)" com uploads .crt/.key e testes
│   └── financeiro/
│       └── receber/
│           └── page.tsx              # Grid com emissão, cópia Pix, download PDF e sincronização
```

---

## 🛠️ 8. Como Portar para Outro Projeto

1. **Dependências**: Apenas o Node.js nativo (`https`, `querystring`, `crypto`). Nenhuma biblioteca externa pesada é necessária.
2. **Copie o arquivo `src/lib/bancoInter.ts`**: Ele é 100% autônomo e gerencia o cache de token OAuth, o agente mTLS e os endpoints da API v3.
3. **Crie as rotas de API**: Adicione as rotas em `api/banco-inter/...` e `api/webhooks/banco-inter/route.ts`.
4. **Adicione os campos no seu banco de dados (Prisma/SQL)**:
   - Na tabela de configurações: `clientId`, `clientSecret`, `certCrt`, `certKey`, `ambiente`, `ativo`, `webhookUrl`.
   - Na tabela de faturas/cobranças: `bancoInterCodigoSolicitacao`, `bancoInterLinhaDigitavel`, `bancoInterPixCopiaECola`, `bancoInterStatus`.
5. **Cadastre as credenciais e ative o Webhook**: Tudo pronto para emitir e conciliar boletos com Pix de forma 100% automatizada!

---

## 🚨 9. Resolução de Erros Comuns e Diagnóstico (Troubleshooting)

### 1. Erro mTLS `SSL routines:ssl3_read_bytes:tlsv1 alert unknown ca` (Alert 48)
- **Causa**: O certificado `.crt` e a chave privada `.key` enviados para o `https.Agent` não pertencem ao mesmo par de chaves gerado pelo Banco Inter, estão truncados, ou com inversão entre os arquivos CRT e KEY.
- **Solução Implementada**:
  - A função `normalizarCertificadoPEM` no `src/lib/bancoInter.ts` normaliza quebras de linha (`\r\n` -> `\n`) e detecta se o usuário acidentalmente inverteu os arquivos `.crt` e `.key` nos campos do formulário, auto-corrigindo os headers `-----BEGIN CERTIFICATE-----` e `-----BEGIN RSA PRIVATE KEY-----`.
  - O agente HTTPS utiliza `minVersion: 'TLSv1.2'`, `maxVersion: 'TLSv1.3'` e ciphers `DEFAULT:@SECLEVEL=1`.

### 2. Erro OAuth 2.0 / API `requested scope is not registered for this client`
- **Causa**: A aplicação foi criada no Internet Banking PJ, mas a permissão/escopo **API Cobrança (Boleto com Pix)** não foi marcada durante a criação ou edição da aplicação.
- **Solução**:
  - No Internet Banking PJ (`https://cdpj.bancointer.com.br`) > **Conta Digital > Integrações > Minhas Aplicações**.
  - Clique na aplicação e verifique se o módulo **Cobrança / Boleto com Pix** (Leitura e Escrita/Emissão) está marcado com permissão concedida.
  - Caso edite as permissões, salve e aguarde de 1 a 2 minutos para a replicação no servidor de autorização do Banco Inter.


### 3. Erro `429: Too Many Requests / Rate Limit`
- **Causa**: Disparos sucessivos em rajada ao endpoint `/oauth/v2/token` do Banco Inter.
- **Solução**:
  - O sistema armazena o token OAuth em cache de memória temporário durante seu período de validade (`expires_in - 60s`), evitando requisições repetidas a cada emissão de cobrança.

### 4. Deploy em VPS com Docker / Coolify e PostgreSQL
- O `prisma/schema.prisma` utiliza `provider = "postgresql"`.
- O `DATABASE_URL` no container aponta para a instância do PostgreSQL de produção (`169.58.246.70:5432/gestaoflats`).
- Ao atualizar a aplicação, a migration/sincronização do Prisma (`npx prisma db push`) roda automaticamente no `docker-entrypoint.sh`, mantendo a integridade de todos os dados cadastrados.

