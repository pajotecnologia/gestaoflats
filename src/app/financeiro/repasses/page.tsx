"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { formatCurrency } from "@/lib/validation";
import { generateRepassePDF, getRepassePDFBase64 } from "@/lib/repassePdfGenerator";
import { sendWhatsAppDocument, sendWhatsAppMessage } from "@/lib/evolutionApi";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Send,
  MessageSquare,
  Search,
  Filter,
  Users,
  Building2,
  Calendar,
  X,
  Check,
  Plus,
  ArrowRight,
  QrCode,
  ShieldCheck,
  CreditCard,
  Percent,
} from "lucide-react";
import Link from "next/link";

interface Repasse {
  id: string;
  mesReferencia: string;
  valorBrutoAluguel: number;
  taxaAdminPercentual: number;
  valorTaxaAdmin: number;
  valorDescontos: number;
  valorLiquidoRepasse: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  formaPagamento?: string | null;
  observacoes?: string | null;
  createdAt: string;
  proprietario: {
    id: string;
    nome: string;
    cpfCnpj: string;
    telefone: string;
    email?: string | null;
    chavePix?: string | null;
    tipoChavePix?: string | null;
    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
  };
  flat?: {
    id: string;
    numero: string;
    local?: { nome: string };
  } | null;
  contrato?: {
    id: string;
    locatario?: { nome: string; telefone: string };
  } | null;
}

