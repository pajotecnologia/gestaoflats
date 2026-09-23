"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import ChecklistVistoriaModal from "@/components/flats/ChecklistVistoriaModal";
import ChecklistVistoriaViewModal from "@/components/flats/ChecklistVistoriaViewModal";
import { generateChecklistPDF, getChecklistPDFBase64 } from "@/lib/checklistPdfGenerator";
import { resolveHeaderData } from "@/lib/pdfHeaderBuilder";
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
  ArrowRightLeft,
  DollarSign,
  AlertOctagon,
  AlertCircle,
  Layers,
} from "lucide-react";
import { formatCurrency } from "@/lib/validation";
import { toast, ConfirmDialog } from "@/components/ui";

export default function VistoriasPage() {
  const [vistorias, setVistorias] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estado do Comparador Entrada × Saída
  const [showComparadorModal, setShowComparadorModal] = useState(false);
  const [comparadorFlatId, setComparadorFlatId] = useState("");
  const [comparadorEntradaId, setComparadorEntradaId] = useState("");
  const [comparadorSaidaId, setComparadorSaidaId] = useState("");
  const [cobrancaDescricao, setCobrancaDescricao] = useState("");
  const [cobrancaValor, setCobrancaValor] = useState("");
  const [cobrancaVencimento, setCobrancaVencimento] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]
  );
  const [cobrancaSubmitting, setCobrancaSubmitting] = useState(false);

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
  // Modal Exclusão Vistoria
  const [deleteVistoriaTarget, setDeleteVistoriaTarget] = useState<any | null>(null);
  const [deletingVistoria, setDeletingVistoria] = useState(false);

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
      toast.warning("Por favor, selecione o Flat / Imóvel.");
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
  const handleConfirmDeleteVistoria = async () => {
    if (!deleteVistoriaTarget) return;

    if (deleteVistoriaTarget.contratoId) {
      toast.warning(`Esta vistoria está vinculada ao Contrato #${deleteVistoriaTarget.contratoId.slice(0, 8)} e não pode ser excluída enquanto o contrato existir.`);
      setDeleteVistoriaTarget(null);
      return;
    }

    setDeletingVistoria(true);
    try {
      const res = await fetch(`/api/vistorias?id=${deleteVistoriaTarget.id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Vistoria excluída com sucesso!");
        setDeleteVistoriaTarget(null);
        loadData();
      } else {
        toast.error(data.error || "Erro ao excluir vistoria.");
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message || err}`);
    } finally {
      setDeletingVistoria(false);
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

    const headerInfo = resolveHeaderData(v.flat?.local, v.empresa || empresaData);
    const flatDisplay = v.flat?.local?.nome ? `${v.flat.local.nome} - Flat ${v.flat.numero}` : `Flat ${v.flat?.numero || ""}`;

    await generateChecklistPDF({
      tipoVistoria: v.tipoVistoria,
      empresaNome: headerInfo.nome,
      empresaCnpj: headerInfo.cnpj,
      empresaEndereco: headerInfo.endereco,
      empresaTelefone: headerInfo.telefone,
      empresaEmail: headerInfo.email,
      empresaLogomarcaUrl: headerInfo.logomarcaUrl,
      usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
      empresaAssinaturaUrl: currentUser?.assinaturaUrl || v.empresa?.assinaturaUrl || empresaData?.assinaturaUrl,
      locatarioNome: v.locatario?.nome || v.contrato?.locatario?.nome || "Locatário Não Informado",
      locatarioCpf: v.locatario?.cpf || v.contrato?.locatario?.cpf || "Não informado",
      flatNumero: flatDisplay,
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
      toast.warning("Locatário não possui telefone cadastrado para disparo de WhatsApp.");
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

    const headerInfo = resolveHeaderData(v.flat?.local, v.empresa || empresaData);
    const flatDisplay = v.flat?.local?.nome ? `${v.flat.local.nome} - Flat ${v.flat.numero}` : `Flat ${v.flat?.numero || ""}`;

    try {
      const pdfBase64 = await getChecklistPDFBase64({
        tipoVistoria: v.tipoVistoria,
        empresaNome: headerInfo.nome,
        empresaCnpj: headerInfo.cnpj,
        empresaEndereco: headerInfo.endereco,
        empresaTelefone: headerInfo.telefone,
        empresaEmail: headerInfo.email,
        empresaLogomarcaUrl: headerInfo.logomarcaUrl,
        usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
        empresaAssinaturaUrl: currentUser?.assinaturaUrl || v.empresa?.assinaturaUrl || empresaData?.assinaturaUrl,
        locatarioNome: v.locatario?.nome || v.contrato?.locatario?.nome || "Locatário",
        locatarioCpf: v.locatario?.cpf || v.contrato?.locatario?.cpf || "Não informado",
        flatNumero: flatDisplay,
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
        toast.success(`Laudo PDF enviado com sucesso pelo WhatsApp para ${locNome}!`);
      } else {
        toast.error(`Falha ao enviar WhatsApp: ${data.error || "Verifique as configurações em Parâmetros."}`);
      }
    } catch (err: any) {
      toast.error(`Erro ao enviar WhatsApp: ${err.message || err}`);
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

      const headerInfo = resolveHeaderData(emailModalVistoria.flat?.local, emailModalVistoria.empresa || empresaData);
      const flatDisplay = emailModalVistoria.flat?.local?.nome ? `${emailModalVistoria.flat.local.nome} - Flat ${emailModalVistoria.flat.numero}` : `Flat ${emailModalVistoria.flat?.numero || ""}`;

      const pdfBase64 = await getChecklistPDFBase64({
        tipoVistoria: emailModalVistoria.tipoVistoria,
        empresaNome: headerInfo.nome,
        empresaCnpj: headerInfo.cnpj,
        empresaEndereco: headerInfo.endereco,
        empresaTelefone: headerInfo.telefone,
        empresaEmail: headerInfo.email,
        empresaLogomarcaUrl: headerInfo.logomarcaUrl,
        usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
        empresaAssinaturaUrl: currentUser?.assinaturaUrl || emailModalVistoria.empresa?.assinaturaUrl || empresaData?.assinaturaUrl,
        locatarioNome: emailModalVistoria.locatario?.nome || "Locatário",
        locatarioCpf: emailModalVistoria.locatario?.cpf || "Não informado",
        flatNumero: flatDisplay,
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

          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const flatComVistoria = flats.find((f) =>
                  vistorias.some((v) => v.flatId === f.id && v.tipoVistoria === "ENTRADA") &&
                  vistorias.some((v) => v.flatId === f.id && v.tipoVistoria === "SAIDA")
                ) || flats[0];
                if (flatComVistoria) {
                  setComparadorFlatId(flatComVistoria.id);
                  const entrada = vistorias.find((v) => v.flatId === flatComVistoria.id && v.tipoVistoria === "ENTRADA");
                  const saida = vistorias.find((v) => v.flatId === flatComVistoria.id && v.tipoVistoria === "SAIDA");
                  if (entrada) setComparadorEntradaId(entrada.id);
                  if (saida) setComparadorSaidaId(saida.id);
                }
                setShowComparadorModal(true);
              }}
              className="w-full sm:w-auto min-h-[44px] py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold text-slate-800 dark:text-zinc-200 text-xs border border-slate-300/80 dark:border-zinc-700 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
              <span>Comparar Entrada × Saída</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedLocalId("");
                setSelectedFlatId("");
                setSelectedLocatarioId("");
                setSelectedTipoVistoria("ENTRADA");
                setShowWizardModal(true);
              }}
              className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
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
                                onClick={() => setDeleteVistoriaTarget(v)}
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition cursor-pointer"
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

        {/* Modal de Confirmação de Exclusão */}
        <ConfirmDialog
          isOpen={Boolean(deleteVistoriaTarget)}
          onClose={() => setDeleteVistoriaTarget(null)}
          onConfirm={handleConfirmDeleteVistoria}
          isLoading={deletingVistoria}
          title="Excluir Laudo de Vistoria"
          description={
            <span>
              Tem certeza que deseja excluir permanentemente o laudo de vistoria de{" "}
              <strong className="text-zinc-100 font-bold">{deleteVistoriaTarget?.tipoVistoria}</strong> do Flat{" "}
              <strong className="text-zinc-100 font-bold">{deleteVistoriaTarget?.flat?.numero}</strong>? Esta ação não pode ser desfeita.
            </span>
          }
          confirmText="Excluir Laudo"
          cancelText="Cancelar"
          variant="danger"
        />

        {/* MODAL COMPARADOR ENTRADA × SAÍDA */}
        {showComparadorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-5xl my-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      Comparador Pericial: Vistoria de Entrada × Saída
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                        Auditoria de Avarias
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Confronte o estado do imóvel na entrega das chaves versus devolução e gere cobranças de danos.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComparadorModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Seletor de Imóvel e Vistorias */}
              <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-zinc-400 mb-1">
                    1. Selecione o Imóvel
                  </label>
                  <select
                    value={comparadorFlatId}
                    onChange={(e) => {
                      const fId = e.target.value;
                      setComparadorFlatId(fId);
                      const ent = vistorias.find((v) => v.flatId === fId && v.tipoVistoria === "ENTRADA");
                      const sai = vistorias.find((v) => v.flatId === fId && v.tipoVistoria === "SAIDA");
                      setComparadorEntradaId(ent ? ent.id : "");
                      setComparadorSaidaId(sai ? sai.id : "");
                    }}
                    className="w-full text-xs font-semibold rounded-xl bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 px-3 py-2 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="">Selecione um imóvel...</option>
                    {flats.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.local?.nome ? `${f.local.nome} - ` : ""}Flat {f.numero} ({f.tipoImovel || "Imóvel"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-zinc-400 mb-1">
                    2. Laudo de Entrada
                  </label>
                  <select
                    value={comparadorEntradaId}
                    onChange={(e) => setComparadorEntradaId(e.target.value)}
                    className="w-full text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 px-3 py-2 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="">Selecione a vistoria de entrada...</option>
                    {vistorias
                      .filter((v) => (!comparadorFlatId || v.flatId === comparadorFlatId) && v.tipoVistoria === "ENTRADA")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          Entrada: {new Date(v.dataVistoria || v.createdAt).toLocaleDateString("pt-BR")} - {v.locatario?.nome || "Locatário"}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-zinc-400 mb-1">
                    3. Laudo de Saída
                  </label>
                  <select
                    value={comparadorSaidaId}
                    onChange={(e) => setComparadorSaidaId(e.target.value)}
                    className="w-full text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 px-3 py-2 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="">Selecione a vistoria de saída...</option>
                    {vistorias
                      .filter((v) => (!comparadorFlatId || v.flatId === comparadorFlatId) && v.tipoVistoria === "SAIDA")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          Saída: {new Date(v.dataVistoria || v.createdAt).toLocaleDateString("pt-BR")} - {v.locatario?.nome || "Locatário"}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Corpo da Comparação */}
              {(() => {
                const entradaObj = vistorias.find((v) => v.id === comparadorEntradaId);
                const saidaObj = vistorias.find((v) => v.id === comparadorSaidaId);

                const parseItens = (itensJson: any) => {
                  if (!itensJson) return [];
                  try {
                    const p = typeof itensJson === "string" ? JSON.parse(itensJson) : itensJson;
                    if (Array.isArray(p)) return p;
                    if (p && Array.isArray(p.itens)) return p.itens;
                    return [];
                  } catch {
                    return [];
                  }
                };

                const itensEntrada = parseItens(entradaObj?.itensJson);
                const itensSaida = parseItens(saidaObj?.itensJson);

                if (!entradaObj || !saidaObj) {
                  return (
                    <div className="p-12 text-center text-slate-500 dark:text-zinc-400 space-y-3">
                      <ArrowRightLeft className="w-10 h-10 mx-auto opacity-30 text-indigo-500 animate-pulse" />
                      <p className="text-sm font-semibold">
                        Selecione um Laudo de Entrada e um Laudo de Saída para comparar os cômodos e itens inspecionados.
                      </p>
                    </div>
                  );
                }

                // Cruzamento de Itens
                const itensMap = new Map<string, { entrada?: any; saida?: any; categoria: string; item: string }>();
                itensEntrada.forEach((it: any) => {
                  const key = `${it.categoria || it.ambiente || "Geral"}___${it.item || it.nome || "Item"}`;
                  itensMap.set(key, {
                    categoria: it.categoria || it.ambiente || "Geral",
                    item: it.item || it.nome || "Item",
                    entrada: it,
                  });
                });
                itensSaida.forEach((it: any) => {
                  const key = `${it.categoria || it.ambiente || "Geral"}___${it.item || it.nome || "Item"}`;
                  const existing: { entrada?: any; saida?: any; categoria: string; item: string } = itensMap.get(key) || {
                    categoria: it.categoria || it.ambiente || "Geral",
                    item: it.item || it.nome || "Item",
                    entrada: undefined,
                    saida: undefined,
                  };
                  existing.saida = it;
                  itensMap.set(key, existing);
                });

                const listaComparada = Array.from(itensMap.values());
                const totalConferidos = listaComparada.length;
                const avariasEncontradas = listaComparada.filter(
                  (c) => (c.saida?.status === "AVARIA" || c.saida?.status === "RUIM") && c.entrada?.status !== "AVARIA"
                );
                const atencoesEncontradas = listaComparada.filter(
                  (c) => c.saida?.status === "ATENCAO" && c.entrada?.status === "OK"
                );
                const semAlteracao = totalConferidos - avariasEncontradas.length - atencoesEncontradas.length;

                return (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                    {/* Resumo Pericial */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Itens Auditados</span>
                        <div className="text-xl font-black text-slate-900 dark:text-zinc-100 mt-1">{totalConferidos}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Sem Alteração</span>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{semAlteracao}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Com Atenção</span>
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{atencoesEncontradas.length}</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Avarias / Danos</span>
                        <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{avariasEncontradas.length}</div>
                      </div>
                    </div>

                    {/* Tabela Comparativa */}
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-zinc-950/90 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-800">
                            <th className="p-3">Cômodo / Item</th>
                            <th className="p-3">Vistoria de Entrada</th>
                            <th className="p-3">Vistoria de Saída</th>
                            <th className="p-3 text-center">Diagnóstico Pericial</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                          {listaComparada.map((comp, idx) => {
                            const stEntrada = String(comp.entrada?.status || "OK").toUpperCase();
                            const stSaida = String(comp.saida?.status || "OK").toUpperCase();
                            const isDano = (stSaida === "AVARIA" || stSaida === "RUIM") && stEntrada !== "AVARIA";
                            const isAtencao = stSaida === "ATENCAO" && stEntrada === "OK";

                            return (
                              <tr
                                key={idx}
                                className={`hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors ${
                                  isDano
                                    ? "bg-rose-50/50 dark:bg-rose-950/20"
                                    : isAtencao
                                    ? "bg-amber-50/50 dark:bg-amber-950/20"
                                    : ""
                                }`}
                              >
                                <td className="p-3">
                                  <div className="font-semibold text-slate-900 dark:text-zinc-100">{comp.item}</div>
                                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
                                    {comp.categoria}
                                  </div>
                                </td>

                                <td className="p-3">
                                  <div className="flex items-center space-x-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        stEntrada === "OK" || stEntrada === "BOM"
                                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                                          : stEntrada === "ATENCAO"
                                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                                          : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                                      }`}
                                    >
                                      {stEntrada}
                                    </span>
                                  </div>
                                  {comp.entrada?.obs && (
                                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                                      {comp.entrada.obs}
                                    </div>
                                  )}
                                </td>

                                <td className="p-3">
                                  <div className="flex items-center space-x-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        stSaida === "OK" || stSaida === "BOM"
                                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                                          : stSaida === "ATENCAO"
                                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                                          : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                                      }`}
                                    >
                                      {stSaida}
                                    </span>
                                  </div>
                                  {comp.saida?.obs && (
                                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                                      {comp.saida.obs}
                                    </div>
                                  )}
                                </td>

                                <td className="p-3 text-center">
                                  {isDano ? (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Avaria Detectada</span>
                                    </span>
                                  ) : isAtencao ? (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Desgaste / Atenção</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Conforme</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Módulo de Geração de Cobrança Financeira de Avaria */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">
                            Lançar Cobrança Direta no Contas a Receber
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Gera uma parcela de ressarcimento para o locatário{" "}
                            <strong>{saidaObj.locatario?.nome || entradaObj.locatario?.nome || "Locatário"}</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                            Descrição das Avarias / Reparos
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Pintura manchada no quarto e controle do ar-condicionado danificado"
                            value={cobrancaDescricao}
                            onChange={(e) => setCobrancaDescricao(e.target.value)}
                            className="w-full text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 px-3 py-2 text-slate-900 dark:text-zinc-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                            Valor Total da Cobrança (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={cobrancaValor}
                            onChange={(e) => setCobrancaValor(e.target.value)}
                            className="w-full text-xs font-bold rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 px-3 py-2 text-slate-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-zinc-800/80">
                        <button
                          type="button"
                          disabled={cobrancaSubmitting || !cobrancaValor}
                          onClick={async () => {
                            const targetLocatarioId = saidaObj.locatarioId || entradaObj.locatarioId;
                            if (!targetLocatarioId) {
                              toast.error("Locatário não identificado para vincular a cobrança.");
                              return;
                            }
                            if (!cobrancaValor || parseFloat(cobrancaValor) <= 0) {
                              toast.error("Informe o valor da avaria.");
                              return;
                            }

                            setCobrancaSubmitting(true);
                            try {
                              const res = await fetch("/api/vistorias/cobrar-avaria", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  locatarioId: targetLocatarioId,
                                  contratoId: saidaObj.contratoId || entradaObj.contratoId,
                                  descricaoAvaria: cobrancaDescricao || "Ressarcimento de danos ao imóvel",
                                  valorAvaria: cobrancaValor,
                                  dataVencimento: cobrancaVencimento,
                                }),
                              });
                              const data = await res.json();
                              if (res.ok && data.success) {
                                toast.success("✅ Cobrança de avaria lançada no Contas a Receber com sucesso!");
                                setCobrancaDescricao("");
                                setCobrancaValor("");
                                setShowComparadorModal(false);
                              } else {
                                toast.error(data.error || "Erro ao lançar cobrança de avaria.");
                              }
                            } catch (err) {
                              toast.error("Erro de conexão ao lançar cobrança.");
                            } finally {
                              setCobrancaSubmitting(false);
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white text-xs shadow-md shadow-rose-500/20 flex items-center space-x-1.5 transition disabled:opacity-50"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {cobrancaSubmitting ? "Lançando..." : "Emitir Cobrança de Avaria"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
