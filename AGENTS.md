# Diretrizes, Regras e Manual Completo de Funcionalidades do Sistema IMOB

Este documento reúne todas as especificações técnicas, regras de negócio, convenções de código e o **guia completo de funcionalidades do sistema IMOB (Gestão de Imóveis & Flats SaaS)**.
Serve como memória operacional para a inteligência artificial, desenvolvedores e como roteiro oficial para gravação de vídeos tutoriais e demonstrações comerciais.

---

## 📑 ÍNDICE GERAL
1. [Visão Geral do Sistema e Arquitetura](#1-visão-geral-do-sistema-e-arquitetura)
2. [Guia de Funcionalidades e Roteiro para Gravação de Vídeos](#2-guia-de-funcionalidades-e-roteiro-para-gravação-de-vídeos)
   - [2.1 Painel Principal / Dashboard](#21-painel-principal--dashboard)
   - [2.2 Gestão de Imóveis e Flats](#22-gestão-de-imóveis-e-flats)
   - [2.3 Gestão de Condomínios e Locais](#23-gestão-de-condomínios-e-locais)
   - [2.4 Cadastro de Locatários e Hóspedes](#24-cadastro-de-locatários-e-hóspedes)
   - [2.5 Emissão e Gestão de Contratos de Locação](#25-emissão-e-gestão-de-contratos-de-locação)
   - [2.6 Editor Visual de Modelos de Contrato (A4 com Tags Dinâmicas)](#26-editor-visual-de-modelos-de-contrato)
   - [2.7 Assinatura Digital de Contratos](#27-assinatura-digital-de-contratos)
   - [2.8 Vistorias e Checklists Digitais com Fotos](#28-vistorias-e-checklists-digitais-com-fotos)
   - [2.9 Link Público e Interativo de Vistoria para o Locatário](#29-link-público-e-interativo-de-vistoria-para-o-locatário)
   - [2.10 Agenda de Ocupação e Reservas por Temporada](#210-agenda-de-ocupação-e-reservas-por-temporada)
   - [2.11 Módulo Financeiro: Contas a Receber, Contas a Pagar e Caixa](#211-módulo-financeiro-contas-a-receber-contas-a-pagar-e-caixa)
   - [2.12 Integração com Banco Inter (API Cobrança v3 - Boleto com Pix / Bolepix)](#212-integração-com-banco-inter)
   - [2.13 Integração com WhatsApp via Evolution API](#213-integração-com-whatsapp-via-evolution-api)
   - [2.14 Painel de Parâmetros e Configurações](#214-painel-de-parâmetros-e-configurações)
   - [2.15 Módulo SaaS, Planos Dinâmicos e Renovação Automática](#215-módulo-saas-planos-dinâmicos-e-renovação-automática)
3. [Padrões de Projeto e Regras Técnicas Estritas](#3-padrões-de-projeto-e-regras-técnicas-estritas)

---

## 1. Visão Geral do Sistema e Arquitetura

O **IMOB** é uma plataforma SaaS completa de gestão imobiliária e locação de flats/imóveis residenciais, comerciais e por temporada (diárias).

### Pilares Principais:
- **Tecnologias**: Next.js (App Router), React, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, Sharp (compressão WebP), jsPDF (gerador de documentos).
- **Comunicação Multicanal**: Disparos nativos no WhatsApp via Evolution API e e-mails via SMTP.
- **Fintech Nativa**: Emissão de boletos com QR Code Pix dinâmico integrado via mTLS OAuth 2.0 com o Banco Inter (Cobrança v3) e baixa em tempo real por Webhook e reconciliação ativa.
- **Assinatura Digital**: Links públicos para assinatura touch/mouse de contratos e laudos de vistoria com captura de fotos da câmera do celular.
- **Multi-tenant / SaaS**: Cada empresa possui isolamento de dados, podendo o Super Admin gerenciar planos, preços, limites e acessos.

---

## 2. Guia de Funcionalidades e Roteiro para Gravação de Vídeos

Use este roteiro para criar vídeos didáticos, tutoriais de uso e materiais de marketing:

### 2.1 Painel Principal / Dashboard
- **Roteiro de Vídeo**: *Como monitorar a sua operação imobiliária em tempo real.*
- **Recursos Exibidos**:
  - **Indicadores de Ocupação**: Cartões inteligentes com imóveis ocupados, disponíveis, em manutenção e taxa percentual de ocupação.
  - **Métricas Financeiras**: Total a receber no mês, receitas recebidas, despesas pagas, inadimplência em aberto e saldo financeiro líquido.
  - **Avisos e Alertas**: Contratos vencendo nos próximos 30 dias, parcelas em atraso e vistorias pendentes.
  - **Ações Rápidas**: Botões de 1 clique para emitir contrato, criar vistoria, cadastrar flat ou lançar receita.

---

### 2.2 Gestão de Imóveis e Flats (`/flats`)
- **Roteiro de Vídeo**: *Cadastro completo de imóveis e controle de ocupação.*
- **Recursos Exibidos**:
  - Cadastro de unidades com número/identificador, condomínio/local vinculado, descrição, valor de aluguel padrão e valor de diária.
  - **Galeria de Fotos**: Upload de múltiplas fotos com ordenação e compressão automática para WebP (~50 KB por foto) salva permanentemente no banco.
  - **Status Dinâmicos**: `DISPONIVEL` (verde), `OCUPADO` (azul), `MANUTENCAO` (amarelo), `RESERVADO` (roxo).
  - **Visualização Flexível**: Alternância entre visualização em Cartões com fotos e Tabela analítica.
  - **Histórico Completo por Imóvel**: Aba de contratos vigentes, histórico de locatários anteriores e laudos de vistoria de entrada e saída.

---

### 2.3 Gestão de Condomínios e Locais (`/locais`)
- **Roteiro de Vídeo**: *Organizando seus imóveis por prédios, condomínios ou localidades.*
- **Recursos Exibidos**:
  - Cadastro do condomínio/edifício com endereço completo, CEP com busca automática, fotos e observações.
  - Vinculação de múltiplos flats/apartamentos pertencentes ao mesmo condomínio.

---

### 2.4 Cadastro de Locatários e Hóspedes (`/locatarios`)
- **Roteiro de Vídeo**: *Cadastro rápido de clientes, inquilinos e hóspedes.*
- **Recursos Exibidos**:
  - Pessoa Física (CPF, RG, Data de Nascimento, Profissão, Estado Civil) ou Pessoa Jurídica (CNPJ, Razão Social).
  - Contatos: WhatsApp com máscara dinâmica `(XX) XXXXX-XXXX`, e-mail e endereço residencial completo.
  - **Cadastro Rápido Sobreposto**: Modal popup para cadastrar inquilino sem sair da tela de contrato ou reserva.
  - Histórico do cliente com todos os contratos já assinados e parcelas financeiras.

---

### 2.5 Emissão e Gestão de Contratos de Locação (`/contratos`)
- **Roteiro de Vídeo**: *Como emitir um contrato de locação em menos de 1 minuto.*
- **Recursos Exibidos**:
  - Seleção do Locatário, Imóvel e Modelo de Contrato.
  - **Vigência Flexível**:
    - **Por Meses**: Locação residencial ou comercial tradicional (ex: 12 meses, gerando 12 parcelas mensais).
    - **Por Dias**: Locação por temporada ou diárias (ex: 15 dias, gerando 1 parcela única do período total).
  - **Geração Financeira Automática**: Cria automaticamente as parcelas no *Contas a Receber* com vencimentos calculados.
  - **Configuração de Multa e Juros**: Definição de percentuais de multa por atraso e juros moratórios mensais.
  - **Grid de Contratos**: Visualização rápida do status da assinatura, botão para visualizar contrato em PDF e disparo no WhatsApp.

---

### 2.6 Editor Visual de Modelos de Contrato (`/contratos/modelos`)
- **Roteiro de Vídeo**: *Personalizando modelos de contrato com tags dinâmicas e visualização A4 em tempo real.*
- **Recursos Exibidos**:
  - Folha A4 em tempo real na tela com margens e paginação idênticas ao documento impresso.
  - **Drag & Drop de Tags**: Arraste tags da caixa de ferramentas com o mouse e solte onde quiser no contrato (`{{locatario.nome}}`, `{{flat.numero}}`, `{{valor_mensal}}`, `{{valor_extenso}}`, `{{duracao}}`, `{{vigencia}}`, etc.).
  - **Arquitetura Estável**: Digitação fluida sem pulo de cursor e texto em **Preto Puro (`#000000`)**.
  - Criação de novos modelos (Residencial, Comercial, Temporada) e pré-visualização instantânea preenchida com dados reais.

---

### 2.7 Assinatura Digital de Contratos (`/assinar/contrato/[token]`)
- **Roteiro de Vídeo**: *Assinatura digital sem papel: envie pelo WhatsApp e receba assinado na hora.*
- **Recursos Exibidos**:
  - Link público seguro com token único enviado diretamente ao WhatsApp ou e-mail do locatário.
  - Leitura completa do contrato no celular, tablet ou computador.
  - **Quadro de Assinatura Digital Touch**: O locatário assina com o dedo na tela do celular ou com o mouse.
  - **Auditoria Jurídica**: Gravação de endereço IP, data, hora e carimbo de autenticação.
  - Download imediato do PDF assinado contendo o certificado visual de assinatura.

---

### 2.8 Vistorias e Checklists Digitais com Fotos (`/vistorias`)
- **Roteiro de Vídeo**: *Vistorias de entrada e saída com fotos pelo celular e laudos periciais.*
- **Recursos Exibidos**:
  - Criação de Vistorias de **Entrada** (na entrega das chaves) e **Saída** (na devolução do imóvel).
  - Checklist detalhado por cômodo (Pintura, Elétrica, Hidráulica, Móveis, Ar-condicionado, Eletrodomésticos).
  - Status por item: **OK** (verde), **Atenção** (amarelo), **Avaria** (vermelho) com campo para observações detalhadas.
  - **Captura Multimodal de Fotos**:
    1. **📷 Câmera Direta**: Aciona a câmera nativa do celular/tablet para foto rápida;
    2. **📹 Câmera Ao Vivo / Webcam**: Preview em tempo real com troca entre câmera frontal e traseira no navegador;
    3. **📁 Galeria**: Seleção de fotos armazenadas no aparelho.
  - **Laudo de Vistoria em PDF**: Gera laudo fotográfico em alta definição com cabeçalho White Clean, miniaturas ampliadas e assinaturas do vistoriador e locatário.

---

### 2.9 Link Público e Interativo de Vistoria para o Locatário (`/assinar/vistoria/[token]`)
- **Roteiro de Vídeo**: *Vistoria colaborativa: o inquilino confere os itens e assina no próprio celular.*
- **Recursos Exibidos**:
  - O locatário abre o link no celular, visualiza todos os itens e pode adicionar apontamentos ou fotos de detalhes.
  - Coleta da assinatura na tela touch.
  - **Automação de Status do Imóvel**:
    - Assinatura da Vistoria de **Entrada** -> Imóvel muda automaticamente para **`OCUPADO`**.
    - Assinatura da Vistoria de **Saída** -> Imóvel muda automaticamente para **`DISPONIVEL`**.

---

### 2.10 Agenda de Ocupação e Reservas por Temporada (`/agenda`)
- **Roteiro de Vídeo**: *Mapa de reservas estilo Airbnb/Booking para locação por temporada.*
- **Recursos Exibidos**:
  - Calendário visual com timeline horizontal de todos os flats.
  - Criação rápida de reserva informando data de check-in, check-out, hóspede e quantidade de diárias.
  - Bloqueio de datas para manutenção e cálculo automático do valor total da estadia.

---

### 2.11 Módulo Financeiro: Contas a Receber, Contas a Pagar e Caixa (`/financeiro`)
- **Roteiro de Vídeo**: *Gestão financeira completa, emissão de recibos e controle de inadimplência.*
- **Recursos Exibidos**:
  - **Contas a Receber**: Listagem de todas as parcelas com filtros por competência (`Ref: MM-AAAA`), status (Pendente, Pago, Atrasado) e locatário.
  - **Baixa Manual ou Automática**: Registro de recebimento com data, valor pago e forma de pagamento.
  - **Emissão de Recibos em PDF**: Recibo oficial de pagamento de aluguel gerado com 1 clique e disparo por WhatsApp.
  - **Contas a Pagar**: Lançamento de despesas operacionais (energia, água, condomínio, manutenção, limpeza).
  - **Relatórios Financeiros em PDF**: Extrato de receitas vs despesas, lucratividade e demonstrativo de repasse ao proprietário.

---

### 2.12 Integração com Banco Inter (API Cobrança v3 - Boleto com Pix / Bolepix)
- **Roteiro de Vídeo**: *Emissão de Boleto com Pix pelo Banco Inter e baixa automática no sistema.*
- **Recursos Exibidos**:
  - **Autenticação mTLS Segura**: Conexão com certificados digitais `.crt` e `.key` em ambiente de Produção ou Sandbox.
  - **Emissão de Cobrança com 1 Clique**: Gera o boleto oficial com código de barras, linha digitável e QR Code Pix dinâmico.
  - **Envio no WhatsApp com Anexo PDF**: Dispara o PDF oficial do boleto + Pix Copia e Cola diretamente no WhatsApp do inquilino.
  - **Baixa Automática Instantânea (Webhook)**: Quando o cliente paga no app de qualquer banco, o Banco Inter notifica o sistema via Webhook e a parcela é liquidada como **`PAGO`** em menos de 2 segundos.
  - **Sincronização em Lote**: Botão *"Sincronizar com Inter"* para conciliar todas as cobranças pendentes de uma só vez.

---

### 2.13 Integração com WhatsApp via Evolution API
- **Roteiro de Vídeo**: *Automação de atendimento e envio direto de PDFs no WhatsApp do cliente.*
- **Recursos Exibidos**:
  - Conexão simples via QR Code na tela de Parâmetros com status da instância em tempo real.
  - **Envio Direto de Mídia PDF**: Contratos, Laudos de Vistoria, Recibos e Boletos enviados como arquivos `.PDF` nativos anexados.
  - **Mensagens Humanizadas**: Textos formatados com saudação amigável e link direto isolado para garantir clique no celular.

---

### 2.14 Painel de Parâmetros e Configurações (`/parametros`)
- **Roteiro de Vídeo**: *Configurações da empresa, logomarca, certificados e integrações.*
- **Recursos Exibidos**:
  - **Dados da Empresa**: Nome fantasia, CNPJ, telefone, endereço, upload da logomarca e da assinatura digital do gestor.
  - **Configurações de E-mail (SMTP)**: Servidor SMTP com porta, SSL/TLS, credenciais e botão de teste de disparo.
  - **Configurações do WhatsApp (Evolution API)**: Conexão, geração de QR Code e verificação de status online.
  - **Configurações do Banco Inter**: Client ID, Client Secret, upload dos certificados mTLS e registro do Webhook com 1 clique.
  - **Gestão de Funcionários / Usuários**: Controle de acessos com níveis de Administrador e Operador.
  - **Formas de Pagamento**: Cadastro de métodos aceitos (Bolepix, Pix, Transferência, Dinheiro, Cartão).

---

### 2.15 Módulo SaaS, Planos Dinâmicos e Renovação Automática (`/parametros?aba=saas` e `/renovar`)
- **Roteiro de Vídeo**: *Como funciona o modelo SaaS, cobrança recorrente e liberação de planos.*
- **Recursos Exibidos**:
  - **Gestão de Planos pelo Super Admin**:
    - Configuração de valores (Mensal, Trimestral, Semestral, Anual) e limites (Imóveis, Usuários, Vistorias, Storage) direto pela interface.
    - Botão para restaurar valores padrão de fábrica com 1 clique.
  - **Gestão de Empresas Clientes**:
    - Listagem de todas as imobiliárias cadastradas com status (`TRIAL`, `ATIVO`, `BLOQUEADO`).
    - Modal de Liberação Rápida de Acesso (adicionar dias ou meses de assinatura).
    - Disparo de avisos automáticos de vencimento por WhatsApp.
  - **Tela de Renovação do Cliente (`/renovar`)**:
    - Escolha de planos e ciclo (Mensal ou Anual com desconto).
    - **Geração de Bolepix Oficial do Banco Inter** com QR Code Pix na tela.
    - **Dupla Reconciliação em Tempo Real (v1.86)**: O sistema recebe a baixa pelo Webhook ou consulta ativamente a API a cada 3 segundos, liberando o acesso na hora com mensagem de sucesso.

---

## 3. Padrões de Projeto e Regras Técnicas Estritas

1. **Padronização Visual de PDFs (White Clean Universal)**:
   - Todo documento PDF (**Recibos, Contratos, Vistorias e Relatórios**) utiliza obrigatoriamente `drawStandardPDFHeader` de `src/lib/pdfHeaderBuilder.ts`.
   - **Fundo 100% Branco Clean (`#ffffff`)** com títulos em Azul Marinho (`#1e3a8a`) e faixas de acabamento em Cinza Claro (`#f1f5f9`). Proibido fundo azul.
   - Rodapé de créditos obrigatório: `Desenvolvimento: pajotecnologia.com.br (87)996540551`.

2. **Armazenamento de Imagens e Compressão WebP**:
   - Todas as fotos de flats, itens de vistoria, assinaturas e logomarcas são convertidas para Data URIs Base64 após compressão com Sharp (`src/lib/imageOptimizer.ts`) e armazenadas nas colunas PostgreSQL, garantindo que nenhum deploy ou rebuild apague imagens.

3. **Porta e Infraestrutura VPS (Coolify)**:
   - Porta oficial da aplicação: **3010**.
   - Toda alteração de código deve ser comitada e enviada automaticamente via `git push origin master`.
   - A versão em `src/lib/version.ts` e `package.json` deve ser incrementada a cada nova entrega.
   - **REGRA ABSOLUTA**: Jamais rodar `npx next build` enquanto `next dev` estiver rodando localmente para evitar corrupção de cache CSS.
