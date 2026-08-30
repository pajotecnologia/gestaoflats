"use client";

import React, { useState, useEffect } from "react";
import SignaturePad from "@/components/common/SignaturePad";
import { generateReciboPDF } from "@/lib/pdfGenerator";
import { getContratoPDFBase64 } from "@/lib/contractPdfGenerator";
import { replaceContractVariables } from "@/lib/validation";
import { getAppBaseUrl } from "@/lib/baseUrl";
import {
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Share2,
  ArrowLeft,
  Printer,
  FileDown,
  Image as ImageIcon,
} from "lucide-react";

export default function AssinarContratoPublicPage({ params }: { params: { token: string } }) {
  const [contrato, setContrato] = useState<any>(null);
  const [vistoriaEntrada, setVistoriaEntrada] = useState<any>(null);
  const [selectedZoomFoto, setSelectedZoomFoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [assinaturaBase64, setAssinaturaBase64] = useState("");
  const [cpfConfirmacao, setCpfConfirmacao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  const loadContrato = async () => {
    try {
      const res = await fetch(`/api/assinar/contrato?token=${params.token}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Link de assinatura inválido ou expirado.");
      } else {
        setContrato(data.contrato);
        setVistoriaEntrada(data.vistoriaEntrada || null);
        if (data.contrato.statusAssinatura === "ASSINADO") {
          setSignedSuccess(true);
        }
      }
    } catch (err) {
      setErrorMsg("Erro ao conectar ao servidor de assinatura.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContrato();
  }, [params.token]);

  const handleDownloadContratoPDF = async () => {
    if (!contrato) return;

    const dtEmissao = contrato.dataEmissao
      ? new Date(contrato.dataEmissao).toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");
    const dtFinal = contrato.dataFinal
      ? new Date(contrato.dataFinal).toLocaleDateString("pt-BR")
      : "";

    const pdfBase64 = await getContratoPDFBase64({
      empresaNome: contrato.empresa?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: contrato.empresa?.cnpj || "00.000.000/0001-00",
      empresaEndereco: contrato.empresa?.endereco,
      empresaTelefone: contrato.empresa?.telefone,
      empresaEmail: contrato.empresa?.email,
      empresaLogomarcaUrl: contrato.empresa?.logomarcaUrl,
      empresaAssinaturaUrl: contrato.empresa?.assinaturaUrl,
      locatarioNome: contrato.locatario?.nome || "Locatário",
      locatarioCpf: contrato.locatario?.cpf || "000.000.000-00",
      locatarioRg: contrato.locatario?.rg,
      locatarioTelefone: contrato.locatario?.telefone,
      flatNumero: contrato.flat?.numero || "Flat",
      localNome: contrato.flat?.local?.nome,
      valorMensal: Number(contrato.valorMensal || 0),
      tipoValidade: contrato.tipoValidade,
      validadeMeses: contrato.validadeMeses || 12,
      validadeDias: contrato.validadeDias,
      dataEmissao: dtEmissao,
      dataFinal: dtFinal,
      conteudoHtml: replaceContractVariables(contrato.modeloContrato?.conteudoHtml || "", contrato),
      statusAssinatura: contrato.statusAssinatura,
      locatarioAssinaturaUrl: contrato.assinaturaLocatarioUrl || assinaturaBase64,
      dataAssinaturaLocatario: contrato.dataAssinaturaLocatario
        ? new Date(contrato.dataAssinaturaLocatario).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR"),
      ipAssinaturaLocatario: contrato.ipAssinaturaLocatario || "127.0.0.1",
      vistoriaEntrada: vistoriaEntrada || undefined,
    });

    const link = document.createElement("a");
    link.href = pdfBase64;
    link.download = `Contrato_Assinado_Flat_${(contrato.flat?.numero || "Flat").replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmarAssinatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assinaturaBase64) {
      alert("Por favor, desenhe sua assinatura no quadro antes de confirmar.");
      return;
    }

    if (contrato?.locatario?.cpf && cpfConfirmacao.replace(/\D/g, "") !== contrato.locatario.cpf.replace(/\D/g, "")) {
      alert("O CPF informado não confere com o CPF do Locatário cadastrado no contrato.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/assinar/contrato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          assinaturaBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao registrar assinatura.");
      } else {
        setContrato((prev: any) => ({
          ...prev,
          statusAssinatura: "ASSINADO",
          assinaturaLocatarioUrl: assinaturaBase64,
          dataAssinaturaLocatario: new Date().toISOString(),
          ipAssinaturaLocatario: "✓ Confirmado",
          ...(data.contrato || {}),
        }));
        setSignedSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setErrorMsg("Erro de conexão ao salvar assinatura.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnviarWhatsAppCopia = async () => {
    if (!contrato || !contrato.locatario?.telefone) return;

    const dtEmissao = contrato.dataEmissao
      ? new Date(contrato.dataEmissao).toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");
    const dtFinal = contrato.dataFinal
      ? new Date(contrato.dataFinal).toLocaleDateString("pt-BR")
      : "";

    const pdfBase64 = await getContratoPDFBase64({
      empresaNome: contrato.empresa?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: contrato.empresa?.cnpj || "00.000.000/0001-00",
      empresaEndereco: contrato.empresa?.endereco,
      empresaTelefone: contrato.empresa?.telefone,
      empresaEmail: contrato.empresa?.email,
      empresaLogomarcaUrl: contrato.empresa?.logomarcaUrl,
      empresaAssinaturaUrl: contrato.empresa?.assinaturaUrl,
      locatarioNome: contrato.locatario?.nome || "Locatário",
      locatarioCpf: contrato.locatario?.cpf || "000.000.000-00",
      locatarioRg: contrato.locatario?.rg,
      locatarioTelefone: contrato.locatario?.telefone,
      flatNumero: contrato.flat?.numero || "Flat",
      localNome: contrato.flat?.local?.nome,
      valorMensal: Number(contrato.valorMensal || 0),
      validadeMeses: contrato.validadeMeses || 12,
      dataEmissao: dtEmissao,
      dataFinal: dtFinal,
      conteudoHtml: replaceContractVariables(contrato.modeloContrato?.conteudoHtml || "", contrato),
      statusAssinatura: contrato.statusAssinatura,
      locatarioAssinaturaUrl: contrato.assinaturaLocatarioUrl,
      dataAssinaturaLocatario: contrato.dataAssinaturaLocatario
        ? new Date(contrato.dataAssinaturaLocatario).toLocaleDateString("pt-BR")
        : undefined,
      ipAssinaturaLocatario: contrato.ipAssinaturaLocatario,
    });

    const publicUrl = `${getAppBaseUrl()}/assinar/contrato/${params.token}`;
    const text = `*CÓPIA DO CONTRATO ASSINADO*\n\nOlá *${contrato.locatario?.nome}*,\nConfirmamos a assinatura digital no contrato do *${contrato.flat?.local?.nome || ""} - Flat ${contrato.flat?.numero}*.\n\nSegue em anexo a cópia do seu contrato em PDF.\nVocê também pode visualizar online: ${publicUrl}`;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: contrato.locatario.telefone,
          message: text,
          pdfBase64,
          fileName: `Contrato_Locacao_Flat_${(contrato.flat?.numero || "").replace(/\s+/g, "_")}.pdf`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Cópia do contrato em PDF enviada com sucesso pelo WhatsApp!");
      } else {
        alert(`❌ Falha ao enviar pelo WhatsApp:\n${data.error || "Verifique as configurações em Parâmetros."}`);
      }
    } catch (err: any) {
      alert(`❌ Erro ao enviar contrato via WhatsApp: ${err.message || err}`);
    }
  };

  const handleVoltarPainel = () => {
    window.location.href = "/contratos";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 text-xs font-semibold text-slate-500">
        Carregando contrato seguro...
      </div>
    );
  }

  if (errorMsg && !contrato) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-8 text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Portal de Assinatura Digital</h2>
          <p className="text-xs text-slate-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const fotosList: string[] = contrato.fotosAnexadasUrl ? JSON.parse(contrato.fotosAnexadasUrl) : [];

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 p-4 sm:p-8 flex justify-center text-slate-900 dark:text-slate-100 font-sans print:p-0 print:bg-white print:text-black">
      <div className="max-w-4xl w-full space-y-6 print:space-y-0 print:max-w-none">
        {/* Cabeçalho do Portal Web (Oculto na Impressão/PDF) */}
        <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Portal de Assinatura Digital de Contrato
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {contrato.empresa?.nomeFantasia || "Imobiliária / Locadora"} • Autenticação com registro de IP e timestamp
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleVoltarPainel}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Sistema</span>
            </button>
            <div className="flex items-center space-x-1 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Lock className="w-4 h-4" />
              <span>SSL 256-bit</span>
            </div>
          </div>
        </div>

        {/* Status de Assinatura Concluída (Oculto na Impressão/PDF) */}
        {signedSuccess && (
          <div className="print:hidden bg-emerald-600 text-white rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500 pb-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-8 h-8 text-white flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold">Contrato Assinado com Sucesso!</h3>
                  <p className="text-xs text-emerald-100">
                    Registrado com carimbo de IP ({contrato.ipAssinaturaLocatario || "127.0.0.1"}) em{" "}
                    {contrato.dataAssinaturaLocatario
                      ? new Date(contrato.dataAssinaturaLocatario).toLocaleString("pt-BR")
                      : "Agora"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadContratoPDF}
                  className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-md flex items-center space-x-1.5 transition"
                >
                  <FileDown className="w-4 h-4 text-emerald-700" />
                  <span>Baixar Contrato PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar</span>
                </button>
                <button
                  onClick={handleEnviarWhatsAppCopia}
                  className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTO OFICIAL DO CONTRATO (FOLHA FORMAL A4) */}
        <div className="bg-white dark:bg-slate-900 print:bg-white print:text-black border border-slate-300 dark:border-slate-800 print:border-none rounded-2xl print:rounded-none p-6 sm:p-12 print:p-6 shadow-2xl print:shadow-none space-y-6">
          
          {/* CABEÇALHO OFICIAL DA EMPRESA NO TOPO DO CONTRATO */}
          <div className="border-b-2 border-slate-800 print:border-black pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {contrato.empresa?.logomarcaUrl ? (
                <img
                  src={contrato.empresa.logomarcaUrl}
                  alt={contrato.empresa.nomeFantasia || "Logo Empresa"}
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 print:border-none"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-blue-600 print:bg-black text-white font-bold flex items-center justify-center text-xl">
                  {contrato.empresa?.nomeFantasia?.[0] || "P"}
                </div>
              )}
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 print:text-black uppercase tracking-tight">
                  {contrato.empresa?.nomeFantasia || "PRIME GESTÃO IMOBILIÁRIA"}
                </h2>
                {contrato.empresa?.razaoSocial && (
                  <p className="text-xs text-slate-600 print:text-gray-700 font-medium">
                    {contrato.empresa.razaoSocial}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 print:text-gray-600">
                  {contrato.empresa?.cnpj && <span>CNPJ: {contrato.empresa.cnpj} • </span>}
                  {contrato.empresa?.telefone && <span>Tel: {contrato.empresa.telefone} • </span>}
                  {contrato.empresa?.email && <span>E-mail: {contrato.empresa.email}</span>}
                </p>
                {contrato.empresa?.endereco && (
                  <p className="text-[10px] text-slate-400 print:text-gray-500">{contrato.empresa.endereco}</p>
                )}
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
              <span className="inline-block px-3 py-1 bg-slate-100 print:bg-gray-100 rounded-lg text-xs font-bold text-slate-800 print:text-black uppercase">
                Contrato de Locação
              </span>
              <p className="text-[11px] text-slate-500 print:text-gray-600 mt-1 font-semibold">
                Vigência: {contrato.validadeMeses} meses
              </p>
            </div>
          </div>

          {/* TÍTULO DO DOCUMENTO */}
          <div className="text-center py-2">
            <h1 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 print:text-black underline underline-offset-4">
              CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL
            </h1>
          </div>

          {/* QUADRO RESUMO: DADOS DAS PARTES E DO IMÓVEL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/80 print:bg-gray-50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 print:border-gray-300 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 print:text-gray-500 block text-[10px] font-bold uppercase">LOCADOR(A):</span>
              <strong className="text-slate-900 print:text-black block text-xs">{contrato.empresa?.nomeFantasia}</strong>
              <span className="block text-[10px] text-slate-500 print:text-gray-600">CNPJ: {contrato.empresa?.cnpj || "Não Informado"}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 print:text-gray-500 block text-[10px] font-bold uppercase">LOCATÁRIO(A):</span>
              <strong className="text-slate-900 print:text-black block text-xs">{contrato.locatario?.nome}</strong>
              <span className="block text-[10px] text-slate-500 print:text-gray-600">CPF: {contrato.locatario?.cpf}</span>
              {contrato.locatario?.telefone && (
                <span className="block text-[10px] text-slate-500 print:text-gray-600">Tel: {contrato.locatario.telefone}</span>
              )}
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 print:text-gray-500 block text-[10px] font-bold uppercase">IMÓVEL / UNIDADE:</span>
              <strong className="text-slate-900 print:text-black block text-xs">
                {contrato.flat?.local?.nome} - Flat {contrato.flat?.numero}
              </strong>
              <span className="block text-[10px] text-slate-500 print:text-gray-600">
                Valor: R$ {Number(contrato.valorMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
              </span>
            </div>
          </div>

          {/* CONTEÚDO / CLÁUSULAS DO CONTRATO COM VARIÁVEIS SUBSTITUÍDAS */}
          <div
            className="prose dark:prose-invert print:prose-neutral max-w-none text-xs sm:text-sm leading-relaxed space-y-4 font-serif p-6 bg-slate-50/50 dark:bg-slate-950/40 print:bg-transparent rounded-xl border border-slate-200 dark:border-slate-800 print:border-none min-h-[280px] text-justify text-slate-800 print:text-black"
            dangerouslySetInnerHTML={{
              __html: replaceContractVariables(
                contrato.modeloContrato?.conteudoHtml ||
                `<p>Pelo presente instrumento particular de locação residencial, de um lado <strong>{{empresa_nome}}</strong> e de outro lado <strong>{{locatario_nome}}</strong>, portador do CPF nº <strong>{{cpf}}</strong>, têm entre si justo e acordado o aluguel do imóvel <strong>{{flat}}</strong>, pelo prazo de <strong>{{validade_meses}}</strong> e pelo valor mensal de <strong>{{valor_mensal}}</strong>.</p>`,
                contrato
              ),
            }}
          />

          {/* ANEXO I: LAUDO DE VISTORIA DE ENTRADA DO IMÓVEL & FOTOS REAIS DA VISTORIA */}
          {vistoriaEntrada && vistoriaEntrada.itens && vistoriaEntrada.itens.length > 0 ? (
            <div className="space-y-4 pt-4 border-t-2 border-slate-200 dark:border-slate-800 print:border-black">
              <div className="bg-slate-50 dark:bg-slate-950/90 print:bg-gray-50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 print:border-gray-300 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 print:border-gray-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-blue-600 print:text-black" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 print:text-black uppercase">
                        ANEXO I: LAUDO DE VISTORIA DE ENTRADA (CHECKLIST DO IMÓVEL)
                      </h3>
                      <p className="text-[11px] text-slate-500 print:text-gray-600">
                        Vistoriador: <strong>{vistoriaEntrada.responsavel || "Vistoriador Oficial"}</strong> • Data:{" "}
                        <strong>{vistoriaEntrada.dataVistoria || new Date().toLocaleDateString("pt-BR")}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 self-start sm:self-center">
                    ✓ VISTORIA REALIZADA
                  </span>
                </div>

                {/* Tabela de Itens do Checklist */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-200/70 dark:bg-slate-800/80 print:bg-gray-200 text-slate-700 print:text-black font-bold">
                        <th className="py-2 px-3 rounded-l-lg">Item / Cômodo</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 rounded-r-lg">Observações / Avarias</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-gray-200">
                      {vistoriaEntrada.itens.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/50">
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                            {item.categoria} - {item.item}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                item.status === "OK"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                                  : item.status === "ATENCAO"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                              }`}
                            >
                              {item.status === "OK" ? "✓ OK / BOM" : item.status === "ATENCAO" ? "! ATENÇÃO" : "✕ AVARIA"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 print:text-gray-700">
                            {item.observacao || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Galeria de Fotos Reais da Vistoria */}
                {(() => {
                  const allVistoriaFotos: Array<{ url: string; label: string }> = [];
                  vistoriaEntrada.itens.forEach((it: any) => {
                    if (it.fotosUrl && Array.isArray(it.fotosUrl)) {
                      it.fotosUrl.forEach((fUrl: string) => {
                        allVistoriaFotos.push({ url: fUrl, label: `${it.categoria} - ${it.item}` });
                      });
                    }
                  });

                  if (allVistoriaFotos.length === 0) return null;

                  return (
                    <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800 print:border-gray-200">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-black flex items-center space-x-1.5">
                        <ImageIcon className="w-4 h-4 text-blue-600 print:hidden" />
                        <span>Fotos Reais da Vistoria de Entrada ({allVistoriaFotos.length} fotos anexadas):</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-3 gap-3">
                        {allVistoriaFotos.map((foto, fIdx) => (
                          <div
                            key={fIdx}
                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
                            onClick={() => setSelectedZoomFoto(foto.url)}
                          >
                            <img
                              src={foto.url}
                              alt={foto.label}
                              className="w-full h-28 object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-1.5 text-[9px] text-slate-200 truncate font-semibold">
                              📷 {foto.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <p className="text-[10px] text-slate-500 print:text-gray-600 italic pt-2">
                  ✓ O Locatário declara ter inspecionado o imóvel e concorda com o estado de conservação descrito neste Laudo de Vistoria de Entrada integrante do contrato.
                </p>
              </div>
            </div>
          ) : null}

          {/* SEÇÃO DE ASSINATURAS DAS DUAS PARTES (LOCADORA & LOCATÁRIO) */}
          <div className="pt-8 border-t-2 border-slate-200 dark:border-slate-800 print:border-black space-y-6">
            <p className="text-[11px] text-slate-500 print:text-gray-600 text-center italic">
              E, por estarem assim justos e contratados, assinam o presente contrato de locação para todos os efeitos de direito.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              {/* ASSINATURA DA EMPRESA / LOCADORA */}
              <div className="flex flex-col items-center justify-end text-center space-y-1">
                {contrato.empresa?.assinaturaUrl ? (
                  <img
                    src={contrato.empresa.assinaturaUrl}
                    alt="Assinatura da Empresa"
                    className="h-16 max-w-[220px] object-contain mb-1"
                  />
                ) : (
                  <div className="h-16 flex flex-col items-center justify-center mb-1">
                    <svg viewBox="0 0 260 60" className="h-12 w-48 text-blue-900 stroke-current fill-none">
                      <path d="M 15,45 Q 35,5 65,30 T 115,35 Q 135,5 155,35 T 205,25 Q 230,45 250,20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 30,50 Q 120,55 230,45" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <div className="w-full border-t border-slate-400 print:border-black pt-1">
                  <p className="text-xs font-bold text-slate-900 print:text-black">
                    {contrato.empresa?.nomeFantasia || "Locadora"}
                  </p>
                  <p className="text-[10px] text-slate-500 print:text-gray-600 font-semibold">
                    LOCADOR(A) • CNPJ: {contrato.empresa?.cnpj || "Conforme cadastro"}
                  </p>
                </div>
              </div>

              {/* ASSINATURA DO LOCATÁRIO */}
              <div className="flex flex-col items-center justify-end text-center space-y-1">
                {contrato.assinaturaLocatarioUrl ? (
                  <img
                    src={contrato.assinaturaLocatarioUrl}
                    alt="Assinatura do Locatário"
                    className="h-16 max-w-[220px] object-contain mb-1"
                  />
                ) : (
                  <div className="h-16 flex items-center justify-center text-xs text-slate-400 italic">
                    [Aguardando Assinatura do Locatário]
                  </div>
                )}
                <div className="w-full border-t border-slate-400 print:border-black pt-1">
                  <p className="text-xs font-bold text-slate-900 print:text-black">
                    {contrato.locatario?.nome || "Locatário"}
                  </p>
                  <p className="text-[10px] text-slate-500 print:text-gray-600 font-semibold">
                    LOCATÁRIO(A) • CPF: {contrato.locatario?.cpf}
                  </p>
                  {contrato.ipAssinaturaLocatario && (
                    <p className="text-[9px] text-emerald-700 print:text-gray-600 font-mono mt-0.5">
                      ✓ Assinatura Digital • IP: {contrato.ipAssinaturaLocatario} •{" "}
                      {contrato.dataAssinaturaLocatario
                        ? new Date(contrato.dataAssinaturaLocatario).toLocaleString("pt-BR")
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RODAPÉ DO DESENVOLVEDOR NO DOCUMENTO IMPRESSO/PDF */}
            <div className="pt-6 border-t border-slate-100 print:border-gray-300 text-center">
              <p className="text-[9px] text-slate-400 print:text-gray-500">
                Desenvolvimento: pajotecnologia.com.br (87)996540551
              </p>
            </div>
          </div>
        </div>

        {/* QUADRO DE COLETA DE ASSINATURA SE AINDA NÃO ESTIVER ASSINADO (Oculto na Impressão/PDF) */}
        {!signedSuccess ? (
          <form onSubmit={handleConfirmarAssinatura} className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span>Coleta de Assinatura Digital do Locatário</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirme seu CPF (apenas números):
              </label>
              <input
                type="text"
                required
                value={cpfConfirmacao}
                onChange={(e) => setCpfConfirmacao(e.target.value)}
                placeholder="ex: 123.456.789-00"
                className="w-full max-w-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <SignaturePad onSaveSignature={(base64) => setAssinaturaBase64(base64)} />

            <button
              type="submit"
              disabled={submitting || !assinaturaBase64}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs shadow-lg flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "Processando Assinatura..." : "Assinar Contrato Digitalmente"}</span>
            </button>
          </form>
        ) : (
          <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-xl">
            <button
              onClick={handleVoltarPainel}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md inline-flex items-center space-x-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Sistema / Painel de Contratos</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE ZOOM / LIGHTBOX DA FOTO DA VISTORIA */}
      {selectedZoomFoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedZoomFoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 p-2">
            <button
              onClick={() => setSelectedZoomFoto(null)}
              className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs"
            >
              ✕ Fechar
            </button>
            <img
              src={selectedZoomFoto}
              alt="Foto Ampliada da Vistoria"
              className="max-h-[80vh] w-auto object-contain rounded-xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
