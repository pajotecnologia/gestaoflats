# 📘 Manual de Primeiros Passos — Gestão de Flats (SaaS)

> Guia prático passo a passo para configurar e utilizar todas as funcionalidades do sistema **Gestão de Flats**.

---

## 📑 Sumário

1. [Visão Geral & Primeiro Acesso](#1-visão-geral--primeiro-acesso)
2. [Passo 1: Dados da Empresa & Logomarca](#passo-1-dados-da-empresa--logomarca)
3. [Passo 2: Conexão com o WhatsApp (Evolution API)](#passo-2-conexão-com-o-whatsapp-evolution-api)
4. [Passo 3: Cadastro de Condomínios / Edifícios (Locais)](#passo-3-cadastro-de-condomínios--edifícios-locais)
5. [Passo 4: Cadastro de Flats & Imóveis](#passo-4-cadastro-de-flats--imóveis)
6. [Passo 5: Cadastro de Locatários](#passo-5-cadastro-de-locatários)
7. [Passo 6: Modelos e Emissão de Contratos de Locação](#passo-6-modelos-e-emissão-de-contratos-de-locação)
8. [Passo 7: Realização de Vistorias / Checklists (Câmera & Fotos)](#passo-7-realização-de-vistorias--checklists-câmera--fotos)
9. [Passo 8: Gestão Financeira (Contas a Receber, Baixas e Recibos PDF)](#passo-8-gestão-financeira-contas-a-receber-baixas-e-recibos-pdf)
10. [Passo 9: Período de Teste Grátis & Renovação de Acesso](#passo-9-período-de-teste-grátis--renovação-de-acesso)

---

## 1. Visão Geral & Primeiro Acesso

* **Acesso Web**: Acesse o sistema pelo navegador através do link oficial (ex: `https://gestaoflats.pajotech.com.br`).
* **Credenciais**: Insira seu e-mail e senha de administrador cadastrados.
* **Layout Responsivo**: O sistema pode ser utilizado no **Computador**, **Notebook**, **Tablet** e **Celular (Smartphone)**.

---

## Passo 1: Dados da Empresa & Logomarca

Para que seus contratos, recibos e laudos de vistoria sejam gerados com a identidade visual da sua empresa:

1. No menu lateral, acesse **⚙️ Parâmetros** → Aba **Dados da Empresa**.
2. Preencha os campos:
   * **Nome Fantasia** e **Razão Social**.
   * **CNPJ**, **E-mail de Contato** e **Telefone / WhatsApp**.
   * **Endereço Completo** (Rua, Número, Bairro, Cidade, Estado e CEP).
3. **Upload da Logomarca**:
   * Clique no quadro de logomarca e selecione o arquivo da sua logo (PNG ou JPG, máx 5MB).
4. **Upload da Assinatura / Carimbo**:
   * Anexe a imagem da sua assinatura ou rubrica digitalizada para sair automaticamente nos documentos.
5. Clique no botão **💾 Salvar Dados da Empresa**.

---

## Passo 2: Conexão com o WhatsApp (Evolution API)

O sistema envia PDFs de contratos, cobranças, laudos de vistoria e recibos diretamente pelo WhatsApp:

1. No menu **⚙️ Parâmetros**, clique na aba **WhatsApp (Evolution API)**.
2. Informe:
   * **URL da Evolution API** (Ex: `https://api.whatsapp.suaempresa.com.br`).
   * **API Key Global**.
   * **Nome da Instância**.
3. Clique em **Salvar Parâmetros**.
4. Clique em **📱 Conectar / Gerar QR Code**:
   * Abra o WhatsApp no celular → **Aparelhos Conectados** → **Conectar um Aparelho**.
   * Aponte a câmera para o QR Code exibido na tela.
5. O status mudará para **🟢 CONECTADO**.

---

## Passo 3: Cadastro de Condomínios / Edifícios (Locais)

Antes de cadastrar os apartamentos/flats, cadastre os prédios ou condomínios onde eles estão localizados:

1. No menu lateral, clique em **🏢 Locais / Condomínios**.
2. Clique no botão **➕ Novo Condomínio / Local**.
3. Informe o **Nome do Edifício** (ex: *Residencial Praia Formosa*) e o **Endereço Completo**.
4. Clique em **Salvar**.

---

## Passo 4: Cadastro de Flats & Imóveis

1. No menu lateral, clique em **🏠 Flats / Imóveis**.
2. Clique em **➕ Novo Flat**.
3. Selecione o **Condomínio / Local**.
4. Informe:
   * **Número / Identificação** (ex: *Flat 302 - Bloco A*).
   * **Valor Padrão de Aluguel / Diária** (R$).
   * **Status Inicial**: *DISPONÍVEL*, *OCUPADO* ou *MANUTENÇÃO*.
   * **Descrição & Mobília**: Detalhe os itens inclusos (ar condicionado, cama, TV, cozinha montada, etc.).
5. **Fotos do Flat**:
   * Clique em **Adicionar Fotos** para fazer upload de imagens do flat pelo computador ou direto da câmera do celular.
6. Clique em **Salvar Flat**.

---

## Passo 5: Cadastro de Locatários

1. No menu lateral, clique em **👥 Locatários**.
2. Clique em **➕ Novo Locatário**.
3. Preencha os dados:
   * **Nome Completo**, **CPF** e **RG**.
   * **Data de Nascimento**, **E-mail** e **Telefone / WhatsApp** *(fundamental para envio de mensagens automáticas)*.
   * **Endereço Residencial**.
4. Clique em **Salvar Locatário**.

---

## Passo 6: Modelos e Emissão de Contratos de Locação

### 6.1. Personalizar o Modelo de Contrato
1. Acesse **📄 Contratos** → **Modelos de Contrato**.
2. Utilize o editor visual estilo Word/A4 para ajustar as cláusulas.
3. Você pode arrastar as **tags dinâmicas** (ex: `{{locatario.nome}}`, `{{flat.numero}}`, `{{contrato.valor}}`, `{{empresa.nome}}`) diretamente para o texto.

### 6.2. Emitir um Novo Contrato
1. Acesse **📄 Contratos** → **➕ Emitir Novo Contrato**.
2. Selecione o **Locatário** e o **Flat**.
3. Escolha o **Tipo de Validade**:
   * **MESES** (para locações residenciais/anuais, ex: 12 meses) — gera parcelas mensais no Contas a Receber.
   * **DIAS** (para locações por temporada/diárias, ex: 15 dias) — gera 1 parcela com o valor total.
4. Defina a **Data de Início**, **Valor do Aluguel**, **Dia de Vencimento** e Forma de Pagamento.
5. Clique em **Emitir Contrato**.
6. **Ações Rápidas**:
   * 🖨️ **Imprimir / Baixar PDF**: Gera o documento oficial com cabeçalho limpo e assinatura.
   * 📱 **Enviar por WhatsApp**: Envia o PDF do contrato e link de assinatura direto no celular do locatário.

---

## Passo 7: Realização de Vistorias / Checklists (Câmera & Fotos)

O sistema possui módulo de vistoria completo de **Entrada** e **Saída**:

1. Acesse **📋 Vistorias** ou abra o contrato/flat desejado e clique em **Checklist / Vistoria**.
2. Selecione o tipo (**ENTRADA** ou **SAÍDA**).
3. Para cada item do flat (Pintura, Portas, Ar Condicionado, Banheiro, etc.):
   * Marque a situação: **🟢 OK**, **🟡 Atenção** ou **🔴 Avaria**.
   * Digite observações específicas se necessário.
   * **Anexo de Fotos**:
     * 📷 **Câmera Celular**: Abre a câmera traseira do smartphone na hora.
     * 📹 **Webcam / Ao Vivo**: Captura foto ao vivo pela webcam no computador.
     * 📁 **Galeria**: Seleciona fotos já tiradas.
4. **Assinatura Digital**:
   * O vistoriador e o locatário assinam diretamente na tela (com o dedo no celular/tablet ou mouse no PC).
   * Ou clique em **Gerar Link de Vistoria** para enviar o laudo para o locatário checar e assinar no próprio celular.
5. Clique em **Salvar Vistoria / Gerar Laudo PDF**.

---

## Passo 8: Gestão Financeira (Contas a Receber, Baixas e Recibos PDF)

1. Acesse **💰 Contas a Receber**.
2. Todas as parcelas geradas pelos contratos ativos aparecem listadas com badges de status:
   * 🟢 **PAGO**
   * 🟡 **PENDENTE**
   * 🔴 **ATRASADO**
3. **Dar Baixa em Pagamento**:
   * Clique no botão **💲 Dar Baixa** na parcela.
   * Informe a **Data de Pagamento**, **Valor Recebido** e a **Forma de Pagamento** (ex: PIX, Transferência, Dinheiro).
   * Anexe o comprovante de pagamento se desejar.
   * Ao confirmar, a parcela é quitada automaticamente.
4. **Gerar e Enviar Recibo de Pagamento**:
   * Clique em **🖨️ Recibo PDF** para visualizar o recibo em padrão Clean.
   * Clique em **📱 WhatsApp** para disparar o Recibo em PDF com autenticação e código de verificação para o locatário.

---

## Passo 9: Período de Teste Grátis & Renovação de Acesso

* **Período de Teste**: Todas as novas empresas cadastradas recebem acesso gratuito com todos os recursos liberados durante o período de teste configurado.
* **Contagem Regressiva**: Um contador no topo da tela exibe quantos dias restam do seu teste.
* **Como Renovar**:
  1. Clique em **⚡ Ver Planos & Renovar** ou acesse `/renovar`.
  2. Escolha entre os planos **Mensal**, **Trimestral**, **Semestral** ou **Anual**.
  3. Realize o pagamento pelo **PIX Copia e Cola** ou **QR Code**.
  4. Clique em **📱 Enviar Comprovante no WhatsApp** para ter seu acesso liberado imediatamente pela equipe.

---

### 📞 Suporte Técnico e Dúvidas
* **WhatsApp de Suporte**: `(87) 99654-0551`
* **Site Oficial**: [pajotecnologia.com.br](https://pajotecnologia.com.br)
