"use client";

import React, { useState } from "react";
import { generateChecklistPDF, getChecklistPDFBase64, ChecklistItem } from "@/lib/checklistPdfGenerator";
import { getAppBaseUrl } from "@/lib/baseUrl";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  X,
  Share2,
  Building,
  User,
  Calendar,
  Printer,
  Image as ImageIcon,
  ExternalLink,
  Edit3,
} from "lucide-react";

interface ChecklistVistoriaViewModalProps {
  vistoria: any;
  empresaData?: any;
  onClose: () => void;
  onEdit?: () => void;
}

export default function ChecklistVistoriaViewModal({
  vistoria,
  empresaData,
  onClose,
  onEdit,
}: ChecklistVistoriaViewModalProps) {
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  let itemsList: ChecklistItem[] = [];
  let obsGerais = "";
  if (vistoria?.itensJson) {
    try {
      const parsed = typeof vistoria.itensJson === "string" ? JSON.parse(vistoria.itensJson) : vistoria.itensJson;
      if (Array.isArray(parsed)) {
        itemsList = parsed;
      } else if (parsed && typeof parsed === "object") {
        itemsList = parsed.itens || [];
        obsGerais = parsed.observacoesGerais || "";
      }
    } catch (e) {
      console.error("Erro ao ler itensJson:", e);
    }
  }

  const tipoVistoria = vistoria.tipoVistoria || "ENTRADA";
  const flatNumero = vistoria.flat?.numero || "Flat";
  const locatarioNome = vistoria.locatario?.nome || "Locatário Não Informado";
  const locatarioCpf = vistoria.locatario?.cpf || "000.000.000-00";
  const responsavel = vistoria.responsavelVistoria || "Vistoriador Responsável";
  const dataFormatada = vistoria.dataVistoria || vistoria.createdAt
    ? new Date(vistoria.dataVistoria || vistoria.createdAt).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  const handlePrintPDF = async () => {
    await generateChecklistPDF({
      tipoVistoria,
      empresaNome: vistoria.empresa?.nomeFantasia || empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: vistoria.empresa?.cnpj || empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: vistoria.empresa?.endereco || empresaData?.endereco,
      empresaTelefone: vistoria.empresa?.telefone || empresaData?.telefone,
      empresaEmail: vistoria.empresa?.email || empresaData?.email,
      empresaLogomarcaUrl: vistoria.empresa?.logomarcaUrl || empresaData?.logomarcaUrl,
      locatarioNome,
      locatarioCpf,
      flatNumero,
      dataVistoria: dataFormatada,
      responsavelVistoria: responsavel,
      itens: itemsList,
      observacoesGerais: obsGerais,
      empresaAssinaturaUrl: vistoria.empresa?.assinaturaUrl || empresaData?.assinaturaUrl,
      locatarioAssinaturaUrl: vistoria.assinaturaLocatarioUrl,
      dataAssinaturaLocatario: vistoria.dataAssinaturaLocatario,
      ipAssinaturaLocatario: vistoria.ipAssinaturaLocatario,
    });
  };

  const handleSendWhatsApp = async () => {
    if (!vistoria.locatario?.telefone) {
      alert("Locatário não possui telefone/WhatsApp cadastrado.");
      return;
    }

    setSendingWhatsApp(true);
    try {
      const pdfBase64 = await getChecklistPDFBase64({
        tipoVistoria,
        empresaNome: vistoria.empresa?.nomeFantasia || empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
        empresaCnpj: vistoria.empresa?.cnpj || empresaData?.cnpj || "00.000.000/0001-00",
        empresaEndereco: vistoria.empresa?.endereco || empresaData?.endereco,
        empresaTelefone: vistoria.empresa?.telefone || empresaData?.telefone,
        empresaEmail: vistoria.empresa?.email || empresaData?.email,
        empresaLogomarcaUrl: vistoria.empresa?.logomarcaUrl || empresaData?.logomarcaUrl,
        locatarioNome,
        locatarioCpf,
        flatNumero,
        dataVistoria: dataFormatada,
        responsavelVistoria: responsavel,
        itens: itemsList,
        observacoesGerais: obsGerais,
        empresaAssinaturaUrl: vistoria.empresa?.assinaturaUrl || empresaData?.assinaturaUrl,
        locatarioAssinaturaUrl: vistoria.assinaturaLocatarioUrl,
        dataAssinaturaLocatario: vistoria.dataAssinaturaLocatario,
        ipAssinaturaLocatario: vistoria.ipAssinaturaLocatario,
      });

      const publicUrl = `${getAppBaseUrl()}/assinar/vistoria/${vistoria.tokenAssinatura}`;
      const text = `*LAUDO DE VISTORIA DE ${tipoVistoria} DO FLAT (${flatNumero})*\n\nOlá *${locatarioNome}*,\nSegue em anexo o laudo de vistoria em PDF.\n\n👉 *Visualizar laudo online:*\n${publicUrl}`;

      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: vistoria.locatario.telefone,
          message: text,
          pdfBase64,
          fileName: `Laudo_Vistoria_${tipoVistoria}_Flat_${flatNumero.replace(/\s+/g, "_")}.pdf`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Laudo PDF enviado com sucesso pelo WhatsApp!");
      } else {
        alert(`❌ Falha ao enviar pelo WhatsApp: ${data.error || "Verifique se a integração está configurada."}`);
      }
    } catch (err: any) {
      alert("Erro ao enviar laudo via WhatsApp: " + (err.message || err));
    } finally {
      setSendingWhatsApp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Ficha de Vistoria de {tipoVistoria} • Flat {flatNumero}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    tipoVistoria === "ENTRADA"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                  }`}
                >
                  {tipoVistoria}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data: {dataFormatada} • Vistoriador: {responsavel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll: Ficha de Vistoria Estilizada */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Ficha do Laudo - Cabeçalho Executivo */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Imóvel / Flat
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Flat {flatNumero}</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {vistoria.flat?.local?.nome || "Condomínio"}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Locatário
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>{locatarioNome}</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">CPF: {locatarioCpf}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Status da Assinatura
              </span>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  vistoria.statusAssinatura?.includes("ASSINADO")
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{vistoria.statusAssinatura || "PENDENTE"}</span>
              </span>
            </div>
          </div>

          {/* Tabela de Itens Vistoriados */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
              <span>Itens Checados e Fotos Anexadas ({itemsList.length} itens):</span>
            </h4>

            <div className="space-y-3">
              {itemsList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        {item.categoria}
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.item}</p>
                    </div>

                    <div>
                      {item.status === "OK" ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>OK</span>
                        </span>
                      ) : item.status === "ATENCAO" ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold inline-flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Atenção</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-bold inline-flex items-center space-x-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Avaria</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {item.observacao && (
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-slate-100">Observação:</strong> {item.observacao}
                    </div>
                  )}

                  {/* Galeria de Fotos do Item */}
                  {item.fotosUrl && item.fotosUrl.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                        <ImageIcon className="w-3 h-3 text-blue-500" />
                        <span>Fotos Anexadas ({item.fotosUrl.length})</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.fotosUrl.map((fotoUrl, fotoIdx) => (
                          <button
                            key={fotoIdx}
                            type="button"
                            onClick={() => setSelectedFullImage(fotoUrl)}
                            className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shadow-sm transition hover:scale-105 hover:border-blue-500"
                            title="Clique para ampliar foto em alta resolução"
                          >
                            <img src={fotoUrl} alt={`Foto ${fotoIdx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <ExternalLink className="w-4 h-4" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Observações Gerais */}
          {obsGerais && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Observações Gerais da Vistoria
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {obsGerais}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé: Botões de Ação */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            Fechar Visualização
          </button>

          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>Preencher / Editar Vistoria</span>
              </button>
            )}

            <button
              type="button"
              disabled={sendingWhatsApp}
              onClick={handleSendWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>{sendingWhatsApp ? "Enviando..." : "Enviar por WhatsApp"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Baixar Laudo PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Foto Ampliada */}
      {selectedFullImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedFullImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl">
            <button
              onClick={() => setSelectedFullImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedFullImage}
              alt="Foto Ampliada"
              className="w-full h-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
