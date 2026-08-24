# Diretrizes e Instruções do Sistema de Locações

Este arquivo reúne todas as regras de negócio, padrões de projeto, especificações técnicas e convenções implementadas no sistema. **DEVE SER CONSULTADO E SEGUIDO EM TODA E QUALQUER ALTERAÇÃO DE CÓDIGO.**

---

## 1. Integração com Evolution API (WhatsApp)

- **Envio Direto de Documentos (.PDF)**:
  - As mensagens de cobrança, recibos de pagamento, laudos de vistoria/checklist e cópias de contratos devem ser enviados **diretamente com os arquivos .PDF anexados** via Evolution API (endpoint `/message/sendMedia/{instance}`).
  - Rota centralizada no servidor: `src/app/api/whatsapp/send/route.ts`.
  - Função auxiliar cliente: `sendWhatsAppDocument` e `sendWhatsAppMessage` em `src/lib/evolutionApi.ts`.

- **Mensagens Amigáveis ao Usuário (Sem Termos Técnicos)**:
  - **NÃO** fazer fallback silencioso para links do WhatsApp Web (`wa.me`) quando a API falhar ou estiver desconectada.
  - Nas confirmações e alertas exibidos ao usuário na interface, utilizar linguagem clara e amigável (ex: `✅ Documento enviado com sucesso pelo WhatsApp!`), evitando expor termos técnicos ou nomes de APIs internas (como "Evolution API") nos popups do usuário.

---

## 2. Padronização Visual de Documentos PDF

- **Módulo Único de Cabeçalho**:
  - Todos os relatórios PDF gerados no sistema (**Recibos**, **Contratos**, **Laudos de Vistoria/Checklist** e **Relatórios Financeiros**) devem obrigatoriamente utilizar o construtor `drawStandardPDFHeader` localizado em `src/lib/pdfHeaderBuilder.ts`.

- **Proibição Estrita de Fundo Azul (White Clean Universal)**:
  - **NENHUM relatório ou documento PDF deve conter fundo azul (blue background)**.
  - O topo de todos os documentos utiliza **fundo 100% Branco Clean (`#ffffff`)** com o nome fantasia em azul marinho escuro (`#1e3a8a`), CNPJ, telefone, e-mail e endereço físico completo.
  - Cabeçalhos de tabelas e categorias utilizam tom cinza claro de acabamento (`#f1f5f9`) com texto em azul marinho escuro.
  - **Logomarca**: Exibe a imagem da logomarca da empresa (`empresaLogomarcaUrl`). Caso não haja logomarca cadastrada, gera automaticamente um emblema com a inicial do nome da empresa.
  - **Faixa de Título**: Faixa cinza clara com o título oficial do documento (ex: *RECIBO DE PAGAMENTO DE ALUGUEL*, *CONTRATO DE LOCAÇÃO RESIDENCIAL*, *LAUDO DE VISTORIA DE ENTRADA*, *RELATÓRIO FINANCEIRO*) e subtítulo explicativo.
  - **Rodapé de Desenvolvimento**: Todos os documentos PDF devem conter a linha de créditos no rodapé: `Desenvolvimento: pajotecnologia.com.br (87)996540551`.

- **Arquivos dos Geradores PDF**:
  - Recibos de Pagamento: `src/lib/pdfGenerator.ts`
  - Contratos de Locação: `src/lib/contractPdfGenerator.ts`
  - Laudos de Vistoria / Checklist: `src/lib/checklistPdfGenerator.ts`
  - Relatórios Financeiros: `src/lib/reportsPdfGenerator.ts`
  - Ficha de Vistoria em Branco: `src/lib/blankChecklistPdfGenerator.ts`

---

## 3. Variáveis Dinâmicas nos Modelos de Contrato

- **Mecanismo de Substituição (`replaceContractVariables`)**:
  - Localizado em `src/lib/validation.ts`.
  - Suporta tanto a **notação de ponto** (`{{locatario.nome}}`) quanto a **notação de underscore** (`{{locatario_nome}}`).

