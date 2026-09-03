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
- **Opção de Vigência do Contrato (Meses ou Dias)**:
  - Na emissão de contratos (`src/app/contratos/page.tsx` e `POST /api/contratos`), o usuário pode selecionar o `tipoValidade` entre **`MESES`** (padrão) e **`DIAS`** (para locações por temporada/diárias).
  - Quando a opção **`DIAS`** for selecionada, o prazo final (`dataFinal`) é calculated somando o número de dias à `dataEmissao` (`setDate`), e é gerada 1 única parcela no Contas a Receber com o valor total do período.
  - As variáveis de substituição de modelo (`replaceContractVariables`) disponibilizam `{{duracao}}`, `{{vigencia}}` e `{{validade_dias}}` exibindo dinamicamente a duração formatada (ex: `15 dias` ou `12 meses`).

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

- **Painel Pós-Assinatura Posicionado Abaixo da Assinatura (Sem Alerta no Topo)**:
  - Na página pública da Vistoria (`/assinar/vistoria/[token]`), após o locatário confirmar a assinatura, o laudo exibe em tempo real a imagem da assinatura processada no quadro correspondente.
  - O painel verde com as opções de **📥 Baixar Laudo PDF Assinado**, **📱 Enviar Cópia no WhatsApp** e **❌ Fechar Tela** é posicionado **exclusivamente abaixo do campo de assinatura** (não no topo da página).

- **Priorização de Vistoria Assinada no Grid de Contratos e APIs (`GridMeses.tsx` & `/api/assinar/vistoria`)**:
  - Quando houver mais de um registro de vistoria para um imóvel/contrato, as consultas e listagens devem priorizar o registro com `statusAssinatura` igual/contendo `"ASSINADO"`. A busca em `GridMeses.tsx` e nas APIs ordena por `[{ statusAssinatura: "desc" }, { updatedAt: "desc" }]` para garantir que o botão do contrato exiba `✓ Ver Assinado` (em verde) e que o link público exiba o documento assinado.

- **Resolução de URLs Relativas de Assinatura no PDF (`convertUrlToBase64`)**:
  - `convertUrlToBase64` em `src/lib/checklistPdfGenerator.ts` resolve caminhos relativos de imagens (ex: `/uploads/...`) prependo `window.location.origin` no cliente e `getAppBaseUrl()` no servidor Node.js, garantindo que tanto a assinatura da empresa/vistoriador quanto a assinatura do locatário e fotos dos itens sejam sempre convertidas para Base64 e desenhadas no PDF.

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
  - A aplicação foi configurada para rodar na **porta 3010** (`package.json`, `baseUrl.ts`, `.env`, `Dockerfile` e `docker-compose.yml`).
  - **Mapeamento Oficial de Portas dos Sistemas na VPS**:
    - **Porta 3002**: `sgh`
    - **Porta 3005**: `contratos`
    - **Porta 3010**: `dnyl` (Sistema de Locações / Gestão de Flats)
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

---

## 11. Estabilidade do Editor de Contratos e Cor de Texto Preta Mandatória

- **Arquitetura Não-Controlada sem Pulo de Cursor**:
  - No editor visual de modelos de contrato (`src/app/contratos/modelos/page.tsx`), a folha A4 em `contentEditable` opera de forma **100% não-controlada pelo React durante a digitação**.
  - **NÃO** deve haver `setConteudoHtml` no evento `onInput` / `onKeyUp`. A leitura de `editorRef.current.innerHTML` só é realizada nas ações explicítas de salvar (`handleSave`), alternar para pré-visualização (`handleTogglePreview`) ou carregar um novo modelo.
  - Isso garante zero re-renders do React enquanto o usuário digita, eliminando 100% o pulo de cursor ou perda de foco.

- **Drag & Drop Nativo de Tags**:
  - As tags da caixa de ferramentas possuem suporte a arrastar com o mouse e soltar diretamente no local desejado da folha A4.
  - O manipulador `handleDropTag` utiliza `document.caretRangeFromPoint(e.clientX, e.clientY)` para identificar a posição exata sob a ponta do cursor do mouse no momento da soltura e insere o nó `<strong>{{tag}}</strong>` naquela posição.

