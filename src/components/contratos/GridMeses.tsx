"use client";

import React, { useState } from "react";
import {
  formatCurrency,
  formatMesReferencia,
  replaceContractVariables,
  calcularEncargosAtraso,
  calcularMultaRescisoria,
} from "@/lib/validation";
import { generateReciboPDF, getReciboPDFBase64 } from "@/lib/pdfGenerator";
import { getContratoPDFBase64 } from "@/lib/contractPdfGenerator";
import { resolveHeaderData } from "@/lib/pdfHeaderBuilder";
import { DEFAULT_CONTRATO_HTML } from "@/lib/defaultContractTemplate";
import ChecklistVistoriaModal from "@/components/flats/ChecklistVistoriaModal";
import { getAppBaseUrl } from "@/lib/baseUrl";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileDown,
  MessageSquare,
  DollarSign,
  X,
  User,
  ClipboardCheck,
  FileSignature,
  Copy,
  Check,
  Share2,
  ExternalLink,
  XCircle,
  Link2,
  ShieldAlert,
  PlusCircle,
  Save,
  Calendar,
  Pencil,
  Zap,
  RotateCcw,
  Percent,
  Scale,
  FileText,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

export interface ParcelaItem {
  id: string;
  mesReferencia: string;
  numeroParcela: number;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  formaPagamento?: string | null;
  valorPago?: number | null;
  status: "PENDENTE" | "PAGO" | "ATRASADO" | string;
  observacao?: string | null;
}

export interface GridMesesProps {
  contratoId: string;
  flatId?: string;
  tokenAssinatura?: string | null;
  statusAssinatura?: string | null;
  tipoValidade?: string | null;
  validadeMeses?: number | null;
  validadeDias?: number | null;
  locatarioId?: string;
  locatarioNome: string;
  locatarioCpf: string;
  locatarioTelefone: string;
  flatNumero: string;
  valorMensal: number;
  parcelas: ParcelaItem[];
  vistoriasChecklist?: any[];
  empresaData?: {
    nomeFantasia: string;
    cnpj: string;
    endereco?: string | null;
    telefone?: string | null;
    email?: string | null;
    logomarcaUrl?: string | null;
    assinaturaUrl?: string | null;
  };
  modeloContratoHtml?: string | null;
  contratoCompleto?: any;
  onBaixaSucesso?: () => void;
  onEditarContrato?: (contrato: any) => void;
}

