"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Zap,
  Clock,
  Building2,
  CreditCard,
  ArrowLeft,
  AlertTriangle,
  Lock,
  ArrowRight,
  Star,
  HardDrive,
  Users,
  FileCheck,
  HelpCircle,
} from "lucide-react";
import { SYSTEM_VERSION } from "@/lib/version";
import { COMMERCIAL_PLANS, SAAS_PLANS, PlanDefinition, getCommercialPlans } from "@/lib/plans/planDefinitions";
import ImobLogo from "@/components/brand/ImobLogo";

interface PlanoPixData {
  config: {
    chavePix: string;
    tipoChavePix: string;
    nomeBeneficiarioPix: string;
    cidadePix: string;
    telefoneSuporteWhatsApp: string;
  };
  planoSelecionado: {
    tipo: string;
    nome: string;
    ciclo: string;
    periodoTexto: string;
    valor: number;
    limiteImoveis: number;
    limiteUsuarios: number;
    limiteAssinaturas: number;
    limiteStorageGB: number;
  };
  pix: {
    copiaCola: string;
    qrCodeBase64: string;
    txid: string;
    cobrancaId?: string;
    linhaDigitavel?: string;
    isBancoInter?: boolean;
  };
  empresaNome: string;
}

function RenovarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const empresaIdParam = searchParams.get("empresaId") || "";
  const planoParam = (searchParams.get("plano") || searchParams.get("planoId") || "PROFISSIONAL").toUpperCase();

  const [selectedPlano, setSelectedPlano] = useState<string>(planoParam);
  const [commercialPlans, setCommercialPlans] = useState<PlanDefinition[]>(COMMERCIAL_PLANS);
  const [billingCycle, setBillingCycle] = useState<"MENSAL" | "ANUAL">("MENSAL");
  const [data, setData] = useState<PlanoPixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  const [dadosLiberacao, setDadosLiberacao] = useState<{ dataExpiracao?: string; plano?: string } | null>(null);

  // Carrega os planos e valores configurados no SaaS (incluindo planos VIP direcionados)
  useEffect(() => {
    const planoIdQuery = searchParams.get("planoId") || searchParams.get("plano") || "";
    fetch(`/api/saas/planos?planoId=${encodeURIComponent(planoIdQuery)}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.clientEligiblePlans && Array.isArray(d.clientEligiblePlans) && d.clientEligiblePlans.length > 0) {
          setCommercialPlans(d.clientEligiblePlans);
        } else if (d.commercialPlans && Array.isArray(d.commercialPlans) && d.commercialPlans.length > 0) {
          setCommercialPlans(d.commercialPlans);
        } else if (d.planos) {
          setCommercialPlans(getCommercialPlans(d.planos));
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const fetchAuthStatus = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => {
        if (d.user) {
          setUserStatus(d.user.statusAcesso);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  const carregarPlanoPix = async (plano: string, ciclo: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/saas/plano-pix?plano=${plano}&ciclo=${ciclo}&empresaId=${empresaIdParam}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (e) {
      console.error("Erro ao carregar dados do PIX:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPlanoPix(selectedPlano, billingCycle);
  }, [selectedPlano, billingCycle, empresaIdParam]);

  // Polling em tempo real a cada 3 segundos para detecção automática do pagamento via Webhook do Banco Inter
  useEffect(() => {
    if (pagamentoConfirmado) return;

    const interval = setInterval(async () => {
      try {
        const cobrancaId = data?.pix?.cobrancaId || "";
        const url = `/api/saas/status-cobranca?${cobrancaId ? `cobrancaId=${cobrancaId}&` : ""}empresaId=${empresaIdParam}`;
        const res = await fetch(url);
        const json = await res.json();

        // Só confirma se a cobrança do checkout atual foi efetivamente liquidada/paga
        if (json.pago || json.statusCobranca === "PAGO") {
          setPagamentoConfirmado(true);
          setDadosLiberacao({
            dataExpiracao: json.statusAcesso?.dataExpiracao,
            plano: json.statusAcesso?.planoAtual || selectedPlano,
          });
          clearInterval(interval);
        }
      } catch (err) {
        // Silencioso
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [data, empresaIdParam, pagamentoConfirmado, selectedPlano]);

  const handleCopyPix = () => {
    if (data?.pix?.copiaCola) {
      navigator.clipboard.writeText(data.pix.copiaCola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatPrice = (val: number) => {
    if (typeof val !== "number" || isNaN(val)) return "0,00";
    return val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const handleEnviarComprovanteWhatsApp = async () => {
    try {
      await fetch("/api/saas/confirmar-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plano: selectedPlano,
          ciclo: billingCycle,
          valor: data?.planoSelecionado?.valor || 149,
          formaPagamento: "PIX",
          empresaId: empresaIdParam || undefined,
        }),
      });
    } catch (e) {
      console.error("Aviso: Falha ao registrar notificação de pagamento:", e);
    }

    const tel = data?.config?.telefoneSuporteWhatsApp?.replace(/\D/g, "") || "5587996540551";
    const empresaNome = data?.empresaNome || "Minha Empresa";
    const planoNome = data?.planoSelecionado?.nome || `Plano ${selectedPlano}`;
    const valor = data?.planoSelecionado?.valor ? formatBRL(data.planoSelecionado.valor) : "";
    const texto = encodeURIComponent(
      `Olá, equipe IMOB / PAJO Tecnologia! 👋\n\nAcabei de realizar o pagamento do *${planoNome}* (${valor}) para o sistema *IMOB*.\n\n🏢 *Empresa:* ${empresaNome}\n🧾 *TxID PIX:* ${data?.pix?.txid || ""}\n\nEstou enviando o comprovante em anexo para ativação imediata do acesso. Obrigado!`
    );
    window.open(`https://wa.me/${tel}?text=${texto}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/dashboard" className="hover:opacity-90 transition">
            <ImobLogo size="sm" showSubtitle={true} />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Painel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:py-12 w-full space-y-8">
        {/* Top Banner Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Escala sob medida para sua operação</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Escolha o plano ideal para a sua gestão
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Você não paga para desbloquear o sistema — você paga conforme sua operação cresce. Todos os planos contam com a plataforma completa e sem travas artificiais.
          </p>

          {/* Toggle Mensal / Anual */}
          <div className="flex justify-center items-center gap-3 pt-4">
            <span className={`text-xs font-bold ${billingCycle === "MENSAL" ? "text-white" : "text-slate-500"}`}>
              Cobrança Mensal
            </span>

            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === "MENSAL" ? "ANUAL" : "MENSAL")}
              className="relative w-14 h-7 bg-slate-800 border border-slate-700 rounded-full p-1 transition-colors focus:outline-none"
            >
              <div
                className={`w-5 h-5 rounded-full bg-emerald-400 transition-transform duration-200 transform ${
                  billingCycle === "ANUAL" ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>

            <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "ANUAL" ? "text-emerald-400" : "text-slate-500"}`}>
              <span>Cobrança Anual</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                Economize até 20%
              </span>
            </span>
          </div>
        </div>

        {/* Grid de Cards de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
          {commercialPlans.map((plano) => {
            const isSelected = selectedPlano === plano.slug;
            const price = billingCycle === "ANUAL" ? plano.priceYearlyMonthlyEquivalent : plano.priceMonthly;

            return (
              <div
                key={plano.id}
                onClick={() => setSelectedPlano(plano.slug)}
                className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between border ${
                  isSelected
                    ? "bg-slate-900/95 border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-[1.02] ring-2 ring-emerald-500/40"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                {plano.visivelPublico === false ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>👑 Exclusivo para sua Empresa</span>
                  </div>
                ) : plano.popular ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    Mais Escolhido
                  </div>
                ) : plano.badge ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-md">
                    {plano.badge}
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-black text-white tracking-tight">{plano.name}</h2>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-emerald-500 bg-emerald-500 text-slate-950" : "border-slate-700"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 min-h-[32px] leading-relaxed mb-4">
                    {plano.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">R$ {formatPrice(price)}</span>
                      <span className="text-xs text-slate-400">/mês</span>
                    </div>
                    {billingCycle === "ANUAL" && (
                      <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                        Faturado R$ {formatPrice(plano.priceYearlyTotal)}/ano
                      </span>
                    )}
                  </div>

                  {/* Limites Chave */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 mb-5 text-xs">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        Até <strong>{plano.limits.maxProperties} imóveis</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        Até <strong>{plano.limits.maxUsers} usuário(s)</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        <strong>{plano.limits.maxSignaturesPerMonth} assinaturas</strong>/mês
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        <strong>{plano.limits.maxStorageGB} GB</strong> de armazenamento
                      </span>
                    </div>
                  </div>

                  {/* Recursos Incluídos */}
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Reservas & Agenda por diária</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Vistorias fotográficas com câmera</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Envio de PDFs no WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Financeiro & Bolepix Inter</span>
                    </div>
                    {plano.features.gestaoProprietarios && (
                      <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Gestão de Proprietários & Repasses</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className={`w-full mt-6 py-2.5 rounded-xl font-bold text-xs transition ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {isSelected ? "Plano Selecionado" : "Selecionar Plano"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Card Enterprise */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black border border-blue-500/20 uppercase tracking-wider">
              Grande Porte
            </span>
            <h3 className="text-xl font-black text-white">Possui mais de 60 imóveis?</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Criamos uma proposta personalizada para sua rede imobiliária ou administradora de grande porte com múltiplos condomínios, SLA dedicado e integrações customizadas.
            </p>
          </div>

          <a
            href="https://wa.me/5587996540551?text=Ol%C3%A1!%20Gostaria%20de%20uma%20proposta%20personalizada%20do%20Plano%20Enterprise%20do%20IMOB%20(60%2B%20im%C3%B3veis)."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-slate-200 transition shadow-lg shrink-0 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Falar com Consultor Enterprise</span>
          </a>
        </div>

        {/* SEÇÃO DE CHECKOUT PIX INSTANTÂNEO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {pagamentoConfirmado ? (
            <div className="py-12 px-4 text-center space-y-5 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30 uppercase tracking-wider">
                  ✅ Pagamento Confirmado pelo Banco Inter!
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Seu Acesso foi Liberado com Sucesso!
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Identificamos o seu pagamento via Pix no Banco Inter. Todos os recursos do{" "}
                  <strong className="text-emerald-400">Plano {dadosLiberacao?.plano || selectedPlano}</strong>{" "}
                  já estão liberados.
                </p>
                {dadosLiberacao?.dataExpiracao && (
                  <p className="text-xs text-slate-400">
                    Acesso válido até:{" "}
                    <strong className="text-white">
                      {new Date(dadosLiberacao.dataExpiracao).toLocaleDateString("pt-BR")}
                    </strong>
                  </p>
                )}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition flex items-center gap-2"
                >
                  <span>Acessar o Painel Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <span className="text-[11px] text-slate-500 block">
                Redirecionando automaticamente em instantes...
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      Etapa de Pagamento Instantâneo
                    </span>
                    {data?.pix?.isBancoInter && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Banco Inter Oficial
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Ativação Imediata via PIX Oficial
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pague pelo QR Code abaixo para liberar seu acesso instantaneamente.
                  </p>
                </div>

                {data && (
                  <div className="text-left sm:text-right bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Total do Pedido:</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {formatBRL(data.planoSelecionado.valor)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {data.planoSelecionado.nome}
                    </span>
                  </div>
                )}
              </div>

              {/* Status de Escuta em Tempo Real */}
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-400 font-semibold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>Aguardando pagamento Pix (Identificação e baixa automática em tempo real)</span>
                </div>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  Verificação a cada 3s
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Gerando cobrança PIX oficial no Banco Inter para {selectedPlano}...
                </div>
              ) : data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Lado Esquerdo: QR Code */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                    {data.pix.qrCodeBase64 ? (
                      <div className="bg-white p-3.5 rounded-2xl shadow-lg">
                        <img
                          src={data.pix.qrCodeBase64}
                          alt="QR Code PIX"
                          className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-slate-800 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                        QR Code Indisponível
                      </div>
                    )}

                    <div className="text-center">
                      <span className="text-xs font-bold text-white block">
                        Beneficiário: {data.config.nomeBeneficiarioPix}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {data.pix.isBancoInter
                          ? "Pix Cobrança Oficial Banco Inter • Baixa Automática"
                          : `Chave: ${data.config.chavePix} (${data.config.tipoChavePix})`}
                      </span>
                    </div>
                  </div>

                  {/* Lado Direito: Copia e Cola & Confirmação */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        PIX Copia e Cola
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={data.pix.copiaCola}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 font-mono focus:outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md transition"
                        >
                          {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                          <span>{copied ? "Copiado!" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>

                    {data.pix.linhaDigitavel && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          Linha Digitável do Bolepix (Opcional)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={data.pix.linhaDigitavel}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono focus:outline-none select-all"
                        />
                      </div>
                    )}

                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Liberação Instantânea & Sem Perda de Dados</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Assim que o pagamento for realizado no seu aplicativo bancário, nosso sistema reconhece a baixa via Webhook e libera seu acesso automaticamente em até 5 segundos.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleEnviarComprovanteWhatsApp}
                        className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Notificar Suporte / Enviar Comprovante via WhatsApp</span>
                      </button>
                      <span className="text-[10px] text-slate-500 text-center block mt-2">
                        Suporte e Atendimento: {data.config.telefoneSuporteWhatsApp}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <ImobLogo size="sm" showSubtitle={true} />
          <span>© 2026 IMOB by PAJO Tecnologia • Versão {SYSTEM_VERSION}</span>
        </div>
      </footer>
    </div>
  );
}

export default function RenovarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">Carregando planos...</div>}>
      <RenovarContent />
    </Suspense>
  );
}
