"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import GridMeses from "@/components/contratos/GridMeses";
import ChecklistVistoriaModal from "@/components/flats/ChecklistVistoriaModal";
import { FileText, Plus, X, FileCheck, CheckCircle2, AlertCircle, Camera, Calendar, CalendarCheck, CalendarX, Clock } from "lucide-react";

export default function ContratosPage() {
  const [contratos, setContratos] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Modal de Vistoria Aberto a partir da Emissão de Contrato
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistFlat, setChecklistFlat] = useState<any>(null);

  // Form State Emissão Contrato
  const [locatarioId, setLocatarioId] = useState("");
  const [flatId, setFlatId] = useState("");
  const [modeloContratoId, setModeloContratoId] = useState("");
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split("T")[0]);
  const [tipoValidade, setTipoValidade] = useState<"MESES" | "DIAS">("MESES");
  const [validadeValor, setValidadeValor] = useState("12");
  const [valorMensal, setValorMensal] = useState("");

  // Estado de Verificação em Tempo Real da Disponibilidade na Agenda
  const [disponibilidadeInfo, setDisponibilidadeInfo] = useState<{
    checking: boolean;
    checked: boolean;
    disponivel: boolean;
    mensagem: string;
    dataInicioFormatada?: string;
    dataFimFormatada?: string;
    duracao?: number;
    tipoValidade?: string;
    conflitos?: any[];
  }>({
    checking: false,
    checked: false,
    disponivel: true,
    mensagem: "",
  });

  // Novos Campos de Condições Financeiras e Regras do Contrato
  const [diaVencimento, setDiaVencimento] = useState("5");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [bancoNome, setBancoNome] = useState("");
  const [bancoDadosConta, setBancoDadosConta] = useState("");
  const [multaAtrasoPercentual, setMultaAtrasoPercentual] = useState("2.0");
  const [jurosAtrasoPercentual, setJurosAtrasoPercentual] = useState("1.0");
  const [valorCaucao, setValorCaucao] = useState("0.00");
  const [caucaoParcelas, setCaucaoParcelas] = useState("0");
  const [multaRescisaoMeses, setMultaRescisaoMeses] = useState("3");

  // Informações da Vistoria de Entrada Vinculada
  const [availableVistorias, setAvailableVistorias] = useState<any[]>([]);
  const [selectedVistoriaId, setSelectedVistoriaId] = useState<string>("");
  const [vistoriaStatusInfo, setVistoriaStatusInfo] = useState<{
    checking: boolean;
    existe: boolean;
    itensCount: number;
    fotosCount: number;
    statusAssinatura: string;
  }>({
    checking: false,
    existe: false,
    itensCount: 0,
    fotosCount: 0,
    statusAssinatura: "PENDENTE",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    try {
      const [resContratos, resLocatarios, resFlats, resModelos, resMe] = await Promise.all([
        fetch("/api/contratos").then((r) => r.json()),
        fetch("/api/locatarios").then((r) => r.json()),
        fetch("/api/flats").then((r) => r.json()),
        fetch("/api/modelos-contrato").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);

      setContratos(resContratos.contratos || []);
      setLocatarios(resLocatarios.locatarios || []);
      setFlats(resFlats.flats || []);
      setModelos(resModelos.modelos || []);
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

  const updateVistoriaInfoFromObject = (vistoria: any) => {
    if (!vistoria) {
      setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
      return;
    }
    let itens = [];
    let totalFotos = 0;
    try {
      const parsed = JSON.parse(vistoria.itensJson || "[]");
      itens = Array.isArray(parsed) ? parsed : (parsed.itens || []);
      itens.forEach((it: any) => {
        if (it.fotosUrl && Array.isArray(it.fotosUrl)) {
          totalFotos += it.fotosUrl.length;
        }
      });
    } catch (e) {}

    setVistoriaStatusInfo({
      checking: false,
      existe: true,
      itensCount: itens.length,
      fotosCount: totalFotos,
      statusAssinatura: vistoria.statusAssinatura || "PENDENTE",
    });
  };

  const checkVistoriaForFlat = async (selectedFlatId: string, selectedLocatarioId?: string) => {
    const activeLocId = selectedLocatarioId !== undefined ? selectedLocatarioId : locatarioId;
    if (!selectedFlatId && !activeLocId) {
      setAvailableVistorias([]);
      setSelectedVistoriaId("");
      setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
      return;
    }

    setVistoriaStatusInfo((prev) => ({ ...prev, checking: true }));
    try {
      let url = `/api/vistorias?tipoVistoria=ENTRADA&apenasDisponiveis=true`;
      if (selectedFlatId && activeLocId) {
        url += `&flatId=${selectedFlatId}&locatarioId=${activeLocId}&flatOuLocatario=true`;
      } else if (selectedFlatId) {
        url += `&flatId=${selectedFlatId}`;
      } else if (activeLocId) {
        url += `&locatarioId=${activeLocId}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.vistorias && data.vistorias.length > 0) {
        setAvailableVistorias(data.vistorias);
        // Priorizar vistoria assinada para o locatário selecionado
        const matchLocAndAssinado = activeLocId ? data.vistorias.find((v: any) => v.locatarioId === activeLocId && v.statusAssinatura?.includes("ASSINADO")) : null;
        const matchLoc = activeLocId ? data.vistorias.find((v: any) => v.locatarioId === activeLocId) : null;
        const matchAssinado = data.vistorias.find((v: any) => v.statusAssinatura?.includes("ASSINADO"));
        const preferred = matchLocAndAssinado || matchLoc || matchAssinado || data.vistorias[0];

        setSelectedVistoriaId(preferred.id);
        updateVistoriaInfoFromObject(preferred);
      } else {
        setAvailableVistorias([]);
        setSelectedVistoriaId("");
        setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
      }
    } catch (e) {
      setAvailableVistorias([]);
      setSelectedVistoriaId("");
      setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
    }
  };

  // Verificação em Tempo Real da Disponibilidade de Datas na Agenda
  useEffect(() => {
    if (!flatId || !dataEmissao || !validadeValor) {
      setDisponibilidadeInfo({
        checking: false,
        checked: false,
        disponivel: true,
        mensagem: "",
      });
      return;
    }

    let active = true;
    setDisponibilidadeInfo((prev) => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/contratos/verificar-disponibilidade?flatId=${flatId}&dataEmissao=${dataEmissao}&tipoValidade=${tipoValidade}&validadeValor=${validadeValor}`
        );
        const data = await res.json();
        if (active) {
          if (res.ok) {
            setDisponibilidadeInfo({
              checking: false,
              checked: true,
              disponivel: data.disponivel,
              mensagem: data.mensagem,
              dataInicioFormatada: data.dataInicioFormatada,
              dataFimFormatada: data.dataFimFormatada,
              duracao: data.duracao,
              tipoValidade: data.tipoValidade,
              conflitos: data.conflitos || [],
            });
          } else {
            setDisponibilidadeInfo({
              checking: false,
              checked: true,
              disponivel: false,
              mensagem: data.error || "Erro ao verificar disponibilidade de datas.",
            });
          }
        }
      } catch (e) {
        if (active) {
          setDisponibilidadeInfo({
            checking: false,
            checked: true,
            disponivel: true,
            mensagem: "",
          });
        }
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [flatId, dataEmissao, tipoValidade, validadeValor]);

  const handleLocatarioChange = (selectedLocatarioId: string) => {
    setLocatarioId(selectedLocatarioId);
    checkVistoriaForFlat(flatId, selectedLocatarioId);
  };

  const handleFlatChange = (selectedFlatId: string) => {
    if (!selectedFlatId) {
      setFlatId("");
      checkVistoriaForFlat("", locatarioId);
      return;
    }

    const flatSelected = flats.find((f) => f.id === selectedFlatId);
    if (flatSelected) {
      if (flatSelected.status === "MANUTENCAO") {
        alert(
          `⚠️ NÃO É POSSÍVEL EMITIR CONTRATO\n\nO imóvel "${flatSelected.numero}" (${flatSelected.local?.nome || "Condomínio"}) encontra-se atualmente em MANUTENÇÃO.\n\nAltere o status do imóvel para DISPONÍVEL no cadastro de imóveis antes de emitir o contrato.`
        );
        setFlatId("");
        setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
        return;
      }

      setFlatId(selectedFlatId);
      if (flatSelected.valorPadrao) setValorMensal(flatSelected.valorPadrao.toString());
      checkVistoriaForFlat(selectedFlatId, locatarioId);
    } else {
      setVistoriaStatusInfo({ checking: false, existe: false, itensCount: 0, fotosCount: 0, statusAssinatura: "PENDENTE" });
    }
  };

  const handleAbrirVistoria = () => {
    if (!flatId) {
      alert("Selecione um flat primeiro para realizar a vistoria.");
      return;
    }
    const flatSelected = flats.find((f) => f.id === flatId);
    if (flatSelected) {
      setChecklistFlat(flatSelected);
      setShowChecklistModal(true);
    }
  };

  const handleEmitirContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel) {
      setErrorMsg(disponibilidadeInfo.mensagem || "O período selecionado está indisponível na agenda.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locatarioId,
          flatId,
          modeloContratoId,
          dataEmissao,
          tipoValidade,
          validadeValor,
          validadeMeses: validadeValor,
          valorMensal,
          diaVencimento: parseInt(diaVencimento, 10),
          formaPagamento,
          bancoNome,
          bancoDadosConta,
          multaAtrasoPercentual: parseFloat(multaAtrasoPercentual),
          jurosAtrasoPercentual: parseFloat(jurosAtrasoPercentual),
          valorCaucao: parseFloat(valorCaucao),
          caucaoParcelas: parseInt(caucaoParcelas, 10),
          multaRescisaoMeses: parseInt(multaRescisaoMeses, 10),
          vistoriaEntradaId: selectedVistoriaId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao emitir contrato.");
        setSubmitting(false);
        return;
      }

      setShowModal(false);
      setLocatarioId("");
      setFlatId("");
      setValorMensal("");
      loadData();
    } catch (err) {
      setErrorMsg("Erro de rede ao conectar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Gestão de Contratos e Aluguéis</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">Fluxo:</span>
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">1º Vistoria de Entrada</span>
                <span>➔</span>
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">2º Contrato de Locação</span>
                <span>➔</span>
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">3º Vistoria de Saída</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Novo Contrato</span>
          </button>
        </div>

        {/* Lista de Contratos */}
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400">Carregando contratos...</div>
        ) : contratos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
            <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">Nenhum contrato cadastrado ainda.</p>
            <p className="text-xs text-slate-500">
              Clique em "Emitir Novo Contrato" acima para iniciar a gestão de um flat.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {contratos.map((contrato) => (
              <GridMeses
                key={contrato.id}
                contratoId={contrato.id}
                flatId={contrato.flatId}
                tokenAssinatura={contrato.tokenAssinatura}
                statusAssinatura={contrato.statusAssinatura}
                tipoValidade={contrato.tipoValidade}
                validadeMeses={contrato.validadeMeses}
                validadeDias={contrato.validadeDias}
                locatarioId={contrato.locatarioId}
                locatarioNome={contrato.locatario.nome}
                locatarioCpf={contrato.locatario.cpf}
                locatarioTelefone={contrato.locatario.telefone}
                flatNumero={`${contrato.flat.local?.nome || "Condomínio"} - ${contrato.flat.numero}`}
                valorMensal={contrato.valorMensal}
                parcelas={contrato.contasReceber || []}
                vistoriasChecklist={contrato.vistoriasChecklist || []}
                empresaData={empresaData}
                modeloContratoHtml={contrato.modeloContrato?.conteudoHtml}
                contratoCompleto={contrato}
                onBaixaSucesso={loadData}
              />
            ))}
          </div>
        )}

        {/* Modal Emissão de Contrato com Anexo de Fotos */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[92vh] my-auto overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Emissão de Novo Contrato de Aluguel</span>
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleEmitirContrato} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Selecionar Locatário
                  </label>
                  <select
                    required
                    value={locatarioId}
                    onChange={(e) => handleLocatarioChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Escolha o Locatário --</option>
                    {locatarios.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nome} ({loc.cpf})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Selecionar Flat / Unidade
                  </label>
                  <select
                    required
                    value={flatId}
                    onChange={(e) => handleFlatChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="">-- Escolha o Flat (Apenas Imóveis Disponíveis) --</option>
                    {flats.map((flat) => {
                      const isAvailable = flat.status === "DISPONIVEL";
                      return (
                        <option
                          key={flat.id}
                          value={flat.id}
                          className={isAvailable ? "font-bold text-emerald-600" : "text-slate-400"}
                        >
                          {flat.local?.nome} - {flat.numero} ({isAvailable ? "🟢 DISPONÍVEL" : flat.status === "OCUPADO" ? "🔵 OCUPADO (Indisponível)" : "🟡 MANUTENÇÃO (Indisponível)"})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* ETAPA 1: Vistoria de Entrada Vinculada ao Flat */}
                {flatId && (
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>1º Passo: Vistoria de Entrada do Imóvel</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAbrirVistoria}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition flex items-center space-x-1 shadow-xs"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Nova Vistoria</span>
                      </button>
                    </div>

                    {vistoriaStatusInfo.checking ? (
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center space-x-2">
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Buscando vistorias de entrada disponíveis para este imóvel...</span>
                      </div>
                    ) : availableVistorias.length > 0 ? (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Selecionar Vistoria de Entrada Disponível:
                          </label>
                          <select
                            value={selectedVistoriaId}
                            onChange={(e) => {
                              const vId = e.target.value;
                              setSelectedVistoriaId(vId);
                              const found = availableVistorias.find((v) => v.id === vId);
                              updateVistoriaInfoFromObject(found);
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                          >
                            {availableVistorias.map((v) => {
                              const isThisLoc = locatarioId && (v.locatarioId === locatarioId || v.locatario?.id === locatarioId);
                              return (
                                <option key={v.id} value={v.id}>
                                  📅 {new Date(v.createdAt).toLocaleDateString("pt-BR")} | {v.statusAssinatura?.includes("ASSINADO") ? "🟢 ASSINADO" : "🟡 PENDENTE"} {isThisLoc ? "★ [Locatário Selecionado]" : ""} {v.locatario?.nome ? `• Locatário: ${v.locatario.nome}` : ""} (Flat {v.flat?.numero})
                                </option>
                              );
                            })}
                            <option value="none">-- Não vincular nenhuma vistoria agora --</option>
                          </select>
                        </div>

                        {selectedVistoriaId && selectedVistoriaId !== "none" && (
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center space-x-2.5">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <div>
                                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                                  <span>✓ Vistoria Pronta para Vinculação Exclusiva</span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                                    {vistoriaStatusInfo.itensCount} itens • {vistoriaStatusInfo.fotosCount} fotos
                                  </span>
                                </span>
                                <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 mt-0.5">
                                  Status: <strong>{vistoriaStatusInfo.statusAssinatura}</strong>. O laudo com as fotos será anexado permanentemente a este contrato.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleAbrirVistoria}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition flex items-center space-x-1 shadow-xs"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Revisar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center space-x-2.5">
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div>
                            <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase">
                              ⚠️ Nenhuma Vistoria Disponível
                            </span>
                            <p className="text-[11px] text-amber-700/90 dark:text-amber-400 mt-0.5">
                              Nenhuma vistoria de entrada livre encontrada para este imóvel. Você pode criar uma agora ou no menu <strong>Vistorias & Checklists</strong>.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAbrirVistoria}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition flex items-center space-x-1.5 shadow-xs self-start sm:self-center"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Fazer Vistoria Agora</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    2º Passo: Condições do Contrato de Locação
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Modelo de Contrato (Opcional)
                  </label>
                  <select
                    value={modeloContratoId}
                    onChange={(e) => setModeloContratoId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Nenhum modelo selecionado --</option>
                    {modelos.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.titulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Data de Emissão
                    </label>
                    <input
                      type="date"
                      required
                      value={dataEmissao}
                      onChange={(e) => setDataEmissao(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Vigência
                    </label>
                    <select
                      value={tipoValidade}
                      onChange={(e) => {
                        const nextType = e.target.value as "MESES" | "DIAS";
                        setTipoValidade(nextType);
                        if (nextType === "DIAS" && parseInt(validadeValor, 10) > 365) {
                          setValidadeValor("30");
                        } else if (nextType === "MESES" && parseInt(validadeValor, 10) > 48) {
                          setValidadeValor("12");
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="MESES">📅 Meses</option>
                      <option value="DIAS">☀️ Dias (Diárias / Temporada)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {tipoValidade === "MESES" ? "Prazo (Meses)" : "Prazo (Dias)"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={tipoValidade === "MESES" ? "48" : "365"}
                      required
                      value={validadeValor}
                      onChange={(e) => setValidadeValor(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {tipoValidade === "MESES" ? "Valor Mensal (R$)" : "Valor do Período (R$)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={valorMensal}
                      onChange={(e) => setValorMensal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>

                {/* Validação em Tempo Real de Disponibilidade na Agenda */}
                {flatId && (
                  <div className="pt-1">
                    {disponibilidadeInfo.checking ? (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center space-x-2">
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Verificando disponibilidade de datas na agenda...</span>
                      </div>
                    ) : disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel ? (
                      <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800/80 text-red-800 dark:text-red-200 space-y-2 shadow-xs">
                        <div className="flex items-start space-x-2.5">
                          <CalendarX className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-xs font-black uppercase text-red-700 dark:text-red-300 tracking-wide flex items-center gap-1.5">
                              <span>❌ Período Indisponível na Agenda</span>
                            </span>
                            <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                              {disponibilidadeInfo.mensagem}
                            </p>
                            {disponibilidadeInfo.conflitos && disponibilidadeInfo.conflitos.length > 0 && (
                              <div className="mt-2 text-[11px] bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-red-200 dark:border-red-900 space-y-1.5 shadow-xs">
                                <span className="font-bold text-slate-900 dark:text-slate-100 block border-b border-slate-100 dark:border-slate-800 pb-1">
                                  Reserva(s) / Contrato(s) Conflitante(s):
                                </span>
                                {disponibilidadeInfo.conflitos.map((c: any) => (
                                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-700 dark:text-slate-300 gap-1">
                                    <span>👤 <strong>{c.locatarioNome}</strong> ({c.tipoValidade === "DIAS" ? `${c.validadeDias} dias` : `${c.validadeMeses} meses`})</span>
                                    <span className="font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded text-[10px]">
                                      {c.dataInicioFormatada} até {c.dataFimFormatada}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-[11px] text-red-700 dark:text-red-400 mt-1 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Para continuar, selecione outra data de início ou altere o prazo da locação.</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : disponibilidadeInfo.checked && disponibilidadeInfo.disponivel ? (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center space-x-2.5 shadow-xs">
                        <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <span>✅ Período 100% Livre na Agenda</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-black">
                              {disponibilidadeInfo.dataInicioFormatada} ➔ {disponibilidadeInfo.dataFimFormatada}
                            </span>
                          </span>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                            Nenhum conflito de reserva/contrato encontrado para este imóvel nestas datas.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Bloco 1: Condições de Pagamento & Dados Bancários */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>💳 Pagamento & Dados Bancários</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Pagamento até o dia (Vencimento)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={diaVencimento}
                        onChange={(e) => setDiaVencimento(e.target.value)}
                        placeholder="Ex: 5"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="PIX">⚡ PIX</option>
                        <option value="BOLETO">📄 Boleto Bancário</option>
                        <option value="TRANSFERENCIA">🏦 Transferência / TED / DOC</option>
                        <option value="DINHEIRO">💵 Dinheiro em Espécie</option>
                        <option value="CARTAO">💳 Cartão de Crédito/Débito</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nome do Banco
                      </label>
                      <input
                        type="text"
                        value={bancoNome}
                        onChange={(e) => setBancoNome(e.target.value)}
                        placeholder="Ex: Banco do Brasil, Bradesco, Itaú..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Dados da Conta / Chave PIX
                      </label>
                      <input
                        type="text"
                        value={bancoDadosConta}
                        onChange={(e) => setBancoDadosConta(e.target.value)}
                        placeholder="Ex: Ag: 0001 / Conta: 12345-6 / PIX: 12.345.678/0001-90"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco 2: Encargos, Caução & Multa Rescisória */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>⚖️ Multas, Juros, Caução & Rescisão</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Multa por Atraso (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={multaAtrasoPercentual}
                        onChange={(e) => setMultaAtrasoPercentual(e.target.value)}
                        placeholder="Ex: 2.0"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Juros de Mora (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={jurosAtrasoPercentual}
                        onChange={(e) => setJurosAtrasoPercentual(e.target.value)}
                        placeholder="Ex: 1.0"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Valor Caução (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={valorCaucao}
                        onChange={(e) => setValorCaucao(e.target.value)}
                        placeholder="Ex: 2500.00"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Equivalente a (Parcelas)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={caucaoParcelas}
                        onChange={(e) => setCaucaoParcelas(e.target.value)}
                        placeholder="Ex: 1"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Multa Rescisão (Meses)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={multaRescisaoMeses}
                        onChange={(e) => setMultaRescisaoMeses(e.target.value)}
                        placeholder="Ex: 3"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || (disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-white text-xs shadow-md transition flex items-center justify-center space-x-2 ${
                    disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel
                      ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  <span>
                    {submitting
                      ? "Gerando..."
                      : disponibilidadeInfo.checked && !disponibilidadeInfo.disponivel
                      ? "❌ Período Indisponível na Agenda (Altere as Datas)"
                      : "Emitir Contrato & Gerar Link de Assinatura"}
                  </span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Checklist / Vistoria de Entrada */}
        {showChecklistModal && checklistFlat && (
          <ChecklistVistoriaModal
            flatId={checklistFlat.id}
            flatNumero={checklistFlat.numero}
            locatarioId={locatarioId || undefined}
            locatarioNome={locatarios.find((l) => l.id === locatarioId)?.nome}
            locatarioCpf={locatarios.find((l) => l.id === locatarioId)?.cpf}
            locatarioTelefone={locatarios.find((l) => l.id === locatarioId)?.telefone}
            initialTipoVistoria="ENTRADA"
            empresaData={empresaData}
            onClose={() => {
              setShowChecklistModal(false);
              if (checklistFlat?.id) {
                checkVistoriaForFlat(checklistFlat.id);
              }
            }}
          />
        )}
      </div>
    </Shell>
  );
}
