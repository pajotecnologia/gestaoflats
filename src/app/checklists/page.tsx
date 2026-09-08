"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import {
  ClipboardCheck,
  Plus,
  X,
  Edit3,
  Trash2,
  Building2,
  Home,
  Sparkles,
  Layers,
  CheckCircle2,
  ListPlus,
  Trash,
  Tag,
  Eye,
  Check,
} from "lucide-react";

interface TopicoItem {
  topico: string;
  itens: string[];
}

export default function ModelosChecklistPage() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPreviewModelo, setSelectedPreviewModelo] = useState<any>(null);

  const [editingModelo, setEditingModelo] = useState<any>(null);
  const [titulo, setTitulo] = useState("");
  const [tipoImovel, setTipoImovel] = useState<"FLAT" | "SALAO" | "CHACARA" | "OUTRO">("FLAT");
  const [descricao, setDescricao] = useState("");
  const [topicos, setTopicos] = useState<TopicoItem[]>([]);
  const [novoTopicoNome, setNovoTopicoNome] = useState("");
  const [novoItemNome, setNovoItemNome] = useState<{ [topicoIdx: number]: string }>({});

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/modelos-checklist");
      const data = await res.json();
      setModelos(data.modelos || []);
    } catch (err) {
      console.error("Erro ao carregar modelos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewModal = () => {
    setEditingModelo(null);
    setTitulo("");
    setTipoImovel("FLAT");
    setDescricao("");
    setTopicos([
      {
        topico: "Estrutura & Paredes",
        itens: ["Pintura e paredes", "Portas e fechaduras", "Janelas e vidros"],
      },
      {
        topico: "Mobiliário & Eletros",
        itens: ["Cama e colchão", "Ar-condicionado", "Geladeira / Frigobar"],
      },
    ]);
    setNovoTopicoNome("");
    setNovoItemNome({});
    setErrorMessage("");
    setShowModal(true);
  };

  const handleOpenEditModal = (m: any) => {
    setEditingModelo(m);
    setTitulo(m.titulo);
    setTipoImovel(m.tipoImovel || "FLAT");
    setDescricao(m.descricao || "");

    let parsedTopicos: TopicoItem[] = [];
    try {
      const raw = JSON.parse(m.topicosJson);
      parsedTopicos = Array.isArray(raw) ? raw : [];
    } catch (e) {
      parsedTopicos = [];
    }

    setTopicos(parsedTopicos);
    setNovoTopicoNome("");
    setNovoItemNome({});
    setErrorMessage("");
    setShowModal(true);
  };

  const handleOpenPreview = (m: any) => {
    setSelectedPreviewModelo(m);
    setShowPreviewModal(true);
  };

  const handleAddTopico = () => {
    if (!novoTopicoNome.trim()) return;
    setTopicos([...topicos, { topico: novoTopicoNome.trim(), itens: [] }]);
    setNovoTopicoNome("");
  };

  const handleRemoveTopico = (index: number) => {
    setTopicos(topicos.filter((_, i) => i !== index));
  };

  const handleAddItem = (topicoIdx: number) => {
    const itemTxt = (novoItemNome[topicoIdx] || "").trim();
    if (!itemTxt) return;

    const updated = [...topicos];
    updated[topicoIdx].itens.push(itemTxt);
    setTopicos(updated);
    setNovoItemNome({ ...novoItemNome, [topicoIdx]: "" });
  };

  const handleRemoveItem = (topicoIdx: number, itemIdx: number) => {
    const updated = [...topicos];
    updated[topicoIdx].itens = updated[topicoIdx].itens.filter((_, i) => i !== itemIdx);
    setTopicos(updated);
  };

  const handleDelete = async (id: string, tit: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o modelo "${tit}"?`)) return;

    try {
      const res = await fetch(`/api/modelos-checklist?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      } else {
        alert("Erro ao excluir modelo de checklist.");
      }
    } catch (err) {
      alert("Erro de conexão ao excluir.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorMessage("Informe o título do modelo de checklist.");
      return;
    }

    if (topicos.length === 0) {
      setErrorMessage("Adicione pelo menos 1 tópico com itens ao modelo.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const method = editingModelo ? "PUT" : "POST";
      const res = await fetch("/api/modelos-checklist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingModelo?.id,
          titulo,
          tipoImovel,
          descricao,
          topicosJson: JSON.stringify(topicos),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Erro ao salvar modelo.");
        return;
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setErrorMessage("Erro de conexão ao salvar modelo de checklist.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "SALAO":
        return {
          label: "Salão de Festas & Eventos",
          bg: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        };
      case "CHACARA":
        return {
          label: "Chácara & Sítio",
          bg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        };
      case "OUTRO":
        return {
          label: "Outros Imóveis",
          bg: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        };
      case "FLAT":
      default:
        return {
          label: "Residencial / Flat / Apto",
          bg: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        };
    }
  };

  const filteredModelos = modelos.filter((m) => {
    if (filtroTipo === "TODOS") return true;
    return m.tipoImovel === filtroTipo;
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Modelos de Checklist & Vistoria</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize os tópicos, ambientes e itens checados em vistorias de flats, salões de festas e chácaras
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Modelo</span>
          </button>
        </div>

        {/* Filtro por Tipo de Imóvel */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "TODOS", label: "Todos os Modelos" },
            { id: "FLAT", label: "🏢 Imóveis & Flats" },
            { id: "SALAO", label: "🎉 Salões de Festas" },
            { id: "CHACARA", label: "🌳 Chácaras & Sítios" },
            { id: "OUTRO", label: "🏷️ Outros" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroTipo(tab.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-medium transition cursor-pointer ${
                filtroTipo === tab.id
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid de Modelos Cadastrados */}
        {loading ? (
          <div className="py-12 text-center text-slate-500">Carregando modelos de checklist...</div>
        ) : filteredModelos.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Nenhum modelo cadastrado nesta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModelos.map((m) => {
              const badge = getTipoBadge(m.tipoImovel);
              let topicosList: TopicoItem[] = [];
              try {
                topicosList = JSON.parse(m.topicosJson);
              } catch (e) {}

              const totalItens = topicosList.reduce((acc, t) => acc + (t.itens?.length || 0), 0);

              return (
                <div
                  key={m.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {m.padrao && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Padrão
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{m.titulo}</h3>
                      {m.descricao && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{m.descricao}</p>
                      )}
                    </div>

                    {/* Resumo de Tópicos */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span>{topicosList.length} tópicos / ambientes</span>
                        <span>{totalItens} itens de vistoria</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {topicosList.slice(0, 4).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300"
                          >
                            {t.topico}
                          </span>
                        ))}
                        {topicosList.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-semibold self-center">
                            +{topicosList.length - 4} mais
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenPreview(m)}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Estrutura</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(m)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Editar Modelo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.titulo)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Excluir Modelo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Criação / Edição de Modelo */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {editingModelo ? "Editar Modelo de Checklist" : "Criar Novo Modelo de Checklist"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Título do Modelo *
                    </label>
                    <input
                      type="text"
                      required
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="ex: Vistoria de Chácara & Piscina"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Imóvel
                    </label>
                    <select
                      value={tipoImovel}
                      onChange={(e: any) => setTipoImovel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FLAT">🏢 Imóvel / Flat / Apto</option>
                      <option value="SALAO">🎉 Salão de Festas</option>
                      <option value="CHACARA">🌳 Chácara / Sítio</option>
                      <option value="OUTRO">🏷️ Outro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição do Modelo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="ex: Modelo de vistoria utilizado para eventos e locações de fim de semana"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Estrutura de Tópicos e Itens */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Tópicos & Ambientes do Checklist</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cada tópico agrupa itens checados durante a vistoria
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={novoTopicoNome}
                        onChange={(e) => setNovoTopicoNome(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTopico();
                          }
                        }}
                        placeholder="Nome do novo tópico..."
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={handleAddTopico}
                        className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs transition cursor-pointer"
                      >
                        + Tópico
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {topicos.map((topico, topicoIdx) => (
                      <div
                        key={topicoIdx}
                        className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{topico.topico}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTopico(topicoIdx)}
                            className="text-slate-400 hover:text-red-500 p-1 text-[11px] flex items-center gap-1 transition cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            <span>Remover Tópico</span>
                          </button>
                        </div>

                        {/* Itens do Tópico */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {topico.itens.map((item, itemIdx) => (
                              <span
                                key={itemIdx}
                                className="inline-flex items-center gap-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-200"
                              >
                                <span>{item}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(topicoIdx, itemIdx)}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>

                          {/* Adicionar Item ao Tópico */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={novoItemNome[topicoIdx] || ""}
                              onChange={(e) =>
                                setNovoItemNome({ ...novoItemNome, [topicoIdx]: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddItem(topicoIdx);
                                }
                              }}
                              placeholder={`Adicionar item em "${topico.topico}"...`}
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddItem(topicoIdx)}
                              className="py-1.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                            >
                              + Item
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Salvando..." : editingModelo ? "Atualizar Modelo" : "Salvar Modelo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Pré-visualização da Estrutura */}
        {showPreviewModal && selectedPreviewModelo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedPreviewModelo.titulo}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedPreviewModelo.descricao || "Estrutura do checklist"}</p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {(() => {
                  let topicosList: TopicoItem[] = [];
                  try {
                    topicosList = JSON.parse(selectedPreviewModelo.topicosJson);
                  } catch (e) {}

                  return topicosList.map((t, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400">{t.topico}</h4>
                      <ul className="space-y-1 pl-2">
                        {t.itens.map((it, itIdx) => (
                          <li key={itIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()}
              </div>

              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
