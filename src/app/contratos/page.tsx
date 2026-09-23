"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Shell from "@/components/layout/Shell";
import GridMeses from "@/components/contratos/GridMeses";
import ChecklistVistoriaModal from "@/components/flats/ChecklistVistoriaModal";
import {
  FileText,
  Plus,
  X,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  Search,
  RotateCcw,
  AlertTriangle,
  UserCheck,
  Building2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Send,
  FileSignature,
} from "lucide-react";
import { formatCurrency } from "@/lib/validation";
import { toast } from "@/components/ui";

export default function ContratosPage() {
  const [contratos, setContratos] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContrato, setEditingContrato] = useState<any | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "VENCIDOS" | "VENCENDO" | "EM_DIA">("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Vistoria Aberto a partir da Emissão de Contrato
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistFlat, setChecklistFlat] = useState<any>(null);

  // Form State Emissão Contrato
  const [locatarioId, setLocatarioId] = useState("");
  const [flatId, setFlatId] = useState("");
  const [modeloContratoId, setModeloContratoId] = useState("");
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split("T")[0]);
  const [tipoValidade, setTipoValidade] = useState<"MESES" | "DIAS">("MESES");
  const [validadeValor, setValidadeValor] = useState("12");
  const [valorMensal, setValorMensal] = useState("");

  // Estado de Verificação em Tempo Real da Disponibilidade na Agenda
  const [disponibilidadeInfo, setDisponibilidadeInfo] = useState<{
    checking: boolean;
    checked: boolean;
    disponivel: boolean;
    mensagem: string;
    dataInicioFormatada?: string;
    dataFimFormatada?: string;
    duracao?: number;
    tipoValidade?: string;
    conflitos?: any[];
  }>({
    checking: false,
    checked: false,
    disponivel: true,
    mensagem: "",
  });

  // Novos Campos de Condições Financeiras e Regras do Contrato
  const [diaVencimento, setDiaVencimento] = useState("5");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [bancoNome, setBancoNome] = useState("");
  const [bancoDadosConta, setBancoDadosConta] = useState("");
  const [multaAtrasoPercentual, setMultaAtrasoPercentual] = useState("2.0");
  const [jurosAtrasoPercentual, setJurosAtrasoPercentual] = useState("1.0");
  const [valorCaucao, setValorCaucao] = useState("0.00");
  const [caucaoParcelas, setCaucaoParcelas] = useState("0");
  const [multaRescisaoMeses, setMultaRescisaoMeses] = useState("3");

  // Informações da Vistoria de Entrada Vinculada
  const [availableVistorias, setAvailableVistorias] = useState<any[]>([]);
  const [selectedVistoriaId, setSelectedVistoriaId] = useState<string>("");
  const [vistoriaStatusInfo, setVistoriaStatusInfo] = useState<{
    checking: boolean;
    existe: boolean;
    itensCount: number;
    fotosCount: number;
    statusAssinatura: string;
  }>({
    checking: false,
    existe: false,
    itensCount: 0,
    fotosCount: 0,
    statusAssinatura: "PENDENTE",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    try {
      const [resContratos, resLocatarios, resFlats, resModelos, resMe] = await Promise.all([
        fetch("/api/contratos").then((r) => r.json()),
        fetch("/api/locatarios").then((r) => r.json()),
        fetch("/api/flats").then((r) => r.json()),
        fetch("/api/modelos-contrato").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);

      setContratos(resContratos.contratos || []);
      setLocatarios(resLocatarios.locatarios || []);
      setFlats(resFlats.flats || []);
      setModelos(resModelos.modelos || []);
      if (resMe.user?.empresa) setEmpresaData(resMe.user.empresa);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Sincronização periódica em tempo real enquanto a aba estiver visível (a cada 3.5 segundos)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadData();
      }
    }, 3500);

    // 2. Atualização imediata ao retornar o foco para a aba do sistema
    const handleFocus = () => loadData();
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadData();
      }
    };

    // 3. Atualização imediata quando outra aba/janela assinar vistoria ou contrato
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "imob_vistoria_signed" || e.key === "imob_contrato_signed") {
        loadData();
      }
    };
    const handleCustomEvent = () => loadData();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("imob_vistoria_signed", handleCustomEvent);
    window.addEventListener("imob_contrato_signed", handleCustomEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("imob_vistoria_signed", handleCustomEvent);
      window.removeEventListener("imob_contrato_signed", handleCustomEvent);
    };
  }, []);

  const updateVistoriaInfoFromObject = (vistoria: any) => {
    if (!vistoria) {
      setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
      return;
    }
    let itens = [];
    let totalFotos = 0;
    try {
      const parsed = JSON.parse(vistoria.itensJson || "[]");
      itens = Array.isArray(parsed) ? parsed : (parsed.itens || []);
      itens.forEach((it: any) => {
        if (it.fotosUrl && Array.isArray(it.fotosUrl)) {
          totalFotos += it.fotosUrl.length;
        }
      });
    } catch (e) {}

    setVistoriaStatusInfo({
      checking: false,
      existe: true,
      itensCount: itens.length,
      fotosCount: totalFotos,
      statusAssinatura: vistoria.statusAssinatura || "PENDENTE",
    });
  };

  const checkVistoriaForFlat = async (selectedFlatId: string, selectedLocatarioId?: string) => {
    const activeLocId = selectedLocatarioId !== undefined ? selectedLocatarioId : locatarioId;
    if (!selectedFlatId && !activeLocId) {
      setAvailableVistorias([]);
      setSelectedVistoriaId("");
      setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
      return;
    }

    setVistoriaStatusInfo((prev) => ({ ...prev, checking: true }));
    try {
      let url = `/api/vistorias?tipoVistoria=ENTRADA&apenasDisponiveis=true`;
      if (selectedFlatId && activeLocId) {
        url += `&flatId=${selectedFlatId}&locatarioId=${activeLocId}&flatOuLocatario=true`;
      } else if (selectedFlatId) {
        url += `&flatId=${selectedFlatId}`;
      } else if (activeLocId) {
        url += `&locatarioId=${activeLocId}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.vistorias && data.vistorias.length > 0) {
        setAvailableVistorias(data.vistorias);
        // Priorizar vistoria assinada para o locatário selecionado
        const matchLocAndAssinado = activeLocId ? data.vistorias.find((v: any) => v.locatarioId === activeLocId && v.statusAssinatura?.includes("ASSINADO")) : null;
        const matchLoc = activeLocId ? data.vistorias.find((v: any) => v.locatarioId === activeLocId) : null;
        const matchAssinado = data.vistorias.find((v: any) => v.statusAssinatura?.includes("ASSINADO"));
        const preferred = matchLocAndAssinado || matchLoc || matchAssinado || data.vistorias[0];

        setSelectedVistoriaId(preferred.id);
        updateVistoriaInfoFromObject(preferred);
      } else {
        setAvailableVistorias([]);
        setSelectedVistoriaId("");
        setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
      }
    } catch (e) {
      setAvailableVistorias([]);
      setSelectedVistoriaId("");
      setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
    }
  };

  // Verificação em Tempo Real da Disponibilidade de Datas na Agenda
  useEffect(() => {
    if (!flatId || !dataEmissao || !validadeValor) {
      setDisponibilidadeInfo({
        checking: false,
        checked: false,
        disponivel: true,
        mensagem: "",
      });
      return;
    }

    let active = true;
    setDisponibilidadeInfo((prev) => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/contratos/verificar-disponibilidade?flatId=${flatId}&dataEmissao=${dataEmissao}&tipoValidade=${tipoValidade}&validadeValor=${validadeValor}`
        );
        const data = await res.json();
        if (active) {
          if (res.ok) {
            setDisponibilidadeInfo({
              checking: false,
              checked: true,
              disponivel: data.disponivel,
              mensagem: data.mensagem,
              dataInicioFormatada: data.dataInicioFormatada,
              dataFimFormatada: data.dataFimFormatada,
              duracao: data.duracao,
              tipoValidade: data.tipoValidade,
              conflitos: data.conflitos || [],
            });
          } else {
            setDisponibilidadeInfo({
              checking: false,
              checked: true,
              disponivel: false,
              mensagem: data.error || "Erro ao verificar disponibilidade de datas.",
            });
          }
        }
      } catch (e) {
        if (active) {
          setDisponibilidadeInfo({
            checking: false,
            checked: true,
            disponivel: true,
            mensagem: "",
          });
        }
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [flatId, dataEmissao, tipoValidade, validadeValor]);

  const handleLocatarioChange = (selectedLocatarioId: string) => {
    setLocatarioId(selectedLocatarioId);
    checkVistoriaForFlat(flatId, selectedLocatarioId);
  };

  const handleFlatChange = (selectedFlatId: string) => {
    if (!selectedFlatId) {
      setFlatId("");
      checkVistoriaForFlat("", locatarioId);
      return;
    }

    const flatSelected = flats.find((f) => f.id === selectedFlatId);
    if (flatSelected) {
      if (flatSelected.status === "MANUTENCAO") {
        toast.error(
          `O imóvel "${flatSelected.numero}" (${flatSelected.local?.nome || "Condomínio"}) encontra-se atualmente em MANUTENÇÃO. Altere o status para DISPONÍVEL antes de emitir contrato.`
        );
        setFlatId("");
        setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
        return;
      }

      setFlatId(selectedFlatId);
      if (flatSelected.valorPadrao) setValorMensal(flatSelected.valorPadrao.toString());
      checkVistoriaForFlat(selectedFlatId, locatarioId);
    } else {
      setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
    }
  };

  const handleOpenNewContrato = () => {
    setEditingContrato(null);
    setLocatarioId("");
    setFlatId("");
    setModeloContratoId("");
    setDataEmissao(new Date().toISOString().split("T")[0]);
    setTipoValidade("MESES");
    setValidadeValor("12");
    setValorMensal("");
    setDiaVencimento("5");
    setFormaPagamento("PIX");
    setBancoNome("");
    setBancoDadosConta("");
    setMultaAtrasoPercentual("2.0");
    setJurosAtrasoPercentual("1.0");
    setValorCaucao("0.00");
    setCaucaoParcelas("0");
    setMultaRescisaoMeses("3");
    setSelectedVistoriaId("");
    setErrorMsg("");
    setWizardStep(1);
    setShowModal(true);
  };

  const handleOpenEditContrato = (contrato: any) => {
    setEditingContrato(contrato);
    setLocatarioId(contrato.locatarioId || "");
    setFlatId(contrato.flatId || "");
    setModeloContratoId(contrato.modeloContratoId || "");
    setDataEmissao(contrato.dataEmissao ? contrato.dataEmissao.split("T")[0] : new Date().toISOString().split("T")[0]);
    setTipoValidade(contrato.tipoValidade || "MESES");
    setValidadeValor(String(contrato.validadeDias || contrato.validadeMeses || 12));
    setValorMensal(String(contrato.valorMensal || ""));
    setDiaVencimento(String(contrato.diaVencimento || 5));
    setFormaPagamento(contrato.formaPagamento || "PIX");
    setBancoNome(contrato.bancoNome || "");
    setBancoDadosConta(contrato.bancoDadosConta || "");
    setMultaAtrasoPercentual(String(contrato.multaAtrasoPercentual ?? 2.0));
    setJurosAtrasoPercentual(String(contrato.jurosAtrasoPercentual ?? 1.0));
    setValorCaucao(String(contrato.valorCaucao ?? "0.00"));
    setCaucaoParcelas(String(contrato.caucaoParcelas ?? 0));
    setMultaRescisaoMeses(String(contrato.multaRescisaoMeses ?? 3));
    setSelectedVistoriaId("");
    setErrorMsg("");
    setWizardStep(1);
    setShowModal(true);
  };

  const handleAbrirVistoria = () => {
    if (!flatId) {
      toast.warning("Selecione um flat primeiro para realizar a vistoria.");
      return;
    }
    const flatSelected = flats.find((f) => f.id === flatId);
    if (flatSelected) {
      setChecklistFlat(flatSelected);
      setShowChecklistModal(true);
    }
  };

  const handleEmitirContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = Boolean(editingContrato?.id);

    if (!isEditing && disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel) {
      const msg = disponibilidadeInfo.mensagem || "O período selecionado está indisponível na agenda.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/contratos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingContrato?.id,
          locatarioId,
          flatId,
          modeloContratoId: modeloContratoId || null,
          dataEmissao,
          tipoValidade,
          validadeValor,
          validadeMeses: validadeValor,
          valorMensal,
          diaVencimento: parseInt(diaVencimento, 10),
          formaPagamento,
          bancoNome,
          bancoDadosConta,
          multaAtrasoPercentual: parseFloat(multaAtrasoPercentual),
          jurosAtrasoPercentual: parseFloat(jurosAtrasoPercentual),
          valorCaucao: parseFloat(valorCaucao),
          caucaoParcelas: parseInt(caucaoParcelas, 10),
          multaRescisaoMeses: parseInt(multaRescisaoMeses, 10),
          vistoriaEntradaId: selectedVistoriaId || null,
          atualizarParcelasPendentes: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || (isEditing ? "Erro ao salvar contrato." : "Erro ao emitir contrato."));
        toast.error(data.error || (isEditing ? "Erro ao salvar contrato." : "Erro ao emitir contrato."));
        setSubmitting(false);
        return;
      }

      toast.success(isEditing ? "Contrato atualizado com sucesso!" : "Contrato emitido com sucesso!");
      setShowModal(false);
      setEditingContrato(null);
      setLocatarioId("");
      setFlatId("");
      setValorMensal("");
      loadData();
    } catch (err) {
      setErrorMsg("Erro de rede ao conectar ao servidor.");
      toast.error("Erro de rede ao conectar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const getContratoVencimentoInfo = (contrato: any) => {
    const dtInicio = contrato.dataInicio ? new Date(contrato.dataInicio) : (contrato.dataEmissao ? new Date(contrato.dataEmissao) : new Date());
    let dtFinal: Date | null = null;
    if (contrato.dataFim) {
      dtFinal = new Date(contrato.dataFim);
    } else if (contrato.tipoValidade === "DIAS" && contrato.validadeDias) {
      dtFinal = new Date(dtInicio.getTime() + contrato.validadeDias * 24 * 60 * 60 * 1000);
    } else if (contrato.validadeMeses) {
      dtFinal = new Date(dtInicio);
      dtFinal.setMonth(dtFinal.getMonth() + contrato.validadeMeses);
    }

    if (!dtFinal) return { status: "EM_DIA", dias: 999 };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diffMs = dtFinal.getTime() - hoje.getTime();
    const diasAteVencimento = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diasAteVencimento < 0) {
      return { status: "VENCIDO", dias: diasAteVencimento };
    } else if (diasAteVencimento <= 30) {
      return { status: "VENCENDO", dias: diasAteVencimento };
    }
    return { status: "EM_DIA", dias: diasAteVencimento };
  };

  const contratosAtivos = contratos.filter((c) => c.status !== "FINALIZADO");
  const contratosEncerradosCount = contratos.filter((c) => c.status === "FINALIZADO").length;

  const countVencidos = contratosAtivos.filter((c) => getContratoVencimentoInfo(c).status === "VENCIDO").length;
  const countVencendo = contratosAtivos.filter((c) => getContratoVencimentoInfo(c).status === "VENCENDO").length;
  const countEmDia = contratosAtivos.filter((c) => getContratoVencimentoInfo(c).status === "EM_DIA").length;

  const contratosFiltrados = contratosAtivos.filter((c) => {
    const info = getContratoVencimentoInfo(c);
    if (filtroStatus === "VENCIDOS" && info.status !== "VENCIDO") return false;
    if (filtroStatus === "VENCENDO" && info.status !== "VENCENDO") return false;
    if (filtroStatus === "EM_DIA" && info.status !== "EM_DIA") return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const locatarioNome = c.locatario?.nome?.toLowerCase() || "";
    const locatarioCpf = c.locatario?.cpf?.toLowerCase() || "";
    const flatNumero = c.flat?.numero?.toLowerCase() || "";
    const localNome = c.flat?.local?.nome?.toLowerCase() || "";

    return (
      locatarioNome.includes(term) ||
      locatarioCpf.includes(term) ||
      flatNumero.includes(term) ||
      localNome.includes(term)
    );
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Gestão de Contratos de Locação (Ativos)</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">Fluxo:</span>
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">1º Vistoria de Entrada</span>
                <span>➔</span>
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">2º Contrato de Locação</span>
                <span>➔</span>
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">3º Vistoria de Saída / Renovação</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewContrato}
            className="w-full sm:w-auto min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Novo Contrato</span>
          </button>
        </div>

        {/* Abas Principais de Navegação entre Contratos Ativos e Encerrados */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Link
            href="/contratos"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm shadow-blue-500/20"
          >
            <FileText className="w-4 h-4" />
            <span>Contratos Ativos</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black">
              {contratosAtivos.length}
            </span>
          </Link>

          <Link
            href="/contratos/encerrados"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Contratos Encerrados</span>
            {contratosEncerradosCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                {contratosEncerradosCount}
              </span>
            )}
          </Link>
        </div>

        {/* Barra de Filtros e Busca Rápida de Vencimento */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Sub-abas de Filtro de Vencimento */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFiltroStatus("TODOS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filtroStatus === "TODOS"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>Todos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 dark:bg-white/20 font-extrabold">
                {contratosAtivos.length}
              </span>
            </button>

            <button
              onClick={() => setFiltroStatus("VENCIDOS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filtroStatus === "VENCIDOS"
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-500/30"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Vencidos (Renovar/Encerrar)</span>
              {countVencidos > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 font-extrabold animate-pulse">
                  {countVencidos}
                </span>
              )}
            </button>

            <button
              onClick={() => setFiltroStatus("VENCENDO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filtroStatus === "VENCENDO"
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Vencendo em até 30d</span>
              {countVencendo > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-extrabold">
                  {countVencendo}
                </span>
              )}
            </button>

            <button
              onClick={() => setFiltroStatus("EM_DIA")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filtroStatus === "EM_DIA"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Em dia / Vigentes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-extrabold">
                {countEmDia}
              </span>
            </button>
          </div>

          {/* Busca por Inquilino, Flat ou CPF */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por inquilino, flat ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Contratos Ativos */}
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400">Carregando contratos ativos...</div>
        ) : contratosFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
            <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
              {searchTerm || filtroStatus !== "TODOS"
                ? "Nenhum contrato encontrado para os filtros selecionados."
                : "Nenhum contrato ativo no momento."}
            </p>
            <p className="text-xs text-slate-500">
              {searchTerm || filtroStatus !== "TODOS" ? (
                <button
                  onClick={() => {
                    setFiltroStatus("TODOS");
                    setSearchTerm("");
                  }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Limpar filtros de busca
                </button>
              ) : (
                'Clique em "Emitir Novo Contrato" acima para iniciar a gestão de um flat.'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {contratosFiltrados.map((contrato) => (
              <GridMeses
                key={contrato.id}
                contratoId={contrato.id}
                flatId={contrato.flatId}
                tokenAssinatura={contrato.tokenAssinatura}
                statusAssinatura={contrato.statusAssinatura}
                tipoValidade={contrato.tipoValidade}
                validadeMeses={contrato.validadeMeses}
                validadeDias={contrato.validadeDias}
                locatarioId={contrato.locatarioId}
                locatarioNome={contrato.locatario.nome}
                locatarioCpf={contrato.locatario.cpf}
                locatarioTelefone={contrato.locatario.telefone}
                flatNumero={`${contrato.flat.local?.nome || "Condomínio"} - ${contrato.flat.numero}`}
                valorMensal={contrato.valorMensal}
                parcelas={contrato.contasReceber || []}
                vistoriasChecklist={contrato.vistoriasChecklist || []}
                empresaData={empresaData}
                modeloContratoHtml={contrato.modeloContrato?.conteudoHtml}
                contratoCompleto={contrato}
                onBaixaSucesso={loadData}
                onEditarContrato={handleOpenEditContrato}
              />
            ))}
          </div>
        )}

        {/* Modal Emissão / Edição de Contrato (Wizard Pipeline de 5 Etapas) */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[92vh] my-auto overflow-y-auto animate-in fade-in zoom-in-95">
              {/* Header do Wizard */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {editingContrato ? "Editar Contrato de Locação" : "Pipeline de Emissão de Contrato"}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                        Etapa {wizardStep} de 5
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Fluxo guiado de emissão com validação anti-conflito, vistoria e geração financeira.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Barra de Progresso / Stepper */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[
                  { step: 1, label: "Cliente", icon: UserCheck },
                  { step: 2, label: "Imóvel", icon: Building2 },
                  { step: 3, label: "Valores", icon: CreditCard },
                  { step: 4, label: "Vistoria", icon: FileCheck },
                  { step: 5, label: "Revisão", icon: CheckCircle2 },
                ].map((s) => {
                  const IconComp = s.icon;
                  const isActive = wizardStep === s.step;
                  const isCompleted = wizardStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        if (isCompleted || s.step < wizardStep) {
                          setWizardStep(s.step);
                        }
                      }}
                      className={`p-2 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                        isActive
                          ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs"
                          : isCompleted
                          ? "bg-slate-50 dark:bg-slate-950 border-emerald-400/60 dark:border-emerald-600/60 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                          : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[10px] font-bold">0{s.step}</span>
                      </div>
                      <span className="text-[11px] font-bold mt-1 truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleEmitirContrato} className="space-y-4">
                {/* ========================================================= */}
                {/* ETAPA 1: LOCATÁRIO / CLIENTE                             */}
                {/* ========================================================= */}
                {wizardStep === 1 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        Selecione o Locatário / Cliente
                      </label>
                      <select
                        required
                        value={locatarioId}
                        onChange={(e) => handleLocatarioChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value="">-- Escolha o Locatário --</option>
                        {locatarios.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.nome} ({loc.cpf})
                          </option>
                        ))}
                      </select>
                    </div>

                    {locatarioId && (() => {
                      const sel = locatarios.find((l) => l.id === locatarioId);
                      if (!sel) return null;
                      return (
                        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-blue-600" />
                              <span>Ficha Cadastral do Cliente</span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                              CPF Válido
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                            <div><strong>Nome:</strong> {sel.nome}</div>
                            <div><strong>CPF:</strong> {sel.cpf}</div>
                            <div><strong>WhatsApp / Telefone:</strong> {sel.telefone || "Não informado"}</div>
                            <div><strong>E-mail:</strong> {sel.email || "Não informado"}</div>
                            <div className="sm:col-span-2"><strong>Endereço:</strong> {sel.endereco || "Não informado"}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ========================================================= */}
                {/* ETAPA 2: IMÓVEL & VIGÊNCIA                                */}
                {/* ========================================================= */}
                {wizardStep === 2 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        Selecione o Flat / Imóvel
                      </label>
                      <select
                        required
                        value={flatId}
                        onChange={(e) => handleFlatChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                      >
                        <option value="">-- Escolha o Imóvel --</option>
                        {flats.map((flat) => {
                          const isCurrentEditingFlat = editingContrato && editingContrato.flatId === flat.id;
                          const isAvailable = flat.status === "DISPONIVEL" || isCurrentEditingFlat;
                          return (
                            <option
                              key={flat.id}
                              value={flat.id}
                              className={isAvailable ? "font-bold text-emerald-600" : "text-slate-400"}
                            >
                              {flat.local?.nome ? `${flat.local.nome} - ` : ""}Flat {flat.numero} ({flat.tipoImovel || "Imóvel"}) - {isCurrentEditingFlat ? "🔵 IMÓVEL DESTE CONTRATO" : isAvailable ? "🟢 DISPONÍVEL" : flat.status === "OCUPADO" ? "🔵 OCUPADO" : "🟡 MANUTENÇÃO"}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Data de Início
                        </label>
                        <input
                          type="date"
                          required
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Tipo de Vigência
                        </label>
                        <select
                          value={tipoValidade}
                          onChange={(e) => {
                            const nextType = e.target.value as "MESES" | "DIAS";
                            setTipoValidade(nextType);
                            if (nextType === "DIAS" && parseInt(validadeValor, 10) > 365) {
                              setValidadeValor("30");
                            } else if (nextType === "MESES" && parseInt(validadeValor, 10) > 48) {
                              setValidadeValor("12");
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                        >
                          <option value="MESES">📅 Meses</option>
                          <option value="DIAS">☀️ Dias (Temporada)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {tipoValidade === "MESES" ? "Prazo (Meses)" : "Prazo (Dias)"}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={tipoValidade === "MESES" ? "48" : "365"}
                          required
                          value={validadeValor}
                          onChange={(e) => setValidadeValor(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {tipoValidade === "MESES" ? "Aluguel Mensal (R$)" : "Valor Total (R$)"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={valorMensal}
                          onChange={(e) => setValorMensal(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                        />
                      </div>
                    </div>

                    {/* Verificação anti-conflito */}
                    {flatId && (
                      <div className="pt-1">
                        {disponibilidadeInfo.checking ? (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center space-x-2">
                            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                            <span>Verificando disponibilidade de datas na agenda...</span>
                          </div>
                        ) : disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel ? (
                          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800/80 text-red-800 dark:text-red-200 space-y-2">
                            <div className="flex items-start space-x-2.5">
                              <CalendarX className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="text-xs font-black uppercase text-red-700 dark:text-red-300 tracking-wide">
                                  ❌ Período Indisponível na Agenda
                                </span>
                                <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                                  {disponibilidadeInfo.mensagem}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : disponibilidadeInfo.checked && disponibilidadeInfo.disponivel ? (
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center space-x-2.5">
                            <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                ✅ Período 100% Livre na Agenda ({disponibilidadeInfo.dataInicioFormatada} ➔ {disponibilidadeInfo.dataFimFormatada})
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* ETAPA 3: CONDIÇÕES FINANCEIRAS                            */}
                {/* ========================================================= */}
                {wizardStep === 3 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                        <span>Forma de Pagamento & Vencimento</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Dia de Vencimento
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            required
                            value={diaVencimento}
                            onChange={(e) => setDiaVencimento(e.target.value)}
                            placeholder="Ex: 5"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Forma de Pagamento
                          </label>
                          <select
                            value={formaPagamento}
                            onChange={(e) => setFormaPagamento(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                          >
                            <option value="PIX">⚡ PIX</option>
                            <option value="BOLETO">📄 Boleto Bancário</option>
                            <option value="TRANSFERENCIA">🏦 Transferência / TED</option>
                            <option value="DINHEIRO">💵 Dinheiro</option>
                            <option value="CARTAO">💳 Cartão</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nome do Banco
                          </label>
                          <input
                            type="text"
                            value={bancoNome}
                            onChange={(e) => setBancoNome(e.target.value)}
                            placeholder="Ex: Banco Inter, Itaú, Nubank..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Dados da Conta / Chave PIX
                          </label>
                          <input
                            type="text"
                            value={bancoDadosConta}
                            onChange={(e) => setBancoDadosConta(e.target.value)}
                            placeholder="Ex: Chave PIX CNPJ / Ag e Conta"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <span>⚖️ Multas, Juros & Caução</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Multa por Atraso (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={multaAtrasoPercentual}
                            onChange={(e) => setMultaAtrasoPercentual(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Juros de Mora Mensal (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={jurosAtrasoPercentual}
                            onChange={(e) => setJurosAtrasoPercentual(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Valor Caução (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={valorCaucao}
                            onChange={(e) => setValorCaucao(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Parcelas Caução
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="12"
                            value={caucaoParcelas}
                            onChange={(e) => setCaucaoParcelas(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Multa Rescisão (Meses)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="12"
                            value={multaRescisaoMeses}
                            onChange={(e) => setMultaRescisaoMeses(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* ETAPA 4: VISTORIA & MODELO DE CONTRATO                    */}
                {/* ========================================================= */}
                {wizardStep === 4 && (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Vistoria de Entrada */}
                    <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Vistoria de Entrada Vinculada</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAbrirVistoria}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition flex items-center space-x-1 shadow-xs"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Fazer Nova Vistoria</span>
                        </button>
                      </div>

                      {availableVistorias.length > 0 ? (
                        <div className="space-y-2.5">
                          <select
                            value={selectedVistoriaId}
                            onChange={(e) => {
                              const vId = e.target.value;
                              setSelectedVistoriaId(vId);
                              const found = availableVistorias.find((v) => v.id === vId);
                              updateVistoriaInfoFromObject(found);
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                          >
                            {availableVistorias.map((v) => (
                              <option key={v.id} value={v.id}>
                                📅 {new Date(v.createdAt).toLocaleDateString("pt-BR")} | {v.statusAssinatura?.includes("ASSINADO") ? "🟢 ASSINADO" : "🟡 PENDENTE"} {v.locatario?.nome ? `• Locatário: ${v.locatario.nome}` : ""} (Flat {v.flat?.numero})
                              </option>
                            ))}
                            <option value="none">-- Não vincular vistoria agora --</option>
                          </select>

                          {selectedVistoriaId && selectedVistoriaId !== "none" && (
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3">
                              <div className="flex items-center space-x-2.5">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div>
                                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase">
                                    ✓ Laudo Fotográfico Selecionado ({vistoriaStatusInfo.itensCount} itens • {vistoriaStatusInfo.fotosCount} fotos)
                                  </span>
                                  <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 mt-0.5">
                                    Status: <strong>{vistoriaStatusInfo.statusAssinatura}</strong>.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between">
                          <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                            Nenhuma vistoria livre encontrada para este imóvel.
                          </span>
                          <button
                            type="button"
                            onClick={handleAbrirVistoria}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                          >
                            Criar Agora
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Modelo de Contrato */}
                    <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Modelo de Contrato (Template A4)
                      </label>
                      <select
                        value={modeloContratoId}
                        onChange={(e) => setModeloContratoId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value="">-- Nenhum modelo (Usar layout padrão) --</option>
                        {modelos.map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.titulo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* ETAPA 5: CONFERÊNCIA & EMISSÃO                            */}
                {/* ========================================================= */}
                {wizardStep === 5 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          Resumo Geral dos Termos do Contrato
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Locatário</span>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {locatarios.find((l) => l.id === locatarioId)?.nome || "Não selecionado"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            CPF: {locatarios.find((l) => l.id === locatarioId)?.cpf || "---"}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Imóvel</span>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            Flat {flats.find((f) => f.id === flatId)?.numero || "---"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Condomínio: {flats.find((f) => f.id === flatId)?.local?.nome || "---"}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Vigência & Datas</span>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {validadeValor} {tipoValidade === "MESES" ? "Meses" : "Dias"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Início: {dataEmissao ? new Date(dataEmissao + "T00:00:00").toLocaleDateString("pt-BR") : "---"}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Valor & Vencimento</span>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatCurrency(parseFloat(valorMensal || "0"))} {tipoValidade === "MESES" ? "/mês" : "total"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Vencimento dia {diaVencimento} • Forma: {formaPagamento}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Barra de Navegação do Wizard (Voltar / Avançar / Emitir) */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  {wizardStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Voltar</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {wizardStep < 5 ? (
                    <button
                      type="button"
                      onClick={() => {
                        // Validação Etapa 1
                        if (wizardStep === 1) {
                          if (!locatarioId) {
                            toast.warning("Selecione um locatário para prosseguir.");
                            return;
                          }
                        }
                        // Validação Etapa 2
                        if (wizardStep === 2) {
                          if (!flatId) {
                            toast.warning("Selecione um flat/imóvel.");
                            return;
                          }
                          if (!valorMensal || parseFloat(valorMensal) <= 0) {
                            toast.warning("Informe o valor do aluguel.");
                            return;
                          }
                          if (!editingContrato && disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel) {
                            toast.error("O período está indisponível na agenda. Ajuste as datas para prosseguir.");
                            return;
                          }
                        }
                        setWizardStep((prev) => Math.min(5, prev + 1));
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <span>Avançar</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting || (!editingContrato && disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel)}
                      className={`px-6 py-2.5 rounded-xl font-bold text-white text-xs shadow-lg transition flex items-center space-x-2 ${
                        !editingContrato && disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel
                          ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 cursor-pointer shadow-emerald-500/20"
                      }`}
                    >
                      <FileSignature className="w-4 h-4" />
                      <span>
                        {submitting
                          ? "Processando..."
                          : editingContrato
                          ? "Salvar Alterações"
                          : "Emitir Contrato & Gerar Parcelas"}
                      </span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Checklist / Vistoria de Entrada */}
        {showChecklistModal && checklistFlat && (
          <ChecklistVistoriaModal
            flatId={checklistFlat.id}
            flatNumero={checklistFlat.numero}
            locatarioId={locatarioId || undefined}
            locatarioNome={locatarios.find((l) => l.id === locatarioId)?.nome}
            locatarioCpf={locatarios.find((l) => l.id === locatarioId)?.cpf}
            locatarioTelefone={locatarios.find((l) => l.id === locatarioId)?.telefone}
            initialTipoVistoria="ENTRADA"
            empresaData={empresaData}
            onClose={() => {
              setShowChecklistModal(false);
              if (checklistFlat?.id) {
                checkVistoriaForFlat(checklistFlat.id);
              }
            }}
          />
        )}
      </div>
    </Shell>
  );
}
