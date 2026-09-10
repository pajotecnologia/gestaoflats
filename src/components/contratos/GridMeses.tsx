"use client";

import React, { useState } from "react";
import { formatCurrency, formatMesReferencia, replaceContractVariables } from "@/lib/validation";
import { generateReciboPDF, getReciboPDFBase64 } from "@/lib/pdfGenerator";
import { getContratoPDFBase64 } from "@/lib/contractPdfGenerator";
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
} from "lucide-react";

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
}: GridMesesProps) {
  const [selectedParcela, setSelectedParcela] = useState<ParcelaItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Vistoria Modal state
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [targetTipoVistoria, setTargetTipoVistoria] = useState<"ENTRADA" | "SAIDA">("ENTRADA");

  // Modal de Encerramento do Contrato
  const [showEncerrarModal, setShowEncerrarModal] = useState(false);
  const [vistoriasSaidaParaEncerramento, setVistoriasSaidaParaEncerramento] = useState<any[]>([]);
  const [selectedVistoriaSaidaId, setSelectedVistoriaSaidaId] = useState<string>("");
  const [cancelarParcelasFuturas, setCancelarParcelasFuturas] = useState(true);
  const [motivoEncerramento, setMotivoEncerramento] = useState("Término de vigência / Devolução de chaves");
  const [loadingEncerramento, setLoadingEncerramento] = useState(false);
  const [loadingVistoriasSaida, setLoadingVistoriasSaida] = useState(false);

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

  const handleOpenModal = (parcela: ParcelaItem) => {
    setSelectedParcela(parcela);
    setValorPago(parcela.valorPago ? parcela.valorPago.toString() : parcela.valor.toString());
    setShowModal(true);
    setMessageFeedback("");
  };

  const handleOpenVistoriaModal = (tipo: "ENTRADA" | "SAIDA") => {
    setTargetTipoVistoria(tipo);
    setShowChecklistModal(true);
  };

  const handleAbrirModalEncerramento = async () => {
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
          motivo: motivoEncerramento,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Contrato encerrado com sucesso!\nO imóvel foi liberado e o status foi atualizado para DISPONÍVEL.");
        setShowEncerrarModal(false);
        if (onBaixaSucesso) onBaixaSucesso();
      } else {
        alert(data.error || "Erro ao encerrar contrato.");
      }
    } catch (err: any) {
      alert("Erro ao encerrar contrato: " + (err.message || err));
    } finally {
      setLoadingEncerramento(false);
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
      alert("Selecione uma vistoria para vincular.");
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
        alert("✅ Vistoria vinculada com sucesso ao contrato!");
        setShowVincularModal(false);
        if (onBaixaSucesso) onBaixaSucesso();
      } else {
        alert(data.error || "Erro ao vincular vistoria.");
      }
    } catch (err: any) {
      alert("Erro ao vincular vistoria: " + (err.message || err));
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

    const pdfBase64 = await getContratoPDFBase64({
      empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresaData?.endereco || undefined,
      empresaTelefone: empresaData?.telefone || undefined,
      empresaEmail: empresaData?.email || undefined,
      empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
      usuarioAssinaturaUrl: currentUser?.assinaturaUrl || undefined,
      empresaAssinaturaUrl: currentUser?.assinaturaUrl || empresaData?.assinaturaUrl || undefined,
      locatarioNome,
      locatarioCpf,
      locatarioTelefone,
      flatNumero,
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
          flat: { numero: flatNumero },
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
        alert("✅ Contrato em PDF e mensagem enviados com sucesso pelo WhatsApp!");
      } else {
        alert(`❌ Falha ao enviar pelo WhatsApp:\n${data.error || "Verifique se o WhatsApp está configurado em Parâmetros."}`);
      }
    } catch (err: any) {
      alert(`❌ Erro ao enviar pelo WhatsApp:\n${err.message || err}`);
    }
  };

  const handleVisualizarDocumentoAssinado = (url: string) => {
    window.open(url, "_blank");
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

    generateReciboPDF({
      empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresaData?.endereco || undefined,
      empresaTelefone: empresaData?.telefone || undefined,
      empresaEmail: empresaData?.email || undefined,
      empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
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

    if (selectedParcela.status === "PAGO") {
      pdfBase64 = await getReciboPDFBase64({
        empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
        empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
        empresaEndereco: empresaData?.endereco || undefined,
        empresaTelefone: empresaData?.telefone || undefined,
        empresaEmail: empresaData?.email || undefined,
        empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
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
          </div>
        </div>

        {/* BOTOES DE ACAO DO CONTRATO E VISTORIAS */}
        <div className="flex flex-col sm:items-end gap-1.5 flex-shrink-0">
          {/* LINHA 1: 1. VISTORIA DE ENTRADA */}
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => {
                if (vistoriaEntrada?.laudoImpressoUrl) {
                  handleVisualizarDocumentoAssinado(vistoriaEntrada.laudoImpressoUrl);
                } else if (vistoriaEntrada?.tokenAssinatura && vistoriaEntrada.statusAssinatura === "ASSINADO") {
                  handleVisualizarDocumentoAssinado(`/assinar/vistoria/${vistoriaEntrada.tokenAssinatura}`);
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
              onClick={() => handleVisualizarDocumentoAssinado(`/assinar/contrato/${activeToken}`)}
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
                  handleVisualizarDocumentoAssinado(vistoriaSaida.laudoImpressoUrl);
                } else if (vistoriaSaida?.tokenAssinatura && vistoriaSaida.statusAssinatura === "ASSINADO") {
                  handleVisualizarDocumentoAssinado(`/assinar/vistoria/${vistoriaSaida.tokenAssinatura}`);
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

          {/* LINHA 4: ENCERRAMENTO DE CONTRATO */}
          {contratoCompleto?.status !== "FINALIZADO" && (
            <button
              type="button"
              onClick={handleAbrirModalEncerramento}
              className="py-1 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-1.5 transition shadow-xs w-full sm:w-auto justify-center sm:justify-start mt-0.5"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Encerrar Contrato / Desocupar</span>
            </button>
          )}
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

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {parcelas.map((p) => {
            const isPago = p.status === "PAGO";
            const isAtrasado = p.status === "ATRASADO";

            return (
              <button
                key={p.id}
                onClick={() => handleOpenModal(p)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border font-semibold text-xs transition-all transform hover:-translate-y-0.5 shadow-sm ${
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

      {/* Modal de Encerramento do Contrato */}
      {showEncerrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[92vh] my-auto overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Encerramento de Contrato
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

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Atenção ao Encerrar a Locação:</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                Ao finalizar o contrato, o status do imóvel será automaticamente alterado para <strong>DISPONÍVEL</strong> e o contrato será arquivado como <strong>FINALIZADO</strong>.
              </p>
            </div>

            <form onSubmit={handleConfirmarEncerramento} className="space-y-4">
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
                  Motivo / Observações do Encerramento
                </label>
                <input
                  type="text"
                  required
                  value={motivoEncerramento}
                  onChange={(e) => setMotivoEncerramento(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  placeholder="Ex: Término de vigência contratual / Entrega de chaves"
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
                  className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{loadingEncerramento ? "Encerrando..." : "Confirmar e Liberar Imóvel"}</span>
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
                  <Link2 className="w-4 h-4" />
                  <span>{loadingSalvarVinculo ? "Vinculando..." : "Confirmar Vínculo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
