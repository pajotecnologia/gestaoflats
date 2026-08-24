"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/validation";
import { generateReciboPDF, getReciboPDFBase64 } from "@/lib/pdfGenerator";
import { getContratoPDFBase64 } from "@/lib/contractPdfGenerator";
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
  };
  onBaixaSucesso?: () => void;
}

export default function GridMeses({
  contratoId,
  flatId,
  tokenAssinatura,
  statusAssinatura = "PENDENTE",
  locatarioId,
  locatarioNome,
  locatarioCpf,
  locatarioTelefone,
  flatNumero,
  valorMensal,
  parcelas,
  vistoriasChecklist = [],
  empresaData,
  onBaixaSucesso,
}: GridMesesProps) {
  const [selectedParcela, setSelectedParcela] = useState<ParcelaItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Vistoria Modal state
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [targetTipoVistoria, setTargetTipoVistoria] = useState<"ENTRADA" | "SAIDA">("ENTRADA");

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

  const vistoriaEntrada = vistoriasChecklist.find((v) => v.tipoVistoria === "ENTRADA");
  const vistoriaSaida = vistoriasChecklist.find((v) => v.tipoVistoria === "SAIDA");

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
      locatarioNome,
      locatarioCpf,
      locatarioTelefone,
      flatNumero,
      valorMensal,
      validadeMeses: parcelas.length || 12,
      dataEmissao: firstVenc.toLocaleDateString("pt-BR"),
      dataFinal: lastVenc.toLocaleDateString("pt-BR"),
      statusAssinatura: statusAssinatura || "PENDENTE",
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

  const handleDownloadRecibo = () => {
    if (!selectedParcela) return;

    generateReciboPDF({
      empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresaData?.endereco || undefined,
      empresaTelefone: empresaData?.telefone || undefined,
      empresaEmail: empresaData?.email || undefined,
      empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
      locatarioNome,
      locatarioCpf,
      flatNumero,
      mesReferencia: selectedParcela.mesReferencia,
      valor: selectedParcela.valorPago || selectedParcela.valor,
      dataPagamento: selectedParcela.dataPagamento
        ? new Date(selectedParcela.dataPagamento).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR"),
      formaPagamento: selectedParcela.formaPagamento || "PIX",
      numeroRecibo: selectedParcela.id.slice(0, 8).toUpperCase(),
    });
  };

  const handleEnviarWhatsAppFallback = async () => {
    if (!selectedParcela || !locatarioTelefone) return;

    let pdfBase64: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let text = "";

    if (selectedParcela.status === "PAGO") {
      pdfBase64 = await getReciboPDFBase64({
        empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
        empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
        empresaEndereco: empresaData?.endereco || undefined,
        empresaTelefone: empresaData?.telefone || undefined,
        empresaEmail: empresaData?.email || undefined,
        empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
        locatarioNome,
        locatarioCpf,
        flatNumero,
        mesReferencia: selectedParcela.mesReferencia,
        valor: selectedParcela.valorPago || selectedParcela.valor,
        dataPagamento: selectedParcela.dataPagamento
          ? new Date(selectedParcela.dataPagamento).toLocaleDateString("pt-BR")
          : new Date().toLocaleDateString("pt-BR"),
        formaPagamento: selectedParcela.formaPagamento || "PIX",
        numeroRecibo: selectedParcela.id.slice(0, 8).toUpperCase(),
      });

      fileName = `Recibo_${selectedParcela.id.slice(0, 8).toUpperCase()}_${selectedParcela.mesReferencia.replace("-", "_")}.pdf`;
      text = `*COMPROVANTE DE PAGAMENTO / RECIBO*\n\nOlá *${locatarioNome}*,\nSegue em anexo o recibo de pagamento em PDF do *${flatNumero}* (Ref: ${selectedParcela.mesReferencia}). Obrigado!`;
    } else {
      text = `*LEMBRETE DE COBRANÇA - ALUGUEL*\n\nOlá *${locatarioNome}*,\nLembramos sobre a parcela do aluguel do *${flatNumero}* (Vencimento: ${new Date(selectedParcela.dataVencimento).toLocaleDateString("pt-BR")}) no valor de *${formatCurrency(selectedParcela.valor)}*.\n\nMês Ref: ${selectedParcela.mesReferencia}.\n\nPara maiores dúvidas ou comprovantes, favor responder este WhatsApp. Obrigado!`;
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
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{locatarioNome}</h3>
              {statusAssinatura === "ASSINADO" ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  ✓ Contrato Assinado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  Aguardando Assinatura
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              CPF: {locatarioCpf} • {flatNumero}
            </p>
          </div>
        </div>

        {/* BOTOES DE ACAO DO CONTRATO E VISTORIAS (3 LINHAS ALINHADAS À DIREITA) */}
        <div className="flex flex-col sm:items-end gap-1.5 flex-shrink-0">
          {/* LINHA 1: BOTÃO DO CONTRATO */}
          {statusAssinatura === "ASSINADO" && activeToken ? (
            <button
              onClick={() => handleVisualizarDocumentoAssinado(`/assinar/contrato/${activeToken}`)}
              className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition w-full sm:w-auto justify-center sm:justify-start"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Contrato Assinado</span>
            </button>
          ) : (
            <button
              onClick={handleGerarOuExibirLinkContrato}
              disabled={generatingToken}
              className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50 w-full sm:w-auto justify-center sm:justify-start"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>{generatingToken ? "Gerando..." : "Gerar Link Assinatura Contrato"}</span>
            </button>
          )}

          {/* LINHA 2: VISTORIA DE ENTRADA */}
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
            className={`py-1 px-3 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition w-full sm:w-auto justify-center sm:justify-start ${
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
                ? `Vistoria Entrada (${vistoriaEntrada.statusAssinatura?.includes("ASSINADO") ? "✓ Ver Assinado" : "⌛ Pendente"})`
                : "🟢 Vistoria Entrada"}
            </span>
          </button>

          {/* LINHA 3: VISTORIA DE SAÍDA */}
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
            className={`py-1 px-3 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition w-full sm:w-auto justify-center sm:justify-start ${
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
                ? `Vistoria Saída (${vistoriaSaida.statusAssinatura?.includes("ASSINADO") ? "✓ Ver Assinado" : "⌛ Pendente"})`
                : "🔴 Vistoria Saída"}
            </span>
          </button>
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
                <span className="text-[10px] opacity-75 font-normal">#{p.numeroParcela}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Mês {getMonthAbbrev(selectedParcela.mesReferencia)} - Parcela #{selectedParcela.numeroParcela}
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
                onClick={handleDownloadRecibo}
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
    </div>
  );
}
