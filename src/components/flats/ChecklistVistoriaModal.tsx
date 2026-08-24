"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Copy,
  Check,
  AlertCircle,
  Upload,
  ExternalLink,
  Camera,
  Image as ImageIcon,
  Save,
  RefreshCw,
  Video,
} from "lucide-react";

interface ChecklistVistoriaModalProps {
  flatNumero: string;
  flatId?: string;
  contratoId?: string;
  locatarioId?: string;
  locatarioNome?: string;
  locatarioCpf?: string;
  locatarioTelefone?: string;
  initialTipoVistoria?: "ENTRADA" | "SAIDA";
  responsavelDefault?: string;
  empresaData?: {
    nomeFantasia: string;
    cnpj: string;
    endereco?: string | null;
    telefone?: string | null;
    email?: string | null;
    logomarcaUrl?: string | null;
    assinaturaUrl?: string | null;
  };
  onClose: () => void;
}

const defaultChecklistCategories = [
  { categoria: "Estrutura & Paredes", item: "Pintura e integridade das paredes e teto" },
  { categoria: "Estrutura & Paredes", item: "Portas, fechaduras e chaves (entregues)" },
  { categoria: "Estrutura & Paredes", item: "Janelas, vidros e cortinas/persianas" },
  { categoria: "Móveis & Marcenaria", item: "Cama box e colchão (sem manchas/avarias)" },
  { categoria: "Móveis & Marcenaria", item: "Armários do quarto e cozinha (portas e gavetas)" },
  { categoria: "Móveis & Marcenaria", item: "Sofá / Poltrona e mesa com cadeiras" },
  { categoria: "Eletrodomésticos", item: "Ar Condicionado (funcionamento e controle)" },
  { categoria: "Eletrodomésticos", item: "Geladeira / Frigobar (limpo e congelando)" },
  { categoria: "Eletrodomésticos", item: "Televisão / Controle remoto funcionando" },
  { categoria: "Eletrodomésticos", item: "Micro-ondas e Cooktop" },
  { categoria: "Hidráulica & Elétrica", item: "Torneiras, pias e chuveiro elétrico" },
  { categoria: "Hidráulica & Elétrica", item: "Iluminação / Lâmpadas de todos os cômodos" },
  { categoria: "Enxoval & Utensílios", item: "Jogo de lençóis, toalhas e travesseiros" },
];

