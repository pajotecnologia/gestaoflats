# 📜 Histórico Oficial de Entregas, Alterações e Melhorias do Sistema IMOB

Este documento registra o histórico cronológico detalhado de todas as implementações, correções de bugs, refatorações de regras de negócio e melhorias de interface realizadas no sistema IMOB (Gestão de Imóveis & Flats SaaS). Serve como base técnica e memória operacional permanente para desenvolvedores, inteligência artificial e auditoria de evolução do software.

---

## 📑 ÍNDICE DE VERSÕES
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