- **Cor de Texto em Preto Puro (`color: #000000`)**:
  - Todos os modelos de contrato, títulos (`<h2>`, `<h3>`), parágrafos (`<p>`) e tabelas no editor e na folha A4 utilizam obrigatoriamente a cor **Preto Puro (`color: #000000; text-black`)**.
  - NENHUM cabeçalho ou corpo de texto do modelo de contrato deve ser renderizado em tom de azul.

---

## 12. Procedimento Padrão e Direto de Atualização / Deploy na VPS Linux

- **COMANDO ÚNICO MANDATÓRIO DE DEPLOY NA VPS (PRESERVA DADOS NO BANCO)**:
  - Para atualizar o sistema em produção na VPS (especificamente a aplicação na pasta `/www/wwwroot/dnyl.pajotech.com.br`), o procedimento **DEVE SER DIRETO** (em linha única encadeada no terminal) para garantir a execução síncrona de todas as etapas:
  ```bash
  cd /www/wwwroot/dnyl.pajotech.com.br && git fetch origin master && git reset --hard origin/master && fuser -k -9 3010/tcp 2>/dev/null || true && rm -rf .next && npx prisma db push && npx next build && chown -R www:www /www/wwwroot/dnyl.pajotech.com.br && pm2 startOrRestart ecosystem.config.js && pm2 save
  ```
  - **Após o build**, se o sistema for gerenciado pelo **aaPanel**, ir em **Website → Node project → Restart** no projeto `dnyl` ao invés de usar o PM2 diretamente.

- **GERENCIAMENTO PELO AAPANEL**:
  - O projeto `dnyl` é gerenciado pelo aaPanel como Node project.
  - **Configuração do projeto no aaPanel**:
    - **Path**: `/www/wwwroot/dnyl.pajotech.com.br`
    - **Run opt**: `start [next start -p 3010]`
    - **Port**: `3010`
    - **User**: `www`
  - Para iniciar pela primeira vez ou após matar o processo manualmente, usar o botão **Start** no aaPanel.
  - O `ecosystem.config.js` na raiz do projeto garante que o PM2 e o aaPanel iniciem o sistema na porta **3010**.

- **PROXY REVERSO NGINX (aaPanel)**:
  - O arquivo de proxy do Nginx para o domínio `dnyl.pajotech.com.br` está em:
    `/www/server/panel/vhost/nginx/proxy/dnyl.pajotech.com.br/proxy.conf`
  - Deve conter `proxy_pass http://127.0.0.1:3010` com `proxy_cache_bypass 1` e `Cache-Control: no-cache` para evitar que o browser sirva chunks JS antigos.
  - **NUNCA** modificar o arquivo principal `/www/server/panel/vhost/nginx/dnyl.pajotech.com.br.conf` diretamente — usar apenas o arquivo de proxy acima.

- **PROIBIÇÃO ABSOLUTA DE `pm2 delete all` OU COMANDOS GERAIS**: A VPS hospeda outros projetos em portas distintas (3002, 3005, etc.). Qualquer comando PM2 deve afetar **EXCLUSIVAMENTE** o processo `dnyl` (ex: `pm2 restart dnyl` ou `pm2 delete dnyl`).

- **Por que esta Ordem é Obrigatória e Imperativa**:
  1. `git fetch origin master && git reset --hard origin/master`: Atualiza o código fonte do repositório no disco. (Obs: Os arquivos `.db` do SQLite foram removidos do Git e ignorados via `.gitignore`, o que impede que o `git reset` sobrescreva ou apague dados reais do banco de produção na VPS).
  2. `rm -rf .next`: Apaga o cache de compilação antigo para forçar o Next.js a gerar todos os chunks estáticos e atualizados da nova versão.
  3. `npx prisma db push`: Atualiza e adiciona novas tabelas ou colunas ao banco de dados SQLite existente **preservando 100% de todos os dados e cadastros criados**.
  4. `npx next build`: Recompila síncronamente todos os arquivos do Next.js gerando o novo `BUILD_ID` e atualizando os pacotes estáticos. **JAMAIS** reiniciar o PM2 antes da conclusão do `next build` para evitar erros de 502 Bad Gateway e `production-start-no-build-id`.
  5. `pm2 restart dnyl`: Recarrega o processo `dnyl` na porta 3010 com a build de produção totalmente pronta.

