"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import GridMeses from "@/components/contratos/GridMeses";
import { FileText, Plus, X, Image as ImageIcon } from "lucide-react";

export default function ContratosPage() {
  const [contratos, setContratos] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State Emissão Contrato
  const [locatarioId, setLocatarioId] = useState("");
  const [flatId, setFlatId] = useState("");
  const [modeloContratoId, setModeloContratoId] = useState("");
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split("T")[0]);
  const [tipoValidade, setTipoValidade] = useState<"MESES" | "DIAS">("MESES");
  const [validadeValor, setValidadeValor] = useState("12");
  const [valorMensal, setValorMensal] = useState("");

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

  // Fotos Anexadas do Flat
  const [availableFlatFotos, setAvailableFlatFotos] = useState<string[]>([]);
  const [selectedFotosToAttach, setSelectedFotosToAttach] = useState<string[]>([]);

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

  const handleFlatChange = (selectedFlatId: string) => {
    if (!selectedFlatId) {
      setFlatId("");
      setAvailableFlatFotos([]);
      setSelectedFotosToAttach([]);
      return;
    }

    const flatSelected = flats.find((f) => f.id === selectedFlatId);
    if (flatSelected) {
      if (flatSelected.status !== "DISPONIVEL") {
        const statusText = flatSelected.status === "OCUPADO" ? "OCUPADO" : "EM MANUTENÇÃO";
        alert(
          `⚠️ NÃO É POSSÍVEL EMITIR CONTRATO\n\nO flat "${flatSelected.numero}" (${flatSelected.local?.nome || "Condomínio"}) encontra-se atualmente ${statusText}.\n\nApenas imóveis com status DISPONÍVEL podem ser selecionados para a emissão de novos contratos.`
        );
        setFlatId("");
        setAvailableFlatFotos([]);
        setSelectedFotosToAttach([]);
        return;
      }

      setFlatId(selectedFlatId);
      if (flatSelected.valorPadrao) setValorMensal(flatSelected.valorPadrao.toString());
      const fotos: string[] = flatSelected.fotosUrl ? JSON.parse(flatSelected.fotosUrl) : [];
      setAvailableFlatFotos(fotos);
      setSelectedFotosToAttach(fotos);
    } else {
      setAvailableFlatFotos([]);
      setSelectedFotosToAttach([]);
    }
  };

  const toggleFotoSelection = (url: string) => {
    if (selectedFotosToAttach.includes(url)) {
      setSelectedFotosToAttach(selectedFotosToAttach.filter((u) => u !== url));
    } else {
      setSelectedFotosToAttach([...selectedFotosToAttach, url]);
    }
  };

  const handleEmitirContrato = async (e: React.FormEvent) => {
    e.preventDefault();
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
          fotosAnexadasUrl: JSON.stringify(selectedFotosToAttach),
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Emissão, Vistoria de Entrada/Saída, Assinatura Digital e Acompanhamento das Parcelas
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
                onBaixaSucesso={loadData}
              />
            ))}
          </div>
        )}

        {/* Modal Emissão de Contrato com Anexo de Fotos */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
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
                    onChange={(e) => setLocatarioId(e.target.value)}
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

                {/* Selecionar Fotos do Flat para Anexar */}
                {availableFlatFotos.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Anexar Fotos do Imóvel ao Contrato ({selectedFotosToAttach.length} selecionadas):</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableFlatFotos.map((url, i) => {
                        const isSelected = selectedFotosToAttach.includes(url);
                        return (
                          <div
                            key={i}
                            onClick={() => toggleFotoSelection(url)}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                              isSelected ? "border-blue-600" : "border-transparent opacity-50"
                            }`}
                          >
                            <img src={url} alt="Foto Flat" className="w-full h-14 object-cover" />
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                ✓
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md"
                >
                  <span>{submitting ? "Gerando..." : "Emitir Contrato & Gerar Link de Assinatura"}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