- **Mapeamento Obrigatório de Campos**:
  - **Locatário**: `nome`, `cpf`, `rg`, `dataNascimento`, `email`, `telefone`, `endereco`.
  - **Contrato**: `id`, `valorMensal` (R$), `valorExtenso` (por extenso em BRL via `numberToWordsBRL`), `validadeMeses`, `dataEmissao`, `dataFinal`, `status`, `statusAssinatura`, `dataAssinatura`, `ipAssinatura`.
  - **Imóvel / Flat**: `numero`, `status`, `descricao`, `valorPadrao`, `local.nome` (condomínio), `local.endereco`.
- **Restrição de Emissão de Contratos Apenas para Imóveis DISPONÍVEIS**:
  - Apenas flats com o status **`DISPONIVEL`** podem ser selecionados para a emissão de novos contratos.
  - Tanto no frontend (`src/app/contratos/page.tsx`) quanto no backend (`POST /api/contratos`), caso um imóvel com status `OCUPADO` ou `MANUTENCAO` seja selecionado, a emissão é bloqueada e uma caixa de alerta em formato de caixa explicativa é apresentada ao usuário.

---

## 4. Checklists de Vistoria e Upload de Fotos

- **Persistência de Vistorias e Carregamento de Itens**:
  - A rota `POST /api/assinar/vistoria` localiza a vistoria existente por `tokenAssinatura`, `vistoriaId`, ou condição `OR: [{ contratoId, tipoVistoria }, { flatId, tipoVistoria }]` e atualiza sempre o JSON completo `itensJson` (itens, status, observações e array `fotosUrl`).
  - O componente `ChecklistVistoriaModal` declara os estados (`useState`) no topo antes do `useEffect` de carregamento para recuperar e exibir imediatamente dados salvos ao abrir o modal.

- **Ocultação do Link de Assinatura ao Salvar Vistoria**:
  - A ação de salvar a vistoria (`handleSalvarVistoria`) grava os dados diretamente no banco de dados com a mensagem de sucesso `✅ Vistoria salva com sucesso no banco de dados!`. O bloco verde de link para assinatura digital não é exibido automaticamente ao salvar, surgindo apenas quando o usuário clica intencionalmente no botão `Gerar Link Vistoria`.

- **Acionamento da Câmera no Celular, Tablet e Webcam**:
  - Cada item do checklist possui opções de captura de fotos:
    1. **📷 Câmera Direta**: Utiliza `accept="image/*" capture="environment"` para abrir a câmera traseira nativa diretamente no celular ou tablet.
    2. **📹 Câmera Ao Vivo / Webcam**: Abre o modal com preview em tempo real via HTML5 `getUserMedia`, permitindo alternar entre câmera frontal/traseira e capturar a foto ao vivo no navegador.
    3. **📁 Galeria**: Permite selecionar fotos armazenadas na galeria do dispositivo.

- **Ficha de Visualização e Impressão de Vistorias (Apenas Visualização / Read-Only)**:
  - Nos detalhes e cadastro de flats e condomínios, o histórico de vistorias utiliza o componente `ChecklistVistoriaViewModal`.
  - Exibe a ficha formatada idêntica ao laudo impresso (dados do flat, locatário, vistoriador, itens checados com badges OK/Atenção/Avaria, observações detalhadas e miniaturas de fotos com ampliação).
  - Inclui botões para **🖨️ Imprimir / Baixar Laudo PDF** e **📱 Enviar por WhatsApp**.

- **Página Pública do Link de Vistoria (`/assinar/vistoria/[token]`) Interativa**:
  - A página gerada pelo link da vistoria é 100% editável e interativa no celular, tablet ou computador antes de assinar:
    1. **Edição dos Itens**: Permite selecionar os status (OK, Atenção, Avaria) e escrever observações em cada item.
    2. **Anexo de Fotos**: Inclui botões `📷 Câmera Direta`, `📹 Câmera Ao Vivo / Webcam` e `📁 Galeria` para capturar imagens da vistoria diretamente no dispositivo.
    3. **Persistência Completa**: Ao assinar no quadro de assinatura, salva os itens atualizados, as observações e as fotos no banco de dados.

