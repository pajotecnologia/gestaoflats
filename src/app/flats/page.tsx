"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import ChecklistVistoriaModal from "@/components/flats/ChecklistVistoriaModal";
import ChecklistVistoriaViewModal from "@/components/flats/ChecklistVistoriaViewModal";
import { formatCurrency } from "@/lib/validation";
import {
  Building2,
  Plus,
  X,
  Building,
  CheckCircle2,
  Clock,
  Wrench,
  Edit3,
  Image as ImageIcon,
  ClipboardCheck,
  Upload,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MapPin,
  DollarSign,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function FlatsPage() {
  const [locais, setLocais] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modais de Criação / Edição / Visualização
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [showFlatModal, setShowFlatModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const [selectedChecklistFlat, setSelectedChecklistFlat] = useState<any>(null);
  const [selectedDetailFlat, setSelectedDetailFlat] = useState<any>(null);
  const [selectedViewVistoria, setSelectedViewVistoria] = useState<any>(null);
  const [loadingVistoriaView, setLoadingVistoriaView] = useState(false);
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0);

  const [editingLocal, setEditingLocal] = useState<any>(null);
  const [editingFlat, setEditingFlat] = useState<any>(null);

  const handleOpenVistoriaFlat = async (flat: any) => {
    setSelectedChecklistFlat(flat);
    setLoadingVistoriaView(true);
    try {
      const res = await fetch(`/api/assinar/vistoria?flatId=${flat.id}`);
      const data = await res.json();
      if (res.ok && data.vistoria) {
        setSelectedViewVistoria(data.vistoria);
      } else {
        setShowChecklistModal(true);
      }
    } catch (err) {
      console.error("Erro ao buscar vistoria do flat:", err);
      setShowChecklistModal(true);
    } finally {
      setLoadingVistoriaView(false);
    }
  };

  // Form Local State
  const [nomeLocal, setNomeLocal] = useState("");
  const [enderecoLocal, setEnderecoLocal] = useState("");

  // Form Flat State
  const [localIdSelected, setLocalIdSelected] = useState("");
  const [numeroFlat, setNumeroFlat] = useState("");
  const [statusFlat, setStatusFlat] = useState("DISPONIVEL");
  const [descricaoFlat, setDescricaoFlat] = useState("");
  const [valorPadraoFlat, setValorPadraoFlat] = useState("2500");

  // Multi-photo State no Modal
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [resFlats, resMe] = await Promise.all([
        fetch("/api/flats").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);
      setLocais(resFlats.locais || []);
      setFlats(resFlats.flats || []);
      if (resMe.user?.empresa) setEmpresaData(resMe.user.empresa);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewLocal = () => {
    setEditingLocal(null);
    setNomeLocal("");
    setEnderecoLocal("");
    setShowLocalModal(true);
  };

  const handleOpenEditLocal = (local: any) => {
    setEditingLocal(local);
    setNomeLocal(local.nome);
    setEnderecoLocal(local.endereco);
    setShowLocalModal(true);
  };

  const handleOpenNewFlat = (localIdDefault?: string) => {
    setEditingFlat(null);
    setLocalIdSelected(localIdDefault || (locais[0]?.id || ""));
    setNumeroFlat("");
    setStatusFlat("DISPONIVEL");
    setDescricaoFlat("");
    setValorPadraoFlat("2500");
    setFotosPreview([]);
    setShowFlatModal(true);
  };

  const handleOpenEditFlat = (flat: any) => {
    setEditingFlat(flat);
    setLocalIdSelected(flat.localId);
    setNumeroFlat(flat.numero);
    setStatusFlat(flat.status);
    setDescricaoFlat(flat.descricao || "");
    setValorPadraoFlat(flat.valorPadrao ? flat.valorPadrao.toString() : "2500");
    setFotosPreview(flat.fotosUrl ? JSON.parse(flat.fotosUrl) : []);
    setShowFlatModal(true);
  };

  const handleOpenDetailModal = (flat: any) => {
    setSelectedDetailFlat(flat);
    setDetailPhotoIndex(0);
    setShowDetailModal(true);
  };

  const handleUploadMultiFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingFotos(true);

    try {
      const formData = new FormData();
      if (editingFlat?.id) {
        formData.append("flatId", editingFlat.id);
      }
      fileList.forEach((file) => {
        formData.append("fotoFiles", file);
      });

      const res = await fetch("/api/flats/upload-fotos", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.fotosUrl) {
        if (editingFlat) {
          setFotosPreview(data.fotosUrl);
        } else {
          setFotosPreview((prev) => [...prev, ...data.fotosUrl]);
        }
        loadData();
      }
    } catch (err) {
      console.error("Erro ao enviar fotos:", err);
    } finally {
      setUploadingFotos(false);
    }
  };

  const handleRemoveFoto = (indexToRemove: number) => {
    setFotosPreview((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingLocal ? "PUT" : "POST";
      await fetch("/api/flats", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "local",
          id: editingLocal?.id,
          nome: nomeLocal,
          endereco: enderecoLocal,
        }),
      });
      setShowLocalModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingFlat ? "PUT" : "POST";
      await fetch("/api/flats", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "flat",
          id: editingFlat?.id,
          localId: localIdSelected,
          numero: numeroFlat,
          status: statusFlat,
          descricao: descricaoFlat,
          valorPadrao: valorPadraoFlat,
          fotosUrl: fotosPreview,
        }),
      });
      setShowFlatModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Cabeçalho Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Gestão de Flats & Condomínios</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastro, fotos, visualização detalhada, valores e laudos de vistoria de entrada e saída
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenNewLocal}
              className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Novo Condomínio/Edifício</span>
            </button>

            <button
              onClick={() => handleOpenNewFlat()}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Flat</span>
            </button>
          </div>
        </div>

        {/* Lista de Condomínios e Flats */}
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400">Carregando imóveis...</div>
        ) : locais.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
            <Building className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum condomínio cadastrado.</p>
            <p className="text-xs text-slate-500">
              Comece criando um condomínio/edifício e depois adicione as unidades de flats.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {locais.map((local) => (
              <div key={local.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{local.nome}</h3>
                        <button
                          onClick={() => handleOpenEditLocal(local)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Editar Condomínio"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>{local.endereco}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenNewFlat(local.id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Flat</span>
                    </button>
                    <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
                      {local.flats?.length || 0} Unidade(s)
                    </span>
                  </div>
                </div>

                {/* Grid dos Cards de Flats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(!local.flats || local.flats.length === 0) ? (
                    <p className="text-xs text-slate-500 col-span-full py-4">
                      Nenhum flat cadastrado neste condomínio ainda.
                    </p>
                  ) : (
                    local.flats.map((flat: any) => {
                      const isDisponivel = flat.status === "DISPONIVEL";
                      const isOcupado = flat.status === "OCUPADO";
                      const fotosList: string[] = flat.fotosUrl ? JSON.parse(flat.fotosUrl) : [];
                      const fotoCapa = fotosList.length > 0 ? fotosList[0] : null;

                      return (
                        <div
                          key={flat.id}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 transition shadow-sm flex flex-col justify-between"
                        >
                          {/* Banner / Foto de Capa do Flat */}
                          <div className="relative h-40 bg-slate-200 dark:bg-slate-900 overflow-hidden group">
                            {fotoCapa ? (
                              <img
                                src={fotoCapa}
                                alt={`Foto ${flat.numero}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                                onClick={() => handleOpenDetailModal(flat)}
                              />
                            ) : (
                              <div
                                onClick={() => handleOpenDetailModal(flat)}
                                className="w-full h-full flex flex-col items-center justify-center text-slate-400 cursor-pointer bg-slate-100 dark:bg-slate-900/50"
                              >
                                <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                                <span className="text-[11px]">Sem foto cadastrada</span>
                              </div>
                            )}

                            {/* Badges no topo da foto */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                              {isDisponivel ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold shadow-md backdrop-blur-sm flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Disponível</span>
                                </span>
                              ) : isOcupado ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-600/90 text-white text-[10px] font-bold shadow-md backdrop-blur-sm flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Ocupado</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-600/90 text-white text-[10px] font-bold shadow-md backdrop-blur-sm flex items-center space-x-1">
                                  <Wrench className="w-3 h-3" />
                                  <span>Manutenção</span>
                                </span>
                              )}

                              {fotosList.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold shadow-md backdrop-blur-sm flex items-center space-x-1">
                                  <ImageIcon className="w-3 h-3" />
                                  <span>{fotosList.length}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Corpo do Card */}
                          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <h4
                                  onClick={() => handleOpenDetailModal(flat)}
                                  className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer"
                                >
                                  {flat.numero}
                                </h4>
                                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                                  {formatCurrency(flat.valorPadrao)}
                                  <span className="text-[10px] text-slate-400 font-normal">/mês</span>
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {flat.descricao || "Sem descrição detalhada cadastrada."}
                              </p>
                            </div>

                            {/* 3 Botões de Ação Organizados */}
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
                              <div className="grid grid-cols-2 gap-1.5">
                                {/* Botão Visualizar */}
                                <button
                                  onClick={() => handleOpenDetailModal(flat)}
                                  className="py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm"
                                  title="Ver Detalhes e Fotos"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>Visualizar</span>
                                </button>

                                {/* Botão Editar & Fotos */}
                                <button
                                  onClick={() => handleOpenEditFlat(flat)}
                                  className="py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm"
                                  title="Editar Flat e Fotos"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Editar</span>
                                </button>
                              </div>

                              {/* Botão Checklist / Histórico de Vistoria (Abre Ficha de Visualização) */}
                              <button
                                onClick={() => handleOpenVistoriaFlat(flat)}
                                className="w-full py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-blue-200 dark:border-blue-800/60"
                              >
                                <ClipboardCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Checklist de Vistoria</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Visualização Rápida / Detalhes Completos do Flat */}
        {showDetailModal && selectedDetailFlat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
              
              {/* Topo do Modal */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                        {selectedDetailFlat.numero}
                      </h3>
                      {selectedDetailFlat.status === "DISPONIVEL" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          Disponível
                        </span>
                      ) : selectedDetailFlat.status === "OCUPADO" ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                          Ocupado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          Manutenção
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {locais.find((l) => l.id === selectedDetailFlat.localId)?.nome || "Condomínio"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/flats/${selectedDetailFlat.id}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 text-slate-600 dark:text-slate-300 transition text-xs font-semibold flex items-center space-x-1"
                    title="Abrir em Nova Aba / Tela Cheia"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Nova Aba</span>
                  </Link>

                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Galeria de Fotos no Modal */}
              {(() => {
                const fotos: string[] = selectedDetailFlat.fotosUrl ? JSON.parse(selectedDetailFlat.fotosUrl) : [];
                return (
                  <div className="space-y-3">
                    {fotos.length > 0 ? (
                      <div className="space-y-2">
                        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner">
                          <img
                            src={fotos[detailPhotoIndex] || fotos[0]}
                            alt="Foto do Flat"
                            className="w-full h-full object-cover"
                          />
                          {fotos.length > 1 && (
                            <>
                              <button
                                onClick={() => setDetailPhotoIndex((prev) => (prev > 0 ? prev - 1 : fotos.length - 1))}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setDetailPhotoIndex((prev) => (prev < fotos.length - 1 ? prev + 1 : 0))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm">
                            {detailPhotoIndex + 1} / {fotos.length}
                          </div>
                        </div>

                        {fotos.length > 1 && (
                          <div className="flex space-x-2 overflow-x-auto py-1">
                            {fotos.map((url, i) => (
                              <button
                                key={i}
                                onClick={() => setDetailPhotoIndex(i)}
                                className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                                  detailPhotoIndex === i
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
                    ) : (
                      <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-400 space-y-1">
                        <ImageIcon className="w-8 h-8 mx-auto opacity-50" />
                        <p className="text-xs">Nenhuma foto adicionada ainda.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Informações Estruturadas do Flat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Valor do Aluguel</span>
                  <strong className="text-base text-blue-600 dark:text-blue-400 font-extrabold">
                    {formatCurrency(selectedDetailFlat.valorPadrao)}
                  </strong>
                  <span className="text-slate-400 text-[10px]"> / mês</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Condomínio</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {locais.find((l) => l.id === selectedDetailFlat.localId)?.nome || "Não informado"}
                  </strong>
                  <span className="block text-[10px] text-slate-500">
                    {locais.find((l) => l.id === selectedDetailFlat.localId)?.endereco || ""}
                  </span>
                </div>
              </div>

              {/* Descrição do Imóvel */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Descrição & Detalhes do Flat:</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedDetailFlat.descricao || "Nenhuma descrição informada."}
                </p>
              </div>

              {/* Ações do Rodapé do Modal */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEditFlat(selectedDetailFlat);
                  }}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5 transition"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Flat & Fotos</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedChecklistFlat(selectedDetailFlat);
                      setShowChecklistModal(true);
                    }}
                    className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md flex items-center space-x-1.5 transition"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Checklist de Vistoria</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Novo / Editar Condomínio */}
        {showLocalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {editingLocal ? "Editar Condomínio / Edifício" : "Novo Condomínio / Edifício"}
                </h3>
                <button onClick={() => setShowLocalModal(false)} className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveLocal} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Edifício</label>
                  <input
                    type="text"
                    required
                    value={nomeLocal}
                    onChange={(e) => setNomeLocal(e.target.value)}
                    placeholder="ex: Condomínio Edifício Mar Azul"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    required
                    value={enderecoLocal}
                    onChange={(e) => setEnderecoLocal(e.target.value)}
                    placeholder="ex: Av. Boa Viagem, 1200 - Recife PE"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs"
                >
                  {editingLocal ? "Atualizar Condomínio" : "Salvar Condomínio"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Novo / Editar Flat com Upload Múltiplo de Fotos e Exclusão */}
        {showFlatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {editingFlat ? `Editar ${editingFlat.numero}` : "Novo Flat / Unidade"}
                </h3>
                <button onClick={() => setShowFlatModal(false)} className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Múltiplo de Fotos com Preview e Botão de Excluir */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Fotos do Flat ({fotosPreview.length})</span>
                  </label>

                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingFotos ? "Enviando..." : "Upload Fotos"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleUploadMultiFotos}
                      disabled={uploadingFotos}
                      className="hidden"
                    />
                  </label>
                </div>

                {fotosPreview.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2.5">
                    {fotosPreview.map((url, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square bg-slate-900">
                        <img
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFoto(i)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow-md"
                          title="Remover Foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Nenhuma foto adicionada ainda. Clique em "Upload Fotos" para anexar imagens.
                  </p>
                )}
              </div>

              <form onSubmit={handleSaveFlat} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Condomínio Vinculado</label>
                  <select
                    required
                    value={localIdSelected}
                    onChange={(e) => setLocalIdSelected(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Selecione o Condomínio --</option>
                    {locais.map((l) => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Número / Nome do Flat</label>
                  <input
                    type="text"
                    required
                    value={numeroFlat}
                    onChange={(e) => setNumeroFlat(e.target.value)}
                    placeholder="ex: Flat 101 - Beira Mar"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={statusFlat}
                      onChange={(e) => setStatusFlat(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="DISPONIVEL">Disponível</option>
                      <option value="OCUPADO">Ocupado</option>
                      <option value="MANUTENCAO">Manutenção</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Padrão (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={valorPadraoFlat}
                      onChange={(e) => setValorPadraoFlat(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <textarea
                    rows={3}
                    value={descricaoFlat}
                    onChange={(e) => setDescricaoFlat(e.target.value)}
                    placeholder="Características do imóvel, mobília, comodidades..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md transition"
                >
                  {editingFlat ? "Atualizar Flat" : "Salvar Flat"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Checklist de Vistoria (Edição / Nova) */}
        {showChecklistModal && selectedChecklistFlat && (
          <ChecklistVistoriaModal
            flatId={selectedChecklistFlat.id}
            flatNumero={selectedChecklistFlat.numero}
            empresaData={empresaData}
            onClose={() => setShowChecklistModal(false)}
          />
        )}

        {/* Modal de Ficha de Vistoria (Apenas Visualização / Read-Only) */}
        {selectedViewVistoria && (
          <ChecklistVistoriaViewModal
            vistoria={selectedViewVistoria}
            empresaData={empresaData}
            onClose={() => setSelectedViewVistoria(null)}
            onEdit={() => {
              setSelectedViewVistoria(null);
              setShowChecklistModal(true);
            }}
          />
        )}
      </div>
    </Shell>
  );
}
