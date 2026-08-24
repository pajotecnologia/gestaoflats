"use client";

import React, { useState, useEffect, useRef } from "react";
import SignaturePad from "@/components/common/SignaturePad";
import { generateChecklistPDF, getChecklistPDFBase64, ChecklistItem } from "@/lib/checklistPdfGenerator";
import { getAppBaseUrl } from "@/lib/baseUrl";
import {
  ClipboardCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  AlertCircle,
  Lock,
  ArrowLeft,
  Share2,
  Camera,
  Video,
  Upload,
  RefreshCw,
  X,
} from "lucide-react";

export default function AssinarVistoriaPublicPage({ params }: { params: { token: string } }) {
  const [vistoria, setVistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [assinaturaBase64, setAssinaturaBase64] = useState("");
  const [empresaAssinatura, setEmpresaAssinatura] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null);

  // Carregar assinatura da empresa fallback
  useEffect(() => {
    fetch("/api/empresa")
      .then((res) => res.json())
      .then((data) => {
        if (data?.empresa?.assinaturaUrl) {
          setEmpresaAssinatura(data.empresa.assinaturaUrl);
        }
      })
      .catch(() => {});
  }, []);

  // Estados para Câmera Ao Vivo / Webcam
  const [activeCameraItemIndex, setActiveCameraItemIndex] = useState<number | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const loadVistoria = async () => {
    try {
      const res = await fetch(`/api/assinar/vistoria?token=${params.token}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Link de vistoria inválido ou expirado.");
      } else if (data.vistoria) {
        const v = data.vistoria;
        setVistoria(v);
        if (v.statusAssinatura?.includes("ASSINADO")) {
          setSignedSuccess(true);
        }

        if (v.itensJson) {
          try {
            const parsed = typeof v.itensJson === "string" ? JSON.parse(v.itensJson) : v.itensJson;
            let loadedItems: ChecklistItem[] = [];
            let loadedObs = "";

            if (Array.isArray(parsed)) {
              loadedItems = parsed;
            } else if (parsed && typeof parsed === "object") {
              loadedItems = parsed.itens || [];
              loadedObs = parsed.observacoesGerais || "";
            }

            if (loadedItems.length > 0) {
              setItems(loadedItems);
            }
            if (loadedObs) {
              setObservacoesGerais(loadedObs);
            }
          } catch (e) {
            console.error("Erro ao ler itensJson:", e);
          }
        }
      }
    } catch (err) {
      setErrorMsg("Erro ao conectar ao servidor de vistoria.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVistoria();
  }, [params.token]);

  // Alteração de Status do Item
  const handleStatusChange = (index: number, status: "OK" | "ATENCAO" | "DANIFICADO") => {
    if (signedSuccess) return;
    const updated = [...items];
    updated[index] = { ...updated[index], status };
    setItems(updated);
  };

  // Alteração de Observação do Item
  const handleObsChange = (index: number, observacao: string) => {
    if (signedSuccess) return;
    const updated = [...items];
    updated[index] = { ...updated[index], observacao };
    setItems(updated);
  };

  // Upload de Fotos do Item
  const handleUploadItemFoto = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (signedSuccess) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
    const fileList = Array.from(files);
    for (const file of fileList) {
      if (file.size > MAX_PHOTO_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        alert(`⚠️ A foto "${file.name}" (${sizeMb} MB) excede o limite máximo permitido de 5 MB.`);
        e.target.value = "";
        return;
      }
    }

    setUploadingItemIndex(index);
    try {
      const formData = new FormData();
      fileList.forEach((file) => formData.append("fotoFiles", file));

      const res = await fetch("/api/vistorias/upload-foto", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.fotoUrls) {
        const updated = [...items];
        const existing = updated[index].fotosUrl || [];
        updated[index] = {
          ...updated[index],
          fotosUrl: [...existing, ...data.fotoUrls],
        };
        setItems(updated);
      } else {
        alert(data.error || "Erro ao fazer upload da foto.");
      }
    } catch (err: any) {
      alert("Erro de conexão ao enviar foto: " + (err.message || err));
    } finally {
      setUploadingItemIndex(null);
      e.target.value = "";
    }
  };

  // Remover Foto do Item
  const handleRemoveItemFoto = (itemIndex: number, fotoIndex: number) => {
    if (signedSuccess) return;
    const updated = [...items];
    const existing = updated[itemIndex].fotosUrl || [];
    updated[itemIndex] = {
      ...updated[itemIndex],
      fotosUrl: existing.filter((_, i) => i !== fotoIndex),
    };
    setItems(updated);
  };

  // Câmera Ao Vivo / Webcam
  const startCamera = async (itemIdx: number, mode: "environment" | "user" = "environment") => {
    if (signedSuccess) return;
    setActiveCameraItemIndex(itemIdx);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setFacingMode(mode);
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões de câmera do navegador ou utilize a opção Câmera Direta / Galeria.");
      stopCamera();
    }
  };

  useEffect(() => {
    if (activeCameraItemIndex !== null && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [activeCameraItemIndex, cameraStream]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setActiveCameraItemIndex(null);
  };

  const toggleCameraFacingMode = () => {
    if (activeCameraItemIndex !== null) {
      const nextMode = facingMode === "environment" ? "user" : "environment";
      startCamera(activeCameraItemIndex, nextMode);
    }
  };

  const capturePhotoFromCamera = async () => {
    if (activeCameraItemIndex === null || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `foto_camera_${Date.now()}.jpg`, { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("fotoFiles", file);

      const targetIdx = activeCameraItemIndex;
      setUploadingItemIndex(targetIdx);
      try {
        const res = await fetch("/api/vistorias/upload-foto", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.fotoUrls) {
          const updated = [...items];
          const existing = updated[targetIdx].fotosUrl || [];
          updated[targetIdx] = {
            ...updated[targetIdx],
            fotosUrl: [...existing, ...data.fotoUrls],
          };
          setItems(updated);
          stopCamera();
        } else {
          alert(data.error || "Erro ao salvar foto capturada.");
        }
      } catch (err: any) {
        alert("Erro no envio da foto: " + (err.message || err));
      } finally {
        setUploadingItemIndex(null);
      }
    }, "image/jpeg", 0.85);
  };

  const handleConfirmarAssinatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assinaturaBase64) {
      alert("Por favor, desenhe sua assinatura no quadro antes de confirmar.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/assinar/vistoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          itens: items,
          observacoesGerais,
          assinaturaBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao registrar assinatura do laudo.");
      } else {
        const freshVistoria = data.vistoria || vistoria;
        if (freshVistoria) {
          setVistoria(freshVistoria);
        }
        setSignedSuccess(true);
        handleDownloadPDF(freshVistoria);
      }
    } catch (err) {
      setErrorMsg("Erro de conexão ao salvar assinatura.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = (vOverride?: any) => {
    const v = vOverride || vistoria;
    if (!v) return;

    const locSignature = v.assinaturaLocatarioUrl || vistoria?.assinaturaLocatarioUrl || assinaturaBase64;
    const ipAssinatura = v.ipAssinaturaLocatario || "127.0.0.1";
    const dataAssinatura = v.dataAssinaturaLocatario ? new Date(v.dataAssinaturaLocatario).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR");

    generateChecklistPDF({
      tipoVistoria: v.tipoVistoria || "ENTRADA",
      empresaNome: v.empresa?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: v.empresa?.cnpj || "00.000.000/0001-00",
      empresaEndereco: v.empresa?.endereco,
      empresaTelefone: v.empresa?.telefone,
      empresaEmail: v.empresa?.email,
      empresaLogomarcaUrl: v.empresa?.logomarcaUrl,
      locatarioNome: v.locatario?.nome || "Locatário",
      locatarioCpf: v.locatario?.cpf || "000.000.000-00",
      flatNumero: v.flat?.numero || "Unidade",
      dataVistoria: new Date(v.dataVistoria || v.createdAt || Date.now()).toLocaleDateString("pt-BR"),
      responsavelVistoria: v.responsavelVistoria || "Vistoriador Responsável",
      itens: items,
      observacoesGerais,
      empresaAssinaturaUrl: v.empresa?.assinaturaUrl || empresaAssinatura,
      locatarioAssinaturaUrl: locSignature,
      dataAssinaturaLocatario: dataAssinatura,
      ipAssinaturaLocatario: ipAssinatura,
      documentoHashSha256: v.documentoHashSha256,
      blockchainProtocol: v.blockchainProtocol,
      blockchainStatus: v.blockchainStatus,
    });
  };

  const handleEnviarWhatsAppCopia = async () => {
    if (!vistoria || !vistoria.locatario?.telefone) return;

    const locSignature = vistoria.assinaturaLocatarioUrl || assinaturaBase64;
    const ipAssinatura = vistoria.ipAssinaturaLocatario || "127.0.0.1";
    const dataAssinatura = vistoria.dataAssinaturaLocatario ? new Date(vistoria.dataAssinaturaLocatario).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR");

    const pdfBase64 = await getChecklistPDFBase64({
      tipoVistoria: vistoria.tipoVistoria || "ENTRADA",
      empresaNome: vistoria.empresa?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: vistoria.empresa?.cnpj || "00.000.000/0001-00",
      empresaEndereco: vistoria.empresa?.endereco,
      empresaTelefone: vistoria.empresa?.telefone,
      empresaEmail: vistoria.empresa?.email,
      empresaLogomarcaUrl: vistoria.empresa?.logomarcaUrl,
      locatarioNome: vistoria.locatario?.nome || "Locatário",
      locatarioCpf: vistoria.locatario?.cpf || "000.000.000-00",
      flatNumero: vistoria.flat?.numero || "Flat",
      dataVistoria: new Date(vistoria.dataVistoria || vistoria.createdAt || Date.now()).toLocaleDateString("pt-BR"),
      responsavelVistoria: vistoria.responsavelVistoria || "Vistoriador Responsável",
      itens: items,
      observacoesGerais,
      empresaAssinaturaUrl: vistoria.empresa?.assinaturaUrl || empresaAssinatura,
      locatarioAssinaturaUrl: locSignature,
      dataAssinaturaLocatario: dataAssinatura,
      ipAssinaturaLocatario: ipAssinatura,
      documentoHashSha256: vistoria.documentoHashSha256,
      blockchainProtocol: vistoria.blockchainProtocol,
      blockchainStatus: vistoria.blockchainStatus,
    });

    const publicUrl = `${getAppBaseUrl()}/assinar/vistoria/${params.token}`;
    const text = `*COMPROVANTE DE LAUDO DE VISTORIA ASSINADO*\n\nOlá *${vistoria.locatario?.nome || "Locatário"}*,\nConfirmamos a assinatura do Laudo de Vistoria de *${vistoria.tipoVistoria}* do *Flat ${vistoria.flat?.numero}*.\n\nSegue em anexo o documento em PDF assinado.\n\n👉 *Visualizar laudo online:*\n${publicUrl}`;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: vistoria.locatario.telefone,
          message: text,
          pdfBase64,
          fileName: `Laudo_Vistoria_${vistoria.tipoVistoria}_Flat_${(vistoria.flat?.numero || "").replace(/\s+/g, "_")}.pdf`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Laudo PDF enviado com sucesso pelo WhatsApp!");
      } else {
        const phone = vistoria.locatario.telefone.replace(/\D/g, "");
        const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (err) {
      const phone = vistoria.locatario.telefone.replace(/\D/g, "");
      const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handleVoltarPainel = () => {
    window.location.href = "/contratos";
  };

  const handleFecharTela = () => {
    try {
      if (window.opener || window.history.length > 1) {
        window.close();
      }
    } catch (e) {}
    setTimeout(() => {
      window.location.href = "/contratos";
    }, 200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 text-xs font-semibold text-slate-500">
        Carregando laudo de vistoria...
      </div>
    );
  }

  if (errorMsg && !vistoria) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-8 text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Portal de Vistoria Imobiliária</h2>
          <p className="text-xs text-slate-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 p-3 sm:p-8 flex justify-center text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-3xl w-full space-y-5">
        
        {/* Barra Superior do Portal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Laudo de Vistoria do Flat ({vistoria.flat?.numero})
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vistoria de {vistoria.tipoVistoria === "ENTRADA" ? "Entrada (Entrega)" : "Saída (Devolução)"} •{" "}
                {vistoria.empresa?.nomeFantasia}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleVoltarPainel}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Painel</span>
            </button>
            <div className="flex items-center space-x-1 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Lock className="w-4 h-4" />
              <span>SSL 256-bit</span>
            </div>
          </div>
        </div>

        {/* Tabela Interativa de Itens Vistoriados */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Conferência dos Itens e Estado de Conservação ({items.length} itens):
            </h3>
            {!signedSuccess && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                Preencha os itens e anexe fotos se necessário
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {items.map((item: ChecklistItem, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      {item.categoria}
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.item}</p>
                  </div>

                  {!signedSuccess ? (
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(idx, "OK")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                          item.status === "OK"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>OK</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(idx, "ATENCAO")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                          item.status === "ATENCAO"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800"
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Atenção</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(idx, "DANIFICADO")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                          item.status === "DANIFICADO"
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800"
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Avaria</span>
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "OK"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "ATENCAO"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  )}
                </div>

                {!signedSuccess ? (
                  <input
                    type="text"
                    value={item.observacao || ""}
                    onChange={(e) => handleObsChange(idx, e.target.value)}
                    placeholder="Observação ou detalhamento de avaria (opcional)..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  item.observacao && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      Obs: {item.observacao}
                    </p>
                  )
                )}

                {/* Captura de Fotos do Item */}
                {!signedSuccess && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                    <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center space-x-1.5 transition">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploadingItemIndex === idx ? "Enviando..." : "📷 Câmera Direta"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={uploadingItemIndex === idx}
                        onChange={(e) => handleUploadItemFoto(idx, e)}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => startCamera(idx, "environment")}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center space-x-1.5 transition"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>📹 Câmera Ao Vivo / Webcam</span>
                    </button>

                    <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center space-x-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Galeria</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingItemIndex === idx}
                        onChange={(e) => handleUploadItemFoto(idx, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Thumbnails de Fotos do Item */}
                {item.fotosUrl && item.fotosUrl.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.fotosUrl.map((fotoUrl, fotoIdx) => (
                      <div
                        key={fotoIdx}
                        className="relative group w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 shadow-sm"
                      >
                        <img src={fotoUrl} alt={`Foto ${fotoIdx + 1}`} className="w-full h-full object-cover" />
                        {!signedSuccess && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFoto(idx, fotoIdx)}
                            className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                            title="Remover foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <span className="text-[10px] text-slate-500 font-semibold">
                      ({item.fotosUrl.length} {item.fotosUrl.length === 1 ? "foto" : "fotos"})
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Campo de Observações Gerais da Vistoria */}
          {!signedSuccess ? (
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Observações Gerais da Vistoria / Outras Questões
              </label>
              <textarea
                rows={3}
                value={observacoesGerais}
                onChange={(e) => setObservacoesGerais(e.target.value)}
                placeholder="Digite aqui observações adicionais sobre a entrega/devolução do flat..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          ) : (
            observacoesGerais && (
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1.5">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  Observações Gerais / Outras Questões:
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {observacoesGerais}
                </p>
              </div>
            )
          )}

          {/* SEÇÃO DE ASSINATURAS NO LAUDO DE VISTORIA */}
          <div className="pt-6 border-t-2 border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
            {/* ASSINATURA DA EMPRESA / VISTORIADOR */}
            <div className="flex flex-col items-center justify-end text-center space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {vistoria.empresa?.assinaturaUrl || empresaAssinatura ? (
                <img
                  src={vistoria.empresa?.assinaturaUrl || empresaAssinatura!}
                  alt="Assinatura da Empresa"
                  className="h-14 max-w-[200px] object-contain mb-1"
                />
              ) : (
                <div className="h-14 flex items-center justify-center text-xs text-slate-400 italic">
                  [Assinatura da Locadora Cadastrada]
                </div>
              )}
              <div className="w-full border-t border-slate-300 dark:border-slate-700 pt-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {vistoria.responsavelVistoria || vistoria.empresa?.nomeFantasia}
                </p>
                <p className="text-[10px] text-slate-400">
                  Vistoriador(a) / {vistoria.empresa?.nomeFantasia}
                </p>
              </div>
            </div>

            {/* ASSINATURA DO LOCATÁRIO */}
            <div className="flex flex-col items-center justify-end text-center space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {vistoria.assinaturaLocatarioUrl ? (
                <img
                  src={vistoria.assinaturaLocatarioUrl}
                  alt="Assinatura do Locatário"
                  className="h-14 max-w-[200px] object-contain mb-1"
                />
              ) : (
                <div className="h-14 flex items-center justify-center text-xs text-slate-400 italic">
                  [Aguardando Assinatura do Locatário]
                </div>
              )}
              <div className="w-full border-t border-slate-300 dark:border-slate-700 pt-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {vistoria.locatario?.nome || "Locatário"}
                </p>
                <p className="text-[10px] text-slate-400">
                  Locatário(a) (CPF: {vistoria.locatario?.cpf})
                </p>
                {vistoria.ipAssinaturaLocatario && (
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    ✓ Assinado • IP: {vistoria.ipAssinaturaLocatario}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quadro de Desenho de Assinatura */}
        {!signedSuccess ? (
          <form onSubmit={handleConfirmarAssinatura} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              <span>Assinatura Digital do Locatário na Vistoria ({vistoria.tipoVistoria})</span>
            </h3>

            <SignaturePad onSaveSignature={(base64) => setAssinaturaBase64(base64)} />

            <button
              type="submit"
              disabled={submitting || !assinaturaBase64}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs shadow-lg flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "Gravando Laudo..." : "Salvar & Assinar Laudo de Vistoria"}</span>
            </button>
          </form>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Laudo de Vistoria de {vistoria.tipoVistoria} Assinado e Concluído!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Sua assinatura foi processada e gravada com sucesso. Você pode fazer o download do documento assinado em PDF, enviar para seu WhatsApp ou fechar a tela.
              </p>
            </div>

            {/* Exibição da Assinatura Processada */}
            {(vistoria.assinaturaLocatarioUrl || assinaturaBase64) && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 inline-block space-y-1.5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assinatura Processada do Locatário
                </span>
                <img
                  src={vistoria.assinaturaLocatarioUrl || assinaturaBase64}
                  alt="Assinatura do Locatário"
                  className="h-16 max-w-[240px] mx-auto object-contain"
                />
                {vistoria.locatario?.nome && (
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {vistoria.locatario.nome}
                  </p>
                )}
              </div>
            )}

            {/* Painel de Ações: Download PDF, WhatsApp e Fechar Tela ABAIXO da Assinatura */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow-lg flex items-center justify-center space-x-2 transition transform active:scale-95"
              >
                <FileDown className="w-4.5 h-4.5" />
                <span>Baixar Laudo PDF Assinado</span>
              </button>

              <button
                type="button"
                onClick={handleEnviarWhatsAppCopia}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs shadow-lg flex items-center justify-center space-x-2 transition transform active:scale-95"
              >
                <Share2 className="w-4.5 h-4.5" />
                <span>Enviar Cópia no WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleFecharTela}
                className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition transform active:scale-95 border border-slate-700"
              >
                <X className="w-4.5 h-4.5 text-rose-400" />
                <span>Fechar Tela</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Câmera Ao Vivo / Webcam */}
      {activeCameraItemIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold truncate">
                  Foto Câmera: {items[activeCameraItemIndex]?.item}
                </h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {uploadingItemIndex === activeCameraItemIndex && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-emerald-300">Processando e salvando foto...</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={toggleCameraFacingMode}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Inverter Câmera ({facingMode === "environment" ? "Traseira" : "Frontal"})</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={uploadingItemIndex !== null}
                  onClick={capturePhotoFromCamera}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 transition shadow-lg disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tirar Foto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
