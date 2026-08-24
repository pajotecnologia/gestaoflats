"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import ChecklistVistoriaModal from "@/components/flats/ChecklistVistoriaModal";
import ChecklistVistoriaViewModal from "@/components/flats/ChecklistVistoriaViewModal";
import { formatCurrency } from "@/lib/validation";
import {
  Building2,
  Building,
  MapPin,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  Wrench,
  Edit3,
  Image as ImageIcon,
  ClipboardCheck,
  ArrowLeft,
  Share2,
  User,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Upload,
} from "lucide-react";
import Link from "next/link";

export default function FlatDetailPage({ params }: { params: { id: string } }) {
  const [flat, setFlat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedViewVistoria, setSelectedViewVistoria] = useState<any>(null);
  const [uploadingFotos, setUploadingFotos] = useState(false);

  const loadFlat = async () => {
    try {
      const res = await fetch(`/api/flats/${params.id}`);
      const data = await res.json();
      if (data.flat) {
        setFlat(data.flat);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes do flat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlat();
  }, [params.id]);

  const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !flat) return;

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

    setUploadingFotos(true);
    try {
      const formData = new FormData();
      formData.append("flatId", flat.id);
      fileList.forEach((file) => {
        formData.append("fotoFiles", file);
      });

      const res = await fetch("/api/flats/upload-fotos", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.fotosUrl) {
        loadFlat();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFotos(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Carregando detalhes completos do flat...</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (!flat) {
    return (
      <Shell>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Flat Não Encontrado</h2>
          <p className="text-xs text-slate-500">O flat solicitado não existe ou foi removido.</p>
          <Link
            href="/flats"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Lista de Flats</span>
          </Link>
        </div>
      </Shell>
    );
  }

  const fotosList: string[] = flat.fotosUrl ? JSON.parse(flat.fotosUrl) : [];
  const contratoAtivo = flat.contratos?.find((c: any) => c.status === "ATIVO") || flat.contratos?.[0];

  const isDisponivel = flat.status === "DISPONIVEL";
  const isOcupado = flat.status === "OCUPADO";

  return (
    <Shell>
      <div className="space-y-6">
        {/* Barra Superior de Ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/flats"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Voltar para Lista"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {flat.numero}
                </h1>
                {isDisponivel ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Disponível</span>
                  </span>
                ) : isOcupado ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Ocupado</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center space-x-1">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Manutenção</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{flat.local?.nome} • {flat.local?.endereco}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChecklistModal(true)}
              className="py-2 px-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Checklist de Vistoria</span>
            </button>

            <label className="cursor-pointer py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm">
              <Upload className="w-4 h-4" />
              <span>{uploadingFotos ? "Enviando..." : "Upload Fotos"}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUploadFotos}
                disabled={uploadingFotos}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Grid Principal: Galeria de Fotos e Detalhes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna Esquerda: Galeria de Fotos em Alta Resolução (7 colunas) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Galeria de Fotos ({fotosList.length} fotos)</span>
                </h3>
              </div>

              {/* Foto Principal em Destaque */}
              {fotosList.length > 0 ? (
                <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  <img
                    src={fotosList[selectedPhotoIndex] || fotosList[0]}
                    alt={`Foto ${selectedPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {fotosList.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : fotosList.length - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedPhotoIndex((prev) => (prev < fotosList.length - 1 ? prev + 1 : 0))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur-sm">
                    {selectedPhotoIndex + 1} / {fotosList.length}
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <ImageIcon className="w-10 h-10 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nenhuma foto adicionada ao flat.</p>
                  <p className="text-[11px] text-slate-400">Clique no botão "Upload Fotos" acima para adicionar imagens deste flat.</p>
                </div>
              )}

              {/* Miniaturas de Navegação */}
              {fotosList.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto py-1">
                  {fotosList.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhotoIndex(i)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                        selectedPhotoIndex === i
                          ? "border-blue-600 shadow-md scale-105"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt="Miniatura" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Dados do Local, Valor, Descrição & Contratos (5 colunas) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Card Valor & Dados do Local */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Valor Padrão de Aluguel</span>
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formatCurrency(flat.valorPadrao)}
                </span>
                <span className="text-xs text-slate-400"> / mês</span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Condomínio / Edifício:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{flat.local?.nome}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Endereço Completo:</span>
                  <p className="text-slate-600 dark:text-slate-400">{flat.local?.endereco}</p>
                </div>
              </div>
            </div>

            {/* Card Descrição do Imóvel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Descrição & Características</span>
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {flat.descricao || "Nenhuma descrição detalhada cadastrada para este flat."}
              </p>
            </div>

            {/* Card Contrato Atual / Locatário */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Situação Contratual</span>
              </h3>

              {contratoAtivo ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-slate-100">{contratoAtivo.locatario?.nome}</strong>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      {contratoAtivo.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    CPF: {contratoAtivo.locatario?.cpf} • Tel: {contratoAtivo.locatario?.telefone || "Não informado"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Vigência: {contratoAtivo.validadeMeses} meses (Valor: {formatCurrency(contratoAtivo.valorMensal)})
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nenhum contrato ativo vinculado a este flat no momento.
                </p>
              )}
            </div>

            {/* Histórico de Vistorias do Flat */}
            {flat.vistoriasChecklist?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                    <span>Histórico de Vistorias ({flat.vistoriasChecklist.length})</span>
                  </h3>

                  <button
                    onClick={() => setShowChecklistModal(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Vistoria</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {flat.vistoriasChecklist.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Vistoria de {v.tipoVistoria}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            ({new Date(v.dataVistoria || v.createdAt).toLocaleDateString("pt-BR")})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Resp: {v.responsavelVistoria} • Locatário: {v.locatario?.nome || "Não informado"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedViewVistoria(v)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center space-x-1 transition shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Visualizar Ficha & Imprimir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Edição de Vistoria */}
        {showChecklistModal && (
          <ChecklistVistoriaModal
            flatId={flat.id}
            flatNumero={flat.numero}
            onClose={() => {
              setShowChecklistModal(false);
              loadFlat();
            }}
          />
        )}

        {/* Modal de Visualização da Ficha de Vistoria (Apenas Visualização) */}
        {selectedViewVistoria && (
          <ChecklistVistoriaViewModal
            vistoria={selectedViewVistoria}
            onClose={() => setSelectedViewVistoria(null)}
          />
        )}
      </div>
    </Shell>
  );
}
