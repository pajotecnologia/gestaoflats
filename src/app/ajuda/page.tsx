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
  FileCode,
  ClipboardCheck,
  DollarSign,
  Zap,
  CheckCircle2,
  Camera,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Truck,
  CreditCard,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";

export default function AjudaPage() {
  const [activeTopic, setActiveTopic] = useState("passo1");
  const [search, setSearch] = useState("");

  const topics = [
    {
      id: "passo1",
      icon: Building2,
      title: "1. Dados da Empresa & Logotipo",
      desc: "Como cadastrar CNPJ, endereço, logomarca, chave PIX e assinatura para documentos PDF.",
      badge: "Configuração",
    },
    {
      id: "passo2",
      icon: Phone,
      title: "2. Conectar WhatsApp (Evolution API)",
      desc: "Como parear o QR Code para envio direto de contratos em PDF, cobranças e recibos.",
      badge: "Integração",
    },
    {
      id: "passo3",
      icon: Building2,
      title: "3. Flats, Condomínios & Fornecedores",
      desc: "Cadastre condomínios, apartamentos/flats com fotos da câmera e prestadores de serviço.",
      badge: "Cadastros",
    },
    {
      id: "passo4",
      icon: Users,
      title: "4. Locatários & Inquilinos",
      desc: "Cadastro completo com CPF/CNPJ, RG, WhatsApp com DDD e endereço do locatário.",
      badge: "Cadastros",
    },
    {
      id: "passo5",
      icon: Calendar,
      title: "5. Agenda de Reservas & Temporada",
      desc: "Controle de diárias, bloqueio de calendário, cálculo de noites e geração de cobrança.",
      badge: "Operação",
    },
    {
      id: "passo6",
      icon: ClipboardCheck,
      title: "6. Modelos de Checklist & Vistorias (1º Passo)",
      desc: "Laudo com câmera do celular, webcam, laudo em PDF e link público de assinatura.",
      badge: "Vistorias",
    },
    {
      id: "passo7",
      icon: FileText,
      title: "7. Modelos & Gestão de Contratos (2º Passo)",
      desc: "Editor de modelos com tags dinâmicas, vigência em meses/dias e assinatura digital.",
      badge: "Contratos",
    },
    {
      id: "passo8",
      icon: DollarSign,
      title: "8. Financeiro, Bolepix Banco Inter & Recibos",
      desc: "Contas a receber, emissão de Boletos com Pix, baixa automática e recibos no WhatsApp.",
      badge: "Financeiro",
    },
    {
      id: "passo9",
      icon: ShieldCheck,
      title: "9. Relatórios, Auditoria & Blockchain",
      desc: "Fluxo de caixa diário, laudos em branco e carimbo de tempo OpenTimestamps.",
      badge: "Auditoria",
    },
    {
      id: "passo10",
      icon: Zap,
      title: "10. Teste Grátis & Planos SaaS",
      desc: "Controle de dias restantes, renovação via PIX instantâneo e liberação de acesso.",
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
        {/* Header (Clean White / Dark Standard) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" /> Central de Ajuda & Onboarding
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Manual de Primeiros Passos</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Siga o fluxo recomendado para operar 100% dos módulos com eficiência e segurança jurídica.
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
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
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
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-xs text-blue-900 dark:text-blue-100"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isActive ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">{topic.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                        {topic.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{topic.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Área de Leitura do Passo Selecionado */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
            {activeTopic === "passo1" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 1: Dados da Empresa, Chave PIX & Logomarca</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Personalize os cabeçalhos de todos os documentos e a chave PIX de recebimento</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    Para que seus contratos de locação, recibos de aluguel e laudos de vistoria sejam emitidos com o logotipo oficial e chave PIX:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <li>No menu lateral esquerdo, clique em <strong>⚙️ Parâmetros do Sistema</strong>.</li>
                    <li>Na aba <strong>Dados da Empresa</strong>, preencha o Nome Fantasia, Razão Social, CNPJ, E-mail e Telefone.</li>
                    <li>Informe o Endereço Físico completo da sua sede (Rua, Cidade, Estado e CEP).</li>
                    <li><strong>🔑 Chave PIX de Recebimento</strong>: Informe sua chave PIX (CNPJ, CPF, E-mail, Celular ou Aleatória), Nome do Beneficiário e Cidade. Esta chave será enviada automaticamente nas mensagens de cobrança aos locatários.</li>
                    <li><strong>Upload do Logotipo (até 5MB)</strong>: Faça upload da imagem do seu logo (PNG ou JPG transparente). O sistema padroniza no cabeçalho limpo universal (White Clean).</li>
                    <li><strong>Upload da Assinatura Digital</strong>: Anexe a assinatura/rubrica do responsável para sair automaticamente no rodapé dos laudos e contratos.</li>
                    <li>Clique no botão <strong>💾 Salvar Dados da Empresa</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo2" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 2: Conexão com WhatsApp (Evolution API)</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Envio direto de PDFs anexados e mensagens com 1 clique</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    O sistema integra-se diretamente com a <strong>Evolution API</strong> para disparo direto dos arquivos PDF (Contratos, Laudos de Vistoria, Boletos e Recibos):
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <li>Acesse <strong>⚙️ Parâmetros do Sistema</strong> → Aba <strong>WhatsApp (Evolution API)</strong>.</li>
                    <li>Informe a <strong>URL da API</strong>, a <strong>Chave Global (API Key)</strong> e o <strong>Nome da Instância</strong>.</li>
                    <li>Clique em <strong>Salvar Parâmetros</strong> e depois em <strong>📱 Conectar / Gerar QR Code</strong>.</li>
                    <li>No WhatsApp do seu celular, abra <strong>Aparelhos Conectados → Conectar um Aparelho</strong> e leia o QR Code na tela.</li>
                    <li>Assim que conectado, o status mudará para <span className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 CONECTADO</span>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo3" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 3: Flats, Condomínios & Fornecedores</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Organize seus imóveis por condomínio ou prédio e cadastre prestadores</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <li>No menu lateral <strong>IMÓVEIS & CADASTROS</strong>, acesse <strong>🏢 Flats & Condomínios</strong>.</li>
                    <li>Cadastre primeiro os edifícios na aba <strong>Condomínios</strong> com nome e endereço completo.</li>
                    <li>Na aba <strong>Flats / Imóveis</strong>, clique em <strong>➕ Novo Flat</strong>.</li>
                    <li>Informe o número/identificação, condomínio, valor padrão da diária ou aluguel e status inicial (<em>DISPONÍVEL</em>).</li>
                    <li><strong>Fotos do Flat</strong>: Tire fotos direto da câmera do smartphone ou selecione da galeria/computador.</li>
                    <li>No menu <strong>Fornecedores</strong>, cadastre empresas de energia, condomínio, manutenção, limpeza e internet para controle no Contas a Pagar.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo4" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 4: Locatários & Inquilinos</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie todos os inquilinos e seus contatos</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <li>Acesse o menu <strong>👥 Locatários</strong>.</li>
                    <li>Clique em <strong>➕ Novo Locatário</strong>.</li>
                    <li>Informe o Nome Completo, CPF/CNPJ, RG, E-mail e o número de <strong>Telefone / WhatsApp com DDD</strong> (formatado com máscara automática).</li>
                    <li>Preencha o endereço completo do locatário (essencial para emissão de Boletos com Pix no Banco Inter) e clique em <strong>Salvar</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo5" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 5: Agenda de Reservas por Diárias / Temporada</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Visualização de calendário para locações de curta duração</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <li>No menu lateral <strong>PRINCIPAL</strong>, clique em <strong>📅 Agenda de Reservas</strong>.</li>
                    <li>Selecione o Flat/Imóvel desejado no topo da tela para carregar o calendário mensal.</li>
                    <li>Clique no dia desejado ou no botão <strong>➕ Nova Reserva</strong>.</li>
                    <li>Defina a Data de Check-in e Check-out: o sistema calcula automaticamente a quantidade de noites e o valor total.</li>
                    <li>Selecione o Locatário e confirme a reserva. O período é bloqueado no calendário e é gerada 1 única parcela no Contas a Receber.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo6" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 6: Modelos de Checklist & Vistorias (1º Passo Obrigatório)</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fluxo sequencial: 1º Vistoria de Entrada → 2º Contrato → 3º Vistoria de Saída</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    No novo fluxo operacional do sistema, a vistoria é realizada antes da assinatura do contrato:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <li>No menu <strong>CONTRATOS & VISTORIAS</strong>, acesse <strong>📋 Modelos de Checklist</strong> para criar seus modelos personalizados de vistoria.</li>
                    <li>Ao alugar um flat, inicie pela <strong>1. Vistoria de Entrada</strong>.</li>
                    <li>Avalie cada cômodo marcando <em>OK</em>, <em>Atenção</em> ou <em>Avaria</em>.</li>
                    <li>Tire fotos comprovatórias usando <strong>📷 Câmera Direta</strong>, <strong>📹 Webcam Ao Vivo</strong> ou <strong>📁 Galeria</strong>.</li>
                    <li>Colete a assinatura na tela ou clique em <strong>Gerar Link Vistoria</strong> para enviar o link público interativo pelo WhatsApp do locatário.</li>
                    <li>Ao assinar a vistoria de entrada, o flat muda para <strong>OCUPADO</strong>. Na vistoria de saída, o flat é liberado automaticamente como <strong>DISPONÍVEL</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo7" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 7: Modelos & Gestão de Contratos (2º Passo)</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Editor visual com tags dinâmicas, vigência em Meses/Dias e assinatura digital</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <li>Acesse <strong>📄 Modelos de Contrato</strong> para editar suas minutas com o editor visual (Drag & Drop de tags, cor preta mandatória e formatação A4).</li>
                    <li>Em <strong>Gestão de Contratos</strong>, clique em <strong>➕ Emitir Contrato</strong> e selecione o modelo, o locatário e o flat.</li>
                    <li>Escolha a vigência: <strong>MESES</strong> (aluguel tradicional com parcelas mensais) ou <strong>DIAS</strong> (temporada com parcela única).</li>
                    <li>Após salvar, gere o <strong>Link de Assinatura</strong> para o inquilino assinar digitalmente pelo celular.</li>
                    <li>O contrato exibe todas as cláusulas preenchidas e gera o PDF oficial com cabeçalho limpo universal (White Clean).</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo8" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 8: Financeiro, Bolepix Banco Inter & Recibos</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Emissão de boletos com QR Code Pix, baixa automática e envio de recibos</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                      <span>1️⃣ Integração Banco Inter (Boleto com Pix / Bolepix)</span>
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Configure seus certificados mTLS (.crt e .key) e Client ID/Secret do Banco Inter em <strong>Parâmetros → Formas de Pagamento</strong> para emitir cobranças com código de barras e QR Code Pix simultâneos.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                      <span>2️⃣ Envio Direto de Cobranças pelo WhatsApp</span>
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Na listagem de <strong>Contas a Receber</strong>, clique no botão WhatsApp para enviar o PDF do boleto oficial do Banco Inter anexado, com a Linha Digitável e o Pix Copia e Cola formatados.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2">
                      <span>3️⃣ Baixa Automática e Conciliação</span>
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      O webhook do Banco Inter liquida as parcelas em tempo real assim que o locatário paga via Pix ou compensação de boleto. Você também pode sincronizar todas as cobranças pendentes com 1 clique no botão <strong>🔄 Sincronizar Inter</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-purple-600 dark:text-purple-400 text-sm flex items-center gap-2">
                      <span>4️⃣ Recibo Oficial de Pagamento em PDF</span>
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Após a liquidação da parcela, clique em <strong>🖨️ Imprimir Recibo</strong> ou <strong>📱 Enviar Recibo WhatsApp</strong> para gerar o documento A4 com logotipo oficial, comprovante e assinatura digital.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTopic === "passo9" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 9: Relatórios, Auditoria & Blockchain</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Extratos consolidados e imutabilidade jurídica dos documentos</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    No menu <strong>RELATÓRIOS & CONFIGURAÇÃO</strong>, você tem acesso a relatórios completos:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <li><strong>Contratos & Blockchain</strong>: Consulta o carimbo de tempo OpenTimestamps registrado na rede Bitcoin para prova incontestável da data e integridade do contrato.</li>
                    <li><strong>Checklist (Em Branco)</strong>: Gera uma folha impressa de vistoria para preenchimento manual em campo quando não houver conexão de internet.</li>
                    <li><strong>Relatórios Financeiros</strong>: Extratos de Contas a Receber, Contas a Pagar e Fluxo de Caixa Diário.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTopic === "passo10" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Passo 10: Teste Grátis & Planos SaaS</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Acompanhe seu período de teste e renove via PIX instantâneo</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    O sistema possui contagem regressiva de dias de teste no topo da tela. Ao término ou a qualquer momento durante o teste:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 pl-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
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

