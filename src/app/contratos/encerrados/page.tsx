"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Shell from "@/components/layout/Shell";
import GridMeses from "@/components/contratos/GridMeses";
import { FileText, CheckCircle2, Search, ArrowLeft, Calendar, Building2, User, ShieldCheck } from "lucide-react";

export default function ContratosEncerradosPage() {
  const [contratos, setContratos] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [resContratos, resMe] = await Promise.all([
        fetch("/api/contratos").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);

      setContratos(resContratos.contratos || []);
      if (resMe.user?.empresa) setEmpresaData(resMe.user.empresa);
    } catch (err) {
      console.error("Erro ao carregar contratos encerrados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const contratosAtivosCount = contratos.filter((c) => c.status !== "FINALIZADO").length;
  const contratosEncerrados = contratos.filter((c) => c.status === "FINALIZADO");

  // Filtro de busca
  const contratosFiltrados = contratosEncerrados.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const locatarioNome = c.locatario?.nome?.toLowerCase() || "";
    const locatarioCpf = c.locatario?.cpf?.toLowerCase() || "";
    const flatNumero = c.flat?.numero?.toLowerCase() || "";
    const localNome = c.flat?.local?.nome?.toLowerCase() || "";

    return (
      locatarioNome.includes(term) ||
      locatarioCpf.includes(term) ||
      flatNumero.includes(term) ||
      localNome.includes(term)
    );
  });

  return (
    <Shell>
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Contratos Encerrados (Histórico & Arquivo)
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Arquivo permanente e histórico de auditoria de todos os contratos finalizados e desocupados.
            </p>
          </div>

          <Link
            href="/contratos"
            className="w-full sm:w-auto min-h-[40px] py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Contratos Ativos</span>
          </Link>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Link
            href="/contratos"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Contratos Ativos</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
              {contratosAtivosCount}
            </span>
          </Link>

          <Link
            href="/contratos/encerrados"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Contratos Encerrados</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black">
              {contratosEncerrados.length}
            </span>
          </Link>
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por locatário, CPF ou flat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Exibindo <strong>{contratosFiltrados.length}</strong> de <strong>{contratosEncerrados.length}</strong> contrato(s) arquivado(s)</span>
          </div>
        </div>

        {/* Listagem de Contratos Encerrados */}
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500 dark:text-slate-400">
            Carregando histórico de contratos encerrados...
          </div>
        ) : contratosFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
              {searchTerm ? "Nenhum contrato encontrado para esta pesquisa." : "Nenhum contrato encerrado até o momento."}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Quando um contrato ativo for finalizado com a desocupação do flat, ele será transferido automaticamente para este histórico com todos os recibos, vistorias e laudos preservados.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {contratosFiltrados.map((contrato) => (
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
                locatarioNome={contrato.locatario?.nome}
                locatarioCpf={contrato.locatario?.cpf}
                locatarioTelefone={contrato.locatario?.telefone}
                flatNumero={`${contrato.flat?.local?.nome || "Condomínio"} - ${contrato.flat?.numero}`}
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
      </div>
    </Shell>
  );
}