- **Atualização Automática de Status da Vistoria e do Flat**:
  - Quando a vistoria é assinada (digitalmente via tela/link ou por upload de laudo impresso), o status da vistoria (`statusAssinatura`) muda para `"ASSINADO"` ou `"ASSINADO (IMPRESSO)"`.
  - Quando a vistoria assinada for do tipo **`SAIDA`**, o status do Flat no banco de dados é atualizado automaticamente para **`DISPONIVEL`**.
  - Quando a vistoria assinada for do tipo **`ENTRADA`**, o status do Flat no banco de dados é atualizado para **`OCUPADO`**.

- **Download Automático Imediato após Assinatura (Contrato e Checklist)**:
  - Tanto na página pública de assinatura do Contrato (`/assinar/contrato/[token]`) quanto da Vistoria (`/assinar/vistoria/[token]`), o momento exato da confirmação da assinatura dispara automaticamente o download do documento assinado em `.PDF` para o dispositivo do locatário, mantendo visível o painel verde com opções para baixar novamente, imprimir ou enviar via WhatsApp.

---

## 5. Formatação de Máscaras e Validações

- **Campos de Telefone e WhatsApp**:
  - Devem utilizar a função `formatPhone` de `src/lib/validation.ts` no evento `onChange` e no carregamento de formulários.
  - Suporta dinamicamente fixo `(XX) XXXX-XXXX` (10 dígitos) e celular `(XX) XXXXX-XXXX` (11 dígitos).

---

## 6. Banco de Dados e Reset/Seeding

- **Prevenção de Duplicidades**:
  - O arquivo `prisma/seed.ts` limpa previamente todas as tabelas via `deleteMany({})` antes de inserir os registros demonstrativos.

---

## 7. Salvamento e Prevenção de Duplicidade em Modelos de Contrato

- **Atualização Sem Duplicidades**:
  - A rota `src/app/api/modelos-contrato/route.ts` verifica se o modelo possui `id` informado ou se já existe um registro cadastrado com o mesmo `titulo` (case-insensitive) para a empresa (`empresaId`).
  - Caso encontre o registro, executa o `update` no banco de dados para atualizar o modelo existente em vez de criar um novo registro duplicado (`create`).
  - O cliente em `src/app/contratos/modelos/page.tsx` envia o `id: selectedModeloId` no payload e preserva a seleção ativa após o salvamento.

---

## 8. Tratamento de PDFs, Mídias e URLs Dinâmicas em Hospedagem VPS

- **Funções Assíncronas de PDF Base64 (`get*PDFBase64`)**:
  - As funções `getContratoPDFBase64`, `getChecklistPDFBase64` e `getReciboPDFBase64` são **obrigatoriamente assíncronas (`async`)** porque convertem previamente as logomarcas e fotos para Data URIs Base64.
  - **REGRA OBRIGATÓRIA**: Todas as chamadas dessas funções nos componentes React devem utilizar a palavra-chave `await` (ex: `const pdfBase64 = await getContratoPDFBase64(...)`). Jamais chamar sem `await`.

- **Higienização de Mídia na Evolution API (`sendWhatsAppDocument`)**:
  - A Evolution API exige que o parâmetro `media` seja uma **URL direta (`http://...`)** ou uma **string Base64 PURA** (sem o prefixo `data:application/pdf;base64,`).
  - `sendWhatsAppDocument` em `src/lib/evolutionApi.ts` faz a resolução assíncrona automática se uma `Promise` ou string for fornecida, extraindo a porção base64 pura e garantindo que exceções como `trim is not a function` ou `Owned media must be a url or base64` nunca ocorram.

- **Porta Padrão e Nginx Reverse Proxy (Porta 3010)**:
  - A aplicação foi configurada para rodar na **porta 3010** (`package.json`, `baseUrl.ts`, `.env`, `Dockerfile` e `docker-compose.yml`), liberando as portas 3000 e 3005 para outras aplicações na VPS.
  - O arquivo `nginx.conf.example` fornece o modelo pronto de Nginx repassando a porta 3010 para o domínio público com suporte a SSL (`certbot`), upload de arquivos de até 25MB (`client_max_body_size 25M`) e repasse de cabeçalhos HTTP (`proxy_set_header X-Forwarded-Proto $scheme`).