export default function ChecklistVistoriaModal({
  flatNumero,
  flatId,
  contratoId,
  locatarioId,
  locatarioNome = "Locatário Não Informado",
  locatarioCpf = "000.000.000-00",
  locatarioTelefone = "",
  initialTipoVistoria = "ENTRADA",
  responsavelDefault,
  empresaData,
  onClose,
}: ChecklistVistoriaModalProps) {
  const [tipoVistoria, setTipoVistoria] = useState<"ENTRADA" | "SAIDA">(initialTipoVistoria);
  const [responsavel, setResponsavel] = useState(responsavelDefault || "Vistoriador Responsável");
  const [dataVistoria, setDataVistoria] = useState(new Date().toISOString().split("T")[0]);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsAppFeedback, setWhatsAppFeedback] = useState<string | null>(null);

  const [items, setItems] = useState<ChecklistItem[]>(
    defaultChecklistCategories.map((c) => ({
      categoria: c.categoria,
      item: c.item,
      status: "OK",
      observacao: "",
    }))
  );

  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [linkAssinatura, setLinkAssinatura] = useState("");
  const [laudoImpressoUrl, setLaudoImpressoUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [savingVistoria, setSavingVistoria] = useState(false);
  const [uploadingLaudo, setUploadingLaudo] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null);

  // Estados para Câmera Ao Vivo / Webcam
  const [activeCameraItemIndex, setActiveCameraItemIndex] = useState<number | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Carregar nome do usuário logado para sugerir como vistoriador
  useEffect(() => {
    if (!responsavelDefault || responsavelDefault === "Vistoriador Responsável") {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.nome) {
            setResponsavel(data.user.nome);
          }
        })
        .catch(() => {});
    }
  }, [responsavelDefault]);

  // Carregar dados de vistoria existente no banco de dados
  useEffect(() => {
    let isMounted = true;
    const fetchExistingVistoria = async () => {
      if (!contratoId && !flatId) return;

      // Reseta estado dos itens para o modelo limpo antes de carregar o tipo selecionado
      setItems(
        defaultChecklistCategories.map((c) => ({
          categoria: c.categoria,
          item: c.item,
          status: "OK",
          observacao: "",
        }))
      );
      setObservacoesGerais("");
      setLinkAssinatura("");

      try {
        const query = `contratoId=${contratoId || ""}&flatId=${flatId || ""}&tipoVistoria=${tipoVistoria}`;

        const res = await fetch(`/api/assinar/vistoria?${query}`);
        const data = await res.json();

        if (isMounted && res.ok && data.vistoria) {
          const v = data.vistoria;
          if (v.responsavelVistoria) setResponsavel(v.responsavelVistoria);
          if (v.laudoImpressoUrl) {
            setLaudoImpressoUrl(v.laudoImpressoUrl);
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
        console.error("Erro ao buscar vistoria existente:", err);
      }
    };

    fetchExistingVistoria();

    return () => {
      isMounted = false;
    };
  }, [contratoId, flatId, tipoVistoria]);
  const startCamera = async (itemIdx: number, mode: "environment" | "user" = "environment") => {
    setActiveCameraItemIndex(itemIdx);
    setErrorMessage("");
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
      alert("Não foi possível acessar a câmera do dispositivo. Verifique as permissões de câmera do navegador ou utilize a opção Câmera Direta / Galeria.");
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

  const handleStatusChange = (index: number, status: "OK" | "ATENCAO" | "DANIFICADO") => {
    const updated = [...items];
    updated[index] = { ...updated[index], status };
    setItems(updated);
  };

  const handleObsChange = (index: number, obs: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], observacao: obs };
    setItems(updated);
  };

  const handleUploadItemFoto = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_PHOTO_SIZE) {
        const sizeMb = (files[i].size / (1024 * 1024)).toFixed(2);
        alert(`⚠️ O arquivo "${files[i].name}" (${sizeMb} MB) excede o tamanho máximo permitido de 5 MB. Por favor, escolha uma imagem menor.`);
        e.target.value = "";
        return;
      }
    }

    setUploadingItemIndex(idx);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("fotoFiles", files[i]);
    }

    try {
      const res = await fetch("/api/vistorias/upload-foto", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.fotoUrls) {
        const updated = [...items];
        const existing = updated[idx].fotosUrl || [];
        updated[idx] = {
          ...updated[idx],
          fotosUrl: [...existing, ...data.fotoUrls],
        };
        setItems(updated);
      } else {
        alert(data.error || "Erro no upload da imagem.");
      }
    } catch (err: any) {
      alert("Erro ao enviar imagem: " + (err.message || err));
    } finally {
      setUploadingItemIndex(null);
      e.target.value = "";
    }
  };

  const handleRemoveItemFoto = (itemIdx: number, fotoIdx: number) => {
    const updated = [...items];
    if (updated[itemIdx].fotosUrl) {
      updated[itemIdx].fotosUrl = updated[itemIdx].fotosUrl!.filter((_, i) => i !== fotoIdx);
      setItems(updated);
    }
  };

  const handleGerarLinkAssinatura = async () => {
    setSavingVistoria(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/assinar/vistoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contratoId,
          flatId: flatId || "flat-geral",
          locatarioId,
          tipoVistoria,
          responsavelVistoria: responsavel,
          itens: items,
          observacoesGerais,
          gerarNovoLink: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Erro ao gerar link de vistoria.");
      } else if (data.tokenAssinatura) {
        const fullUrl = `${getAppBaseUrl()}/assinar/vistoria/${data.tokenAssinatura}`;
        setLinkAssinatura(fullUrl);
        setTimeout(() => {
          document.getElementById("bloco-link-vistoria")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
      }
    } catch (err) {
      setErrorMessage("Erro de conexão ao gerar link de assinatura.");
    } finally {
      setSavingVistoria(false);
    }
  };

  const handleUploadLaudoImpresso = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_LAUDO_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_LAUDO_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`⚠️ O arquivo "${file.name}" (${sizeMb} MB) excede o limite máximo permitido de 10 MB. Por favor, escolha um arquivo menor.`);
      e.target.value = "";
      return;
    }

    setUploadingLaudo(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("laudoFile", file);

      const resUpload = await fetch("/api/vistorias/upload-laudo", {
        method: "POST",
        body: formData,
      });

      const dataUpload = await resUpload.json();
      if (!resUpload.ok || !dataUpload.laudoImpressoUrl) {
        setErrorMessage(dataUpload.error || "Erro ao fazer upload do laudo impresso.");
        setUploadingLaudo(false);
        return;
      }

      setLaudoImpressoUrl(dataUpload.laudoImpressoUrl);

      // Gravar na vistoria
      await fetch("/api/assinar/vistoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contratoId,
          flatId: flatId || "flat-geral",
          locatarioId,
          tipoVistoria,
          responsavelVistoria: responsavel,
          itens: items,
          observacoesGerais,
          laudoImpressoUrl: dataUpload.laudoImpressoUrl,
        }),
      });

      setSuccessMessage(`✅ Checklist impresso (${tipoVistoria}) anexado com sucesso! Arquivo: ${dataUpload.fileName}`);
    } catch (err) {
      setErrorMessage("Erro ao anexar arquivo do laudo impresso.");
    } finally {
      setUploadingLaudo(false);
    }
  };

  const handleCopyLink = () => {
    if (!linkAssinatura) return;
    navigator.clipboard.writeText(linkAssinatura);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEnviarWhatsAppLink = async () => {
    if (!locatarioTelefone) {
      alert("Locatário não possui número de telefone/WhatsApp cadastrado.");
      return;
    }

    setSendingWhatsApp(true);
    setWhatsAppFeedback(null);

    // Gerar PDF base64 do laudo de vistoria
    const pdfBase64 = await getChecklistPDFBase64({
      tipoVistoria,
      empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresaData?.endereco || undefined,
      empresaTelefone: empresaData?.telefone || undefined,
      empresaEmail: empresaData?.email || undefined,
      empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
      locatarioNome: locatarioNome || "Locatário",
      locatarioCpf: locatarioCpf || "000.000.000-00",
      flatNumero,
      dataVistoria: new Date(dataVistoria).toLocaleDateString("pt-BR"),
      responsavelVistoria: responsavel,
      itens: items,
      observacoesGerais,
      empresaAssinaturaUrl: empresaData?.assinaturaUrl || undefined,
    });

    const text = `*LAUDO DE VISTORIA DE ${tipoVistoria} DO FLAT (${flatNumero})*\n\nOlá *${locatarioNome || "Locatário"}*,\nSegue em anexo o laudo de vistoria em PDF.\n\n👉 *Clique no link abaixo para conferir e assinar digitalmente:*\n${linkAssinatura}`;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: locatarioTelefone,
          message: text,
          pdfBase64,
          fileName: `Laudo_Vistoria_${tipoVistoria}_Flat_${flatNumero.replace(/\s+/g, "_")}.pdf`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setWhatsAppFeedback("✅ Laudo PDF enviado com sucesso pelo WhatsApp!");
      } else {
        setWhatsAppFeedback(`❌ Falha ao enviar pelo WhatsApp: ${data.error || "Verifique se a integração está configurada em Parâmetros."}`);
      }
    } catch (err: any) {
      setWhatsAppFeedback(`❌ Erro ao enviar pelo WhatsApp: ${err.message || err}`);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleSalvarVistoria = async () => {
    setSavingVistoria(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/assinar/vistoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contratoId,
          flatId: flatId || "flat-geral",
          locatarioId,
          tipoVistoria,
          responsavelVistoria: responsavel,
          itens: items,
          observacoesGerais,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Erro ao salvar vistoria.");
        return false;
      } else {
        setSuccessMessage(`✅ Vistoria (${tipoVistoria}) salva com sucesso no banco de dados!`);
        return true;
      }
    } catch (err) {
      setErrorMessage("Erro de conexão ao salvar vistoria.");
      return false;
    } finally {
      setSavingVistoria(false);
    }
  };

  const handleGerarLaudoPDF = async () => {
    await handleSalvarVistoria();
    await generateChecklistPDF({
      tipoVistoria,
      empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresaData?.endereco || undefined,
      empresaTelefone: empresaData?.telefone || undefined,
      empresaEmail: empresaData?.email || undefined,
      empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
      locatarioNome,
      locatarioCpf,
      flatNumero,
      dataVistoria: new Date(dataVistoria).toLocaleDateString("pt-BR"),
      responsavelVistoria: responsavel,
      itens: items,
      observacoesGerais,
      empresaAssinaturaUrl: empresaData?.assinaturaUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Laudo de Vistoria do Flat ({flatNumero})</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${tipoVistoria === "ENTRADA" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
                  {tipoVistoria === "ENTRADA" ? "ENTRADA (ENTREGA)" : "SAÍDA (DEVOLUÇÃO)"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Checklist de Entrada (Entrega) e Saída (Devolução) • Assinatura Digital ou Upload de Laudo Impresso
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
            {laudoImpressoUrl && (
              <a
                href={laudoImpressoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visualizar Arquivo</span>
              </a>
            )}
          </div>
        )}

        {/* Tipo de Vistoria (Flag Entrada / Saida) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Flag do Tipo de Vistoria
            </label>
            <select
              value={tipoVistoria}
              onChange={(e) => setTipoVistoria(e.target.value as "ENTRADA" | "SAIDA")}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="ENTRADA">🟢 Vistoria de ENTRADA (Entrega do Flat)</option>
              <option value="SAIDA">🔴 Vistoria de SAÍDA (Devolução do Flat)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data da Vistoria
            </label>
            <input
              type="date"
              value={dataVistoria}
              onChange={(e) => setDataVistoria(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vistoriador / Responsável
            </label>
            <input
              type="text"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Tabela do Checklist */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Checklist de Itens ({tipoVistoria === "ENTRADA" ? "ENTRADA" : "SAÍDA"}):
          </h4>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      {item.categoria}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.item}</p>
                  </div>

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
                </div>

                <input
                  type="text"
                  value={item.observacao || ""}
                  onChange={(e) => handleObsChange(idx, e.target.value)}
                  placeholder="Observação ou detalhamento de avaria (opcional)..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100"
                />

                {/* Upload e Captura de Fotos do Item */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  {/* Botão 1: Ativar Câmera Nativa no Celular / Tablet */}
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

                  {/* Botão 2: Câmera Ao Vivo / Webcam */}
                  <button
                    type="button"
                    onClick={() => startCamera(idx, "environment")}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center space-x-1.5 transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>📹 Câmera Ao Vivo / Webcam</span>
                  </button>

                  {/* Botão 3: Galeria / Arquivos */}
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

                  {item.fotosUrl && item.fotosUrl.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.fotosUrl.map((fotoUrl, fotoIdx) => (
                        <div
                          key={fotoIdx}
                          className="relative group w-9 h-9 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 shadow-sm"
                        >
                          <img src={fotoUrl} alt={`Foto ${fotoIdx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFoto(idx, fotoIdx)}
                            className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                            title="Remover foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <span className="text-[10px] text-slate-500 font-semibold">
                        ({item.fotosUrl.length} {item.fotosUrl.length === 1 ? "foto" : "fotos"})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Campo de Observações Gerais da Vistoria */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Observações Gerais da Vistoria / Outras Questões
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Descreva detalhes adicionais, condições gerais do imóvel, chaves/tags entregues, leituras de medidores ou acordos específicos.
            </p>
            <textarea
              rows={3}
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              placeholder="Digite aqui as observações gerais da vistoria..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
        </div>

        {/* Rodapé: Botões de Ação */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGerarLinkAssinatura}
                disabled={savingVistoria}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>{savingVistoria ? "Gerando..." : `Gerar Link Vistoria ${tipoVistoria}`}</span>
              </button>

              <label className="cursor-pointer py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition border border-slate-700">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{uploadingLaudo ? "Enviando..." : `Upload Checklist ${tipoVistoria} Impresso`}</span>
                <input type="file" accept="image/*,.pdf" onChange={handleUploadLaudoImpresso} disabled={uploadingLaudo} className="hidden" />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSalvarVistoria}
                disabled={savingVistoria}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingVistoria ? "Salvando..." : "Salvar Vistoria"}</span>
              </button>

              <button
                type="button"
                onClick={handleGerarLaudoPDF}
                disabled={savingVistoria}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                <span>Gerar Laudo PDF Direto</span>
              </button>
            </div>
          </div>

          {/* Link de Assinatura Gerado - Exibido logo abaixo dos botões */}
          {linkAssinatura && (
            <div id="bloco-link-vistoria" className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Link de Assinatura da Vistoria ({tipoVistoria}) pronto para envio:</span>
                </span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  Pronto
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={linkAssinatura}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
                />
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copiado!" : "Copiar Link"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={sendingWhatsApp}
                    onClick={handleEnviarWhatsAppLink}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{sendingWhatsApp ? "Enviando PDF..." : "Enviar WhatsApp"}</span>
                  </button>
                </div>
              </div>
              {whatsAppFeedback && (
                <p className="text-xs font-medium mt-2 text-slate-700 dark:text-slate-300">
                  {whatsAppFeedback}
                </p>
              )}
            </div>
          )}
        </div>
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