export default function GridMeses({
  contratoId,
  flatId,
  tokenAssinatura,
  statusAssinatura = "PENDENTE",
  tipoValidade = "MESES",
  validadeMeses,
  validadeDias,
  locatarioId,
  locatarioNome,
  locatarioCpf,
  locatarioTelefone,
  flatNumero,
  valorMensal,
  parcelas,
  vistoriasChecklist = [],
  empresaData,
  modeloContratoHtml,
  contratoCompleto,
  onBaixaSucesso,
  onEditarContrato,
}: GridMesesProps) {
  const [selectedParcela, setSelectedParcela] = useState<ParcelaItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Vistoria Modal state
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [targetTipoVistoria, setTargetTipoVistoria] = useState<"ENTRADA" | "SAIDA">("ENTRADA");

  // Modal de Encerramento do Contrato & Rescisão Antecipada
  const [showEncerrarModal, setShowEncerrarModal] = useState(false);
  const [tipoEncerramento, setTipoEncerramento] = useState<"NORMAL" | "RESCISAO_ANTECIPADA">("NORMAL");
  const [dataRescisao, setDataRescisao] = useState(new Date().toISOString().split("T")[0]);
  const [cobrarMultaRescisoria, setCobrarMultaRescisoria] = useState(true);
  const [tipoCalculoMulta, setTipoCalculoMulta] = useState<"PROPORCIONAL" | "INTEGRAL" | "PERSONALIZADO">("PROPORCIONAL");
  const [valorMultaCustom, setValorMultaCustom] = useState<string>("");
  const [dataVencimentoMulta, setDataVencimentoMulta] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [vistoriasSaidaParaEncerramento, setVistoriasSaidaParaEncerramento] = useState<any[]>([]);
  const [selectedVistoriaSaidaId, setSelectedVistoriaSaidaId] = useState<string>("");
  const [cancelarParcelasFuturas, setCancelarParcelasFuturas] = useState(true);
  const [motivoEncerramento, setMotivoEncerramento] = useState("Término de vigência / Devolução de chaves");
  const [loadingEncerramento, setLoadingEncerramento] = useState(false);
  const [loadingVistoriasSaida, setLoadingVistoriasSaida] = useState(false);

  // Modal de Renovação de Contrato
  const [showRenovarModal, setShowRenovarModal] = useState(false);
  const [renovacaoMesmoImovel, setRenovacaoMesmoImovel] = useState(true);
  const [renovacaoNovoFlatId, setRenovacaoNovoFlatId] = useState("");
  const [renovacaoNovoValor, setRenovacaoNovoValor] = useState(valorMensal.toString());
  const [renovacaoDataInicio, setRenovacaoDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [renovacaoTipoValidade, setRenovacaoTipoValidade] = useState<"MESES" | "DIAS">("MESES");
  const [renovacaoValidadeValor, setRenovacaoValidadeValor] = useState("12");
  const [renovacaoDiaVencimento, setRenovacaoDiaVencimento] = useState("5");
  const [renovacaoFormaPagamento, setRenovacaoFormaPagamento] = useState("PIX");
  const [renovacaoModeloId, setRenovacaoModeloId] = useState("");
  const [renovacaoMultaAtraso, setRenovacaoMultaAtraso] = useState("2.0");
  const [renovacaoJurosAtraso, setRenovacaoJurosAtraso] = useState("1.0");
  const [renovacaoMultaRescisao, setRenovacaoMultaRescisao] = useState("3");
  const [renovacaoTransferirCaucao, setRenovacaoTransferirCaucao] = useState(true);
  const [renovacaoNovoCaucao, setRenovacaoNovoCaucao] = useState("0.00");
  const [renovacaoCaucaoParcelas, setRenovacaoCaucaoParcelas] = useState("0");
  const [renovacaoVistoriaSaidaId, setRenovacaoVistoriaSaidaId] = useState("");
  const [renovacaoVistoriaEntradaId, setRenovacaoVistoriaEntradaId] = useState("");
  const [flatsDisponiveisRenovacao, setFlatsDisponiveisRenovacao] = useState<any[]>([]);
  const [modelosRenovacao, setModelosRenovacao] = useState<any[]>([]);
  const [loadingRenovacao, setLoadingRenovacao] = useState(false);
  const [loadingDadosRenovacao, setLoadingDadosRenovacao] = useState(false);

  // Modal de Vincular Vistoria Existente
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [vincularTipo, setVincularTipo] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [vistoriasParaVincular, setVistoriasParaVincular] = useState<any[]>([]);
  const [selectedVistoriaIdParaVincular, setSelectedVistoriaIdParaVincular] = useState<string>("");
  const [loadingVistoriasVincular, setLoadingVistoriasVincular] = useState(false);
  const [loadingSalvarVinculo, setLoadingSalvarVinculo] = useState(false);

  const [activeToken, setActiveToken] = useState<string | null>(tokenAssinatura || null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [showLinkBox, setShowLinkBox] = useState(false);
  const [copiedContractLink, setCopiedContractLink] = useState(false);

  // Modal de Visualização Interna de Documentos (Contrato / Vistoria)
  const [modalDocumentoUrl, setModalDocumentoUrl] = useState<string | null>(null);
  const [modalDocumentoTitulo, setModalDocumentoTitulo] = useState<string>("");

  // Form Baixa
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0]);
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [valorPago, setValorPago] = useState(valorMensal.toString());
  const [enviarWhatsAppAuto, setEnviarWhatsAppAuto] = useState(true);
  const [loadingBaixa, setLoadingBaixa] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const vistoriasEntradaList = (vistoriasChecklist || []).filter((v: any) => v.tipoVistoria === "ENTRADA");
  const vistoriaEntrada = vistoriasEntradaList.find((v: any) => v.statusAssinatura?.includes("ASSINADO"))
    || vistoriasEntradaList[vistoriasEntradaList.length - 1]
    || vistoriasEntradaList[0];

  const vistoriasSaidaList = (vistoriasChecklist || []).filter((v: any) => v.tipoVistoria === "SAIDA");
  const vistoriaSaida = vistoriasSaidaList.find((v: any) => v.statusAssinatura?.includes("ASSINADO"))
    || vistoriasSaidaList[vistoriasSaidaList.length - 1]
    || vistoriasSaidaList[0];

  // Informações de Vencimento e Vigência do Contrato (Diário, Semanal, Mensal, Anual)
  const vencimentoInfo = React.useMemo(() => {
    const dataEmissaoRaw = contratoCompleto?.dataEmissao || contratoCompleto?.createdAt;
    const dataFinalRaw = contratoCompleto?.dataFinal;

    const parseDateOnly = (dStr?: string | Date | null) => {
      if (!dStr) return null;
      const str = typeof dStr === "string" ? dStr.split("T")[0] : new Date(dStr).toISOString().split("T")[0];
      const parts = str.split("-");
      if (parts.length === 3) {
        return {
          formatted: `${parts[2]}/${parts[1]}/${parts[0]}`,
          date: new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])),
        };
      }
      return {
        formatted: new Date(dStr).toLocaleDateString("pt-BR"),
        date: new Date(dStr),
      };
    };

    const emissaoParsed = parseDateOnly(dataEmissaoRaw);
    let finalParsed = parseDateOnly(dataFinalRaw);

    // Se não tiver dataFinal persistida, calcular dinamicamente a partir da emissão e validade
    if (!finalParsed && emissaoParsed) {
      const dt = new Date(emissaoParsed.date.getTime());
      if (tipoValidade === "DIAS") {
        const d = Number(validadeDias || validadeMeses || 1);
        dt.setDate(dt.getDate() + d);
      } else {
        const m = Number(validadeMeses || 12);
        dt.setMonth(dt.getMonth() + m);
      }
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      finalParsed = {
        formatted: `${d}/${m}/${y}`,
        date: dt,
      };
    }

    let tipoLabel = "";
    if (tipoValidade === "DIAS") {
      const d = Number(validadeDias || validadeMeses || 1);
      if (d === 1) tipoLabel = "Diário (1 Dia)";
      else if (d === 7) tipoLabel = "Semanal (7 Dias)";
      else if (d === 14 || d === 15) tipoLabel = "Quinzenal (15 Dias)";
      else if (d === 30) tipoLabel = "Mensal (30 Dias)";
      else tipoLabel = `${d} Dias (Temporada)`;
    } else {
      const m = Number(validadeMeses || 12);
      if (m === 1) tipoLabel = "Mensal (1 Mês)";
      else if (m === 3) tipoLabel = "Trimestral (3 Meses)";
      else if (m === 6) tipoLabel = "Semestral (6 Meses)";
      else if (m === 12) tipoLabel = "Anual (12 Meses)";
      else if (m === 24) tipoLabel = "Bianual (24 Meses)";
      else tipoLabel = `${m} Meses`;
    }

    let diasAteVencimento: number | null = null;
    let isVencido = false;
    let isVencendoEmBreve = false;

    if (finalParsed?.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(finalParsed.date);
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      diasAteVencimento = diffDays;
      if (contratoCompleto?.status !== "FINALIZADO") {
        if (diffDays < 0) {
          isVencido = true;
        } else if (diffDays <= 30) {
          isVencendoEmBreve = true;
        }
      }
    }

    return {
      dataEmissao: emissaoParsed?.formatted || "-",
      dataVencimento: finalParsed?.formatted || "-",
      tipoLabel,
      diaVencimento: contratoCompleto?.diaVencimento ? `Todo dia ${contratoCompleto.diaVencimento}` : undefined,
      diasAteVencimento,
      isVencido,
      isVencendoEmBreve,
    };
  }, [contratoCompleto, tipoValidade, validadeDias, validadeMeses]);

  // Cálculo de encargos por atraso na baixa de parcela
  const encargosParcela = React.useMemo(() => {
    if (!selectedParcela) return null;
    const multaPercent = contratoCompleto?.multaAtrasoPercentual ?? 2.0;
    const jurosPercent = contratoCompleto?.jurosAtrasoPercentual ?? 1.0;
    return calcularEncargosAtraso(
      selectedParcela.valor,
      selectedParcela.dataVencimento,
      dataPagamento,
      multaPercent,
      jurosPercent
    );
  }, [selectedParcela, dataPagamento, contratoCompleto]);

  // Cálculo da Multa Rescisória Contratual
  const multaRescisoriaInfo = React.useMemo(() => {
    const vMensal = valorMensal || contratoCompleto?.valorMensal || 0;
    const dInicio = contratoCompleto?.dataEmissao || contratoCompleto?.createdAt;
    const valMeses = contratoCompleto?.validadeMeses || (tipoValidade === "MESES" ? Number(validadeMeses || 12) : 12);
    const mMeses = contratoCompleto?.multaRescisaoMeses ?? 3;

    return calcularMultaRescisoria(vMensal, dInicio, dataRescisao, valMeses, mMeses);
  }, [valorMensal, contratoCompleto, tipoValidade, validadeMeses, dataRescisao]);

  const valorMultaEfetivo = React.useMemo(() => {
    if (!cobrarMultaRescisoria) return 0;
    if (tipoCalculoMulta === "PROPORCIONAL") return multaRescisoriaInfo.multaProporcional;
    if (tipoCalculoMulta === "INTEGRAL") return multaRescisoriaInfo.multaIntegral;
    return parseFloat(valorMultaCustom || "0") || 0;
  }, [cobrarMultaRescisoria, tipoCalculoMulta, multaRescisoriaInfo, valorMultaCustom]);

  const handleOpenModal = (parcela: ParcelaItem) => {
    setSelectedParcela(parcela);
    const todayStr = new Date().toISOString().split("T")[0];
    setDataPagamento(todayStr);
    const multaPercent = contratoCompleto?.multaAtrasoPercentual ?? 2.0;
    const jurosPercent = contratoCompleto?.jurosAtrasoPercentual ?? 1.0;
    const enc = calcularEncargosAtraso(parcela.valor, parcela.dataVencimento, todayStr, multaPercent, jurosPercent);

    if (parcela.valorPago) {
      setValorPago(parcela.valorPago.toString());
    } else if (enc.diasAtraso > 0) {
      setValorPago(enc.totalComEncargos.toFixed(2));
    } else {
      setValorPago(parcela.valor.toString());
    }
    setShowModal(true);
    setMessageFeedback("");
  };

  const handleOpenVistoriaModal = (tipo: "ENTRADA" | "SAIDA") => {
    setTargetTipoVistoria(tipo);
    setShowChecklistModal(true);
  };

  const handleAbrirModalEncerramento = async () => {
    setTipoEncerramento("NORMAL");
    setDataRescisao(new Date().toISOString().split("T")[0]);
    setCobrarMultaRescisoria(true);
    setTipoCalculoMulta("PROPORCIONAL");
    setMotivoEncerramento("Término de vigência / Devolução de chaves");
    const d5 = new Date();
    d5.setDate(d5.getDate() + 5);
    setDataVencimentoMulta(d5.toISOString().split("T")[0]);
    setShowEncerrarModal(true);
    setLoadingVistoriasSaida(true);
    try {
      let url = `/api/vistorias?tipoVistoria=SAIDA&apenasDisponiveis=true`;
      if (flatId && locatarioId) {
        url += `&flatId=${flatId}&locatarioId=${locatarioId}&flatOuLocatario=true`;
      } else if (flatId) {
        url += `&flatId=${flatId}`;
      } else if (locatarioId) {
        url += `&locatarioId=${locatarioId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const list = data.vistorias || [];
      setVistoriasSaidaParaEncerramento(list);

      if (vistoriaSaida?.id) {
        setSelectedVistoriaSaidaId(vistoriaSaida.id);
      } else if (list.length > 0) {
        const preferred = list.find((v: any) => v.statusAssinatura?.includes("ASSINADO")) || list[0];
        setSelectedVistoriaSaidaId(preferred.id);
      } else {
        setSelectedVistoriaSaidaId("none");
      }
    } catch (e) {
      setVistoriasSaidaParaEncerramento([]);
      setSelectedVistoriaSaidaId("none");
    } finally {
      setLoadingVistoriasSaida(false);
    }
  };

  const handleConfirmarEncerramento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEncerramento(true);
    try {
      const res = await fetch("/api/contratos/encerrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contratoId,
          vistoriaSaidaId: selectedVistoriaSaidaId !== "none" ? selectedVistoriaSaidaId : null,
          cancelarParcelasPendentes: cancelarParcelasFuturas,
          tipoEncerramento,
          cobrarMulta: tipoEncerramento === "RESCISAO_ANTECIPADA" && cobrarMultaRescisoria && valorMultaEfetivo > 0,
          valorMulta: valorMultaEfetivo,
          tipoCalculoMulta,
          dataVencimentoMulta,
          motivo: motivoEncerramento,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Contrato finalizado com sucesso! O imóvel foi liberado.");
        setShowEncerrarModal(false);
        if (onBaixaSucesso) onBaixaSucesso();
      } else {
        toast.error(data.error || "Erro ao encerrar contrato.");
      }
    } catch (err: any) {
      toast.error("Erro ao encerrar contrato: " + (err.message || err));
    } finally {
      setLoadingEncerramento(false);
    }
  };

  const handleAbrirModalRenovacao = async () => {
    setLoadingDadosRenovacao(true);
    setShowRenovarModal(true);

    let dtSugerida = new Date();
    if (contratoCompleto?.dataFinal) {
      const dtF = new Date(contratoCompleto.dataFinal);
      dtF.setDate(dtF.getDate() + 1);
      dtSugerida = dtF;
    }
    const dtSugeridaStr = dtSugerida.toISOString().split("T")[0];

    setRenovacaoMesmoImovel(true);
    setRenovacaoNovoFlatId(flatId || "");
    setRenovacaoNovoValor(String(valorMensal || contratoCompleto?.valorMensal || ""));
    setRenovacaoDataInicio(dtSugeridaStr);
    setRenovacaoTipoValidade(tipoValidade === "DIAS" ? "DIAS" : "MESES");
    setRenovacaoValidadeValor(String(validadeMeses || validadeDias || "12"));
    setRenovacaoDiaVencimento(String(contratoCompleto?.diaVencimento || "5"));
    setRenovacaoFormaPagamento(contratoCompleto?.formaPagamento || "PIX");
    setRenovacaoModeloId(contratoCompleto?.modeloContratoId || "");
    setRenovacaoMultaAtraso(String(contratoCompleto?.multaAtrasoPercentual ?? "2.0"));
    setRenovacaoJurosAtraso(String(contratoCompleto?.jurosAtrasoPercentual ?? "1.0"));
    setRenovacaoMultaRescisao(String(contratoCompleto?.multaRescisaoMeses ?? "3"));
    setRenovacaoTransferirCaucao(Boolean(contratoCompleto?.valorCaucao && contratoCompleto.valorCaucao > 0));
    setRenovacaoNovoCaucao("0.00");
    setRenovacaoCaucaoParcelas("0");

    try {
      const [resFlats, resModelos] = await Promise.all([
        fetch("/api/flats").then((r) => r.json()).catch(() => ({ flats: [] })),
        fetch("/api/modelos-contrato").then((r) => r.json()).catch(() => ({ modelos: [] })),
      ]);
      setFlatsDisponiveisRenovacao(resFlats.flats || []);
      setModelosRenovacao(resModelos.modelos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDadosRenovacao(false);
    }
  };

  const handleConfirmarRenovacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRenovacao(true);

    try {
      const res = await fetch("/api/contratos/renovar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contratoAnteriorId: contratoId,
          mesmoImovel: renovacaoMesmoImovel,
          novoFlatId: renovacaoMesmoImovel ? flatId : renovacaoNovoFlatId,
          novoValorMensal: parseFloat(renovacaoNovoValor),
          tipoValidade: renovacaoTipoValidade,
          validadeValor: renovacaoValidadeValor,
          dataInicioRenovacao: renovacaoDataInicio,
          diaVencimento: parseInt(renovacaoDiaVencimento, 10),
          formaPagamento: renovacaoFormaPagamento,
          modeloContratoId: renovacaoModeloId || undefined,
          multaAtrasoPercentual: parseFloat(renovacaoMultaAtraso),
          jurosAtrasoPercentual: parseFloat(renovacaoJurosAtraso),
          multaRescisaoMeses: parseInt(renovacaoMultaRescisao, 10),
          valorCaucao: parseFloat(renovacaoNovoCaucao || "0"),
          caucaoParcelas: parseInt(renovacaoCaucaoParcelas || "0", 10),
          transferirCaucaoAnterior: renovacaoTransferirCaucao,
          vistoriaSaidaAntigaId: renovacaoVistoriaSaidaId || undefined,
          vistoriaEntradaNovaId: renovacaoVistoriaEntradaId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Contrato renovado com sucesso!");
        setShowRenovarModal(false);
        if (onBaixaSucesso) onBaixaSucesso();
      } else {
        toast.error(data.error || "Erro ao renovar contrato.");
      }
    } catch (err: any) {
      toast.error("Erro ao renovar contrato: " + (err.message || err));
    } finally {
      setLoadingRenovacao(false);
    }
  };

  const handleAbrirModalVincular = async (tipo: "ENTRADA" | "SAIDA") => {
    setVincularTipo(tipo);
    setShowVincularModal(true);
    setLoadingVistoriasVincular(true);
    try {
      let url = `/api/vistorias?tipoVistoria=${tipo}&apenasDisponiveis=true`;
      if (flatId && locatarioId) {
        url += `&flatId=${flatId}&locatarioId=${locatarioId}&flatOuLocatario=true`;
      } else if (flatId) {
        url += `&flatId=${flatId}`;
      } else if (locatarioId) {
        url += `&locatarioId=${locatarioId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const list = data.vistorias || [];
      setVistoriasParaVincular(list);
      if (list.length > 0) {
        const preferred = list.find((v: any) => v.locatarioId === locatarioId) || list[0];
        setSelectedVistoriaIdParaVincular(preferred.id);
      } else {
        setSelectedVistoriaIdParaVincular("");
      }
    } catch (e) {
      setVistoriasParaVincular([]);
      setSelectedVistoriaIdParaVincular("");
    } finally {
      setLoadingVistoriasVincular(false);
    }
  };

  const handleSalvarVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVistoriaIdParaVincular) {
      toast.warning("Selecione uma vistoria para vincular.");
      return;
    }

    setLoadingSalvarVinculo(true);
    try {
      const res = await fetch("/api/contratos/vincular-vistoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contratoId,
          vistoriaId: selectedVistoriaIdParaVincular,
          tipoVistoria: vincularTipo,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Vistoria vinculada com sucesso ao contrato!");
        setShowVincularModal(false);
        if (onBaixaSucesso) onBaixaSucesso();
      } else {
        toast.error(data.error || "Erro ao vincular vistoria.");
      }
    } catch (err: any) {
      toast.error("Erro ao vincular vistoria: " + (err.message || err));
    } finally {
      setLoadingSalvarVinculo(false);
    }
  };

  const contractPublicUrl = activeToken
    ? `${getAppBaseUrl()}/assinar/contrato/${activeToken}`
    : "";

  const handleGerarOuExibirLinkContrato = async () => {
    if (activeToken) {
      setShowLinkBox(!showLinkBox);
      return;
    }

    setGeneratingToken(true);
    try {
      const res = await fetch("/api/contratos/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contratoId }),
      });

      const data = await res.json();
      if (data.tokenAssinatura) {
        setActiveToken(data.tokenAssinatura);
        setShowLinkBox(true);
      }
    } catch (err) {
      console.error("Erro ao gerar token do contrato:", err);
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyContractLink = () => {
    if (!contractPublicUrl) return;
    navigator.clipboard.writeText(contractPublicUrl);
    setCopiedContractLink(true);
    setTimeout(() => setCopiedContractLink(false), 2000);
  };

  const handleEnviarContratoWhatsApp = async () => {
    if (!contractPublicUrl || !locatarioTelefone) return;

    const isAssinado = statusAssinatura === "ASSINADO";
    const firstVenc = parcelas[0]?.dataVencimento ? new Date(parcelas[0].dataVencimento) : new Date();
    const lastVenc = parcelas[parcelas.length - 1]?.dataVencimento
      ? new Date(parcelas[parcelas.length - 1].dataVencimento)
      : new Date();

    const flatLocal = contratoCompleto?.flat?.local || null;
    const headerInfo = resolveHeaderData(flatLocal, empresaData);

    const pdfBase64 = await getContratoPDFBase64({
      empresaNome: headerInfo.nome,
      empresaCnpj: headerInfo.cnpj,
      empresaEndereco: headerInfo.endereco,
      empresaTelefone: headerInfo.telefone,
      empresaEmail: headerInfo.email,
      empresaLogomarcaUrl: headerInfo.logomarcaUrl,
      usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
      empresaAssinaturaUrl: currentUser?.assinaturaUrl || empresaData?.assinaturaUrl || undefined,
      locatarioNome,
      locatarioCpf,
      locatarioTelefone,
      flatNumero,
      localNome: flatLocal?.nome,
      valorMensal,
      tipoValidade: tipoValidade || "MESES",
      validadeMeses: validadeMeses || parcelas.length || 12,
      validadeDias: validadeDias || undefined,
      dataEmissao: firstVenc.toLocaleDateString("pt-BR"),
      dataFinal: lastVenc.toLocaleDateString("pt-BR"),
      conteudoHtml: replaceContractVariables(
        modeloContratoHtml || DEFAULT_CONTRATO_HTML,
        contratoCompleto || {
          id: contratoId,
          locatario: { nome: locatarioNome, cpf: locatarioCpf, telefone: locatarioTelefone },
          flat: { numero: flatNumero, local: flatLocal },
          valorMensal,
          tipoValidade,
          validadeMeses,
          validadeDias,
          empresa: empresaData,
        }
      ),
      statusAssinatura: statusAssinatura || "PENDENTE",
      vistoriaEntrada: vistoriaEntrada || undefined,
    });

    const text = isAssinado
      ? `*CÓPIA DO CONTRATO ASSINADO*\n\nOlá *${locatarioNome}*,\nSegue em anexo a cópia do seu contrato de aluguel do *${flatNumero}* em formato PDF (devidamente assinado).\n\nAcesse também pelo link seguro:\n${contractPublicUrl}`
      : `*CONTRATO DE LOCAÇÃO - ASSINATURA DIGITAL*\n\nOlá *${locatarioNome}*,\nSeu contrato de aluguel do *${flatNumero}* já está disponível para assinatura digital.\n\nSegue em anexo o documento em PDF para simples leitura.\nAcesse o link seguro para assinar:\n${contractPublicUrl}`;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: locatarioTelefone,
          message: text,
          pdfBase64,
          fileName: `Contrato_Locacao_Flat_${flatNumero.replace(/\s+/g, "_")}.pdf`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Contrato em PDF e mensagem enviados com sucesso pelo WhatsApp!");
      } else {
        toast.error(`Falha ao enviar pelo WhatsApp: ${data.error || "Verifique as configurações em Parâmetros."}`);
      }
    } catch (err: any) {
      toast.error(`Erro ao enviar pelo WhatsApp: ${err.message || err}`);
    }
  };

  const handleVisualizarDocumentoAssinado = (url: string, titulo: string = "Visualizar Documento") => {
    setModalDocumentoTitulo(titulo);
    setModalDocumentoUrl(url);
  };

  const handleBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcela) return;

    setLoadingBaixa(true);
    setMessageFeedback("");

    try {
      const res = await fetch("/api/financeiro/baixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contaId: selectedParcela.id,
          dataPagamento,
          formaPagamento,
          valorPago: parseFloat(valorPago),
          enviarWhatsApp: enviarWhatsAppAuto,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageFeedback(`❌ Erro: ${data.error}`);
        setLoadingBaixa(false);
        return;
      }

      setMessageFeedback("✅ Baixa realizada com sucesso!");
      if (data.whatsAppResult?.success) {
        setMessageFeedback("✅ Baixa realizada e mensagem enviada pelo WhatsApp!");
      }

      setTimeout(() => {
        setShowModal(false);
        if (onBaixaSucesso) onBaixaSucesso();
      }, 1200);
    } catch (err) {
      setMessageFeedback("❌ Erro ao conectar ao servidor.");
    } finally {
      setLoadingBaixa(false);
    }
  };

  const handleGerarRecibo = () => {
    if (!selectedParcela) return;

    const formattedMesRef = formatMesReferencia(selectedParcela.mesReferencia);
    const flatLocal = contratoCompleto?.flat?.local || null;
    const headerInfo = resolveHeaderData(flatLocal, empresaData);

    generateReciboPDF({
      empresaNome: headerInfo.nome,
      empresaCnpj: headerInfo.cnpj,
      empresaEndereco: headerInfo.endereco,
      empresaTelefone: headerInfo.telefone,
      empresaEmail: headerInfo.email,
      empresaLogomarcaUrl: headerInfo.logomarcaUrl,
      usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
      empresaAssinaturaUrl: currentUser?.assinaturaUrl || empresaData?.assinaturaUrl || undefined,
      locatarioNome,
      locatarioCpf,
      flatNumero,
      mesReferencia: formattedMesRef,
      valor: selectedParcela.valorPago || selectedParcela.valor,
      dataPagamento: selectedParcela.dataPagamento
        ? new Date(selectedParcela.dataPagamento).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR"),
      formaPagamento: selectedParcela.formaPagamento || "PIX",
      numeroRecibo: selectedParcela.id.slice(0, 8).toUpperCase(),
      observacao: selectedParcela.observacao || (selectedParcela.numeroParcela === 0 ? "Depósito Caução / Garantia Locatícia" : undefined),
    });
  };

  const handleEnviarWhatsAppFallback = async () => {
    if (!selectedParcela || !locatarioTelefone) return;

    let pdfBase64: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let text = "";
    const formattedMesRef = formatMesReferencia(selectedParcela.mesReferencia);
    const isCaucaoItem = selectedParcela.numeroParcela === 0 || selectedParcela.observacao?.toLowerCase().includes("caução") || selectedParcela.observacao?.toLowerCase().includes("caucao");

    const flatLocal = contratoCompleto?.flat?.local || null;
    const headerInfo = resolveHeaderData(flatLocal, empresaData);

    if (selectedParcela.status === "PAGO") {
      pdfBase64 = await getReciboPDFBase64({
        empresaNome: headerInfo.nome,
        empresaCnpj: headerInfo.cnpj,
        empresaEndereco: headerInfo.endereco,
        empresaTelefone: headerInfo.telefone,
        empresaEmail: headerInfo.email,
        empresaLogomarcaUrl: headerInfo.logomarcaUrl,
        usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
        empresaAssinaturaUrl: currentUser?.assinaturaUrl || empresaData?.assinaturaUrl || undefined,
        locatarioNome,
        locatarioCpf,
        flatNumero,
        mesReferencia: formattedMesRef,
        valor: selectedParcela.valorPago || selectedParcela.valor,
        dataPagamento: selectedParcela.dataPagamento
          ? new Date(selectedParcela.dataPagamento).toLocaleDateString("pt-BR")
          : new Date().toLocaleDateString("pt-BR"),
        formaPagamento: selectedParcela.formaPagamento || "PIX",
        numeroRecibo: selectedParcela.id.slice(0, 8).toUpperCase(),
        observacao: selectedParcela.observacao || (isCaucaoItem ? "Depósito Caução / Garantia Locatícia" : undefined),
      });

      fileName = isCaucaoItem
        ? `Recibo_Caucao_${flatNumero.replace(/\s+/g, "_")}.pdf`
        : `Recibo_${selectedParcela.id.slice(0, 8).toUpperCase()}_${formattedMesRef.replace("/", "_")}.pdf`;
      text = isCaucaoItem
        ? `*COMPROVANTE DE DEPÓSITO CAUÇÃO / GARANTIA*\n\nOlá *${locatarioNome}*,\nSegue em anexo o recibo de Depósito Caução em PDF referente ao *${flatNumero}*. Obrigado!`
        : `*COMPROVANTE DE PAGAMENTO / RECIBO*\n\nOlá *${locatarioNome}*,\nSegue em anexo o recibo de pagamento em PDF do *${flatNumero}* (Ref: ${formattedMesRef}). Obrigado!`;
    } else {
      text = isCaucaoItem
        ? `*LEMBRETE DE PAGAMENTO - DEPÓSITO CAUÇÃO*\n\nOlá *${locatarioNome}*,\nLembramos sobre o pagamento do Depósito Caução do *${flatNumero}* no valor de *${formatCurrency(selectedParcela.valor)}*.\n\nVencimento: ${new Date(selectedParcela.dataVencimento).toLocaleDateString("pt-BR")}.`
        : `*LEMBRETE DE COBRANÇA - ALUGUEL*\n\nOlá *${locatarioNome}*,\nLembramos sobre a parcela do aluguel do *${flatNumero}* (Vencimento: ${new Date(selectedParcela.dataVencimento).toLocaleDateString("pt-BR")}) no valor de *${formatCurrency(selectedParcela.valor)}*.\n\nMês Ref: ${formattedMesRef}.\n\nPara maiores dúvidas ou comprovantes, favor responder este WhatsApp. Obrigado!`;
    }

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: locatarioTelefone,
          message: text,
          pdfBase64,
          fileName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessageFeedback("✅ Recibo em PDF enviado com sucesso pelo WhatsApp!");
      } else {
        setMessageFeedback(`❌ Falha ao enviar pelo WhatsApp: ${data.error || "Verifique se a integração está configurada em Parâmetros."}`);
      }
    } catch (err: any) {
      setMessageFeedback(`❌ Erro ao enviar pelo WhatsApp: ${err.message || err}`);
    }
  };

  const getMonthAbbrev = (mesRef: string) => {
    const parts = mesRef.split("-");
    if (parts.length < 2) return mesRef;
    const mesIndex = parseInt(parts[1]) - 1;
    const nomes = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    return `${nomes[mesIndex] || parts[1]}/${parts[0].slice(2)}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
      {/* Topo: Locatário & Flat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base mr-1">{locatarioNome}</h3>
              
              {/* 1. Status Vistoria de Entrada */}
              {vistoriaEntrada?.statusAssinatura?.includes("ASSINADO") ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <span>1.</span> <span>✓ Vistoria Entrada Assinada</span>
                </span>
              ) : vistoriaEntrada ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center gap-1">
                  <span>1.</span> <span>Vistoria Entrada Pendente</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold flex items-center gap-1">
                  <span>1.</span> <span>Sem Vistoria Entrada</span>
                </span>
              )}

              {/* 2. Status Contrato de Locação */}
              {statusAssinatura === "ASSINADO" ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <span>2.</span> <span>✓ Contrato Assinado</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                  <span>2.</span> <span>Aguardando Assinatura</span>
                </span>
              )}

              {/* 3. Status Encerramento / Status Geral */}
              {contratoCompleto?.status === "FINALIZADO" ? (
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-extrabold flex items-center gap-1">
                  <span>🏁 Contrato Encerrado</span>
                </span>
              ) : vencimentoInfo.isVencido ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse flex items-center gap-1 shadow-xs">
                  <span>🚨 Vencido ({Math.abs(vencimentoInfo.diasAteVencimento || 0)}d)</span>
                </span>
              ) : vencimentoInfo.isVencendoEmBreve ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                  <span>⚠️ Vence em {vencimentoInfo.diasAteVencimento} dias</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                  <span>🟢 Ativo</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              CPF: {locatarioCpf} • {flatNumero} •{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {tipoValidade === "DIAS" ? `☀️ ${validadeDias || validadeMeses} dias (Temporada)` : `📅 ${validadeMeses || 12} meses`}
              </span>
            </p>

            {/* Linha com a Data de Vencimento do Contrato (Diário, Semanal, Mensal, Anual, etc.) */}
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 font-bold text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  Vencimento do Contrato: <strong className="text-blue-700 dark:text-blue-300 font-black">{vencimentoInfo.dataVencimento}</strong>
                </span>
                <span className="text-[11px] font-normal text-blue-600/80 dark:text-blue-400/80">
                  (Início: {vencimentoInfo.dataEmissao})
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Modalidade: <strong>{vencimentoInfo.tipoLabel}</strong></span>
                {vencimentoInfo.diaVencimento && (
                  <span className="text-slate-500 dark:text-slate-400">({vencimentoInfo.diaVencimento})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTOES DE ACAO DO CONTRATO E VISTORIAS */}
        <div className="flex flex-col sm:items-end gap-1.5 flex-shrink-0">
          {/* LINHA 1: 1. VISTORIA DE ENTRADA */}
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => {
                if (vistoriaEntrada?.laudoImpressoUrl) {
                  handleVisualizarDocumentoAssinado(vistoriaEntrada.laudoImpressoUrl, `Laudo de Vistoria de Entrada - Flat ${flatNumero}`);
                } else if (vistoriaEntrada?.tokenAssinatura && vistoriaEntrada.statusAssinatura === "ASSINADO") {
                  handleVisualizarDocumentoAssinado(`/assinar/vistoria/${vistoriaEntrada.tokenAssinatura}`, `Laudo de Vistoria de Entrada - Flat ${flatNumero}`);
                } else {
                  handleOpenVistoriaModal("ENTRADA");
                }
              }}
              className={`py-1 px-3 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition flex-1 sm:flex-initial justify-center sm:justify-start ${
                vistoriaEntrada
                  ? vistoriaEntrada.statusAssinatura?.includes("ASSINADO")
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {vistoriaEntrada
                  ? `1. Vistoria Entrada (${vistoriaEntrada.statusAssinatura?.includes("ASSINADO") ? "✓ Ver Assinado" : "⌛ Pendente"})`
                  : "1. 🟢 Nova Vistoria Entrada"}
              </span>
            </button>

            {!vistoriaEntrada && (
              <button
                type="button"
                onClick={() => handleAbrirModalVincular("ENTRADA")}
                className="p-1 px-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold flex items-center gap-1 transition"
                title="Vincular Vistoria de Entrada Existente"
              >
                <Link2 className="w-3 h-3" />
                <span>Vincular</span>
              </button>
            )}
          </div>

          {/* LINHA 2: 2. CONTRATO DE LOCAÇÃO */}
          {statusAssinatura === "ASSINADO" && activeToken ? (
            <button
              onClick={() => handleVisualizarDocumentoAssinado(`/assinar/contrato/${activeToken}`, `Contrato de Locação Assinado - Flat ${flatNumero}`)}
              className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition w-full sm:w-auto justify-center sm:justify-start"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>2. Ver Contrato Assinado</span>
            </button>
          ) : (
            <button
              onClick={handleGerarOuExibirLinkContrato}
              disabled={generatingToken}
              className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50 w-full sm:w-auto justify-center sm:justify-start"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>{generatingToken ? "Gerando..." : "2. Gerar Link Assinatura Contrato"}</span>
            </button>
          )}

          {/* LINHA 3: 3. VISTORIA DE SAÍDA & ENCERRAMENTO */}
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => {
                if (vistoriaSaida?.laudoImpressoUrl) {
                  handleVisualizarDocumentoAssinado(vistoriaSaida.laudoImpressoUrl, `Laudo de Vistoria de Saída - Flat ${flatNumero}`);
                } else if (vistoriaSaida?.tokenAssinatura && vistoriaSaida.statusAssinatura === "ASSINADO") {
                  handleVisualizarDocumentoAssinado(`/assinar/vistoria/${vistoriaSaida.tokenAssinatura}`, `Laudo de Vistoria de Saída - Flat ${flatNumero}`);
                } else {
                  handleOpenVistoriaModal("SAIDA");
                }
              }}
              className={`py-1 px-3 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition flex-1 sm:flex-initial justify-center sm:justify-start ${
                vistoriaSaida
                  ? vistoriaSaida.statusAssinatura?.includes("ASSINADO")
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {vistoriaSaida
                  ? `3. Vistoria Saída (${vistoriaSaida.statusAssinatura?.includes("ASSINADO") ? "✓ Ver Assinado" : "⌛ Pendente"})`
                  : "3. 🔴 Nova Vistoria Saída"}
              </span>
            </button>

            {!vistoriaSaida && (
              <button
                type="button"
                onClick={() => handleAbrirModalVincular("SAIDA")}
                className="p-1 px-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold flex items-center gap-1 transition"
                title="Vincular Vistoria de Saída Existente"
              >
                <Link2 className="w-3 h-3" />
                <span>Vincular</span>
              </button>
            )}
          </div>

          {/* LINHA 4: RENOVAR, EDITAR & ENCERRAMENTO */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {contratoCompleto?.status !== "FINALIZADO" && (
              <button
                type="button"
                onClick={handleAbrirModalRenovacao}
                className={`py-1 px-3 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs flex-1 sm:flex-initial justify-center sm:justify-start ${
                  vencimentoInfo.isVencido || vencimentoInfo.isVencendoEmBreve
                    ? "bg-purple-600 hover:bg-purple-500 text-white ring-2 ring-purple-400/50 animate-pulse"
                    : "bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                }`}
                title="Renovar Contrato de Locação (Mesmo Imóvel ou Troca de Flat)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Renovar Contrato</span>
              </button>
            )}

            {onEditarContrato && (
              <button
                type="button"
                onClick={() => onEditarContrato(contratoCompleto)}
                className="py-1 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs flex-1 sm:flex-initial justify-center sm:justify-start"
                title="Editar Condições do Contrato"
              >
                <Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Editar Contrato</span>
              </button>
            )}

            {contratoCompleto?.status !== "FINALIZADO" && (
              <button
                type="button"
                onClick={handleAbrirModalEncerramento}
                className="py-1 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-1.5 transition shadow-xs flex-1 sm:flex-initial justify-center sm:justify-start"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Encerrar / Desocupar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Caixa Expansível com o Link de Assinatura do Contrato Gerado */}
      {showLinkBox && contractPublicUrl && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 space-y-2 animate-in fade-in">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
            {statusAssinatura === "ASSINADO"
              ? "✓ Contrato Assinado - Link de Cópia para Envio:"
              : "✓ Link de Assinatura Digital do Contrato Pronto para Envio:"}
          </span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={contractPublicUrl}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyContractLink}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1"
              >
                {copiedContractLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedContractLink ? "Copiado!" : "Copiar Link"}</span>
              </button>
              <button
                onClick={handleEnviarContratoWhatsApp}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Meses / Linha do Tempo */}
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          Grid Visual de Meses / Linha do Tempo:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {parcelas.map((p) => {
            const isPago = p.status === "PAGO";
            const isAtrasado = p.status === "ATRASADO";

            return (
              <button
                key={p.id}
                onClick={() => handleOpenModal(p)}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border font-semibold text-xs transition-all transform hover:-translate-y-0.5 shadow-xs ${
                  isPago
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                    : isAtrasado
                    ? "bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-700/60 text-red-800 dark:text-red-300 hover:bg-red-100 animate-pulse"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100"
                }`}
              >
                <span className="text-[10px] opacity-75 font-normal">
                  {p.numeroParcela === 0 ? "🛡️ Caução" : `#${p.numeroParcela}`}
                </span>
                <span className="text-xs font-bold my-0.5">{getMonthAbbrev(p.mesReferencia)}</span>

                {/* Valor da Parcela Pequeno e Discreto */}
                <span className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight my-0.5 opacity-90">
                  R$ {(p.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>

                <div className="flex items-center space-x-1 mt-1 text-[10px]">
                  {isPago ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Pago</span>
                    </>
                  ) : isAtrasado ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                      <span>Atrasado</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Pendente</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal de Baixa */}
      {showModal && selectedParcela && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[92vh] my-auto overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {selectedParcela.numeroParcela === 0
                    ? "🛡️ Depósito Caução - Garantia Locatícia"
                    : `Mês ${getMonthAbbrev(selectedParcela.mesReferencia)} - Parcela #${selectedParcela.numeroParcela}`}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {locatarioNome} • {flatNumero}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {messageFeedback && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                {messageFeedback}
              </div>
            )}

            <form onSubmit={handleBaixa} className="space-y-4">
              {/* Alerta Inteligente de Atraso e Encargos */}
              {encargosParcela && encargosParcela.diasAtraso > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between text-amber-900 dark:text-amber-200">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Pagamento em atraso ({encargosParcela.diasAtraso} dias)</span>
                    </div>
                    <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 rounded-md font-mono font-bold">
                      Venc: {new Date(selectedParcela.dataVencimento).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[11px] bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-amber-200 dark:border-amber-900/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Multa ({encargosParcela.multaPercentual}%):</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">+{formatCurrency(encargosParcela.multaValor)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Juros ({encargosParcela.jurosPercentualMensal}% a.m.):</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">+{formatCurrency(encargosParcela.jurosValor)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total c/ Encargos:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(encargosParcela.totalComEncargos)}</span>
                    </div>
                  </div>

                  {/* Botões de Ação Rápida */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setValorPago(encargosParcela.totalComEncargos.toFixed(2))}
                      className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10.5px] font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      title="Aplica juros e multa calculados no valor a pagar"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Aplicar Encargos ({formatCurrency(encargosParcela.totalComEncargos)})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setValorPago(Number(selectedParcela.valor).toFixed(2))}
                      className="flex-1 py-1.5 px-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10.5px] font-bold transition flex items-center justify-center gap-1"
                      title="Zera juros e multa, mantendo o valor original da parcela"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Zerar Encargos ({formatCurrency(selectedParcela.valor)})</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    required
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão de Crédito/Débito</option>
                    <option value="Boleto">Boleto Bancário</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Valor Pago (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={enviarWhatsAppAuto}
                  onChange={(e) => setEnviarWhatsAppAuto(e.target.checked)}
                  className="rounded border-slate-300 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <span>Enviar confirmação automática pelo WhatsApp</span>
              </label>

              <button
                type="submit"
                disabled={loadingBaixa}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4" />
                <span>{loadingBaixa ? "Confirmando..." : "Dar Baixa no Pagamento"}</span>
              </button>
            </form>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGerarRecibo}
                className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center space-x-2 transition"
              >
                <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Baixar Recibo PDF</span>
              </button>

              <button
                type="button"
                onClick={handleEnviarWhatsAppFallback}
                className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-2 transition"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Enviar WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Checklist no Contrato (Entrada ou Saída) */}
      {showChecklistModal && (
        <ChecklistVistoriaModal
          flatId={flatId}
          contratoId={contratoId}
          flatNumero={flatNumero}
          locatarioId={locatarioId}
          locatarioNome={locatarioNome}
          locatarioCpf={locatarioCpf}
          locatarioTelefone={locatarioTelefone}
          initialTipoVistoria={targetTipoVistoria}
          empresaData={empresaData}
          onClose={() => setShowChecklistModal(false)}
        />
      )}

      {/* Modal de Encerramento e Rescisão Antecipada do Contrato */}
      {showEncerrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 max-h-[92vh] my-auto overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl ${tipoEncerramento === "RESCISAO_ANTECIPADA" ? "bg-rose-100 dark:bg-rose-950 text-rose-600" : "bg-blue-100 dark:bg-blue-950 text-blue-600"}`}>
                  {tipoEncerramento === "RESCISAO_ANTECIPADA" ? <Scale className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {tipoEncerramento === "RESCISAO_ANTECIPADA" ? "Rescisão Antecipada de Contrato" : "Encerramento Normal de Contrato"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {locatarioNome} • {flatNumero}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEncerrarModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador de Modo: Término Normal vs Rescisão Antecipada */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setTipoEncerramento("NORMAL");
                  setMotivoEncerramento("Término de vigência / Devolução de chaves");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  tipoEncerramento === "NORMAL"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Término de Prazo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoEncerramento("RESCISAO_ANTECIPADA");
                  setMotivoEncerramento("Rescisão antecipada a pedido do locatário");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  tipoEncerramento === "RESCISAO_ANTECIPADA"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Rescisão Antecipada</span>
              </button>
            </div>

            {/* Alerta de Rescisão Antecipada com Calculadora de Multa */}
            {tipoEncerramento === "RESCISAO_ANTECIPADA" ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 space-y-3">
                <div className="flex items-center justify-between text-rose-900 dark:text-rose-200 font-bold text-xs">
                  <span className="flex items-center gap-1">
                    <Scale className="w-4 h-4 text-rose-600 shrink-0" />
                    Cálculo da Multa Contratual Rescisória:
                  </span>
                  <span className="text-[10.5px] bg-rose-200/80 dark:bg-rose-900 px-2 py-0.5 rounded font-mono font-bold">
                    Cláusula: {multaRescisoriaInfo.multaRescisaoMeses} meses
                  </span>
                </div>

                {/* Resumo do Contrato */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10.5px] bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
                  <div>
                    <span className="text-slate-500 block">Aluguel:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(multaRescisoriaInfo.valorMensal)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Vigência:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{multaRescisoriaInfo.validadeTotalMeses} meses</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cumpridos:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{multaRescisoriaInfo.mesesCumpridos} meses</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Restantes:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{multaRescisoriaInfo.mesesRestantes} meses</span>
                  </div>
                </div>

                {/* Seleção do Tipo de Cálculo da Multa */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Base de Cobrança da Multa:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTipoCalculoMulta("PROPORCIONAL")}
                      className={`p-2 rounded-xl text-left border transition ${
                        tipoCalculoMulta === "PROPORCIONAL"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-400"
                      }`}
                    >
                      <span className="text-[10px] opacity-80 block font-semibold">Lei do Inquilinato</span>
                      <span className="text-xs font-extrabold block">Proporcional</span>
                      <span className="text-[11px] font-bold mt-0.5 block">{formatCurrency(multaRescisoriaInfo.multaProporcional)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoCalculoMulta("INTEGRAL")}
                      className={`p-2 rounded-xl text-left border transition ${
                        tipoCalculoMulta === "INTEGRAL"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-400"
                      }`}
                    >
                      <span className="text-[10px] opacity-80 block font-semibold">{multaRescisoriaInfo.multaRescisaoMeses} Meses Cheios</span>
                      <span className="text-xs font-extrabold block">Integral</span>
                      <span className="text-[11px] font-bold mt-0.5 block">{formatCurrency(multaRescisoriaInfo.multaIntegral)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoCalculoMulta("PERSONALIZADO")}
                      className={`p-2 rounded-xl text-left border transition ${
                        tipoCalculoMulta === "PERSONALIZADO"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-400"
                      }`}
                    >
                      <span className="text-[10px] opacity-80 block font-semibold">Valor Manual</span>
                      <span className="text-xs font-extrabold block">Personalizado</span>
                      <span className="text-[11px] font-bold mt-0.5 block">Isenção/Outro</span>
                    </button>
                  </div>
                </div>

                {tipoCalculoMulta === "PERSONALIZADO" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Valor Personalizado da Multa Rescisória (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={valorMultaCustom}
                      onChange={(e) => setValorMultaCustom(e.target.value)}
                      placeholder="0,00 (Deixe 0 para isentar)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                {/* Vencimento da Multa e Checkbox */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data da Rescisão:
                    </label>
                    <input
                      type="date"
                      value={dataRescisao}
                      onChange={(e) => setDataRescisao(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Vencimento da Multa:
                    </label>
                    <input
                      type="date"
                      value={dataVencimentoMulta}
                      onChange={(e) => setDataVencimentoMulta(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-2 text-xs font-bold text-rose-900 dark:text-rose-200 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={cobrarMultaRescisoria}
                    onChange={(e) => setCobrarMultaRescisoria(e.target.checked)}
                    className="rounded border-rose-400 bg-white dark:bg-slate-900 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Gerar Cobrança da Multa ({formatCurrency(valorMultaEfetivo)}) no Contas a Receber</span>
                </label>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Atenção ao Encerrar a Locação:</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Ao finalizar o contrato, o status do imóvel será automaticamente alterado para <strong>DISPONÍVEL</strong> e o contrato será arquivado como <strong>FINALIZADO</strong>.
                </p>
              </div>
            )}

            <form onSubmit={handleConfirmarEncerramento} className="space-y-3.5">
              {/* Selecionar Vistoria de Saída */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Selecionar Vistoria de Saída (Desocupação):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEncerrarModal(false);
                      handleOpenVistoriaModal("SAIDA");
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Nova Vistoria de Saída</span>
                  </button>
                </div>

                {loadingVistoriasSaida ? (
                  <div className="p-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-xl border">
                    Carregando vistorias de saída disponíveis...
                  </div>
                ) : (
                  <select
                    value={selectedVistoriaSaidaId}
                    onChange={(e) => setSelectedVistoriaSaidaId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {vistoriasSaidaParaEncerramento.map((v) => {
                      const isThisLoc = locatarioId && (v.locatarioId === locatarioId || v.locatario?.id === locatarioId);
                      return (
                        <option key={v.id} value={v.id}>
                          📅 {new Date(v.createdAt).toLocaleDateString("pt-BR")} | {v.statusAssinatura?.includes("ASSINADO") ? "🟢 ASSINADO" : "🟡 PENDENTE"} {isThisLoc ? "★ [Locatário]" : ""} | Vistoriador: {v.responsavelVistoria || "N/I"} (Flat {v.flat?.numero})
                        </option>
                      );
                    })}
                    <option value="none">-- Sem Vistoria de Saída (Não vincular laudo) --</option>
                  </select>
                )}
              </div>

              {/* Motivo do Encerramento */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Observações {tipoEncerramento === "RESCISAO_ANTECIPADA" ? "da Rescisão" : "do Encerramento"}
                </label>
                <input
                  type="text"
                  required
                  value={motivoEncerramento}
                  onChange={(e) => setMotivoEncerramento(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  placeholder={tipoEncerramento === "RESCISAO_ANTECIPADA" ? "Ex: Rescisão solicitada pelo locatário por mudança" : "Ex: Término de vigência contratual / Entrega de chaves"}
                />
              </div>

              {/* Checkbox cancelar parcelas pendentes */}
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={cancelarParcelasFuturas}
                  onChange={(e) => setCancelarParcelasFuturas(e.target.checked)}
                  className="rounded border-slate-300 bg-slate-50 dark:bg-slate-950 text-rose-600 focus:ring-rose-500"
                />
                <span>Cancelar parcelas pendentes futuras deste contrato</span>
              </label>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEncerrarModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingEncerramento}
                  className={`w-2/3 py-2.5 rounded-xl ${tipoEncerramento === "RESCISAO_ANTECIPADA" ? "bg-rose-600 hover:bg-rose-500" : "bg-blue-600 hover:bg-blue-500"} disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition`}
                >
                  {tipoEncerramento === "RESCISAO_ANTECIPADA" ? <Scale className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{loadingEncerramento ? "Processando..." : tipoEncerramento === "RESCISAO_ANTECIPADA" ? "Efetivar Rescisão e Liberar Imóvel" : "Confirmar e Liberar Imóvel"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Renovação de Contrato */}
      {showRenovarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 max-h-[92vh] my-auto overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Renovação de Contrato de Locação</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                      Novo Contrato
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {locatarioNome} • Imóvel Atual: <strong>{flatNumero}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRenovarModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRenovacao} className="space-y-4">
              {/* ETAPA 1: DESTINO DO IMÓVEL (MANTER OU TROCAR) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Destino do Imóvel para o Novo Período:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setRenovacaoMesmoImovel(true);
                      setRenovacaoNovoFlatId(flatId || "");
                      setRenovacaoNovoValor(String(valorMensal || contratoCompleto?.valorMensal || ""));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      renovacaoMesmoImovel
                        ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Permanecer no Flat Atual ({flatNumero})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRenovacaoMesmoImovel(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      !renovacaoMesmoImovel
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Mudar de Imóvel (Troca de Flat)</span>
                  </button>
                </div>

                {/* Se escolheu mudar de imóvel, exibe o seletor de flats disponíveis */}
                {!renovacaoMesmoImovel && (
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/80 space-y-2 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-purple-900 dark:text-purple-200">
                      Selecione o Novo Flat / Imóvel de Destino:
                    </label>
                    <select
                      required
                      value={renovacaoNovoFlatId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        setRenovacaoNovoFlatId(selId);
                        const selFlat = flatsDisponiveisRenovacao.find((f) => f.id === selId);
                        if (selFlat && selFlat.valorPadrao) {
                          setRenovacaoNovoValor(selFlat.valorPadrao.toString());
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Escolha o novo imóvel --</option>
                      {flatsDisponiveisRenovacao
                        .filter((f) => f.id !== flatId)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            Flat {f.numero} - {f.local?.nome || "Geral"} ({f.status === "DISPONIVEL" ? "🟢 DISPONÍVEL" : f.status}) - R$ {f.valorPadrao || 0}/mês
                          </option>
                        ))}
                    </select>
                    <p className="text-[10.5px] text-purple-700 dark:text-purple-300">
                      💡 Ao concluir, o Flat <strong>{flatNumero}</strong> ficará <strong>DISPONÍVEL</strong> e o novo imóvel será ocupado pelo locatário.
                    </p>
                  </div>
                )}
              </div>

              {/* ETAPA 2: VALORES E VIGÊNCIA */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Condições Financeiras e Período da Renovação:
                </label>

                {/* Valor do Aluguel com Chips de Reajuste */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Novo Valor do Aluguel (R$):
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRenovacaoNovoValor(String(valorMensal || contratoCompleto?.valorMensal || ""))}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        Manter Atual
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const base = Number(valorMensal || contratoCompleto?.valorMensal || 0);
                          setRenovacaoNovoValor((base * 1.05).toFixed(2));
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200"
                      >
                        +5% (IPCA)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const base = Number(valorMensal || contratoCompleto?.valorMensal || 0);
                          setRenovacaoNovoValor((base * 1.10).toFixed(2));
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200"
                      >
                        +10%
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={renovacaoNovoValor}
                    onChange={(e) => setRenovacaoNovoValor(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-black text-slate-900 dark:text-slate-100"
                    placeholder="0,00"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data de Início da Renovação:
                    </label>
                    <input
                      type="date"
                      required
                      value={renovacaoDataInicio}
                      onChange={(e) => setRenovacaoDataInicio(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Duração ({renovacaoTipoValidade === "DIAS" ? "Dias" : "Meses"}):
                    </label>
                    <div className="flex items-center gap-1">
                      <select
                        value={renovacaoTipoValidade}
                        onChange={(e) => setRenovacaoTipoValidade(e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold"
                      >
                        <option value="MESES">Meses</option>
                        <option value="DIAS">Dias</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        required
                        value={renovacaoValidadeValor}
                        onChange={(e) => setRenovacaoValidadeValor(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Dia Vencimento:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={renovacaoDiaVencimento}
                      onChange={(e) => setRenovacaoDiaVencimento(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Forma de Pagamento:
                    </label>
                    <select
                      value={renovacaoFormaPagamento}
                      onChange={(e) => setRenovacaoFormaPagamento(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value="PIX">PIX</option>
                      <option value="BOLETO">Boleto Bancário</option>
                      <option value="CARTAO">Cartão de Crédito/Débito</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="TRANSFERENCIA">Transferência / TED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Modelo de Contrato:
                    </label>
                    <select
                      value={renovacaoModeloId}
                      onChange={(e) => setRenovacaoModeloId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Modelo Padrão do Sistema --</option>
                      {modelosRenovacao.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ETAPA 3: CAUÇÃO E GARANTIAS */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={renovacaoTransferirCaucao}
                    onChange={(e) => setRenovacaoTransferirCaucao(e.target.checked)}
                    className="rounded border-slate-300 bg-white dark:bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                  <span>🛡️ Transferir / Manter Depósito Caução já pago no contrato anterior</span>
                </label>

                {!renovacaoTransferirCaucao && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Novo Depósito Caução (R$):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={renovacaoNovoCaucao}
                        onChange={(e) => setRenovacaoNovoCaucao(e.target.value)}
                        placeholder="0,00"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Parcelas do Caução:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={renovacaoCaucaoParcelas}
                        onChange={(e) => setRenovacaoCaucaoParcelas(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo do Fluxo */}
              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 text-[11.5px] text-purple-900 dark:text-purple-200 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Resumo da Renovação Automática:</span>
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-purple-800 dark:text-purple-300">
                  <li>O contrato anterior será arquivado com status <strong>FINALIZADO</strong>.</li>
                  <li>Um novo contrato de locação ativo será emitido para <strong>{locatarioNome}</strong>.</li>
                  <li><strong>{renovacaoValidadeValor} novas parcelas</strong> de <strong>{formatCurrency(parseFloat(renovacaoNovoValor || "0"))}</strong> serão geradas no Contas a Receber.</li>
                  <li>Um novo link para assinatura digital será disponibilizado e poderá ser enviado por WhatsApp.</li>
                </ul>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenovarModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingRenovacao}
                  className="w-2/3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{loadingRenovacao ? "Emitindo Renovação..." : "Confirmar Renovação e Emitir Contrato"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Vincular Vistoria Existente */}
      {showVincularModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[92vh] my-auto overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Vincular Vistoria de {vincularTipo} Existente
                </h4>
              </div>
              <button
                onClick={() => setShowVincularModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione uma vistoria de <strong>{vincularTipo}</strong> realizada para o Flat <strong>{flatNumero}</strong> ou Locatário <strong>{locatarioNome}</strong> para vincular a este contrato.
            </p>

            <form onSubmit={handleSalvarVinculo} className="space-y-4">
              {loadingVistoriasVincular ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Buscando vistorias de {vincularTipo} disponíveis...
                </div>
              ) : vistoriasParaVincular.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-center space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    Nenhuma vistoria de {vincularTipo} disponível encontrada para este imóvel/locatário.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVincularModal(false);
                      handleOpenVistoriaModal(vincularTipo);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    + Criar Nova Vistoria de {vincularTipo} Agora
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vistorias Disponíveis ({vistoriasParaVincular.length}):
                  </label>
                  <select
                    required
                    value={selectedVistoriaIdParaVincular}
                    onChange={(e) => setSelectedVistoriaIdParaVincular(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {vistoriasParaVincular.map((v) => {
                      const isThisLoc = locatarioId && (v.locatarioId === locatarioId || v.locatario?.id === locatarioId);
                      return (
                        <option key={v.id} value={v.id}>
                          📅 {new Date(v.createdAt).toLocaleDateString("pt-BR")} | {v.statusAssinatura?.includes("ASSINADO") ? "🟢 ASSINADO" : "🟡 PENDENTE"} {isThisLoc ? "★ [Locatário]" : ""} | Vistoriador: {v.responsavelVistoria || "N/I"} (Flat {v.flat?.numero})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVincularModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingSalvarVinculo || vistoriasParaVincular.length === 0}
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{loadingSalvarVinculo ? "Vinculando..." : "Salvar Vínculo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL OVERLAY DE VISUALIZAÇÃO INTERNA DE DOCUMENTOS (CONTRATO / VISTORIA) */}
      {modalDocumentoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <FileSignature className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{modalDocumentoTitulo}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setModalDocumentoUrl(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1 transition"
                >
                  <X className="w-4 h-4" />
                  <span>Fechar</span>
                </button>
              </div>
            </div>

            {/* Conteúdo Iframe do Documento */}
            <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
              <iframe
                src={modalDocumentoUrl}
                title={modalDocumentoTitulo}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