- **URLs Dinâmicas do Sistema (`getAppBaseUrl`)**:
  - Para garantir suporte total a hospedagens VPS com Docker/Nginx e domínios de produção sem dependência de `localhost:3010`, todas as URLs enviadas por e-mail ou WhatsApp utilizam a função utilitária `getAppBaseUrl(req)` de `src/lib/baseUrl.ts`.

- **Garantia de Links Clicáveis no WhatsApp Mobile (Mensagem de URL Isolada)**:
  - O aplicativo do WhatsApp nos celulares (Android/iOS) desativa links em legendas de mídias e também em textos que contêm marcadores de formatação (`*...*`).
  - Para garantir que a URL do laudo/contrato seja **100% clicável no celular**, a rota `/api/whatsapp/send/route.ts` envia primeiramente o PDF, depois o texto explicativo e, em seguida, dispara o **link HTTP puramente isolado** como mensagem individual final com `linkPreview: true`.
  - **Aviso de Teste Local em Celular**: O endereço `http://localhost:3010` só é clicável no próprio computador de desenvolvimento. Para testar o clique direto pelo celular na rede local ou produção, a variável `NEXT_PUBLIC_APP_URL` no `.env` deve ser configurada com o IP da máquina na rede (ex: `http://192.168.x.x:3010`) ou com o domínio público da VPS (ex: `https://meusistema.com.br`).

---

## 9. Limites e Validações de Upload de Arquivos (Tamanho Máximo)

- **Imagens e Fotos (Logomarca, Assinaturas, Vistorias e Flats)**:
  - **Tamanho Máximo Permitido**: **5 MB por arquivo**.
  - **Validação Dupla**: Ocorre tanto no frontend (antes de enviar o formulário) quanto no backend nas rotas de API (`/api/vistorias/upload-foto`, `/api/flats/upload-fotos`, `/api/empresa/upload-logo`, `/api/empresa/upload-assinatura`).
  - Caso o arquivo exceda 5MB, a ação é bloqueada exibindo um aviso informando o nome do arquivo e o tamanho em MB.

- **Documentos e Laudos Impressos (.PDF)**:
  - **Tamanho Máximo Permitido**: **10 MB por arquivo**.
  - **Validação**: Aplicada no cliente e na rota `/api/vistorias/upload-laudo`.

- **Acesso Público aos Uploads de Vistoria (Celular e Links Públicos)**:
  - As rotas `/api/vistorias/upload-foto` e `/api/vistorias/upload-laudo` não exigem sessão de login administrativo (`getAuthSession`), permitindo que locatários e vistoriadores capturem e enviem fotos de itens diretamente do celular a partir do link público da vistoria (`/assinar/vistoria/[token]`).

---

## 10. Preservação de Cache e Integridade dos Estilos CSS / Layout Tailwind

- **Prevenção de Quebra de Estilos (`.next` Cache)**:
  - **REGRA ABSOLUTA E IMPRESCINDÍVEL**: **JAMAIS** executar o comando `npx next build` enquanto o servidor de desenvolvimento `next dev` estiver em execução em segundo plano no ambiente de desenvolvimento local.
  - **Motivo Técnico**: O comando `next build` recompila e sobrescreve integralmente o diretório `.next`, invalidando os manifestos e chunks de folhas de estilo CSS (`TailwindCSS`) utilizados em tempo real pelo `next dev`, resultando no recarregamento de HTML sem formatação no navegador do usuário.
  - **Restabelecimento Automático em Caso de Erro de Cache**: Se houver perda acidental de folhas de estilo ou arquivos 404 de CSS, executar imediatamente a reinicialização limpa:
    `taskkill /F /IM node.exe; Remove-Item -Recurse -Force .next; npm run dev`
  - Esta diretriz garante que os seletores Tailwind CSS e chunks do Webpack permaneçam perfeitamente sincronizados e que o layout jamais seja renderizado sem estilização visual.

