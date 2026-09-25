# 📜 Histórico Oficial de Entregas, Alterações e Melhorias do Sistema IMOB

Este documento registra o histórico cronológico detalhado de todas as implementações, correções de bugs, refatorações de regras de negócio e melhorias de interface realizadas no sistema IMOB (Gestão de Imóveis & Flats SaaS). Serve como base técnica e memória operacional permanente para desenvolvedores, inteligência artificial e auditoria de evolução do software.

---

## 📑 ÍNDICE DE VERSÕES
- [v2.29.19 - Eliminação de Flash nos Preços e Personalização da Landing Page pelo Super Admin](#v22919---eliminação-de-flash-nos-preços-e-personalização-da-landing-page-pelo-super-admin)
- [v2.29.18 - Forçamento Dinâmico e Sem Cache para Planos SaaS na Landing Page](#v22918---forçamento-dinâmico-e-sem-cache-para-planos-saas-na-landing-page)
- [v2.29.17 - Sincronização Dinâmica dos Planos SaaS na Landing Page](#v22917---sincronização-dinâmica-dos-planos-saas-na-landing-page)
- [v2.29.16 - Modelo Padrão de Contrato de Locação de Chácara para Eventos](#v22916---modelo-padrão-de-contrato-de-locação-de-chácara-para-eventos)
- [v2.29.15 - Emissão de Cobrança SaaS no Banco Inter sob Demanda via Botão](#v22915---emissão-de-cobrança-saas-no-banco-inter-sob-demanda-via-botão)
- [v2.29.14 - Eliminação de Flash de Preços no Checkout com Skeleton Loading](#v22914---eliminação-de-flash-de-preços-no-checkout-com-skeleton-loading)
- [v2.29.13 - Padronização do Percentual de Economia Anual (10%)](#v22913---padronização-do-percentual-de-economia-anual-10)
- [v2.29.12 - Sincronização Instantânea no Checkout & Correção da Linha Digitável Inter](#v22912---sincronização-instantânea-no-checkout--correção-da-linha-digitável-inter)
- [v2.29.11 - Exclusão Livre de Planos Comerciais na Matriz SaaS](#v22911---exclusão-livre-de-planos-comerciais-na-matriz-saas)
- [v2.29.10 - Atribuição Dinâmica de Planos, Status e Validade de Empresas](#v22910---atribuição-dinâmica-de-planos-status-e-validade-de-empresas)
- [v2.29.9 - Padronização do Menu "Gestão SaaS" e Limpeza da Barra Lateral](#v2299---padronização-do-menu-gestão-saas-e-limpeza-da-barra-lateral)
- [v2.29.8 - Compatibilização de Cadastro de Empresas SaaS na Landing Page](#v2298---compatibilização-de-cadastro-de-empresas-saas-na-landing-page)
- [v2.29.7 - Vinculação Dinâmica da Empresa Proprietária ao Cabeçalho da O.S.](#v2297---vinculação-dinâmica-da-empresa-proprietária-ao-cabeçalho-da-os)
- [v2.29.6 - Emissão e Impressão de Ordem de Serviço em PDF White Clean](#v2296---emissão-e-impressão-de-ordem-de-serviço-em-pdf-white-clean)
- [v2.29.5 - Múltiplos Anexos de Notas de Compra de Materiais na O.S.](#v2295---múltiplos-anexos-de-notas-de-compra-de-materiais-na-os)
- [v2.29.4 - Conciliação Automática no Contas a Pagar e Caixa do Dia](#v2294---conciliação-automática-no-contas-a-pagar-e-caixa-do-dia)
- [v2.29.3 - Integração Financeira Nativa da Ordem de Serviço (O.S.)](#v2293---integração-financeira-nativa-da-ordem-de-serviço-os)
- [v2.29.2 - Atualização Reativa de Status da Vistoria sem F5](#v2292---atualização-reativa-de-status-da-vistoria-sem-f5)

---

### v2.29.19 - Eliminação de Flash nos Preços e Personalização da Landing Page pelo Super Admin
- **Data**: 25/09/2026
- **Arquivos**:
  - `src/lib/landingConfig.ts`
  - `src/app/api/saas/landing-config/route.ts`
  - `src/app/page.tsx`
  - `src/app/parametros/page.tsx`
  - `prisma/schema.prisma`
  - `src/lib/version.ts`
  - `package.json`
  - `AGENTS.md`
  - `HISTORICO_ENTREGAS_E_MELHORIAS.md`
- **Problema Relatado**:
  - A Landing Page exibia momentaneamente os valores estáticos iniciais antes de carregar os valores reais do banco de dados (flash de preços).
  - O Super Admin necessitava de um módulo no painel administrativo para personalizar os textos, WhatsApp comercial, banners e perguntas frequentes da Landing Page sem alterar código-fonte.
- **Causa Raiz**:
  - Renderização síncrona dos preços estáticos antes da conclusão do `fetch('/api/saas/planos')`.
  - Ausência de tela visual e endpoint dedicado para edição da Landing Page.
- **Solução Implementada**:
  - **Eliminação do Flash de Preços**: Implementação de Skeleton Shimmer (`animate-pulse`) na área de preços dos cards até que os dados reais do banco cheguem, revelando os valores com transição suave.
  - **Módulo de Personalização da Landing Page**: Criada sub-aba *🎨 Personalização da Landing Page* em `Parâmetros ➔ Gestão SaaS`, permitindo configurar:
    1. **Hero Section**: Badge superior, Título principal (H1), Palavra em destaque, Subtítulo, Texto do botão CTA e Link de vídeo demonstrativo.
    2. **Contato & WhatsApp**: WhatsApp comercial, Mensagem padrão de atendimento e E-mail.
    3. **Banner Promocional**: Toggle para ativar banner superior de aviso/promoção com link.
    4. **Títulos de Seções**: Títulos e subtítulos de Benefícios e Planos.
    5. **Editor de FAQ**: Adicionar, editar e remover perguntas e respostas frequentes.
  - **Persistência no PostgreSQL**: Armazenamento na tabela `ConfiguracaoSaaS.landingConfigJson` com endpoint `/api/saas/landing-config` e atualização em tempo real.

---

### v2.29.18 - Forçamento Dinâmico e Sem Cache para Planos SaaS na Landing Page
- **Data**: 25/09/2026
- **Arquivos**:
  - `src/app/api/saas/planos/route.ts`
  - `src/app/page.tsx`
  - `src/lib/version.ts`
  - `package.json`
  - `AGENTS.md`
  - `HISTORICO_ENTREGAS_E_MELHORIAS.md`
- **Problema Relatado**:
  - A Landing Page eventualmente exibia versões em cache estático dos planos após alterações salvas pelo Super Admin no banco de dados.
- **Causa Raiz**:
  - Ausência de flags de renderização dinâmica (`force-dynamic` e `revalidate = 0`) na rota de API `/api/saas/planos`, além da falta de `cache: "no-store"` e query param de timestamp no `fetch` do cliente.
- **Solução Implementada**:
  - Configuração explícita de `export const dynamic = "force-dynamic"` e `export const revalidate = 0` na rota de planos SaaS.
  - Implementação de `fetch("/api/saas/planos?t=" + Date.now(), { cache: "no-store" })` na Landing Page.
  - Definição da matriz de precificação proporcional SaaS com base na âncora do Plano Gestão (R$ 600,00/mês).

---

### v2.29.17 - Sincronização Dinâmica dos Planos SaaS na Landing Page
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/page.tsx`
  - `src/lib/version.ts`
  - `package.json`
  - `AGENTS.md`
  - `HISTORICO_ENTREGAS_E_MELHORIAS.md`
- **Problema Relatado**:
  - Os planos e valores cadastrados/customizados pelo Super Admin no painel (`/parametros?aba=saas`) não refletiam na Landing Page (`/`), gerando divergência entre os valores públicos da página inicial e os valores do checkout (`/renovar`).
- **Causa Raiz**:
  - A Landing Page (`src/app/page.tsx`) utilizava uma constante estática `COMMERCIAL_PLANS` importada diretamente do código-fonte em vez de consumir a rota de planos dinâmicos `/api/saas/planos`.
- **Solução Implementada**:
  - Inserção de estado reativo e `useEffect` em `src/app/page.tsx` para sincronizar automaticamente a lista de planos comerciais públicos e configurações gerais (`commercialPlans` e `planos`) do banco de dados.
  - Atualização do grid responsivo de planos para se adaptar dinamicamente à quantidade de planos públicos cadastrados (1, 2, 3, 4 ou mais planos).
  - Exibição de preços mensais e anuais calculados com precisão, badges ("Mais Escolhido"), limites de imóveis, usuários, assinaturas e storage, e recursos dinâmicos.
  - Sincronização do valor de partida do Plano Enterprise com o banco de dados.
  - Links diretos em cada card para contratação imediata (`/renovar?plano=...`) ou abertura do formulário de cadastro/teste grátis de 7 dias.

---

### v2.29.16 - Modelo Padrão de Contrato de Locação de Chácara para Eventos
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/lib/defaultContractTemplate.ts`
  - `src/app/api/modelos-contrato/route.ts`
  - `src/app/contratos/modelos/page.tsx`
  - `prisma/seed.ts`
  - `src/lib/version.ts`
  - `package.json`
- **Funcionalidade Entregue**:
  - Criação do modelo oficial de **Contrato de Locação de Chácara para Eventos e Temporada** com suporte integral às variáveis dinâmicas do sistema.
  - O contrato abrange qualificação completa do Locador e Locatário, objeto da chácara/espaço, vigência e horário limite, valores com sinal/reserva e saldo restante, regras de convivência e lei do silêncio (22:00h), danos ao patrimônio e recolhimento de lixo, política de cancelamento/desistência e foro da comarca.
  - Disponibilização de botões de atalho (*Modelos Prontos*) no editor visual A4 (`/contratos/modelos`) para carregar o modelo de chácara ou o modelo residencial de flat com 1 clique.
  - Sincronização automática no banco de dados para todas as empresas e inclusão nos seeds oficiais do sistema.

---

### v2.29.15 - Emissão de Cobrança SaaS no Banco Inter sob Demanda via Botão
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/api/saas/plano-pix/route.ts`
  - `src/app/renovar/page.tsx`
  - `src/lib/version.ts`
  - `package.json`
- **Problema Relatado**:
  - Ao entrar na página `/renovar` e alternar entre os planos ou ciclos, o sistema gerava imediatamente e automaticamente novas cobranças/boletos no Banco Inter sem o consentimento ou confirmação do cliente.
  - Solicitação de verificação das credenciais e status de conexão da Empresa com o Banco Inter.
- **Diagnóstico da Conexão**:
  - Script diagnóstico validou as chaves mTLS da Empresa Mestre (`empresa-demo-001`): `bancoInterAtivo: true`, certificado CRT, chave KEY e ambiente `PRODUCAO`.
  - Autenticação OAuth 2.0 mTLS bem-sucedida e consulta à API `/cobranca/v3/cobrancas` retornou HTTP 200 OK.
- **Causa Raiz da Emissão Automática**:
  - O hook `useEffect` da tela de renovação invocava `/api/saas/plano-pix` a cada alteração de `[selectedPlano, billingCycle]`. A rota chamava incondicionalmente a API de emissão de cobrança do Banco Inter.
- **Solução Implementada**:
  - **Backend (`/api/saas/plano-pix`)**: Adicionado controle pelo parâmetro `emitir=true` (ou método `POST`). Se `emitir !== "true"`, a rota apenas retorna as informações de preview e valores do plano sem registrar nenhuma cobrança no banco.
  - **Frontend (`/renovar`)**: A emissão da cobrança no Banco Inter agora ocorre única e exclusivamente quando o usuário clica no botão principal *"Gerar Pagamento PIX (R$ XX,XX)"*.
  - Ao clicar no botão, é exibido feedback de carregamento (*"Gerando Bolepix no Banco Inter..."*), seguido do QR Code Pix, Copia e Cola, Linha Digitável e início do monitoramento de baixa em tempo real.
  - Se o usuário trocar de plano ou ciclo após ter gerado um QR Code, o sistema oculta a cobrança anterior e reapresenta o botão de confirmação para o novo plano selecionado.

---

### v2.29.14 - Eliminação de Flash de Preços no Checkout com Skeleton Loading
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/renovar/page.tsx`
  - `src/lib/version.ts`
  - `package.json`
- **Problema Relatado**:
  - Ao abrir `/renovar`, a tela exibia valores padrão hardcoded de fallback (ex: R$ 79, R$ 149) e, frações de segundo depois, ao receber a resposta da API do banco de dados, substituía o valor na frente do usuário (ex: R$ 29,90 ou R$ 800,00).
- **Causa Raiz**:
  - O estado `commercialPlans` iniciava pré-populado com a constante estática `COMMERCIAL_PLANS`. O Next.js/React renderizava a tela imediatamente com esses valores e o `useEffect` assíncrono disparava a re-renderização com os preços customizados do banco.
- **Solução Implementada**:
  - Adicionado o estado `plansLoading` (inicialmente `true`) e `commercialPlans` iniciando vazio `[]`.
  - Enquanto a configuração oficial do banco de dados é recuperada (~150ms), a tela renderiza uma silhueta de carregamento (*Skeleton Shimmer*) suave nos 4 cards e no bloco de *Total do Pedido*.
  - A tela agora renderiza de primeira diretamente com os preços oficiais e definitivos, sem nenhuma piscada ou sobreposição de números.

---

### v2.29.13 - Padronização do Percentual de Economia Anual (10%)
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/renovar/page.tsx`
  - `src/app/page.tsx`
  - `src/app/api/saas/plano-pix/route.ts`
  - `src/lib/plans/planDefinitions.ts`
- **Problema Relatado**:
  - O seletor de ciclo anual indicava "Economize até 20%", mas a regra de precificação comercial do sistema é de 10% de desconto no plano anual.
- **Solução Implementada**:
  - Selo no toggle anual atualizado para **`Economize 10%`** tanto no checkout (`/renovar`) quanto na Landing Page (`/`).
  - Textos informativos de período e comentários técnicos alinhados para 10%.

---

### v2.29.12 - Sincronização Instantânea no Checkout & Correção da Linha Digitável Inter
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/renovar/page.tsx`
  - `src/lib/bancoInterSaaS.ts`
  - `src/lib/plans/planService.ts`
- **Problema Relatado**:
  - A linha digitável do Bolepix mostrava um valor antigo (ex: final `...44900` = R$ 449,00) enquanto o Total do Pedido exibia R$ 800,00.
  - Ao clicar nos cards de planos no topo, havia atraso perceptível para atualizar o total e parâmetros abaixo.
- **Causa Raiz**:
  - `emitirCobrancaSaaSBancoInter` buscava cobranças pendentes recentes nas últimas 12 horas sem verificar se `cobrancaExistente.valor === valorAtual`. Se o Super Admin reajustava o preço do plano, o sistema retornava o Bolepix emitido anteriormente com o valor defasado.
  - O Total do Pedido dependia do término da chamada de rede mTLS do Banco Inter (2 a 3s) para atualizar a UI.
- **Solução Implementada**:
  - A busca de cobrança pendente agora exige estritamente `valor: valor`. Se o preço mudou, a cobrança defasada é ignorada e uma nova é gerada no Banco Inter com o valor exato.
  - O Total do Pedido e o nome do plano agora são calculados e sincronizados em **0ms** no frontend.
  - Adicionado `AbortController` para cancelar requisições anteriores se o usuário alternar entre planos rapidamente.
  - Adicionado estado de loading dinâmico com mensagem indicando o plano e valor exato em processamento no Banco Inter.

---

### v2.29.11 - Exclusão Livre de Planos Comerciais na Matriz SaaS
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/api/saas/planos/route.ts`
  - `src/app/parametros/page.tsx`
- **Problema Relatado**:
  - O Super Admin não conseguia excluir planos que não desejava mais comercializar (ex: botão de lixeira no plano Essencial falhava com erro).
- **Causa Raiz**:
  - A rota de API possuía uma trava estática bloqueando a remoção de planos que estivessem no array `["ESSENCIAL", "PROFISSIONAL", "GESTAO", "EMPRESARIAL", ...]`. Além disso, a rota `GET` mesclava com `SAAS_PLANS`, reintroduzindo planos deletados.
- **Solução Implementada**:
  - A proteção de exclusão foi restrita exclusivamente aos planos de infraestrutura interna do sistema (`TRIAL` e `MESTRE`).
  - Qualquer plano comercial (`ESSENCIAL`, `PROFISSIONAL`, `GESTAO`, `EMPRESARIAL`, `ENTERPRISE` ou customizado) pode ser excluído livremente.
  - O botão *"Restaurar Padrões"* continua disponível para recriar as configurações de fábrica se desejado.
  - O botão de lixeira 🗑️ foi habilitado para todos os cards na Matriz SaaS com confirmação e atualização reativa.

---

### v2.29.10 - Atribuição Dinâmica de Planos, Status e Validade de Empresas
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/parametros/page.tsx`
  - `src/app/api/saas/liberar-acesso/route.ts`
- **Problema Relatado**:
  - Impossibilidade de trocar ou atribuir diretamente o plano de uma empresa cliente pelo painel SaaS.
- **Solução Implementada**:
  - Redesenho completo do modal *"Liberar / Plano"* na aba de Empresas SaaS.
  - O campo de plano passou a listar dinamicamente todos os planos cadastrados na matriz (com seus respectivos valores mensais).
  - Inclusão de seletor explícito de status da conta (`ATIVO`, `TRIAL`, `BLOQUEADO`, `EXPIRADO`) e opção `"Manter Data Atual"` para alterar plano sem mexer na data de expiração.

---

### v2.29.9 - Padronização do Menu "Gestão SaaS" e Limpeza da Barra Lateral
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/components/layout/Shell.tsx`
- **Problema Relatado**:
  - O item aparecia como "Gestão SAAS e Assinatura" sob o menu Relatórios e havia um botão duplicado na barra lateral.
- **Solução Implementada**:
  - Rótulo padronizado para **`Gestão SaaS`** dentro do dropdown de *Parâmetros & Configurações*.
  - Removido o botão avulso redundante da barra lateral.

---

### v2.29.8 - Compatibilização de Cadastro de Empresas SaaS na Landing Page
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/api/auth/register/route.ts`
  - `src/app/page.tsx`
- **Problema Relatado**:
  - Erro de campos obrigatórios ao tentar criar uma conta de imobiliária pelo formulário modal da Landing Page.
- **Causa Raiz**:
  - O modal enviava o campo com o nome `senha`, enquanto a rota `/api/auth/register` verificava estritamente `body.password`.
- **Solução Implementada**:
  - A rota `/api/auth/register` foi compatibilizada para aceitar variações (`password`, `senha`, `nomeEmpresa`, `razaoSocial`, etc.).

---

### v2.29.7 - Vinculação Dinâmica da Empresa Proprietária ao Cabeçalho da O.S.
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/api/ordens-servico/route.ts`
  - `src/lib/ordemServicoPdfGenerator.ts`
  - `src/app/ordens-servico/page.tsx`
- **Solução Implementada**:
  - O cabeçalho da Ordem de Serviço em PDF estampa diretamente a logomarca, Razão Social, CNPJ, endereço completo e contatos da Empresa à qual o imóvel pertence (`ordem.flat.empresa`).

---

### v2.29.6 - Emissão e Impressão de Ordem de Serviço em PDF White Clean
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/lib/ordemServicoPdfGenerator.ts`
  - `src/app/ordens-servico/page.tsx`
- **Solução Implementada**:
  - Criação do gerador oficial de laudos periciais de O.S. em PDF no padrão *White Clean Universal* (`#ffffff` + Azul Marinho `#1e3a8a` + faixas `#f1f5f9`).
  - Exibição de dados do imóvel, locatário solicitante, técnico responsável, prazos, custos e galeria de fotos anexadas.

---

### v2.29.5 - Múltiplos Anexos de Notas de Compra de Materiais na O.S.
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/ordens-servico/page.tsx`
  - `src/app/api/ordens-servico/route.ts`
- **Solução Implementada**:
  - Suporte a múltiplos uploads de fotos e notas fiscais de compra de materiais na Ordem de Serviço, com compressão automática WebP e preview integrado.

---

### v2.29.4 - Conciliação Automática no Contas a Pagar e Caixa do Dia
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/api/ordens-servico/route.ts`
  - `src/app/financeiro/page.tsx`
- **Solução Implementada**:
  - Quando uma O.S. gera despesas com materiais ou mão de obra, é criado automaticamente o lançamento no *Contas a Pagar* e refletido no *Caixa do Dia*.

---

### v2.29.2 - Atualização Reativa de Status da Vistoria sem F5
- **Data**: 23/09/2026
- **Arquivos**:
  - `src/app/vistorias/page.tsx`
- **Problema Relatado**:
  - Após assinar a vistoria pelo celular/link público, era necessário pressionar F5 no painel para visualizar o checklist como assinado.
- **Solução Implementada**:
  - Adicionada escuta de visibilidade (`visibilitychange`/`focus`) e recarregamento reativo automático dos dados sem necessidade de recarregar a página manualmente.

---

## 🎯 Padrões Técnicos Mandatórios (Manter em todas as versões)
1. **Porta e VPS**: Aplicação roda na porta **3010** via Coolify.
2. **Versionamento Obrigatório**: Incrementar `SYSTEM_VERSION` em `src/lib/version.ts` e `package.json` a cada nova entrega.
3. **Padrão PDF**: Todo documento gerado utiliza `drawStandardPDFHeader` com fundo 100% branco (`#ffffff`), títulos em Azul Marinho (`#1e3a8a`) e rodapé de créditos oficial: `Desenvolvimento: pajotecnologia.com.br (87)996540551`.
4. **Armazenamento de Imagens**: Conversão de fotos para Base64 WebP otimizadas com Sharp gravadas diretamente no PostgreSQL para persistência definitiva.
