"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import ChecklistVistoriaModal from "@/components/flats/ChecklistVistoriaModal";
import ChecklistVistoriaViewModal from "@/components/flats/ChecklistVistoriaViewModal";
import { generateChecklistPDF, getChecklistPDFBase64 } from "@/lib/checklistPdfGenerator";
import { getAppBaseUrl } from "@/lib/baseUrl";
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  UserCheck,
  FileDown,
  MessageSquare,
  Mail,
  ExternalLink,
  Copy,
  Check,
  X,
  Edit3,
  Trash2,
  Sparkles,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Link as LinkIcon,
  ShieldCheck,
} from "lucide-react";

export default function VistoriasPage() {
  const [vistorias, setVistorias] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("TODOS");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterVinculo, setFilterVinculo] = useState("TODOS"); // TODOS, DISPONIVEIS, VINCULADOS

  // Modais de Criação e Visualização
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [selectedLocalId, setSelectedLocalId] = useState("");
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [selectedLocatarioId, setSelectedLocatarioId] = useState("");
  const [selectedTipoVistoria, setSelectedTipoVistoria] = useState<"ENTRADA" | "SAIDA">("ENTRADA");

  // Modal de Edição/Criação do Checklist
  const [activeChecklistModal, setActiveChecklistModal] = useState<any | null>(null);

  // Modal de Visualização (Read-Only)
  const [viewingVistoria, setViewingVistoria] = useState<any | null>(null);

  // Modal Link Assinatura Digital
  const [linkModalVistoria, setLinkModalVistoria] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal Envio por E-mail
  const [emailModalVistoria, setEmailModalVistoria] = useState<any | null>(null);
  const [emailDestino, setEmailDestino] = useState("");
  const [emailAssunto, setEmailAssunto] = useState("");
  const [emailMensagem, setEmailMensagem] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState("");

  // Feedback Geral
  const [feedback, setFeedback] = useState<{ type: string; message: string }>({ type: "", message: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resVistorias, resFlats, resLocais, resLocatarios, resMe, resEmpresa] = await Promise.all([
        fetch("/api/vistorias").then((r) => r.json()),
        fetch("/api/flats").then((r) => r.json()),
        fetch("/api/locais").then((r) => r.json()).catch(() => ({ locais: [] })),
        fetch("/api/locatarios").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/empresa").then((r) => r.json()).catch(() => null),
      ]);

      setVistorias(resVistorias.vistorias || []);
      setFlats(resFlats.flats || []);
      setLocais(resLocais.locais || []);
      setLocatarios(resLocatarios.locatarios || []);
      if (resEmpresa && resEmpresa.nomeFantasia) {
        setEmpresaData(resEmpresa);
      } else if (resMe.user?.empresa) {
        setEmpresaData(resMe.user.empresa);
      }
      if (resMe.user) {
        setCurrentUser(resMe.user);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de vistorias:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtragem dos Flats pelo Condomínio Selecionado no Wizard
  const filteredFlatsForWizard = selectedLocalId
    ? flats.filter((f) => f.localId === selectedLocalId)
    : flats;

  // Handler para Iniciar o Checklist no Modal
  const handleStartChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlatId) {
      alert("Por favor, selecione o Flat / Imóvel.");
      return;
    }

    const flatObj = flats.find((f) => f.id === selectedFlatId);
    const locatarioObj = locatarios.find((l) => l.id === selectedLocatarioId);

    setShowWizardModal(false);

    setActiveChecklistModal({
      flatNumero: flatObj?.numero || "Flat",
      flatId: flatObj?.id,
      locatarioId: locatarioObj?.id,
      locatarioNome: locatarioObj?.nome || "Locatário Não Informado",
      locatarioCpf: locatarioObj?.cpf || "",
      locatarioTelefone: locatarioObj?.telefone || "",
      initialTipoVistoria: selectedTipoVistoria,
      responsavelDefault: currentUser?.nome || "Vistoriador Responsável",
    });
  };

  // Handler para Excluir Vistoria
  const handleDeleteVistoria = async (v: any) => {
    if (v.contratoId) {
      alert(`⚠️ Esta vistoria está vinculada ao Contrato #${v.contratoId.slice(0, 8)} e não pode ser excluída enquanto o contrato existir.`);
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o laudo de vistoria (${v.tipoVistoria}) do Flat ${v.flat?.numero}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/vistorias?id=${v.id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: "success", message: "✅ Vistoria excluída com sucesso!" });
        loadData();
      } else {
        alert(data.error || "Erro ao excluir vistoria.");
      }
    } catch (err: any) {
      alert(`Erro: ${err.message || err}`);
    }
  };

  // Handler para Baixar Laudo PDF White Clean
  const handleDownloadPDF = async (v: any) => {
    let itemsList: any[] = [];
    let obsGerais = "";
    if (v.itensJson) {
      try {
        const parsed = typeof v.itensJson === "string" ? JSON.parse(v.itensJson) : v.itensJson;
        if (Array.isArray(parsed)) itemsList = parsed;
        else if (parsed && typeof parsed === "object") {
          itemsList = parsed.itens || [];
          obsGerais = parsed.observacoesGerais || "";
        }
      } catch (e) {}
    }

    await generateChecklistPDF({
      tipoVistoria: v.tipoVistoria,
      empresaNome: v.empresa?.nomeFantasia || empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: v.empresa?.cnpj || empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: v.empresa?.endereco || empresaData?.endereco,
      empresaTelefone: v.empresa?.telefone || empresaData?.telefone,
      empresaEmail: v.empresa?.email || empresaData?.email,
      empresaLogomarcaUrl: v.empresa?.logomarcaUrl || empresaData?.logomarcaUrl,
      usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
      empresaAssinaturaUrl: currentUser?.assinaturaUrl || v.empresa?.assinaturaUrl || empresaData?.assinaturaUrl,
      locatarioNome: v.locatario?.nome || v.contrato?.locatario?.nome || "Locatário Não Informado",
      locatarioCpf: v.locatario?.cpf || v.contrato?.locatario?.cpf || "Não informado",
      flatNumero: v.flat?.numero || "Flat",
      dataVistoria: new Date(v.dataVistoria || v.createdAt).toLocaleDateString("pt-BR"),
      responsavelVistoria: v.responsavelVistoria || "Vistoriador Responsável",
      itens: itemsList,
      observacoesGerais: obsGerais,
      locatarioAssinaturaUrl: v.assinaturaLocatarioUrl,
      dataAssinaturaLocatario: v.dataAssinaturaLocatario,
      ipAssinaturaLocatario: v.ipAssinaturaLocatario,
    });
  };

  // Handler para Enviar Laudo via WhatsApp com PDF Anexado
  const handleSendWhatsApp = async (v: any) => {
    const telefone = v.locatario?.telefone || v.contrato?.locatario?.telefone;
    if (!telefone) {
      alert("Locatário não possui telefone cadastrado para disparo de WhatsApp.");
      return;
    }

    let itemsList: any[] = [];
    let obsGerais = "";
    if (v.itensJson) {
      try {
        const parsed = typeof v.itensJson === "string" ? JSON.parse(v.itensJson) : v.itensJson;
        if (Array.isArray(parsed)) itemsList = parsed;
        else if (parsed && typeof parsed === "object") {
          itemsList = parsed.itens || [];
          obsGerais = parsed.observacoesGerais || "";
        }
      } catch (e) {}
    }

    try {
      const pdfBase64 = await getChecklistPDFBase64({
        tipoVistoria: v.tipoVistoria,
        empresaNome: v.empresa?.nomeFantasia || empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
        empresaCnpj: v.empresa?.cnpj || empresaData?.cnpj || "00.000.000/0001-00",
        empresaEndereco: v.empresa?.endereco || empresaData?.endereco,
        empresaTelefone: v.empresa?.telefone || empresaData?.telefone,
        empresaEmail: v.empresa?.email || empresaData?.email,
        empresaLogomarcaUrl: v.empresa?.logomarcaUrl || empresaData?.logomarcaUrl,
        usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
        empresaAssinaturaUrl: currentUser?.assinaturaUrl || v.empresa?.assinaturaUrl || empresaData?.assinaturaUrl,
        locatarioNome: v.locatario?.nome || v.contrato?.locatario?.nome || "Locatário",
        locatarioCpf: v.locatario?.cpf || v.contrato?.locatario?.cpf || "Não informado",
        flatNumero: v.flat?.numero || "Flat",
        dataVistoria: new Date(v.dataVistoria || v.createdAt).toLocaleDateString("pt-BR"),
        responsavelVistoria: v.responsavelVistoria || "Vistoriador Responsável",
        itens: itemsList,
        observacoesGerais: obsGerais,
        locatarioAssinaturaUrl: v.assinaturaLocatarioUrl,
        dataAssinaturaLocatario: v.dataAssinaturaLocatario,
        ipAssinaturaLocatario: v.ipAssinaturaLocatario,
      });

      const publicUrl = `${getAppBaseUrl()}/assinar/vistoria/${v.tokenAssinatura}`;
      const locNome = v.locatario?.nome || "Locatário";
      const flatNum = v.flat?.numero || "";
      const text = `*LAUDO DE VISTORIA DE ${v.tipoVistoria} DO FLAT (${flatNum})*\n\nOlá *${locNome}*,\nSegue em anexo a cópia oficial do seu laudo de vistoria em formato PDF.\n\n👉 *Acesse o link seguro para conferência e assinatura digital:*\n${publicUrl}`;

      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: telefone,
          message: text,
          pdfBase64,
          fileName: `Laudo_Vistoria_${v.tipoVistoria}_Flat_${flatNum.replace(/\s+/g, "_")}.pdf`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: `✅ Laudo PDF enviado com sucesso pelo WhatsApp para ${locNome}!` });
      } else {
        alert(`❌ Falha ao enviar WhatsApp: ${data.error || "Verifique a integração da Evolution API em Parâmetros."}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message || err}`);
    }
  };

  // Handler para Abrir Modal de Envio por E-mail
  const handleOpenEmailModal = (v: any) => {
    setEmailModalVistoria(v);
    setEmailDestino(v.locatario?.email || v.contrato?.locatario?.email || "");
    const flatNome = `${v.flat?.local?.nome ? `${v.flat.local.nome} - ` : ""}Flat ${v.flat?.numero || ""}`;
    setEmailAssunto(`Laudo de Vistoria de ${v.tipoVistoria} - ${flatNome}`);
    setEmailMensagem(`Informamos que o laudo de vistoria do imóvel ${flatNome} está disponível para sua conferência e assinatura digital. Segue o PDF em anexo.`);
    setEmailFeedback("");
  };

  // Handler para Disparar E-mail
  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModalVistoria || !emailDestino) return;

    setSendingEmail(true);
    setEmailFeedback("");

    try {
      let itemsList: any[] = [];
      let obsGerais = "";
      if (emailModalVistoria.itensJson) {
        try {
          const parsed = typeof emailModalVistoria.itensJson === "string" ? JSON.parse(emailModalVistoria.itensJson) : emailModalVistoria.itensJson;
          if (Array.isArray(parsed)) itemsList = parsed;
          else if (parsed && typeof parsed === "object") {
            itemsList = parsed.itens || [];
            obsGerais = parsed.observacoesGerais || "";
          }
        } catch (e) {}
      }

      const pdfBase64 = await getChecklistPDFBase64({
        tipoVistoria: emailModalVistoria.tipoVistoria,
        empresaNome: emailModalVistoria.empresa?.nomeFantasia || empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
        empresaCnpj: emailModalVistoria.empresa?.cnpj || empresaData?.cnpj || "00.000.000/0001-00",
        empresaEndereco: emailModalVistoria.empresa?.endereco || empresaData?.endereco,
        empresaTelefone: emailModalVistoria.empresa?.telefone || empresaData?.telefone,
        empresaEmail: emailModalVistoria.empresa?.email || empresaData?.email,
        empresaLogomarcaUrl: emailModalVistoria.empresa?.logomarcaUrl || empresaData?.logomarcaUrl,
        usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
        empresaAssinaturaUrl: currentUser?.assinaturaUrl || emailModalVistoria.empresa?.assinaturaUrl || empresaData?.assinaturaUrl,
        locatarioNome: emailModalVistoria.locatario?.nome || "Locatário",
        locatarioCpf: emailModalVistoria.locatario?.cpf || "Não informado",
        flatNumero: emailModalVistoria.flat?.numero || "Flat",
        dataVistoria: new Date(emailModalVistoria.dataVistoria || emailModalVistoria.createdAt).toLocaleDateString("pt-BR"),
        responsavelVistoria: emailModalVistoria.responsavelVistoria || "Vistoriador Responsável",
        itens: itemsList,
        observacoesGerais: obsGerais,
        locatarioAssinaturaUrl: emailModalVistoria.assinaturaLocatarioUrl,
        dataAssinaturaLocatario: emailModalVistoria.dataAssinaturaLocatario,
        ipAssinaturaLocatario: emailModalVistoria.ipAssinaturaLocatario,
      });

      const res = await fetch("/api/vistorias/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vistoriaId: emailModalVistoria.id,
          toEmail: emailDestino,
          pdfBase64,
          customSubject: emailAssunto,
          customMessage: emailMensagem,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEmailModalVistoria(null);
        setFeedback({ type: "success", message: `✅ Laudo de vistoria enviado com sucesso por e-mail para ${emailDestino}!` });
      } else {
        setEmailFeedback(data.error || "Erro ao enviar e-mail.");
      }
    } catch (err: any) {
      setEmailFeedback(`Erro: ${err.message || err}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Métricas Calculadas
  const totalVistorias = vistorias.length;
  const vistoriasEntrada = vistorias.filter((v) => v.tipoVistoria === "ENTRADA").length;
  const vistoriasSaida = vistorias.filter((v) => v.tipoVistoria === "SAIDA").length;
  const vistoriasAssinadas = vistorias.filter((v) => v.statusAssinatura?.includes("ASSINADO")).length;
  const vistoriasPendentes = vistorias.filter((v) => !v.statusAssinatura?.includes("ASSINADO")).length;
  const vistoriasDisponiveis = vistorias.filter((v) => !v.contratoId).length;

  // Filtragem Dinâmica da Tabela
  const filteredVistorias = vistorias.filter((v) => {
    // Filtro Tipo
    if (filterTipo !== "TODOS" && v.tipoVistoria !== filterTipo) return false;

    // Filtro Status
    if (filterStatus === "ASSINADO" && !v.statusAssinatura?.includes("ASSINADO")) return false;
    if (filterStatus === "PENDENTE" && v.statusAssinatura?.includes("ASSINADO")) return false;

    // Filtro Vínculo
    if (filterVinculo === "DISPONIVEIS" && v.contratoId) return false;
    if (filterVinculo === "VINCULADOS" && !v.contratoId) return false;

    // Busca Textual
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchFlat = v.flat?.numero?.toLowerCase().includes(term);
      const matchLocal = v.flat?.local?.nome?.toLowerCase().includes(term);
      const matchLocatario = (v.locatario?.nome || v.contrato?.locatario?.nome || "").toLowerCase().includes(term);
      const matchResp = (v.responsavelVistoria || "").toLowerCase().includes(term);
      if (!matchFlat && !matchLocal && !matchLocatario && !matchResp) return false;
    }

    return true;
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Vistorias & Checklists de Imóveis
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Laudos digitais de Entrega (Entrada) e Recebimento (Saída), links de assinatura e vínculos contratuais.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setSelectedLocalId("");
                setSelectedFlatId("");
                setSelectedLocatarioId("");
                setSelectedTipoVistoria("ENTRADA");
                setShowWizardModal(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Vistoria / Checklist</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK */}
        {feedback.message && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback.message}</span>
            </div>
            <button type="button" onClick={() => setFeedback({ type: "", message: "" })}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* CARDS DE INDICADORES / MÉTRICAS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Total Laudos</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{totalVistorias}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 shadow-xs">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block mb-0.5">Entrada (Entrega)</span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-300">{vistoriasEntrada}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-0.5">Saída (Devolução)</span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300">{vistoriasSaida}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-0.5">✓ Assinadas</span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{vistoriasAssinadas}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mb-0.5">⏳ Pendentes</span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-300">{vistoriasPendentes}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 shadow-xs">
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">🔗 P/ Contratos</span>
            <span className="text-xl font-black text-indigo-700 dark:text-indigo-300">{vistoriasDisponiveis}</span>
          </div>
        </div>

        {/* BARRA DE FILTROS & BUSCA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por flat, condomínio, locatário ou vistoriador..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="ENTRADA">Entrada (Entrega)</option>
                <option value="SAIDA">Saída (Devolução)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="ASSINADO">✓ Assinados</option>
                <option value="PENDENTE">⏳ Pendentes</option>
              </select>

              <select
                value={filterVinculo}
                onChange={(e) => setFilterVinculo(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value="TODOS">Todos os Vínculos</option>
                <option value="DISPONIVEIS">🟢 Disponíveis para Contrato</option>
                <option value="VINCULADOS">🔗 Vinculados ao Contrato</option>
              </select>

              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                title="Recarregar dados"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-500" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* TABELA / LISTA DE VISTORIAS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-semibold flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>Carregando vistorias e laudos...</span>
            </div>
          ) : filteredVistorias.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <p className="font-semibold">Nenhum laudo de vistoria encontrado para os filtros selecionados.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedLocalId("");
                  setSelectedFlatId("");
                  setSelectedLocatarioId("");
                  setSelectedTipoVistoria("ENTRADA");
                  setShowWizardModal(true);
                }}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs inline-flex items-center space-x-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Primeira Vistoria</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="p-3.5">Imóvel / Condomínio</th>
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5">Locatário</th>
                    <th className="p-3.5">Data & Vistoriador</th>
                    <th className="p-3.5">Status Assinatura</th>
                    <th className="p-3.5">Vínculo Contrato</th>
                    <th className="p-3.5 text-right">Ações & Disparos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredVistorias.map((v) => {
                    const isAssinado = v.statusAssinatura?.includes("ASSINADO");
                    const locatarioNome = v.locatario?.nome || v.contrato?.locatario?.nome || "Locatário Não Informado";
                    const locatarioTelefone = v.locatario?.telefone || v.contrato?.locatario?.telefone;
                    const locatarioEmail = v.locatario?.email || v.contrato?.locatario?.email;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        {/* Imóvel */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            Flat {v.flat?.numero}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {v.flat?.local?.nome || "Condomínio Geral"}
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                              v.tipoVistoria === "ENTRADA"
                                ? "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            <span>{v.tipoVistoria === "ENTRADA" ? "🔑 ENTRADA" : "🚪 SAÍDA"}</span>
                          </span>
                        </td>

                        {/* Locatário */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{locatarioNome}</div>
                          {v.locatario?.cpf && (
                            <div className="text-[10px] text-slate-400 font-mono">CPF: {v.locatario.cpf}</div>
                          )}
                        </td>

                        {/* Data & Vistoriador */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(v.dataVistoria || v.createdAt).toLocaleDateString("pt-BR")}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Resp: {v.responsavelVistoria || "Vistoriador"}
                          </div>
                        </td>

                        {/* Status Assinatura */}
                        <td className="p-3.5">
                          {isAssinado ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Assinado</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 inline-flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Pendente</span>
                            </span>
                          )}
                        </td>

                        {/* Vínculo Contrato */}
                        <td className="p-3.5">
                          {v.contratoId ? (
                            <span
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 inline-flex items-center space-x-1"
                              title={`Vinculado ao Contrato ID: ${v.contratoId}`}
                            >
                              <LinkIcon className="w-3 h-3 text-indigo-600" />
                              <span>Contrato #{v.contratoId.slice(0, 6).toUpperCase()}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 inline-flex items-center space-x-1">
                              <span>🟢 Disponível</span>
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Ver Laudo / Ficha */}
                            <button
                              type="button"
                              onClick={() => setViewingVistoria(v)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                              title="Visualizar Ficha Completa do Laudo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            {/* Link de Assinatura */}
                            <button
                              type="button"
                              onClick={() => setLinkModalVistoria(v)}
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 transition"
                              title="Gerar / Ver Link de Assinatura Digital"
                            >
                              <LinkIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            </button>

                            {/* Baixar PDF */}
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF(v)}
                              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 transition"
                              title="Baixar Laudo PDF White Clean"
                            >
                              <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </button>

                            {/* Enviar WhatsApp */}
                            {locatarioTelefone && (
                              <button
                                type="button"
                                onClick={() => handleSendWhatsApp(v)}
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 transition"
                                title="Enviar Laudo por WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              </button>
                            )}

                            {/* Enviar por E-mail */}
                            <button
                              type="button"
                              onClick={() => handleOpenEmailModal(v)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 transition"
                              title="Enviar Laudo por E-mail"
                            >
                              <Mail className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            </button>

                            {/* Editar Itens */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveChecklistModal({
                                  flatNumero: v.flat?.numero || "Flat",
                                  flatId: v.flatId,
                                  contratoId: v.contratoId,
                                  locatarioId: v.locatarioId,
                                  locatarioNome: v.locatario?.nome || "Locatário",
                                  locatarioCpf: v.locatario?.cpf || "",
                                  locatarioTelefone: v.locatario?.telefone || "",
                                  initialTipoVistoria: v.tipoVistoria,
                                  responsavelDefault: v.responsavelVistoria,
                                });
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                              title="Editar Itens do Laudo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Excluir */}
                            {!v.contratoId && (
                              <button
                                type="button"
                                onClick={() => handleDeleteVistoria(v)}
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition"
                                title="Excluir Vistoria"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL WIZARD: SELEÇÃO DE CONDOMÍNIO, FLAT E LOCATÁRIO */}
        {showWizardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Nova Vistoria / Checklist
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Selecione o imóvel e locatário para iniciar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWizardModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStartChecklist} className="space-y-3.5 text-xs">
                {/* 1. Condomínio / Local */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Condomínio / Local (Opcional)
                  </label>
                  <select
                    value={selectedLocalId}
                    onChange={(e) => {
                      setSelectedLocalId(e.target.value);
                      setSelectedFlatId("");
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="">Todos os Condomínios / Locais</option>
                    {locais.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Flat / Imóvel */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Flat / Imóvel <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedFlatId}
                    onChange={(e) => setSelectedFlatId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="">Selecione o Flat / Imóvel...</option>
                    {filteredFlatsForWizard.map((f) => (
                      <option key={f.id} value={f.id}>
                        Flat {f.numero} {f.local?.nome ? `(${f.local.nome})` : ""} - Status: {f.status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Locatário */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Locatário
                  </label>
                  <select
                    value={selectedLocatarioId}
                    onChange={(e) => setSelectedLocatarioId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="">Selecione o Locatário (Opcional se ainda for negociado)...</option>
                    {locatarios.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nome} (CPF: {loc.cpf})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Tipo de Vistoria */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo da Vistoria
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTipoVistoria("ENTRADA")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                        selectedTipoVistoria === "ENTRADA"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span>🔑 Entrada (Entrega)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTipoVistoria("SAIDA")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                        selectedTipoVistoria === "SAIDA"
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span>🚪 Saída (Devolução)</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowWizardModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md flex items-center space-x-1.5"
                  >
                    <span>Avançar para o Checklist</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL LINK DE ASSINATURA DIGITAL */}
        {linkModalVistoria && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Link de Assinatura Digital
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Laudo de {linkModalVistoria.tipoVistoria} • Flat {linkModalVistoria.flat?.numero}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkModalVistoria(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Envie este link seguro para o locatário ou vistoriador conferir os itens, fotos e assinar digitalmente pelo celular ou computador:
                </p>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 break-all select-all font-bold">
                    {`${getAppBaseUrl()}/assinar/vistoria/${linkModalVistoria.tokenAssinatura}`}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${getAppBaseUrl()}/assinar/vistoria/${linkModalVistoria.tokenAssinatura}`;
                      navigator.clipboard.writeText(url);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "Link Copiado!" : "Copiar Link"}</span>
                  </button>

                  <a
                    href={`/assinar/vistoria/${linkModalVistoria.tokenAssinatura}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center space-x-1.5 transition border border-slate-200 dark:border-slate-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir Tela</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DISPARO POR E-MAIL */}
        {emailModalVistoria && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-rose-600 text-white">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Enviar Laudo por E-mail
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Disparo com Laudo PDF anexado e link de assinatura
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModalVistoria(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {emailFeedback && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {emailFeedback}
                </div>
              )}

              <form onSubmit={handleSendEmailSubmit} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail do Destinatário <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailDestino}
                    onChange={(e) => setEmailDestino(e.target.value)}
                    placeholder="locatario@email.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assunto
                  </label>
                  <input
                    type="text"
                    required
                    value={emailAssunto}
                    onChange={(e) => setEmailAssunto(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mensagem
                  </label>
                  <textarea
                    rows={3}
                    value={emailMensagem}
                    onChange={(e) => setEmailMensagem(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEmailModalVistoria(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingEmail ? "Enviando..." : "Enviar E-mail"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CHECKLIST (CRIAÇÃO / EDIÇÃO COMPLETA) */}
        {activeChecklistModal && (
          <ChecklistVistoriaModal
            flatNumero={activeChecklistModal.flatNumero}
            flatId={activeChecklistModal.flatId}
            contratoId={activeChecklistModal.contratoId}
            locatarioId={activeChecklistModal.locatarioId}
            locatarioNome={activeChecklistModal.locatarioNome}
            locatarioCpf={activeChecklistModal.locatarioCpf}
            locatarioTelefone={activeChecklistModal.locatarioTelefone}
            initialTipoVistoria={activeChecklistModal.initialTipoVistoria}
            responsavelDefault={activeChecklistModal.responsavelDefault}
            empresaData={empresaData}
            onClose={() => {
              setActiveChecklistModal(null);
              loadData();
            }}
          />
        )}

        {/* MODAL VISUALIZAÇÃO DE LAUDO (FICHA READ-ONLY) */}
        {viewingVistoria && (
          <ChecklistVistoriaViewModal
            vistoria={viewingVistoria}
            empresaData={empresaData}
            onClose={() => setViewingVistoria(null)}
            onEdit={() => {
              const v = viewingVistoria;
              setViewingVistoria(null);
              setActiveChecklistModal({
                flatNumero: v.flat?.numero || "Flat",
                flatId: v.flatId,
                contratoId: v.contratoId,
                locatarioId: v.locatarioId,
                locatarioNome: v.locatario?.nome || "Locatário",
                locatarioCpf: v.locatario?.cpf || "",
                locatarioTelefone: v.locatario?.telefone || "",
                initialTipoVistoria: v.tipoVistoria,
                responsavelDefault: v.responsavelVistoria,
              });
            }}
          />
        )}
      </div>
    </Shell>
  );
}