- **Controle de Versão do Sistema (`src/lib/version.ts`)**:
  - Em cada nova funcionalidade ou atualização enviada, a constante `SYSTEM_VERSION` em `src/lib/version.ts` e no `package.json` deve ser incrementada (ex: `v1.10`, `v1.11`, `v1.12`).
  - O indicador de versão `🟢 Versão: X.XX` deve permanecer exibido tanto no cartão da tela de login (`src/app/login/page.tsx`) quanto no topo das páginas internas (`src/components/layout/Shell.tsx`), garantindo a confirmação visual imediata de deploy bem-sucedido.

---

## 14. Integração com Banco Inter (API Cobrança v3 - Boleto com Pix / Bolepix)

- **Autenticação OAuth 2.0 e mTLS Nativo (`src/lib/bancoInter.ts`)**:
  - Toda comunicação com o Banco Inter é autenticada utilizando **Mutual TLS (mTLS)** via `https.Agent` com o certificado `.crt` e a chave privada `.key` da empresa.
  - O Token de Acesso Bearer é obtido via `POST /oauth/v2/token` (`grant_type=client_credentials` e `scope=boleto-cobranca.read boleto-cobranca.write`) e mantido em cache temporário de memória baseado no `expires_in` para otimização de performance.
  - Ambientes suportados: **PRODUÇÃO** (`https://cdpj.partners.bancointer.com.br`) e **SANDBOX** (`https://cdpj-sandbox.partners.bancointer.com.br`).

- **Emissão de Cobrança e Bolepix (`/api/banco-inter/emitir`)**:
  - Dispara `POST /cobranca/v3/cobrancas` informando dados do pagador/locatário (CPF/CNPJ, nome, endereço), valor nominal, data de vencimento, juros e multa do contrato.
  - Vincula o `codigoSolicitacao`, `nossoNumero`, `linhaDigitavel`, `codigoBarras` e `pixCopiaECola` na tabela `ContaReceber`.

- **Download de PDF Oficial do Boleto (`/api/banco-inter/pdf`)**:
  - Obtém o PDF gerado pelo Banco Inter via `GET /cobranca/v3/cobrancas/{id}/pdf` e disponibiliza para visualização em nova aba, download direto ou disparo por WhatsApp.

- **Envio Direto de Boleto + Pix via WhatsApp (Evolution API)**:
  - Dispara o PDF oficial do boleto gerado pelo Inter diretamente como mídia anexada no WhatsApp do locatário, acompanhado da Linha Digitável e do Pix Copia e Cola formatados.

- **Conciliação e Baixa Automática (Webhook + Sincronização)**:
  - Rota de Webhook: `POST /api/webhooks/banco-inter`. Ao receber status `RECEBIDO` ou `PAGO`, aplica a liquidação imediata da `ContaReceber` (`status: "PAGO"`, `formaPagamento: "BOLETO"`, `valorPago`, `dataPagamento`).
  - Sincronização em Lote (`POST /api/banco-inter/consultar`): Botão **Sincronizar com Inter** na tela de Contas a Receber para consultar e conciliar todas as cobranças pendentes com 1 clique.

---

## 15. Sincronização Automática com o GitHub

- **Envio Automático Obrigatório**: Toda e qualquer alteração realizada no código, configurações ou documentação DEVE ser imediatamente adicionada (`git add .`), comitada e enviada (`git push origin master`) para o GitHub ao final de cada alteração, garantindo que o repositório remoto e os webhooks do Coolify/CI estejam sempre 100% atualizados.