export default function RepassesPage() {
  const [repasses, setRepasses] = useState<Repasse[]>([]);
  const [totais, setTotais] = useState<any>({
    totalBruto: 0,
    totalTaxaAdmin: 0,
    totalLiquido: 0,
    totalPago: 0,
    totalPendente: 0,
    quantidade: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedMes, setSelectedMes] = useState(new Date().toISOString().substring(0, 7));
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Baixa / Pagamento
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [selectedRepasseForBaixa, setSelectedRepasseForBaixa] = useState<Repasse | null>(null);
  const [baixaDataPagamento, setBaixaDataPagamento] = useState(new Date().toISOString().substring(0, 10));
  const [baixaFormaPagamento, setBaixaFormaPagamento] = useState("PIX");
  const [baixaSubmitting, setBaixaSubmitting] = useState(false);

  // Modal Novo Repasse Manual
  const [showNewModal, setShowNewModal] = useState(false);
  const [proprietariosList, setProprietariosList] = useState<any[]>([]);
  const [flatsList, setFlatsList] = useState<any[]>([]);
  const [newProprietarioId, setNewProprietarioId] = useState("");
  const [newFlatId, setNewFlatId] = useState("");
  const [newValorBruto, setNewValorBruto] = useState("");
  const [newTaxaAdmin, setNewTaxaAdmin] = useState("10");
  const [newDescontos, setNewDescontos] = useState("0");
  const [newDataVencimento, setNewDataVencimento] = useState(new Date().toISOString().substring(0, 10));
  const [newObservacoes, setNewObservacoes] = useState("");
  const [newSubmitting, setNewSubmitting] = useState(false);

  // WhatsApp Sending State
  const [sendingWhatsId, setSendingWhatsId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      let url = `/api/repasses?mes=${selectedMes}`;
      if (selectedStatus !== "TODOS") url += `&status=${selectedStatus}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setRepasses(data.repasses || []);
        setTotais(data.totais || {});
      }
    } catch (err) {
      console.error("Erro ao carregar repasses:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuxData = async () => {
    try {
      const [pRes, fRes] = await Promise.all([
        fetch("/api/proprietarios"),
        fetch("/api/flats"),
      ]);
      const pData = await pRes.json();
      const fData = await fRes.json();
      if (pRes.ok) setProprietariosList(pData.proprietarios || []);
      if (fRes.ok) setFlatsList(fData.flats || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    loadAuxData();
  }, [selectedMes, selectedStatus]);

  const handleOpenBaixa = (repasse: Repasse) => {
    setSelectedRepasseForBaixa(repasse);
    setBaixaDataPagamento(new Date().toISOString().substring(0, 10));
    setBaixaFormaPagamento(repasse.formaPagamento || "PIX");
    setShowBaixaModal(true);
  };

  const handleConfirmBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepasseForBaixa) return;
    setBaixaSubmitting(true);

    try {
      const res = await fetch("/api/repasses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRepasseForBaixa.id,
          status: "PAGO",
          dataPagamento: baixaDataPagamento,
          formaPagamento: baixaFormaPagamento,
        }),
      });

      if (res.ok) {
        setShowBaixaModal(false);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || "Erro ao dar baixa no repasse.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBaixaSubmitting(false);
    }
  };

  const handleDownloadPDF = async (repasse: Repasse) => {
    try {
      // Obter dados da empresa logada
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const emp = meData.user?.empresa || {
        nomeFantasia: "IMOB Gestão de Locações",
        cnpj: "00.000.000/0001-00",
        endereco: "Brasil",
        telefone: "(87) 99654-0551",
        email: "contato@pajotech.com.br",
      };

      const pdf = await generateRepassePDF({
        empresa: {
          nomeFantasia: emp.nomeFantasia,
          razaoSocial: emp.razaoSocial || emp.nomeFantasia,
          cnpj: emp.cnpj || "",
          endereco: emp.endereco || "",
          telefone: emp.telefone || "",
          email: emp.email || "",
          logomarcaUrl: emp.logomarcaUrl,
        },
        repasse: {
          id: repasse.id,
          mesReferencia: repasse.mesReferencia,
          valorBrutoAluguel: repasse.valorBrutoAluguel,
          taxaAdminPercentual: repasse.taxaAdminPercentual,
          valorTaxaAdmin: repasse.valorTaxaAdmin,
          valorDescontos: repasse.valorDescontos,
          valorLiquidoRepasse: repasse.valorLiquidoRepasse,
          dataVencimento: repasse.dataVencimento,
          dataPagamento: repasse.dataPagamento,
          status: repasse.status,
          formaPagamento: repasse.formaPagamento,
          observacoes: repasse.observacoes,
          createdAt: repasse.createdAt,
        },
        proprietario: repasse.proprietario,
        flat: repasse.flat
          ? {
              numero: repasse.flat.numero,
              localNome: repasse.flat.local?.nome || "Condomínio",
            }
          : undefined,
        locatarioNome: repasse.contrato?.locatario?.nome,
      });

      pdf.save(`Extrato_Repasse_${repasse.proprietario.nome.replace(/\s+/g, "_")}_${repasse.mesReferencia}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF de repasse:", err);
      alert("Erro ao gerar PDF.");
    }
  };

  const handleSendWhatsApp = async (repasse: Repasse) => {
    if (!repasse.proprietario.telefone) {
      alert("Proprietário não possui telefone cadastrado.");
      return;
    }

    setSendingWhatsId(repasse.id);
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const emp = meData.user?.empresa || {
        nomeFantasia: "IMOB Gestão de Locações",
        cnpj: "00.000.000/0001-00",
        endereco: "Brasil",
        telefone: "(87) 99654-0551",
        email: "contato@pajotech.com.br",
      };

      const pdfBase64 = await getRepassePDFBase64({
        empresa: {
          nomeFantasia: emp.nomeFantasia,
          razaoSocial: emp.razaoSocial || emp.nomeFantasia,
          cnpj: emp.cnpj || "",
          endereco: emp.endereco || "",
          telefone: emp.telefone || "",
          email: emp.email || "",
          logomarcaUrl: emp.logomarcaUrl,
        },
        repasse: {
          id: repasse.id,
          mesReferencia: repasse.mesReferencia,
          valorBrutoAluguel: repasse.valorBrutoAluguel,
          taxaAdminPercentual: repasse.taxaAdminPercentual,
          valorTaxaAdmin: repasse.valorTaxaAdmin,
          valorDescontos: repasse.valorDescontos,
          valorLiquidoRepasse: repasse.valorLiquidoRepasse,
          dataVencimento: repasse.dataVencimento,
          dataPagamento: repasse.dataPagamento,
          status: repasse.status,
          formaPagamento: repasse.formaPagamento,
          observacoes: repasse.observacoes,
          createdAt: repasse.createdAt,
        },
        proprietario: repasse.proprietario,
        flat: repasse.flat
          ? {
              numero: repasse.flat.numero,
              localNome: repasse.flat.local?.nome || "Condomínio",
            }
          : undefined,
        locatarioNome: repasse.contrato?.locatario?.nome,
      });

      const fileName = `Extrato_Repasse_${repasse.mesReferencia}.pdf`;
      const isPago = repasse.status === "PAGO";
      const caption = `Olá, *${repasse.proprietario.nome}*! 👋\n\nSegue em anexo o seu *Extrato de Repasse de Aluguel* referente ao mês *${repasse.mesReferencia}*.\n\n💰 *Valor Líquido:* R$ ${repasse.valorLiquidoRepasse.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n📊 *Situação:* ${isPago ? "✅ QUITADO" : "⏳ AGENDADO"}\n\nAtenciosamente,\n*${emp.nomeFantasia || "Administradora"}*`;

      const res = await sendWhatsAppDocument(
        {
          evolutionApiUrl: emp.evolutionApiUrl,
          evolutionApiKey: emp.evolutionApiKey,
          evolutionInstance: emp.evolutionInstance,
        },
        repasse.proprietario.telefone,
        pdfBase64,
        fileName,
        caption
      );

      if (res.success) {
        alert("✅ Extrato de repasse enviado com sucesso pelo WhatsApp!");
      } else {
        alert(`Não foi possível enviar: ${res.message || "Verifique a conexão da Evolution API"}`);
      }
    } catch (e: any) {
      console.error(e);
      alert("Erro ao disparar mensagem no WhatsApp.");
    } finally {
      setSendingWhatsId(null);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewSubmitting(true);

    try {
      const res = await fetch("/api/repasses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proprietarioId: newProprietarioId,
          flatId: newFlatId || null,
          mesReferencia: selectedMes,
          valorBrutoAluguel: newValorBruto,
          taxaAdminPercentual: newTaxaAdmin,
          valorDescontos: newDescontos,
          dataVencimento: newDataVencimento,
          observacoes: newObservacoes,
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || "Erro ao criar repasse.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNewSubmitting(false);
    }
  };

  const filteredRepasses = repasses.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.proprietario.nome.toLowerCase().includes(q) ||
      r.proprietario.cpfCnpj.includes(q) ||
      r.flat?.numero.toLowerCase().includes(q) ||
      r.flat?.local?.nome.toLowerCase().includes(q)
    );
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Repasses a Proprietários & Comissões
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extrato financeiro, retenção de taxa de administração, controle de pagamentos e envio de demonstrativos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/proprietarios"
              className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Gerenciar Proprietários</span>
            </Link>

            <button
              onClick={() => {
                setNewProprietarioId(proprietariosList[0]?.id || "");
                setNewValorBruto("");
                setNewDescontos("0");
                setNewObservacoes("");
                setShowNewModal(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs shadow-md flex items-center space-x-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Repasse</span>
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO FINANCEIRO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Bruto dos Aluguéis */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Aluguéis Brutos Recebidos
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              R$ {totais.totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {totais.quantidade} repasse(s) no mês de {selectedMes}
            </span>
          </div>

          {/* Card 2: Receita da Imobiliária (Taxa Admin Retida) */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-800/60 space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Taxa de Administração (Receita)
              </span>
              <Percent className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              R$ {totais.totalTaxaAdmin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-600/80 font-medium block">
              Lucro retido pela administração
            </span>
          </div>

          {/* Card 3: Total Líquido a Repassar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Líquido Total dos Proprietários
            </span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">
              R$ {totais.totalLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Valor líquido após descontar comissão
            </span>
          </div>

          {/* Card 4: Status dos Pagamentos */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Situação dos Repasses
            </span>
            <div className="flex items-center gap-3 pt-0.5">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                  Pago: R$ {totais.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                  Pendente: R$ {totais.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS E BUSCA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Seletor de Mês */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="month"
                value={selectedMes}
                onChange={(e) => setSelectedMes(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
              />
            </div>

            {/* Filtro de Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE">Apenas Pendentes</option>
              <option value="PAGO">Apenas Pagos</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por proprietário ou imóvel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* TABELA DE REPASSES */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-500">Carregando extrato de repasses...</div>
          ) : filteredRepasses.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 space-y-2">
              <DollarSign className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p>Nenhum repasse encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-3">Proprietário / Locador</th>
                    <th className="py-3 px-3">Imóvel & Locatário</th>
                    <th className="py-3 px-3">Aluguel Bruto</th>
                    <th className="py-3 px-3">Taxa Admin (%)</th>
                    <th className="py-3 px-3">Líquido a Repassar</th>
                    <th className="py-3 px-3">Chave PIX</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Ações & Extrato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRepasses.map((repasse) => {
                    const isPago = repasse.status === "PAGO";

                    return (
                      <tr key={repasse.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        {/* Proprietário */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {repasse.proprietario.nome}
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {repasse.proprietario.cpfCnpj} • {repasse.proprietario.telefone}
                          </span>
                        </td>

                        {/* Imóvel & Locatário */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {repasse.flat ? `Flat ${repasse.flat.numero} (${repasse.flat.local?.nome || "Condomínio"})` : "Imóvel Geral"}
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            Locatário: {repasse.contrato?.locatario?.nome || "Contrato em vigor"}
                          </span>
                        </td>

                        {/* Aluguel Bruto */}
                        <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          R$ {repasse.valorBrutoAluguel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Taxa Admin */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            - R$ {repasse.valorTaxaAdmin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-slate-400">({repasse.taxaAdminPercentual}% retido)</span>
                        </td>

                        {/* Líquido */}
                        <td className="py-3.5 px-3 font-black text-sm text-slate-900 dark:text-white">
                          R$ {repasse.valorLiquidoRepasse.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Chave PIX */}
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                          {repasse.proprietario.chavePix ? (
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                              {repasse.proprietario.chavePix}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Não informada</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isPago
                                ? "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-100 dark:bg-amber-950/60 border-amber-300 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {isPago ? "✓ QUITADO" : "⏳ PENDENTE"}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPago ? (
                              <button
                                onClick={() => handleOpenBaixa(repasse)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition"
                                title="Dar baixa no repasse ao proprietário"
                              >
                                Dar Baixa
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenBaixa(repasse)}
                                className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-semibold transition"
                                title="Editar dados da quitação"
                              >
                                Editar Baixa
                              </button>
                            )}

                            {/* Botão PDF */}
                            <button
                              onClick={() => handleDownloadPDF(repasse)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Baixar Extrato Oficial em PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Botão WhatsApp */}
                            <button
                              onClick={() => handleSendWhatsApp(repasse)}
                              disabled={sendingWhatsId === repasse.id}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition disabled:opacity-50"
                              title="Enviar Extrato via WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4 text-emerald-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL DE BAIXA / LIQUIDAÇÃO DO REPASSE */}
        {showBaixaModal && selectedRepasseForBaixa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <button
                onClick={() => setShowBaixaModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Quitar Repasse ao Proprietário</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedRepasseForBaixa.proprietario.nome} • Ref: {selectedRepasseForBaixa.mesReferencia}
                </p>
              </div>

              {/* Box com Valor Líquido e Chave PIX */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Valor Líquido a Transferir:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    R$ {selectedRepasseForBaixa.valorLiquidoRepasse.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span>Chave PIX: </span>
                  <strong className="font-mono text-slate-900 dark:text-slate-100">
                    {selectedRepasseForBaixa.proprietario.chavePix || "Não cadastrada"}
                  </strong>
                </div>
              </div>

              <form onSubmit={handleConfirmBaixa} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Data do Pagamento / Transferência
                  </label>
                  <input
                    type="date"
                    required
                    value={baixaDataPagamento}
                    onChange={(e) => setBaixaDataPagamento(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Forma de Pagamento
                  </label>
                  <select
                    value={baixaFormaPagamento}
                    onChange={(e) => setBaixaFormaPagamento(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="PIX">PIX (Transferência Instantânea)</option>
                    <option value="TED">TED / DOC Bancário</option>
                    <option value="DINHEIRO">Dinheiro em Espécie</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBaixaModal(false)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={baixaSubmitting}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                  >
                    {baixaSubmitting ? "Confirmando..." : "Confirmar Quitação"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL NOVO REPASSE MANUAL */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <button
                onClick={() => setShowNewModal(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  <span>Lançar Ordem de Repasse</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Cadastre um repasse avulso ou comissão com cálculo automático da taxa
                </p>
              </div>

              <form onSubmit={handleCreateManual} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Selecione o Proprietário *
                  </label>
                  <select
                    required
                    value={newProprietarioId}
                    onChange={(e) => {
                      setNewProprietarioId(e.target.value);
                      const prop = proprietariosList.find((p) => p.id === e.target.value);
                      if (prop?.taxaAdministracaoPadrao) {
                        setNewTaxaAdmin(String(prop.taxaAdministracaoPadrao));
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="">Selecione um proprietário...</option>
                    {proprietariosList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.cpfCnpj})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Imóvel / Flat (Opcional)
                  </label>
                  <select
                    value={newFlatId}
                    onChange={(e) => setNewFlatId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="">Selecione um flat (se aplicável)...</option>
                    {flatsList.map((f) => (
                      <option key={f.id} value={f.id}>
                        Flat {f.numero} - {f.local?.nome || "Condomínio"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Aluguel Bruto (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="2500.00"
                      value={newValorBruto}
                      onChange={(e) => setNewValorBruto(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Taxa Admin (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={newTaxaAdmin}
                      onChange={(e) => setNewTaxaAdmin(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Descontos (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newDescontos}
                      onChange={(e) => setNewDescontos(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Data de Vencimento do Repasse *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDataVencimento}
                    onChange={(e) => setNewDataVencimento(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Observações / Discriminação
                  </label>
                  <textarea
                    rows={2}
                    value={newObservacoes}
                    onChange={(e) => setNewObservacoes(e.target.value)}
                    placeholder="Ex: Desconto de R$ 50 para troca de lâmpada..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={newSubmitting}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                  >
                    {newSubmitting ? "Lançando..." : "Criar Repasse"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
