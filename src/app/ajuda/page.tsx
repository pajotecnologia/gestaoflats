"use client";

import React, { useState } from "react";
import Shell from "@/components/layout/Shell";
import {
  BookOpen,
  Building2,
  Phone,
  Home,
  Users,
  FileText,
  ClipboardCheck,
  DollarSign,
  Zap,
  CheckCircle2,
  Camera,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function AjudaPage() {
  const [activeTopic, setActiveTopic] = useState("passo1");
  const [search, setSearch] = useState("");

  const topics = [
    {
      id: "passo1",
      icon: Building2,
      title: "1. Dados da Empresa & Logotipo",
      desc: "Como cadastrar CNPJ, endereço, logomarca e assinatura para sair nos relatórios PDF.",
      badge: "Configuração",
    },
    {
      id: "passo2",
      icon: Phone,
      title: "2. Conectar WhatsApp (Evolution API)",
      desc: "Como parear o QR Code para envio de contratos, cobranças e recibos automáticos.",
      badge: "Integração",
    },
    {
      id: "passo3",
      icon: Building2,
      title: "3. Cadastrar Condomínios / Edifícios",
      desc: "Cadastrando os prédios e locais onde os flats estão situados.",
      badge: "Cadastros",
    },
    {
      id: "passo4",
      icon: Home,
      title: "4. Cadastrar Flats & Imóveis",
      desc: "Definir números, fotos com câmera/celular, descrição de mobília e valores de locação.",
      badge: "Cadastros",
    },
    {
      id: "passo5",
      icon: Users,
      title: "5. Cadastrar Locatários",
      desc: "Informações pessoais, CPF, RG e telefone/WhatsApp dos inquilinos.",
      badge: "Cadastros",
    },
    {
      id: "passo6",
      icon: FileText,
      title: "6. Emissão de Contratos & Tags",
      desc: "Emissão de contratos residenciais (meses) ou temporada (dias) com envio em PDF.",
      badge: "Operação",
    },
    {
      id: "passo7",
      icon: ClipboardCheck,
      title: "7. Vistorias com Fotos & Câmera",
      desc: "Laudos de entrada e saída com captura de fotos na câmera, webcam e assinatura na tela.",
      badge: "Operação",
    },
    {
      id: "passo8",
      icon: DollarSign,
      title: "8. Financeiro, Baixas & Recibos",
      desc: "Contas a receber, quitação de parcelas com comprovantes e envio de recibos no WhatsApp.",
      badge: "Financeiro",
    },
    {
      id: "passo9",
      icon: Zap,
      title: "9. Teste Grátis & Planos SaaS",
      desc: "Controle de dias restantes, pagamentos via PIX e liberação de acesso.",
      badge: "Assinatura",
    },
  ];

  const filteredTopics = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-blue-800/40 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" /> Central de Ajuda & Onboarding
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Manual de Primeiros Passos</h1>
            <p className="text-sm text-slate-400 mt-1">
              Siga o passo a passo ilustrado para configurar e operar 100% das funções do sistema.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar no manual..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Navegação Lateral dos Tópicos */}
          <div className="lg:col-span-4 space-y-2">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const isActive = activeTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  className={`w-full text-left p-4 rounded-xl border transition flex items-start gap-3.5 ${
                    isActive
                      ? "bg-blue-950/50 border-blue-500 shadow-md text-white"
                      : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg shrink-0 ${
                      isActive ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">{topic.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
                        {topic.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{topic.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Área de Leitura do Passo Selecionado */}
          <div className="lg:col-span-8 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-xl">
            {activeTopic === "passo1" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Passo 1: Dados da Empresa & Logomarca</h2>
                    <p className="text-xs text-slate-400">Personalize os cabeçalhos de todos os documentos gerados</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <p>
                    Para que seus contratos de locação, recibos de aluguel e laudos de vistoria sejam emitidos com o logotipo e dados oficiais da sua imobiliária/empresa:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs md:text-sm text-slate-300">
                    <li>No menu lateral esquerdo, clique em <strong>⚙️ Parâmetros</strong>.</li>
                    <li>Na aba <strong>Dados da Empresa</strong>, preencha o Nome Fantasia, Razão Social, CNPJ, E-mail e Telefone.</li>
                    <li>Informe o Endereço Físico completo da sua sede (Rua, Cidade, Estado e CEP).</li>
                    <li><strong>Upload do Logotipo</strong>: Faça upload da imagem do seu logo (PNG ou JPG transparente). O sistema redimensiona e otimiza automaticamente para os PDFs.</li>
                    <li><strong>Upload da Assinatura Digital</strong>: Anexe a assinatura/rubrica do responsável para sair automaticamente no rodapé dos laudos e contratos.</li>
                    <li>Clique no botão <strong>💾 Salvar Dados da Empresa</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo2" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="p-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Passo 2: Conexão com WhatsApp (Evolution API)</h2>
                    <p className="text-xs text-slate-400">Envio direto de PDFs e mensagens com 1 clique</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <p>
                    O sistema integra-se diretamente com a <strong>Evolution API</strong> para envio automático de cobranças, recibos com comprovante e links de assinatura digital:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs md:text-sm text-slate-300">
                    <li>Acesse <strong>⚙️ Parâmetros</strong> → Aba <strong>WhatsApp (Evolution API)</strong>.</li>
                    <li>Informe a <strong>URL da API</strong>, a <strong>Chave Global (API Key)</strong> e o <strong>Nome da Instância</strong>.</li>
                    <li>Clique em <strong>Salvar Parâmetros</strong> e depois em <strong>📱 Conectar / Gerar QR Code</strong>.</li>
                    <li>No WhatsApp do seu celular, abra <strong>Aparelhos Conectados → Conectar um Aparelho</strong> e leia o QR Code na tela.</li>
                    <li>Assim que conectado, o status mudará para <span className="text-emerald-400 font-bold">🟢 CONECTADO</span>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo3" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Passo 3: Cadastrar Condomínios / Edifícios</h2>
                    <p className="text-xs text-slate-400">Organize seus imóveis por condomínio ou prédio</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <p>
                    Cadastre primeiro os edifícios, condomínios ou residenciais onde os seus flats estão localizados:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs md:text-sm text-slate-300">
                    <li>No menu lateral, clique em <strong>🏢 Locais / Condomínios</strong>.</li>
                    <li>Clique no botão <strong>➕ Novo Condomínio / Local</strong>.</li>
                    <li>Informe o nome do edifício (ex: <em>Residencial Praia Formosa</em>) e o endereço completo.</li>
                    <li>Clique em <strong>Salvar</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo4" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="p-3 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Passo 4: Cadastrar Flats & Imóveis</h2>
                    <p className="text-xs text-slate-400">Defina os flats, fotos, valores de locação e mobília</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs md:text-sm text-slate-300">
                    <li>No menu lateral, clique em <strong>🏠 Flats / Imóveis</strong>.</li>
                    <li>Clique em <strong>➕ Novo Flat</strong>.</li>
                    <li>Selecione o Condomínio/Local correspondente.</li>
                    <li>Informe o número do apartamento (ex: <em>Flat 101 - Vista Mar</em>), o valor padrão do aluguel ou diária e o status inicial (<em>DISPONÍVEL</em> ou <em>OCUPADO</em>).</li>
                    <li><strong>Fotos do Flat</strong>: Tire fotos direto da câmera do smartphone ou selecione da galeria/computador.</li>
                    <li>Clique em <strong>Salvar Flat</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo5" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="p-3 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Passo 5: Cadastrar Locatários</h2>
                    <p className="text-xs text-slate-400">Gerencie todos os inquilinos e seus contatos</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs md:text-sm text-slate-300">
                    <li>Acesse o menu <strong>👥 Locatários</strong>.</li>
                    <li>Clique em <strong>➕ Novo Locatário</strong>.</li>
                    <li>Informe o Nome Completo, CPF, RG, E-mail e o número de <strong>Telefone / WhatsApp com DDD</strong>.</li>
                    <li>Preencha o endereço de residência do locatário e clique em <strong>Salvar</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo6" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Passo 6: Modelos & Emissão de Contratos</h2>
                    <p className="text-xs text-slate-400">Contratos anuais (meses) ou temporadas (diárias)</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs md:text-sm text-slate-300">
                    <li>Acesse <strong>📄 Contratos</strong> → <strong>➕ Emitir Contrato</strong>.</li>
                    <li>Selecione o Locatário e o Flat.</li>
                    <li>Escolha a validade:
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-400">
                        <li><strong>MESES</strong>: Gera parcelas mensais no Contas a Receber (ex: 12 meses).</li>
                        <li><strong>DIAS</strong>: Locação por temporada (ex: 15 dias) gerando 1 única parcela com valor total.</li>
                      </ul>
                    </li>
                    <li>Informe o valor e dia de vencimento.</li>
                    <li>Clique em <strong>Emitir Contrato</strong> e envie o PDF diretamente pelo WhatsApp do locatário com 1 clique.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo7" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="p-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Passo 7: Vistorias com Fotos na Câmera & Assinatura</h2>
                    <p className="text-xs text-slate-400">Laudos com validade jurídica e fotos comprobatórias</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs md:text-sm text-slate-300">
                    <li>Abra o flat ou contrato e clique em <strong>Checklist / Vistoria</strong>.</li>
                    <li>Selecione <strong>ENTRADA</strong> ou <strong>SAÍDA</strong>.</li>
                    <li>Para cada cômodo e item (Pintura, Portas, Ar, TV, etc.), marque <em>OK</em>, <em>Atenção</em> ou <em>Avaria</em>.</li>
                    <li>Anexe fotos na hora usando <strong>📷 Câmera do Celular</strong>, <strong>📹 Webcam Ao Vivo</strong> ou <strong>📁 Galeria</strong>.</li>
                    <li>Colete a assinatura do vistoriador e do locatário direto na tela ou envie o link público para assinatura à distância.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo8" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="p-3 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Passo 8: Controle de Pagamentos de Clientes & Locatários</h2>
                    <p className="text-xs text-slate-400">Ciclo financeiro completo: da geração do contrato à quitação com recibo</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                      <span>1️⃣ Geração Automática das Parcelas</span>
                    </h3>
                    <p className="text-slate-300">
                      Assim que você emite um contrato no sistema, as parcelas no <strong>Contas a Receber</strong> são criadas automaticamente:
                    </p>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400">
                      <li><strong>Locações por Mês (Anuais/Mensais)</strong>: O sistema gera 1 parcela para cada mês de vigência (ex: 12 parcelas para 12 meses), com a data de vencimento programada para o dia escolhido.</li>
                      <li><strong>Locações por Temporada (Dias)</strong>: O sistema gera 1 parcela única com o valor total do período contratado.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                      <span>2️⃣ Envio de Cobranças pelo WhatsApp</span>
                    </h3>
                    <p className="text-slate-300">
                      No menu <strong>💰 Contas a Receber</strong> ou na tela de detalhes do Flat/Contrato:
                    </p>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400">
                      <li>Localize a parcela a ser cobrada e clique no botão <strong>📱 Enviar Cobrança WhatsApp</strong>.</li>
                      <li>A mensagem é enviada diretamente ao WhatsApp do locatário com o valor, data de vencimento, chave PIX da imobiliária e o PDF da fatura/contrato anexado.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-blue-400 text-sm flex items-center gap-2">
                      <span>3️⃣ Como Dar Baixa / Registrar o Pagamento</span>
                    </h3>
                    <p className="text-slate-300">
                      Quando o locatário efetuar o pagamento via PIX, transferência, dinheiro ou cartão:
                    </p>
                    <ol className="list-decimal list-inside pl-2 space-y-1 text-slate-400">
                      <li>Acesse <strong>Contas a Receber</strong> e clique no botão <strong>💲 Dar Baixa</strong> da parcela correspondente.</li>
                      <li>Confirme ou ajuste a <strong>Data do Pagamento</strong> e o <strong>Valor Efetivamente Pago</strong>.</li>
                      <li>Se aplicável, informe valores de <strong>Desconto</strong> ou <strong>Acréscimo (Multa/Juros por atraso)</strong>.</li>
                      <li>Selecione a <strong>Forma de Pagamento</strong> (PIX, Transferência, Boleto, Dinheiro, etc.).</li>
                      <li><strong>Comprovante</strong>: Você pode anexar a foto ou PDF do comprovante bancário para registro histórico.</li>
                      <li>Clique em <strong>Confirmar Baixa</strong>. O status da parcela mudará imediatamente para <span className="text-emerald-400 font-bold">PAGO</span>.</li>
                    </ol>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-purple-400 text-sm flex items-center gap-2">
                      <span>4️⃣ Emissão e Envio do Recibo Oficial em PDF</span>
                    </h3>
                    <p className="text-slate-300">
                      Após liquidar a parcela, o sistema libera a emissão do <strong>Recibo de Pagamento Oficial</strong>:
                    </p>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400">
                      <li>Clique no botão <strong>🖨️ Imprimir Recibo</strong> para gerar o PDF em folha A4 com logotipo da empresa, endereço, dados do inquilino, assinatura digital e QR Code de autenticidade.</li>
                      <li>Clique no botão <strong>📱 Enviar Recibo no WhatsApp</strong> para disparar o PDF do recibo oficial diretamente no celular do inquilino.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-rose-400 text-sm flex items-center gap-2">
                      <span>5️⃣ Gestão de Inadimplência & Atrasos</span>
                    </h3>
                    <p className="text-slate-300">
                      O sistema monitora diariamente as datas de vencimento:
                    </p>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400">
                      <li>Parcelas com data vencida são destacadas automaticamente em <span className="text-rose-400 font-bold">EM ATRASO</span> com a contagem exata de dias de atraso.</li>
                      <li>Utilize o filtro <strong>Status: Vencidas</strong> no topo do Contas a Receber para listar e renegociar pendências com rapidez.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                      <span>6️⃣ Relatórios Financeiros & Fluxo de Caixa</span>
                    </h3>
                    <p className="text-slate-300">
                      No menu lateral <strong>📊 Relatórios</strong>, você tem acesso aos consolidados:
                    </p>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-slate-400">
                      <li><strong>Relatório - Contas a Receber</strong>: Extrato completo de valores recebidos e a receber por condomínio, flat ou locatário.</li>
                      <li><strong>Relatório - Contas a Pagar</strong>: Controle de despesas (condomínio, energia, manutenção, faxina, fornecedores).</li>
                      <li><strong>Fluxo de Caixa Diário</strong>: Demonstrativo de entradas vs saídas com saldo líquido em tempo real.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTopic === "passo9" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                  <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Passo 9: Teste Grátis & Planos SaaS</h2>
                    <p className="text-xs text-slate-400">Acompanhe seu período de teste e renove via PIX</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <p>
                    O sistema possui contagem regressiva de dias de teste no topo da tela. Ao término ou a qualquer momento durante o teste:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs md:text-sm text-slate-300">
                    <li>Clique no botão <strong>⚡ Ver Planos & Renovar</strong> no topo do painel.</li>
                    <li>Escolha o plano (Mensal, Trimestral, Semestral ou Anual com desconto).</li>
                    <li>Copie o código <strong>PIX Copia e Cola</strong> ou aponte a câmera do seu banco para o <strong>QR Code</strong>.</li>
                    <li>Clique em <strong>📱 Enviar Comprovante no WhatsApp</strong> para que nossa equipe libere seu acesso imediatamente.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
