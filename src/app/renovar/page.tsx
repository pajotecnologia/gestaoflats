"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { SYSTEM_VERSION } from "@/lib/version";

interface PlanoPixData {
  config: {
    chavePix: string;
    tipoChavePix: string;
    nomeBeneficiarioPix: string;
    cidadePix: string;
    telefoneSuporteWhatsApp: string;
    valores: {
      MENSAL: number;
      TRIMESTRAL: number;
      SEMESTRAL: number;
      ANUAL: number;
    };
  };
  planoSelecionado: {
    tipo: string;
    nome: string;
    periodoTexto: string;
    valor: number;
  };
  pix: {
    copiaCola: string;
    qrCodeBase64: string;
    txid: string;
  };
  empresaNome: string;
}

function RenovarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const empresaIdParam = searchParams.get("empresaId") || "";

  const [selectedPlano, setSelectedPlano] = useState<"MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL">("MENSAL");
  const [data, setData] = useState<PlanoPixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userStatus, setUserStatus] = useState<any>(null);

  useEffect(() => {
    // Carregar status do usuário logado se houver
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => {
        if (d.user) {
          setUserStatus(d.user.statusAcesso);
        }
      })
      .catch(() => {});
  }, []);

  const carregarPlanoPix = async (plano: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/saas/plano-pix?plano=${plano}&empresaId=${empresaIdParam}`);
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
    carregarPlanoPix(selectedPlano);
  }, [selectedPlano, empresaIdParam]);

  const handleCopyPix = () => {
    if (data?.pix?.copiaCola) {
      navigator.clipboard.writeText(data.pix.copiaCola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const handleEnviarComprovanteWhatsApp = async () => {
    // 1. Notifica o Super Admin por E-mail no sistema
    try {
      await fetch("/api/saas/confirmar-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plano: selectedPlano,
          valor: data?.planoSelecionado?.valor || 97,
          formaPagamento: "PIX",
          empresaId: empresaIdParam || undefined,
        }),
      });
    } catch (e) {
      console.error("Aviso: Falha ao registrar notificação de pagamento:", e);
    }

    // 2. Abre a conversa no WhatsApp para enviar o comprovante
    const tel = data?.config?.telefoneSuporteWhatsApp?.replace(/\D/g, "") || "5587996540551";
    const empresaNome = data?.empresaNome || "Minha Empresa";
    const planoNome = data?.planoSelecionado?.nome || "Plano Gestão de Flats";
    const valor = data?.planoSelecionado?.valor ? formatBRL(data.planoSelecionado.valor) : "";
    const texto = encodeURIComponent(
      `Olá, suporte! 👋\n\nAcabei de realizar o pagamento do *${planoNome}* (${valor}) para o sistema *Gestão de Flats*.\n\n🏢 *Empresa:* ${empresaNome}\n🧾 *TxID PIX:* ${data?.pix?.txid || ""}\n\nEstou enviando o comprovante em anexo para liberação/renovação do acesso. Obrigado!`
    );
    window.open(`https://wa.me/${tel}?text=${texto}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
              GF
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-2">
                Gestão de Flats <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">SaaS</span>
              </h1>
              <p className="text-xs text-slate-400">Assinatura & Renovação de Acesso</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Ir para o Painel
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Banner de Status */}
        {userStatus?.isExpirado ? (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-sm">Seu período de acesso ao sistema expirou.</p>
              <p className="text-xs text-amber-200/80">
                Selecione um dos planos abaixo e efetue o pagamento via PIX para reativar seu acesso e manter todos os seus dados e contratos sincronizados.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Planos Flexíveis sem Fidelidade
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Escolha seu Plano e Renove seu Acesso
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl mx-auto">
              Contratos digitais ilimitados, laudos com fotos na câmera, envio de cobranças e recibos no WhatsApp.
            </p>
          </div>
        )}

        {/* Grid de Seleção de Planos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Mensal */}
          <div
            onClick={() => setSelectedPlano("MENSAL")}
            className={`cursor-pointer rounded-2xl p-5 border transition duration-200 relative flex flex-col justify-between ${
              selectedPlano === "MENSAL"
                ? "bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30"
                : "bg-slate-800/60 border-slate-700/80 hover:border-slate-600"
            }`}
          >
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mensal</span>
              <h3 className="text-lg font-bold text-white mt-1">Plano Mensal</h3>
              <p className="text-xs text-slate-400 mt-1">Flexibilidade mês a mês</p>
              <div className="mt-4">
                <span className="text-2xl font-black text-white">
                  {data?.config?.valores?.MENSAL ? formatBRL(data.config.valores.MENSAL) : "R$ 97,00"}
                </span>
                <span className="text-xs text-slate-400">/mês</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Acesso total
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> WhatsApp Ilimitado
              </div>
            </div>
          </div>

          {/* Trimestral */}
          <div
            onClick={() => setSelectedPlano("TRIMESTRAL")}
            className={`cursor-pointer rounded-2xl p-5 border transition duration-200 relative flex flex-col justify-between ${
              selectedPlano === "TRIMESTRAL"
                ? "bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30"
                : "bg-slate-800/60 border-slate-700/80 hover:border-slate-600"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trimestral</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  Economize 10%
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">3 Meses</h3>
              <p className="text-xs text-slate-400 mt-1">Pagamento a cada 3 meses</p>
              <div className="mt-4">
                <span className="text-2xl font-black text-white">
                  {data?.config?.valores?.TRIMESTRAL ? formatBRL(data.config.valores.TRIMESTRAL) : "R$ 260,00"}
                </span>
                <span className="text-xs text-slate-400">/trimestre</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 3 meses garantidos
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Suporte Prioritário
              </div>
            </div>
          </div>

          {/* Semestral */}
          <div
            onClick={() => setSelectedPlano("SEMESTRAL")}
            className={`cursor-pointer rounded-2xl p-5 border transition duration-200 relative flex flex-col justify-between ${
              selectedPlano === "SEMESTRAL"
                ? "bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30"
                : "bg-slate-800/60 border-slate-700/80 hover:border-slate-600"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semestral</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  Economize 15%
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">6 Meses</h3>
              <p className="text-xs text-slate-400 mt-1">6 meses de tranquilidade</p>
              <div className="mt-4">
                <span className="text-2xl font-black text-white">
                  {data?.config?.valores?.SEMESTRAL ? formatBRL(data.config.valores.SEMESTRAL) : "R$ 490,00"}
                </span>
                <span className="text-xs text-slate-400">/semestre</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 6 meses de acesso
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Backup Nuvem Automático
              </div>
            </div>
          </div>

          {/* Anual */}
          <div
            onClick={() => setSelectedPlano("ANUAL")}
            className={`cursor-pointer rounded-2xl p-5 border transition duration-200 relative flex flex-col justify-between ${
              selectedPlano === "ANUAL"
                ? "bg-gradient-to-b from-blue-950/60 to-slate-900 border-blue-400 shadow-xl shadow-blue-500/20 ring-2 ring-blue-400"
                : "bg-slate-800/60 border-slate-700/80 hover:border-slate-600"
            }`}
          >
            <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow">
              ★ Mais Popular
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Anual</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  Economize 25%
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">12 Meses</h3>
              <p className="text-xs text-slate-400 mt-1">1 ano inteiro liberado</p>
              <div className="mt-4">
                <span className="text-2xl font-black text-amber-400">
                  {data?.config?.valores?.ANUAL ? formatBRL(data.config.valores.ANUAL) : "R$ 890,00"}
                </span>
                <span className="text-xs text-slate-400">/ano</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> 12 meses de acesso VIP
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Suporte Direto WhatsApp
              </div>
            </div>
          </div>
        </div>

        {/* Card de Pagamento PIX */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* QR Code */}
            <div className="flex flex-col items-center shrink-0">
              <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200">
                {data?.pix?.qrCodeBase64 ? (
                  <img
                    src={data.pix.qrCodeBase64}
                    alt="QR Code PIX"
                    className="w-48 h-48 md:w-56 md:h-56 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 md:w-56 md:h-56 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-semibold">
                    Carregando QR Code...
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Aponte a câmera do app do banco
              </span>
            </div>

            {/* Informações do Pagamento & Copia e Cola */}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
                <div>
                  <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                    Pagamento Instantâneo via PIX
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {data?.planoSelecionado?.nome}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Valor a pagar:</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {data?.planoSelecionado?.valor ? formatBRL(data.planoSelecionado.valor) : ""}
                  </span>
                </div>
              </div>

              {/* Detalhes do Beneficiário */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block">Beneficiário:</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {data?.config?.nomeBeneficiarioPix || "PAJO TECNOLOGIA"}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block">Chave PIX:</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {data?.config?.chavePix || "contato@pajotech.com.br"}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block">Identificador (TxID):</span>
                  <span className="font-mono font-semibold text-blue-400 truncate block">
                    {data?.pix?.txid || "SAAS001"}
                  </span>
                </div>
              </div>

              {/* PIX Copia e Cola Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Código PIX Copia e Cola:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={data?.pix?.copiaCola || "Gerando payload PIX..."}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 flex-1 select-all focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleCopyPix}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copiar Código
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ação de Envio de Comprovante */}
              <div className="mt-6 pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" /> Liberação rápida após envio do comprovante.
                </div>

                <button
                  onClick={handleEnviarComprovanteWhatsApp}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition hover:scale-105 active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" /> Enviar Comprovante no WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-400">
        <p>Gestão de Flats SaaS — {SYSTEM_VERSION} | Desenvolvimento: pajotecnologia.com.br (87) 99654-0551</p>
      </footer>
    </div>
  );
}

export default function RenovarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>}>
      <RenovarContent />
    </Suspense>
  );
}
