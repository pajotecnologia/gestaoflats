"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "@/components/layout/Shell";
import SignaturePad from "@/components/common/SignaturePad";
import { formatCNPJ, formatPhone } from "@/lib/validation";
import {
  Settings,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  PenTool,
  Check,
  Upload,
  RefreshCw,
  Send,
  MessageSquare,
  UserCheck,
  Users,
  Plus,
  Edit3,
  X,
  ShieldCheck,
  CreditCard,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Clock,
  Sparkles,
  Unlock,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Layers,
  Activity,
  Eye,
  EyeOff,
  HardDrive,
  Lock,
  Globe,
  Copy,
  ExternalLink,
  PieChart,
  Info,
  QrCode,
  Power,
  RotateCcw,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Server,
} from "lucide-react";
import { toast, ConfirmDialog } from "@/components/ui";

function ParametrosContent() {
  const searchParams = useSearchParams();
  const abaParam = searchParams.get("aba");
  const [activeTab, setActiveTab] = useState<"empresa" | "evolution" | "email" | "funcionarios" | "formas" | "saas" | "inter">("empresa");
  const [empresa, setEmpresa] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "danger";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const openConfirm = (opts: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "danger";
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      ...opts,
    });
  };

  // Sync tab reativamente do parâmetro URL ?aba=
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          const superAdmin = Boolean(data.user.isSuperAdmin);
          setIsSuperAdmin(superAdmin);
          if (abaParam && ["empresa", "evolution", "email", "funcionarios", "formas", "saas", "inter"].includes(abaParam)) {
            if (abaParam === "saas" && !superAdmin) {
              setActiveTab("empresa");
            } else {
              setActiveTab(abaParam as any);
            }
          }
        }
      })
      .catch(() => {
        if (abaParam && ["empresa", "evolution", "email", "funcionarios", "formas", "inter"].includes(abaParam)) {
          setActiveTab(abaParam as any);
        }
      });
  }, [abaParam]);

  // Form Empresa
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [emailEmpresa, setEmailEmpresa] = useState("");
  const [telefoneEmpresa, setTelefoneEmpresa] = useState("");
  const [enderecoEmpresa, setEnderecoEmpresa] = useState("");
  const [bairroEmpresa, setBairroEmpresa] = useState("");
  const [cidadeEmpresa, setCidadeEmpresa] = useState("");
  const [estadoEmpresa, setEstadoEmpresa] = useState("");
  const [cepEmpresa, setCepEmpresa] = useState("");
  const [logomarcaUrl, setLogomarcaUrl] = useState("");
  const [assinaturaUrl, setAssinaturaUrl] = useState("");
  const [chavePixEmpresa, setChavePixEmpresa] = useState("");
  const [tipoChavePixEmpresa, setTipoChavePixEmpresa] = useState("CNPJ");
  const [nomeBeneficiarioPixEmpresa, setNomeBeneficiarioPixEmpresa] = useState("");
  const [cidadePixEmpresa, setCidadePixEmpresa] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  // Formas de Pagamento
  const [formas, setFormas] = useState<any[]>([]);
  const [loadingFormas, setLoadingFormas] = useState(false);
  const [showFormaModal, setShowFormaModal] = useState(false);
  const [editingForma, setEditingForma] = useState<any>(null);
  const [formaNome, setFormaNome] = useState("");
  const [formaAtivo, setFormaAtivo] = useState(true);
  const [submittingForma, setSubmittingForma] = useState(false);

  // Form Evolution API (WhatsApp)
  const [evolutionApiUrl, setEvolutionApiUrl] = useState("");
  const [evolutionApiKey, setEvolutionApiKey] = useState("");
  const [evolutionInstance, setEvolutionInstance] = useState("");
  const [statusConexao, setStatusConexao] = useState("DESCONECTADO");
  const [testingEvolution, setTestingEvolution] = useState(false);
  const [savingEvolution, setSavingEvolution] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [loadingQrCode, setLoadingQrCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ base64?: string; pairingCode?: string; code?: string; message?: string; count?: number } | null>(null);
  const [loggingOutEvolution, setLoggingOutEvolution] = useState(false);
  const [restartingEvolution, setRestartingEvolution] = useState(false);
  const [testWhatsAppNumber, setTestWhatsAppNumber] = useState("");
  const [sendingTestWhatsApp, setSendingTestWhatsApp] = useState(false);
  const [qrScanSuccess, setQrScanSuccess] = useState(false);
  const [showEvolutionApiKey, setShowEvolutionApiKey] = useState(false);
  const [showAdvancedEvolution, setShowAdvancedEvolution] = useState(false);

  // Form SMTP Gmail / Email Server
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [savingSmtp, setSavingSmtp] = useState(false);

  // Form Banco Inter (Boleto com Pix / Bolepix API v3)
  const [bancoInterClientId, setBancoInterClientId] = useState("");
  const [bancoInterClientSecret, setBancoInterClientSecret] = useState("");
  const [bancoInterCertCrt, setBancoInterCertCrt] = useState("");
  const [bancoInterCertKey, setBancoInterCertKey] = useState("");
  const [bancoInterHasCertCrt, setBancoInterHasCertCrt] = useState(false);
  const [bancoInterHasCertKey, setBancoInterHasCertKey] = useState(false);
  const [bancoInterContaCorrente, setBancoInterContaCorrente] = useState("");
  const [bancoInterAmbiente, setBancoInterAmbiente] = useState<"PRODUCAO" | "SANDBOX">("PRODUCAO");
  const [bancoInterChavePix, setBancoInterChavePix] = useState("");
  const [bancoInterAtivo, setBancoInterAtivo] = useState(false);
  const [bancoInterWebhookUrl, setBancoInterWebhookUrl] = useState("");
  const [savingInter, setSavingInter] = useState(false);
  const [testingInter, setTestingInter] = useState(false);
  const [registeringWebhookInter, setRegisteringWebhookInter] = useState(false);
  const [showInterSecret, setShowInterSecret] = useState(false);
  const [testInterResult, setTestInterResult] = useState<{ success: boolean; message: string } | null>(null);

  // Gestão de Funcionários
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);
  const [showFuncModal, setShowFuncModal] = useState(false);
  const [editingFunc, setEditingFunc] = useState<any>(null);
  const [nomeFunc, setNomeFunc] = useState("");
  const [emailFunc, setEmailFunc] = useState("");
  const [senhaFunc, setSenhaFunc] = useState("");
  const [cargoFunc, setCargoFunc] = useState("OPERADOR");
  const [statusFunc, setStatusFunc] = useState("ATIVO");
  const [assinaturaFunc, setAssinaturaFunc] = useState("");
  const [submittingFunc, setSubmittingFunc] = useState(false);
  const [errorFunc, setErrorFunc] = useState("");

  const [testEmailDestino, setTestEmailDestino] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Estados do SaaS & Assinaturas
  const [saasSubTab, setSaasSubTab] = useState<"empresas" | "planos" | "config">("empresas");
  const [saasDiasTrial, setSaasDiasTrial] = useState(7);
  const [saasChavePix, setSaasChavePix] = useState("contato@pajotech.com.br");
  const [saasTipoPix, setSaasTipoPix] = useState("EMAIL");
  const [saasNomePix, setSaasNomePix] = useState("PAJO TECNOLOGIA");
  const [saasCidadePix, setSaasCidadePix] = useState("RECIFE");
  const [saasValorMensal, setSaasValorMensal] = useState(97);
  const [saasValorTrimestral, setSaasValorTrimestral] = useState(260);
  const [saasValorSemestral, setSaasValorSemestral] = useState(490);
  const [saasValorAnual, setSaasValorAnual] = useState(890);
  const [saasDiasAviso, setSaasDiasAviso] = useState(3);
  const [saasTelSuporte, setSaasTelSuporte] = useState("(87) 99654-0551");
  const [saasEmailAdmin, setSaasEmailAdmin] = useState("pajotecnologia@gmail.com");
  const [saasMsgAviso, setSaasMsgAviso] = useState("");
  const [savingSaasConfig, setSavingSaasConfig] = useState(false);

  // Gestão Dinâmica dos Planos SaaS (Limites e Preços)
  const [saasPlanos, setSaasPlanos] = useState<Record<string, any>>({});
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [salvandoPlanos, setSalvandoPlanos] = useState(false);
  const [hasCustomPlanos, setHasCustomPlanos] = useState(false);

  // Modal de Criação / Edição de Plano Personalizado
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanSlug, setEditingPlanSlug] = useState<string | null>(null);
  const [savingCustomPlan, setSavingCustomPlan] = useState(false);
  const [planFormData, setPlanFormData] = useState<any>({
    name: "",
    slug: "",
    badge: "",
    description: "",
    idealPara: "",
    popular: false,
    visivelPublico: true,
    empresasAutorizadasIds: [],
    priceMonthly: 99,
    priceQuarterly: 270,
    priceSemiannual: 510,
    priceYearlyMonthlyEquivalent: 79,
    priceYearlyTotal: 948,
    limits: {
      maxProperties: 10,
      maxUsers: 2,
      maxSignaturesPerMonth: 10,
      maxStorageGB: 5,
      maxWhatsAppMessagesPerMonth: 300,
      maxOwners: 2,
    },
    features: {
      boletosInterBolepix: true,
      vistoriasComFotos: true,
      gestaoProprietarios: false,
      repassesAutomaticos: false,
      suporteNivel: "PADRAO",
    },
  });

  // Modal de Detalhes de Armazenamento por Empresa
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageModalEmpresa, setStorageModalEmpresa] = useState<any>(null);

  // Gestão de Empresas
  const [empresasSaaS, setEmpresasSaaS] = useState<any[]>([]);
  const [summarySaaS, setSummarySaaS] = useState<any>(null);
  const [loadingEmpresasSaaS, setLoadingEmpresasSaaS] = useState(false);
  const [searchTermEmpresa, setSearchTermEmpresa] = useState("");
  const [statusFilterEmpresa, setStatusFilterEmpresa] = useState("TODOS");
  const [showLiberarModal, setShowLiberarModal] = useState(false);
  const [empresaLiberar, setEmpresaLiberar] = useState<any>(null);
  const [liberarTipo, setLiberarTipo] = useState<"MESES" | "DIAS" | "CUSTOM" | "MANTER">("MESES");
  const [liberarQtd, setLiberarQtd] = useState(1);
  const [liberarPlano, setLiberarPlano] = useState("PROFISSIONAL");
  const [liberarStatus, setLiberarStatus] = useState("ATIVO");
  const [liberarDataCustom, setLiberarDataCustom] = useState("");
  const [submittingLiberar, setSubmittingLiberar] = useState(false);
  const [disparandoAvisos, setDisparandoAvisos] = useState(false);

  const [savingAll, setSavingAll] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const carregarPlanosSaaS = async () => {
    setLoadingPlanos(true);
    try {
      const res = await fetch("/api/saas/planos");
      const data = await res.json();
      if (res.ok && data.planos) {
        setSaasPlanos(data.planos);
        setHasCustomPlanos(data.hasCustomConfig);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlanos(false);
    }
  };

  const handleOpenNewPlan = () => {
    setEditingPlanSlug(null);
    setPlanFormData({
      name: "Plano Sob Medida",
      slug: `CUSTOM_${Date.now().toString().slice(-4)}`,
      badge: "EXCLUSIVO",
      description: "Plano personalizado com limites e condições especiais.",
      idealPara: "Clientes com necessidades e volume sob medida.",
      popular: false,
      visivelPublico: false,
      empresasAutorizadasIds: [],
      priceMonthly: 199,
      priceQuarterly: 540,
      priceSemiannual: 990,
      priceYearlyMonthlyEquivalent: 159,
      priceYearlyTotal: 1908,
      limits: {
        maxProperties: 25,
        maxUsers: 5,
        maxSignaturesPerMonth: 40,
        maxStorageGB: 15,
        maxWhatsAppMessagesPerMonth: 1000,
        maxOwners: 10,
      },
      features: {
        boletosInterBolepix: true,
        vistoriasComFotos: true,
        gestaoProprietarios: true,
        repassesAutomaticos: true,
        suporteNivel: "PRIORITARIO",
      },
    });
    setShowPlanModal(true);
  };

  const handleOpenEditPlan = (slug: string) => {
    const p = saasPlanos[slug];
    if (!p) return;
    setEditingPlanSlug(slug);
    setPlanFormData({
      ...p,
      slug: p.slug || slug,
      name: p.name || slug,
      badge: p.badge || "",
      description: p.description || "",
      idealPara: p.idealPara || "",
      popular: Boolean(p.popular),
      visivelPublico: p.visivelPublico !== false,
      empresasAutorizadasIds: p.empresasAutorizadasIds || [],
      priceMonthly: p.priceMonthly ?? 0,
      priceQuarterly: p.priceQuarterly ?? 0,
      priceSemiannual: p.priceSemiannual ?? 0,
      priceYearlyMonthlyEquivalent: p.priceYearlyMonthlyEquivalent ?? 0,
      priceYearlyTotal: p.priceYearlyTotal ?? 0,
      limits: {
        maxProperties: p.limits?.maxProperties ?? 10,
        maxUsers: p.limits?.maxUsers ?? 2,
        maxSignaturesPerMonth: p.limits?.maxSignaturesPerMonth ?? 10,
        maxStorageGB: p.limits?.maxStorageGB ?? 5,
        maxWhatsAppMessagesPerMonth: p.limits?.maxWhatsAppMessagesPerMonth ?? 300,
        maxOwners: p.limits?.maxOwners ?? 2,
      },
      features: {
        boletosInterBolepix: p.features?.boletosInterBolepix !== false,
        vistoriasComFotos: p.features?.vistoriasComFotos !== false,
        gestaoProprietarios: Boolean(p.features?.gestaoProprietarios),
        repassesAutomaticos: Boolean(p.features?.repassesAutomaticos),
        suporteNivel: p.features?.suporteNivel || "PADRAO",
      },
    });
    setShowPlanModal(true);
  };

  const handleSaveCustomPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCustomPlan(true);
    try {
      const res = await fetch("/api/saas/planos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_plano",
          plano: planFormData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Plano salvo com sucesso!");
        setShowPlanModal(false);
        carregarPlanosSaaS();
      } else {
        toast.error(data.error || "Erro ao salvar plano.");
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setSavingCustomPlan(false);
    }
  };

  const handleDeleteCustomPlan = (slug: string) => {
    openConfirm({
      title: "Excluir Plano Personalizado",
      description: `Tem certeza que deseja excluir o plano personalizado "${slug}"?`,
      confirmText: "Excluir",
      variant: "danger",
      onConfirm: async () => {
        setSalvandoPlanos(true);
        try {
          const res = await fetch("/api/saas/planos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete_plano",
              slug,
              planoId: slug,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            toast.success("Plano personalizado excluído!");
            carregarPlanosSaaS();
          } else {
            toast.error(data.error || "Erro ao excluir plano.");
          }
        } catch (err: any) {
          toast.error(`Erro: ${err.message}`);
        } finally {
          setSalvandoPlanos(false);
        }
      },
    });
  };

  const handleCopyVipLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const vipUrl = `${origin}/renovar?planoId=${slug}`;
    navigator.clipboard.writeText(vipUrl);
    toast.success("Link VIP Direto copiado para a área de transferência!");
  };

  const handleSalvarPlanosSaaS = async () => {
    setSalvandoPlanos(true);
    try {
      const res = await fetch("/api/saas/planos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planos: saasPlanos }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = { error: `Resposta inválida do servidor (HTTP ${res.status})` };
      }

      if (res.ok && data.success) {
        toast.success("Limites e preços dos planos salvos com sucesso no sistema!");
        setHasCustomPlanos(true);
        setFeedback({ type: "success", message: "✅ Limites e preços dos planos salvos com sucesso!" });
      } else {
        toast.error(data.error || `Erro ao salvar planos (HTTP ${res.status}).`);
        setFeedback({ type: "error", message: `❌ ${data.error || "Erro ao salvar planos."}` });
      }
    } catch (err: any) {
      toast.error(`Erro de rede ao conectar com o servidor: ${err?.message || err}`);
      setFeedback({ type: "error", message: `❌ Erro de rede: ${err?.message || err}` });
    } finally {
      setSalvandoPlanos(false);
    }
  };

  const handleRestaurarPlanosPadrao = () => {
    openConfirm({
      title: "Restaurar Planos Padrão",
      description: "Deseja restaurar as configurações padrão de fábrica para todos os planos SaaS?",
      confirmText: "Restaurar Padrão",
      variant: "danger",
      onConfirm: async () => {
        setSalvandoPlanos(true);
        try {
          const res = await fetch("/api/saas/planos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reset" }),
          });
          let data: any = {};
          try {
            data = await res.json();
          } catch (jsonErr) {
            data = { error: `Resposta inválida do servidor (HTTP ${res.status})` };
          }

          if (res.ok && data.planos) {
            toast.success("Planos restaurados para a configuração padrão de fábrica!");
            setSaasPlanos(data.planos);
            setHasCustomPlanos(false);
            setFeedback({ type: "success", message: "✅ Planos restaurados para os padrões de fábrica!" });
          } else {
            toast.error(data.error || `Erro ao restaurar planos (HTTP ${res.status}).`);
            setFeedback({ type: "error", message: `❌ ${data.error || "Erro ao restaurar."}` });
          }
        } catch (err: any) {
          toast.error(`Erro de rede ao conectar com o servidor: ${err?.message || err}`);
          setFeedback({ type: "error", message: `❌ Erro de rede: ${err?.message || err}` });
        } finally {
          setSalvandoPlanos(false);
        }
      },
    });
  };

  const loadSaasConfig = async () => {
    try {
      const res = await fetch("/api/saas/config");
      const data = await res.json();
      if (data.config) {
        setSaasDiasTrial(data.config.diasTrialPadrao ?? 7);
        setSaasChavePix(data.config.chavePix || "");
        setSaasTipoPix(data.config.tipoChavePix || "EMAIL");
        setSaasNomePix(data.config.nomeBeneficiarioPix || "PAJO TECNOLOGIA");
        setSaasCidadePix(data.config.cidadePix || "RECIFE");
        setSaasValorMensal(data.config.valorMensal ?? 97);
        setSaasValorTrimestral(data.config.valorTrimestral ?? 260);
        setSaasValorSemestral(data.config.valorSemestral ?? 490);
        setSaasValorAnual(data.config.valorAnual ?? 890);
        setSaasDiasAviso(data.config.diasAvisoAntesExpirar ?? 3);
        setSaasTelSuporte(data.config.telefoneSuporteWhatsApp || "(87) 99654-0551");
        setSaasEmailAdmin(data.config.emailNotificacaoAdmin || "pajotecnologia@gmail.com");
        setSaasMsgAviso(data.config.mensagemAvisoWhatsApp || "");
      }
      carregarPlanosSaaS();
    } catch (e) {
      console.error(e);
    }
  };

  const loadEmpresasSaaS = async () => {
    setLoadingEmpresasSaaS(true);
    try {
      const res = await fetch("/api/saas/empresas");
      const data = await res.json();
      setEmpresasSaaS(data.empresas || []);
      setSummarySaaS(data.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEmpresasSaaS(false);
    }
  };

  const handleSaveSaasConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSaasConfig(true);
    try {
      const res = await fetch("/api/saas/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diasTrialPadrao: Number(saasDiasTrial),
          chavePix: saasChavePix,
          tipoChavePix: saasTipoPix,
          nomeBeneficiarioPix: saasNomePix,
          cidadePix: saasCidadePix,
          valorMensal: Number(saasValorMensal),
          valorTrimestral: Number(saasValorTrimestral),
          valorSemestral: Number(saasValorSemestral),
          valorAnual: Number(saasValorAnual),
          diasAvisoAntesExpirar: Number(saasDiasAviso),
          telefoneSuporteWhatsApp: saasTelSuporte,
          emailNotificacaoAdmin: saasEmailAdmin,
          mensagemAvisoWhatsApp: saasMsgAviso,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: "✅ Parâmetros globais do SaaS salvos com sucesso!" });
      } else {
        setFeedback({ type: "error", message: `❌ Erro: ${data.error}` });
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: `❌ Erro ao salvar: ${e.message}` });
    } finally {
      setSavingSaasConfig(false);
    }
  };

  const handleOpenLiberarModal = (emp: any) => {
    if (Object.keys(saasPlanos).length === 0) {
      carregarPlanosSaaS();
    }
    setEmpresaLiberar(emp);
    setLiberarTipo("MESES");
    setLiberarQtd(1);
    setLiberarPlano(emp.planoAtual || "PROFISSIONAL");
    setLiberarStatus(emp.statusAssinatura || "ATIVO");
    setLiberarDataCustom(
      emp.dataFimAcesso ? new Date(emp.dataFimAcesso).toISOString().split("T")[0] : ""
    );
    setShowLiberarModal(true);
  };

  const handleConfirmarLiberacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaLiberar) return;
    setSubmittingLiberar(true);
    try {
      const res = await fetch("/api/saas/liberar-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresaLiberar.id,
          tipo: liberarTipo,
          quantidade: liberarQtd,
          dataExpiracaoCustom: liberarDataCustom,
          plano: liberarPlano,
          status: liberarStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowLiberarModal(false);
        await loadEmpresasSaaS();
        toast.success(data.message || "Acesso e plano atribuídos com sucesso!");
        setFeedback({ type: "success", message: `✅ ${data.message || "Acesso e plano atribuídos com sucesso!"}` });
      } else {
        toast.error(data.error || "Erro ao atualizar plano da empresa");
      }
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setSubmittingLiberar(false);
    }
  };

  const handleDispararAvisosWhatsApp = () => {
    openConfirm({
      title: "Disparar Avisos de Vencimento",
      description: "Deseja disparar agora os avisos de vencimento de teste/plano para todas as empresas com expiração próxima?",
      confirmText: "Disparar Avisos",
      variant: "primary",
      onConfirm: async () => {
        setDisparandoAvisos(true);
        try {
          const res = await fetch("/api/saas/avisos-expiracao", { method: "POST" });
          const data = await res.json();
          if (res.ok) {
            await loadEmpresasSaaS();
            toast.success(`Avisos processados! Total: ${data.totalVerificadas}, Avisos: ${data.avisosProcessados}.`);
            setFeedback({
              type: "success",
              message: `✅ Avisos processados! Total verificadas: ${data.totalVerificadas}, Avisos: ${data.avisosProcessados}.`,
            });
          } else {
            toast.error(`Erro ao disparar avisos: ${data.error}`);
            setFeedback({ type: "error", message: `❌ Erro ao disparar avisos: ${data.error}` });
          }
        } catch (e: any) {
          toast.error(`Erro ao disparar avisos: ${e.message}`);
        } finally {
          setDisparandoAvisos(false);
        }
      },
    });
  };

  const loadData = async () => {
    try {
      const [resEmpresa, resParametros] = await Promise.all([
        fetch("/api/empresa").then((r) => r.json()),
        fetch("/api/parametros").then((r) => r.json()),
      ]);

      if (resEmpresa.empresa) {
        setEmpresa(resEmpresa.empresa);
        setNomeFantasia(resEmpresa.empresa.nomeFantasia || "");
        setRazaoSocial(resEmpresa.empresa.razaoSocial || "");
        setCnpj(resEmpresa.empresa.cnpj || "");
        setEmailEmpresa(resEmpresa.empresa.email || "");
        setTelefoneEmpresa(formatPhone(resEmpresa.empresa.telefone || ""));
        setEnderecoEmpresa(resEmpresa.empresa.endereco || "");
        setBairroEmpresa(resEmpresa.empresa.bairro || "");
        setCidadeEmpresa(resEmpresa.empresa.cidade || "");
        setEstadoEmpresa(resEmpresa.empresa.estado || "");
        setCepEmpresa(resEmpresa.empresa.cep || "");
        setLogomarcaUrl(resEmpresa.empresa.logomarcaUrl || "");
        setAssinaturaUrl(resEmpresa.empresa.assinaturaUrl || "");
        setChavePixEmpresa(resEmpresa.empresa.chavePix || "");
        setTipoChavePixEmpresa(resEmpresa.empresa.tipoChavePix || "CNPJ");
        setNomeBeneficiarioPixEmpresa(resEmpresa.empresa.nomeBeneficiarioPix || "");
        setCidadePixEmpresa(resEmpresa.empresa.cidadePix || "");
      }

      const p = resParametros.config || resParametros.parametros;
      if (p) {
        setEvolutionApiUrl(p.evolutionApiUrl || "");
        setEvolutionApiKey(p.evolutionApiKey || "");
        setEvolutionInstance(p.evolutionInstance || "");
        setStatusConexao(p.statusConexao || "DESCONECTADO");

        setSmtpHost(p.smtpHost || "smtp.gmail.com");
        setSmtpPort(p.smtpPort || 465);
        setSmtpUser(p.smtpUser || "");
        setSmtpPass(p.smtpPass || "");
        setSmtpSecure(p.smtpSecure !== undefined ? p.smtpSecure : true);
        setSmtpFromEmail(p.smtpFromEmail || p.smtpUser || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFuncionarios = async () => {
    setLoadingFuncionarios(true);
    try {
      const res = await fetch("/api/funcionarios");
      const data = await res.json();
      setFuncionarios(data.funcionarios || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFuncionarios(false);
    }
  };

  const loadFormas = async () => {
    setLoadingFormas(true);
    try {
      const res = await fetch("/api/formas-pagamento");
      const data = await res.json();
      setFormas(data.formas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFormas(false);
    }
  };

  const loadInterConfig = async () => {
    try {
      const res = await fetch("/api/banco-inter/config");
      const data = await res.json();
      if (data.config) {
        setBancoInterClientId(data.config.clientId || "");
        setBancoInterClientSecret(data.config.clientSecret || "");
        setBancoInterHasCertCrt(Boolean(data.config.hasCertCrt));
        setBancoInterHasCertKey(Boolean(data.config.hasCertKey));
        setBancoInterContaCorrente(data.config.contaCorrente || "");
        setBancoInterAmbiente(data.config.ambiente || "PRODUCAO");
        setBancoInterChavePix(data.config.chavePix || "");
        setBancoInterAtivo(Boolean(data.config.ativo));
        setBancoInterWebhookUrl(data.config.webhookUrl || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    loadFuncionarios();
    loadFormas();
    loadSaasConfig();
    loadEmpresasSaaS();
    loadInterConfig();
    if (typeof window !== "undefined" && window.location.hash) {
      if (window.location.hash.includes("evolution")) setActiveTab("evolution");
      if (window.location.hash.includes("smtp") || window.location.hash.includes("email")) setActiveTab("email");
      if (window.location.hash.includes("funcionarios")) setActiveTab("funcionarios");
      if (window.location.hash.includes("formas")) setActiveTab("formas");
      if (window.location.hash.includes("saas")) setActiveTab("saas");
      if (window.location.hash.includes("inter")) setActiveTab("inter");
    }
  }, []);

  const handleOpenNewFormaModal = () => {
    setEditingForma(null);
    setFormaNome("");
    setFormaAtivo(true);
    setShowFormaModal(true);
  };

  const handleOpenEditFormaModal = (f: any) => {
    setEditingForma(f);
    setFormaNome(f.nome);
    setFormaAtivo(f.ativo);
    setShowFormaModal(true);
  };

  const handleSaveForma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formaNome.trim()) return;
    setSubmittingForma(true);

    try {
      const method = editingForma ? "PUT" : "POST";
      const res = await fetch("/api/formas-pagamento", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingForma?.id,
          nome: formaNome,
          ativo: formaAtivo,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowFormaModal(false);
        await loadFormas();
        toast.success("Forma de pagamento salva com sucesso!");
        setFeedback({ type: "success", message: "Forma de pagamento salva com sucesso!" });
      } else {
        toast.error(data.error || "Erro ao salvar forma de pagamento");
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message || err}`);
    } finally {
      setSubmittingForma(false);
    }
  };

  const handleToggleFormaAtivo = async (f: any) => {
    try {
      await fetch("/api/formas-pagamento", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: f.id, ativo: !f.ativo }),
      });
      await loadFormas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteForma = (id: string) => {
    openConfirm({
      title: "Excluir Forma de Pagamento",
      description: "Tem certeza que deseja excluir esta forma de pagamento?",
      confirmText: "Excluir",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/formas-pagamento?id=${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Forma de pagamento excluída com sucesso!");
            await loadFormas();
          } else {
            toast.error("Não foi possível excluir esta forma de pagamento.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Erro de conexão ao excluir.");
        }
      },
    });
  };

  const handleOpenNewFuncModal = () => {
    setEditingFunc(null);
    setNomeFunc("");
    setEmailFunc("");
    setSenhaFunc("");
    setCargoFunc("OPERADOR");
    setStatusFunc("ATIVO");
    setAssinaturaFunc("");
    setErrorFunc("");
    setShowFuncModal(true);
  };

  const handleOpenEditFuncModal = (func: any) => {
    setEditingFunc(func);
    setNomeFunc(func.nome || "");
    setEmailFunc(func.email || "");
    setSenhaFunc("");
    setCargoFunc(func.cargo || "OPERADOR");
    setStatusFunc(func.status || "ATIVO");
    setAssinaturaFunc(func.assinaturaUrl || "");
    setErrorFunc("");
    setShowFuncModal(true);
  };

  const handleSubmitFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFunc("");
    setSubmittingFunc(true);

    try {
      const method = editingFunc ? "PUT" : "POST";
      const res = await fetch("/api/funcionarios", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFunc?.id,
          nome: nomeFunc,
          email: emailFunc,
          senha: senhaFunc,
          cargo: cargoFunc,
          status: statusFunc,
          assinaturaUrl: assinaturaFunc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorFunc(data.error || "Erro ao salvar funcionário.");
        setSubmittingFunc(false);
        return;
      }

      setShowFuncModal(false);
      setFeedback({ type: "success", message: `✅ Funcionário ${nomeFunc} e sua Assinatura Digital foram salvos com sucesso!` });
      loadFuncionarios();
    } catch (err) {
      setErrorFunc("Erro de conexão ao salvar funcionário.");
    } finally {
      setSubmittingFunc(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_LOGO_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFeedback({
        type: "error",
        message: `⚠️ A logomarca selecionada (${sizeMb} MB) excede o limite máximo permitido de 5 MB.`,
      });
      e.target.value = "";
      return;
    }

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("logoFile", file);

      const res = await fetch("/api/empresa/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.logomarcaUrl) {
        setLogomarcaUrl(data.logomarcaUrl);
        setFeedback({ type: "success", message: "Logomarca enviada com sucesso!" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Erro ao enviar logomarca." });
    } finally {
      setUploadingLogo(false);
    }
  };

  // 💾 Salvar Apenas Dados da Empresa
  const handleSaveEmpresa = async () => {
    setSavingEmpresa(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeFantasia,
          razaoSocial,
          cnpj,
          email: emailEmpresa,
          telefone: telefoneEmpresa,
          endereco: enderecoEmpresa,
          bairro: bairroEmpresa,
          cidade: cidadeEmpresa,
          estado: estadoEmpresa,
          cep: cepEmpresa,
          logomarcaUrl,
          assinaturaUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.empresa) setEmpresa(data.empresa);
        setFeedback({ type: "success", message: "✅ Dados da empresa e Assinatura Digital salvos com sucesso!" });
      } else {
        setFeedback({ type: "error", message: `❌ Erro ao salvar: ${data.error || "Erro interno no servidor."}` });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "❌ Erro de conexão ao salvar empresa." });
    } finally {
      setSavingEmpresa(false);
    }
  };

  // 💾 Salvar Apenas Evolution API
  const handleSaveEvolution = async () => {
    setSavingEvolution(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/parametros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolutionApiUrl,
          evolutionApiKey,
          evolutionInstance,
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpUser,
          smtpPass,
          smtpSecure,
          smtpFromEmail,
        }),
      });

      if (res.ok) {
        setFeedback({ type: "success", message: "✅ Configurações da Evolution API salvas no banco de dados com sucesso!" });
      } else {
        setFeedback({ type: "error", message: "❌ Erro ao salvar configurações da Evolution API." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "❌ Erro de conexão ao salvar Evolution API." });
    } finally {
      setSavingEvolution(false);
    }
  };

  // 💾 Salvar Apenas SMTP E-mail
  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/parametros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolutionApiUrl,
          evolutionApiKey,
          evolutionInstance,
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpUser,
          smtpPass,
          smtpSecure,
          smtpFromEmail: smtpFromEmail || smtpUser,
        }),
      });

      if (res.ok) {
        setFeedback({ type: "success", message: "✅ Configurações do Servidor SMTP salvas no banco de dados com sucesso!" });
      } else {
        setFeedback({ type: "error", message: "❌ Erro ao salvar configurações do Servidor SMTP." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "❌ Erro de conexão ao salvar Servidor SMTP." });
    } finally {
      setSavingSmtp(false);
    }
  };

  // Sugestão de nome de instância baseado no nome da empresa
  const handleSuggestInstanceName = () => {
    const raw = nomeFantasia || razaoSocial || "locacoes";
    const clean = raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    setEvolutionInstance(clean ? `imob_${clean}` : "imob_instancia");
  };

  // Cria a instância na Evolution API
  const handleCreateInstance = async () => {
    setCreatingInstance(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await fetch("/api/parametros/evolution/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolutionApiUrl: evolutionApiUrl.trim() || undefined,
          evolutionApiKey: evolutionApiKey.trim() || undefined,
          evolutionInstance: evolutionInstance.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.instanceName) setEvolutionInstance(data.instanceName);
        setFeedback({ type: "success", message: `✅ ${data.message || "Instância criada com sucesso!"}` });
        // Abre imediatamente o modal de QR Code para conectar
        handleOpenQrModal();
      } else {
        setFeedback({ type: "error", message: `❌ ${data.message || data.error || "Falha ao criar instância na Evolution API."}` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `❌ Erro ao conectar ao servidor: ${err.message || err}` });
    } finally {
      setCreatingInstance(false);
    }
  };

  // Abre modal e carrega QR Code
  const handleOpenQrModal = async () => {
    setShowQrModal(true);
    setQrScanSuccess(false);
    setLoadingQrCode(true);
    try {
      const res = await fetch("/api/parametros/evolution/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolutionApiUrl: evolutionApiUrl.trim() || undefined,
          evolutionApiKey: evolutionApiKey.trim() || undefined,
          evolutionInstance: evolutionInstance.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.instanceName) setEvolutionInstance(data.instanceName);
      if (data.success) {
        if (data.base64 || data.code || data.pairingCode) {
          setQrCodeData(data);
        } else if (data.message?.includes("já está conectada")) {
          setStatusConexao("CONECTADO");
          setQrScanSuccess(true);
          setTimeout(() => setShowQrModal(false), 2000);
        }
      } else {
        setFeedback({ type: "error", message: `❌ ${data.message || "Erro ao obter QR Code."}` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `❌ Erro de conexão: ${err.message || err}` });
    } finally {
      setLoadingQrCode(false);
    }
  };

  // Polling automático para verificar autenticação com QR Code aberto
  useEffect(() => {
    if (!showQrModal || qrScanSuccess) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/parametros/evolution/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evolutionApiUrl,
            evolutionApiKey,
            evolutionInstance,
          }),
        });
        const data = await res.json();
        if (data.connected || data.status === "CONECTADO") {
          setStatusConexao("CONECTADO");
          setQrScanSuccess(true);
          setFeedback({ type: "success", message: "🎉 WhatsApp Conectado com Sucesso!" });
          setTimeout(() => {
            setShowQrModal(false);
            setQrScanSuccess(false);
          }, 2000);
        }
      } catch (e) {
        // Ignora falhas pontuais no polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showQrModal, qrScanSuccess, evolutionApiUrl, evolutionApiKey, evolutionInstance]);

  // Desconectar (Logout) da sessão do WhatsApp
  const handleLogoutEvolution = () => {
    openConfirm({
      title: "Desconectar WhatsApp",
      description: "Deseja realmente desconectar a sessão do WhatsApp? Será necessário ler o QR Code novamente para reconectar.",
      confirmText: "Desconectar",
      variant: "danger",
      onConfirm: async () => {
        setLoggingOutEvolution(true);
        setFeedback({ type: "", message: "" });
        try {
          const res = await fetch("/api/parametros/evolution/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              evolutionApiUrl,
              evolutionApiKey,
              evolutionInstance,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setStatusConexao("DESCONECTADO");
            toast.success("WhatsApp desconectado com sucesso!");
            setFeedback({ type: "success", message: "✅ WhatsApp desconectado com sucesso!" });
          } else {
            toast.error(data.message || data.error || "Erro ao desconectar.");
            setFeedback({ type: "error", message: `❌ ${data.message || data.error || "Erro ao desconectar."}` });
          }
        } catch (err: any) {
          toast.error(`Erro ao desconectar: ${err.message || err}`);
          setFeedback({ type: "error", message: `❌ Erro ao desconectar: ${err.message || err}` });
        } finally {
          setLoggingOutEvolution(false);
        }
      },
    });
  };

  // Reiniciar a instância
  const handleRestartEvolution = async () => {
    setRestartingEvolution(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await fetch("/api/parametros/evolution/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolutionApiUrl,
          evolutionApiKey,
          evolutionInstance,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: "✅ Instância reiniciada com sucesso! Aguarde alguns instantes." });
        setTimeout(() => handleTestEvolution(), 3500);
      } else {
        setFeedback({ type: "error", message: `❌ ${data.message || data.error || "Erro ao reiniciar instância."}` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `❌ Erro ao reiniciar: ${err.message || err}` });
    } finally {
      setRestartingEvolution(false);
    }
  };

  // Disparo de mensagem de teste
  const handleSendTestWhatsApp = async () => {
    if (!testWhatsAppNumber) {
      toast.warning("Informe um número de WhatsApp de destino (com DDD) no campo de teste.");
      return;
    }
    setSendingTestWhatsApp(true);
    setFeedback({ type: "", message: "" });
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testWhatsAppNumber,
          message: `🔔 *Teste de Conexão IMOB*\n\nOlá! A sua integração com o WhatsApp via Evolution API está configurada e operando com sucesso! 🚀\n\n*Empresa:* ${nomeFantasia || razaoSocial || "IMOB"}\n*Data/Hora:* ${new Date().toLocaleString("pt-BR")}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Mensagem de teste enviada com sucesso no WhatsApp!");
        setFeedback({ type: "success", message: "✅ Mensagem de teste enviada com sucesso no WhatsApp!" });
      } else {
        toast.error(`Falha no envio: ${data.error || data.message || "Verifique o status da conexão"}`);
        setFeedback({ type: "error", message: `❌ Falha no envio: ${data.error || data.message || "Verifique o status da conexão"}` });
      }
    } catch (err: any) {
      toast.error(`Erro no teste de WhatsApp: ${err.message || err}`);
      setFeedback({ type: "error", message: `❌ Erro no teste de WhatsApp: ${err.message || err}` });
    } finally {
      setSendingTestWhatsApp(false);
    }
  };

  const handleTestEvolution = async () => {
    setTestingEvolution(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/parametros/evolution/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolutionApiUrl,
          evolutionApiKey,
          evolutionInstance,
        }),
      });

      const data = await res.json();
      if (data.success || data.connected) {
        setStatusConexao(data.status || "CONECTADO");
        setFeedback({ type: "success", message: `✅ Evolution API Conectada com sucesso! (${data.message || "Instância OK"})` });
      } else {
        setStatusConexao(data.status || "DESCONECTADO");
        setFeedback({ type: "error", message: `❌ Falha ao conectar na Evolution API: ${data.message || "Verifique a URL e a API Key"}` });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "❌ Erro ao testar conexão com o servidor Evolution API." });
    } finally {
      setTestingEvolution(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmailDestino) {
      toast.warning("Por favor, digite um e-mail de destino no campo de teste.");
      return;
    }

    setTestingSmtp(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/parametros/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail: testEmailDestino,
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpUser,
          smtpPass,
          smtpSecure,
          smtpFromEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", message: `✅ E-mail de teste enviado com sucesso para ${testEmailDestino}!` });
      } else {
        setFeedback({ type: "error", message: `❌ Falha no envio SMTP: ${data.error || "Verifique o usuário e a senha de app do Gmail."}` });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "❌ Erro ao conectar ao servidor SMTP." });
    } finally {
      setTestingSmtp(false);
    }
  };

  // 💾 Salvar Apenas Banco Inter
  const handleSaveInter = async () => {
    setSavingInter(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/banco-inter/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: bancoInterClientId,
          clientSecret: bancoInterClientSecret,
          certCrt: bancoInterCertCrt,
          certKey: bancoInterCertKey,
          contaCorrente: bancoInterContaCorrente,
          ambiente: bancoInterAmbiente,
          chavePix: bancoInterChavePix,
          ativo: bancoInterAtivo,
          webhookUrl: bancoInterWebhookUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: "✅ Configurações do Banco Inter salvas com sucesso!" });
        loadInterConfig();
      } else {
        setFeedback({ type: "error", message: `❌ Erro ao salvar Banco Inter: ${data.error || "Erro interno."}` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `❌ Erro de conexão ao salvar Banco Inter: ${err.message}` });
    } finally {
      setSavingInter(false);
    }
  };

  const handleTestInter = async () => {
    setTestingInter(true);
    setTestInterResult(null);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/banco-inter/testar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: bancoInterClientId,
          clientSecret: bancoInterClientSecret,
          certCrt: bancoInterCertCrt,
          certKey: bancoInterCertKey,
          ambiente: bancoInterAmbiente,
          contaCorrente: bancoInterContaCorrente,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestInterResult({ success: true, message: data.message });
        setFeedback({ type: "success", message: `✅ ${data.message}` });
      } else {
        setTestInterResult({ success: false, message: data.message || "Falha na conexão mTLS com o Banco Inter." });
        setFeedback({ type: "error", message: `❌ ${data.message || "Falha na conexão mTLS com o Banco Inter."}` });
      }
    } catch (err: any) {
      setTestInterResult({ success: false, message: err.message || "Erro de rede ao testar Banco Inter." });
      setFeedback({ type: "error", message: `❌ Erro ao testar Banco Inter: ${err.message}` });
    } finally {
      setTestingInter(false);
    }
  };

  const handleFileUploadCrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        setBancoInterCertCrt(content);
        setBancoInterHasCertCrt(true);
        setFeedback({ type: "success", message: `✅ Certificado ${file.name} carregado com sucesso!` });
      }
    };
    reader.readAsText(file);
  };

  const handleFileUploadKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        setBancoInterCertKey(content);
        setBancoInterHasCertKey(true);
        setFeedback({ type: "success", message: `✅ Chave Privada ${file.name} carregada com sucesso!` });
      }
    };
    reader.readAsText(file);
  };

  const handleRegisterWebhookInter = async () => {
    setRegisteringWebhookInter(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/banco-inter/webhook-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: bancoInterWebhookUrl || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBancoInterWebhookUrl(data.webhookUrl || "");
        setFeedback({ type: "success", message: `✅ Webhook registrado com sucesso no Banco Inter!` });
      } else {
        setFeedback({ type: "error", message: `❌ Falha ao registrar webhook: ${data.error || "Verifique os certificados mTLS."}` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `❌ Erro ao registrar webhook: ${err.message}` });
    } finally {
      setRegisteringWebhookInter(false);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setFeedback({ type: "", message: "" });

    try {
      const [resEmp, resParam, resInter] = await Promise.all([
        fetch("/api/empresa", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nomeFantasia,
            razaoSocial,
            cnpj,
            email: emailEmpresa,
            telefone: telefoneEmpresa,
            endereco: enderecoEmpresa,
            bairro: bairroEmpresa,
            cidade: cidadeEmpresa,
            estado: estadoEmpresa,
            cep: cepEmpresa,
            logomarcaUrl,
            assinaturaUrl,
            chavePix: chavePixEmpresa,
            tipoChavePix: tipoChavePixEmpresa,
            nomeBeneficiarioPix: nomeBeneficiarioPixEmpresa,
            cidadePix: cidadePixEmpresa,
          }),
        }),
        fetch("/api/parametros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evolutionApiUrl,
            evolutionApiKey,
            evolutionInstance,
            smtpHost,
            smtpPort: Number(smtpPort),
            smtpUser,
            smtpPass,
            smtpSecure,
            smtpFromEmail: smtpFromEmail || smtpUser,
          }),
        }),
        fetch("/api/banco-inter/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: bancoInterClientId,
            clientSecret: bancoInterClientSecret,
            certCrt: bancoInterCertCrt,
            certKey: bancoInterCertKey,
            contaCorrente: bancoInterContaCorrente,
            ambiente: bancoInterAmbiente,
            chavePix: bancoInterChavePix,
            ativo: bancoInterAtivo,
            webhookUrl: bancoInterWebhookUrl,
          }),
        }),
      ]);

      if (resEmp.ok && resParam.ok && resInter.ok) {
        setFeedback({ type: "success", message: "✅ Todas as configurações de todas as abas foram salvas com sucesso!" });
        loadData();
        loadInterConfig();
      } else {
        setFeedback({ type: "error", message: "Erro ao atualizar alguns dados no servidor." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Erro de conexão ao salvar parâmetros." });
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* CABEÇALHO DA PÁGINA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Parâmetros do Sistema</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie em abas: Dados da Empresa, Evolution API (WhatsApp) e Servidor SMTP E-mail
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingAll}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md flex items-center space-x-2 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{savingAll ? "Salvando Tudo..." : "Salvar Todas as Abas"}</span>
          </button>
        </div>

        {/* FEEDBACK DE SUCESSO / ERRO */}
        {feedback.message && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 border shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* CONTROLE DE ABAS INTERATIVAS (SEM BARRA DE ROLAGEM, TOTALMENTE RESPONSIVO) */}
        <div className="flex flex-wrap items-center border-b border-slate-200 dark:border-slate-800 gap-2 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("empresa")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "empresa"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Dados da Empresa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("evolution")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "evolution"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp (Evolution API)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "email"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Servidor E-mail (SMTP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("funcionarios")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "funcionarios"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Usuários & Assinaturas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("formas")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "formas"
                ? "bg-cyan-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Formas de Pagamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inter")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "inter"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Zap className="w-4 h-4 text-orange-400" />
            <span>Banco Inter (Bolepix)</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("saas")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === "saas"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Gestão SaaS</span>
            </button>
          )}
        </div>

        {/* CONTEÚDO DA ABA 1: EMPRESA */}
        {activeTab === "empresa" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Dados da Empresa & Assinatura Digital</h2>
              </div>

              <div className="flex items-center space-x-3">
                {logomarcaUrl && (
                  <img src={logomarcaUrl} alt="Logo Empresa" className="h-9 object-contain bg-white p-1 rounded-lg border border-slate-200 dark:border-slate-800" />
                )}
                <button
                  type="button"
                  onClick={handleSaveEmpresa}
                  disabled={savingEmpresa}
                  className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEmpresa ? "Salvando..." : "Salvar Dados da Empresa"}</span>
                </button>
              </div>
            </div>

            {/* BANNER INFORMATIVO SE FOR EMPRESA MESTRE */}
            {(empresa?.isMestre || isSuperAdmin) && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-6 h-6 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span>👑 EMPRESA MESTRE</span>
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">(Administrador Geral)</span>
                    </span>
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-300/90 mt-0.5">
                      Esta é a empresa titular do sistema. Possui <strong>validade vitalícia permanente</strong> e sua Chave PIX cadastrada abaixo é a utilizada para receber os pagamentos de assinaturas de todos os locadores do SaaS.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 self-start sm:self-center shrink-0">
                  ACESSO VITALÍCIO
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    required
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Razão Social</label>
                  <input
                    type="text"
                    required
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
                    <input
                      type="text"
                      required
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                    <input
                      type="text"
                      required
                      value={telefoneEmpresa}
                      onChange={(e) => setTelefoneEmpresa(formatPhone(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Logradouro / Rua / N°</label>
                    <input
                      type="text"
                      required
                      value={enderecoEmpresa}
                      onChange={(e) => setEnderecoEmpresa(e.target.value)}
                      placeholder="Ex: Rua do Imperador, 250"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={bairroEmpresa}
                      onChange={(e) => setBairroEmpresa(e.target.value)}
                      placeholder="Ex: Santo Antônio"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={cidadeEmpresa}
                      onChange={(e) => setCidadeEmpresa(e.target.value)}
                      placeholder="Ex: Recife"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      value={estadoEmpresa}
                      onChange={(e) => setEstadoEmpresa(e.target.value.toUpperCase())}
                      placeholder="Ex: PE"
                      maxLength={2}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">CEP</label>
                    <input
                      type="text"
                      value={cepEmpresa}
                      onChange={(e) => setCepEmpresa(e.target.value)}
                      placeholder="Ex: 50010-000"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingLogo ? "Enviando Logomarca..." : "Upload de Logomarca (PNG/JPG)"}</span>
                    <input type="file" accept="image/*" onChange={handleUploadLogo} disabled={uploadingLogo} className="hidden" />
                  </label>

                  {/* PREVIEW DA LOGOMARCA ABAIXO DO BOTÃO DE UPLOAD */}
                  {logomarcaUrl ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-start space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Logomarca Oficial Cadastrada:</span>
                      </span>
                      <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-[220px] shadow-sm">
                        <img src={logomarcaUrl} alt="Logomarca da Empresa" className="max-h-24 max-w-full object-contain rounded" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Nenhuma logomarca enviada. Um emblema com a inicial da empresa será gerado nos relatórios.</p>
                  )}
                </div>
              </div>

              {/* DADOS DA CHAVE PIX DA EMPRESA PARA RECEBIMENTO DE ALUGUÉIS */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>Dados da Chave PIX para Recebimento de Aluguéis</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Disparado automaticamente no WhatsApp
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Informe a chave PIX da sua imobiliária/empresa. Ela será incluída automaticamente nas mensagens de cobrança e recibos enviados aos locatários.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Chave PIX
                    </label>
                    <select
                      value={tipoChavePixEmpresa}
                      onChange={(e) => setTipoChavePixEmpresa(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="TELEFONE">Telefone / Celular</option>
                      <option value="ALEATORIA">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chave PIX *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 00.000.000/0001-00 ou pix@minhaempresa.com"
                      value={chavePixEmpresa}
                      onChange={(e) => setChavePixEmpresa(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Titular / Beneficiário
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Prime Gestão Imobiliária"
                      value={nomeBeneficiarioPixEmpresa}
                      onChange={(e) => setNomeBeneficiarioPixEmpresa(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cidade da Conta PIX
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Recife"
                      value={cidadePixEmpresa}
                      onChange={(e) => setCidadePixEmpresa(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: EVOLUTION API */}
        {activeTab === "evolution" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Header da Aba */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Integrador WhatsApp (Evolution API)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Envio automatizado de contratos com assinatura digital, recibos de aluguel e laudos de vistoria.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center space-x-1.5 shadow-sm transition ${
                    statusConexao === "CONECTADO"
                      ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                      : statusConexao === "CONECTANDO"
                      ? "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                      : "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      statusConexao === "CONECTADO"
                        ? "bg-emerald-500 animate-pulse ring-4 ring-emerald-400/30"
                        : statusConexao === "CONECTANDO"
                        ? "bg-amber-500 animate-pulse ring-4 ring-amber-400/30"
                        : "bg-rose-500"
                    }`}
                  />
                  <span>Status: {statusConexao}</span>
                </span>
              </div>
            </div>

            {/* Painel Principal de Conexão (Hero 1-Clique) */}
            {statusConexao === "CONECTADO" ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-300 dark:border-emerald-800/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>WhatsApp Oficial Conectado e Operante</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          ONLINE
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Disparo automático de contratos, links de assinatura digital, boletos e recibos ativo para seus locatários.
                      </p>
                      {evolutionInstance && (
                        <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                          <span className="text-slate-400">Instância:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{evolutionInstance}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleTestEvolution}
                      disabled={testingEvolution}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingEvolution ? "animate-spin text-emerald-500" : ""}`} />
                      <span>{testingEvolution ? "Verificando..." : "Verificar Conexão"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestartEvolution}
                      disabled={restartingEvolution}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition border border-amber-300/40 dark:border-amber-700/40 disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${restartingEvolution ? "animate-spin" : ""}`} />
                      <span>{restartingEvolution ? "Reiniciando..." : "Reiniciar Instância"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogoutEvolution}
                      disabled={loggingOutEvolution}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-1.5 transition border border-rose-300/40 dark:border-rose-700/40 disabled:opacity-50"
                    >
                      <Power className={`w-3.5 h-3.5 ${loggingOutEvolution ? "animate-spin" : ""}`} />
                      <span>{loggingOutEvolution ? "Desconectando..." : "Desconectar Sessão"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-emerald-500/10 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Conexão Automática SaaS 1-Clique</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      Conecte o WhatsApp da sua Imobiliária
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Crie sua instância exclusiva e abra o QR Code para conectar com o WhatsApp do seu celular com 1 clique.
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCreateInstance}
                      disabled={creatingInstance}
                      className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                      title="Registrar esta instância no servidor da Evolution API"
                    >
                      <Plus className={`w-4 h-4 ${creatingInstance ? "animate-spin" : ""}`} />
                      <span>{creatingInstance ? "Criando..." : "1. Criar Instância"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenQrModal}
                      disabled={loadingQrCode}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      title="Gerar QR Code na tela para escanear com o WhatsApp"
                    >
                      <QrCode className={`w-4 h-4 ${loadingQrCode ? "animate-spin" : ""}`} />
                      <span>{loadingQrCode ? "Gerando QR..." : "2. Conectar (QR Code)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTestEvolution}
                      disabled={testingEvolution}
                      className="px-3.5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                      title="Verificar status da conexão"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingEvolution ? "animate-spin text-emerald-500" : ""}`} />
                      <span>{testingEvolution ? "..." : "Status"}</span>
                    </button>
                  </div>
                </div>

                {/* Bloco de Definição do Nome da Instância da Empresa */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-xl border">
                  <div className="flex-1 max-w-md space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Nome da Instância Exclusiva da Empresa:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={evolutionInstance}
                        onChange={(e) => setEvolutionInstance(e.target.value)}
                        placeholder="Ex: imob_minhaempresa"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleSuggestInstanceName}
                        className="shrink-0 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center space-x-1 border border-indigo-200 dark:border-indigo-800 transition"
                        title="Gerar nome padronizado automático para esta empresa"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Sugerir Nome</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-right">
                    <p>Cada empresa possui seu próprio nome de instância isolado.</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Sem compartilhamento entre clientes.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Configurações Avançadas Recolhíveis (BYOS / Servidor Próprio) */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 transition">
              <button
                type="button"
                onClick={() => setShowAdvancedEvolution(!showAdvancedEvolution)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <Server className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Configurações Avançadas de Servidor (Opcional / Servidor Próprio)
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400 text-xs">
                  <span>{showAdvancedEvolution ? "Ocultar" : "Personalizar"}</span>
                  {showAdvancedEvolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showAdvancedEvolution && (
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Por padrão, o sistema utiliza o servidor gerenciado de WhatsApp da plataforma. Caso a sua empresa possua uma instalação própria e dedicada da Evolution API, você pode informar os dados abaixo:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        URL da Evolution API Própria
                      </label>
                      <input
                        type="text"
                        value={evolutionApiUrl}
                        onChange={(e) => setEvolutionApiUrl(e.target.value)}
                        placeholder="https://evolution.suaempresa.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Ex: URL do seu servidor Evolution com https://</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        API Key Global Própria
                      </label>
                      <div className="relative">
                        <input
                          type={showEvolutionApiKey ? "text" : "password"}
                          value={evolutionApiKey}
                          onChange={(e) => setEvolutionApiKey(e.target.value)}
                          placeholder="AUTHENTICATION_API_KEY"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 pr-9 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEvolutionApiKey(!showEvolutionApiKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showEvolutionApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Chave mestre da sua Evolution API</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Nome da Instância Customizada
                        </label>
                        <button
                          type="button"
                          onClick={handleSuggestInstanceName}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center space-x-0.5"
                        >
                          <Sparkles className="w-3 h-3 inline" />
                          <span>Sugerir</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={evolutionInstance}
                        onChange={(e) => setEvolutionInstance(e.target.value)}
                        placeholder="ex: imob_recife"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Nome identificador da instância</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveEvolution}
                      disabled={savingEvolution}
                      className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingEvolution ? "Salvando..." : "Salvar Configurações Customizadas"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Teste de Disparo de Mensagem em Tempo Real */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Teste Imediato de Disparo de Mensagem
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Digite um número de telefone com DDD para receber uma mensagem de teste e confirmar o envio em tempo real.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 max-w-lg">
                <input
                  type="text"
                  value={testWhatsAppNumber}
                  onChange={(e) => setTestWhatsAppNumber(formatPhone(e.target.value))}
                  placeholder="Ex: (87) 99999-9999"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                />
                <button
                  type="button"
                  onClick={handleSendTestWhatsApp}
                  disabled={sendingTestWhatsApp}
                  className="w-full sm:w-auto shrink-0 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingTestWhatsApp ? "animate-spin" : ""}`} />
                  <span>{sendingTestWhatsApp ? "Enviando..." : "Enviar Mensagem Teste"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: EMAIL (SMTP) */}
        {activeTab === "email" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-rose-500" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Servidor SMTP (Gmail / E-mail Server)</h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSaveSmtp}
                  disabled={savingSmtp}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50 border border-slate-700"
                >
                  <Save className="w-3.5 h-3.5 text-rose-400" />
                  <span>{savingSmtp ? "Salvar..." : "Salvar Configurações SMTP"}</span>
                </button>

                <input
                  type="email"
                  value={testEmailDestino}
                  onChange={(e) => setTestEmailDestino(e.target.value)}
                  placeholder="E-mail para receber teste..."
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1 text-xs text-slate-900 dark:text-slate-100 w-52"
                />
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp}
                  className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingSmtp ? "Enviando..." : "Enviar E-mail de Teste"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Servidor Host SMTP</label>
                <input
                  type="text"
                  required
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Porta SMTP</label>
                <input
                  type="number"
                  required
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  placeholder="465 (SSL) ou 587 (TLS)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Criptografia SSL/TLS</label>
                <select
                  value={smtpSecure ? "true" : "false"}
                  onChange={(e) => setSmtpSecure(e.target.value === "true")}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                >
                  <option value="true">SSL / TLS Seguro (Porta 465)</option>
                  <option value="false">STARTTLS / Padrão (Porta 587)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Usuário / E-mail do Gmail</label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="seu-email@gmail.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Senha de Aplicativo (16 dígitos)</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="Senha de 16 letras gerada no Google"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail Remetente Exibido</label>
                <input
                  type="email"
                  value={smtpFromEmail}
                  onChange={(e) => setSmtpFromEmail(e.target.value)}
                  placeholder="atendimento@primeflats.com.br"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 4: FUNCIONÁRIOS & EQUIPE */}
        {activeTab === "funcionarios" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Usuários & Funcionários da Empresa</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gerencie os acessos, cargos e assinaturas individuais de cada membro da equipe.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenNewFuncModal}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Funcionário</span>
              </button>
            </div>

            {loadingFuncionarios ? (
              <div className="p-8 text-center text-xs text-slate-500 font-semibold">
                Carregando lista de funcionários...
              </div>
            ) : funcionarios.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                Nenhum funcionário cadastrado. Clique no botão acima para adicionar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="p-3">Nome</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Cargo / Função</th>
                      <th className="p-3">Assinatura Digital</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {funcionarios.map((func) => (
                      <tr key={func.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                            {func.nome?.[0]?.toUpperCase() || "U"}
                          </div>
                          <span>{func.nome}</span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{func.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              func.cargo === "ADMIN"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                : func.cargo === "GERENTE"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {func.cargo}
                          </span>
                        </td>
                        <td className="p-3">
                          {func.assinaturaUrl ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Cadastrada</span>
                              </span>
                              <div className="bg-white p-0.5 rounded border border-slate-200 inline-block shadow-xs">
                                <img src={func.assinaturaUrl} alt="Assinatura" className="h-4 object-contain max-w-[50px]" />
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Não cadastrada
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              func.status === "ATIVO"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            }`}
                          >
                            {func.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditFuncModal(func)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                            title="Editar Funcionário e Assinatura"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL ADICIONAR / EDITAR FUNCIONÁRIO */}
        {showFuncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>{editingFunc ? "Editar Funcionário & Assinatura" : "Novo Funcionário"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFuncModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorFunc && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorFunc}</span>
                </div>
              )}

              <form onSubmit={handleSubmitFuncionario} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={nomeFunc}
                    onChange={(e) => setNomeFunc(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail de Acesso</label>
                  <input
                    type="email"
                    required
                    value={emailFunc}
                    onChange={(e) => setEmailFunc(e.target.value)}
                    placeholder="carlos@empresa.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {editingFunc ? "Nova Senha (deixe em branco para manter)" : "Senha de Acesso"}
                  </label>
                  <input
                    type="password"
                    required={!editingFunc}
                    value={senhaFunc}
                    onChange={(e) => setSenhaFunc(e.target.value)}
                    placeholder={editingFunc ? "Manter senha atual" : "Mínimo 6 caracteres"}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cargo / Nível</label>
                    <select
                      value={cargoFunc}
                      onChange={(e) => setCargoFunc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      <option value="OPERADOR">Operador</option>
                      <option value="GERENTE">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={statusFunc}
                      onChange={(e) => setStatusFunc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      <option value="ATIVO">Ativo</option>
                      <option value="INATIVO">Inativo</option>
                    </select>
                  </div>
                </div>

                {/* CAMPO DE ASSINATURA INDIVIDUAL DO FUNCIONÁRIO */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Assinatura Digital deste Usuário:</span>
                    </span>
                    {assinaturaFunc && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Assinatura Definida</span>
                      </span>
                    )}
                  </div>

                  <SignaturePad onSaveSignature={(base64) => setAssinaturaFunc(base64)} />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Imagem (PNG/JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (reader.result) {
                                setAssinaturaFunc(reader.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {assinaturaFunc && (
                      <button
                        type="button"
                        onClick={() => setAssinaturaFunc("")}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        Limpar Assinatura
                      </button>
                    )}
                  </div>

                  {assinaturaFunc && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400">Prévia:</span>
                      <div className="bg-white p-1 rounded-lg border border-slate-200 inline-block">
                        <img src={assinaturaFunc} alt="Assinatura" className="h-8 object-contain" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowFuncModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFunc}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md disabled:opacity-50"
                  >
                    {submittingFunc ? "Salvando..." : "Salvar Funcionário & Assinatura"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 5: FORMAS DE PAGAMENTO */}
        {activeTab === "formas" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Formas de Pagamento Cadastradas</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cadastre e gerencie as formas de pagamento disponíveis no recebimento e lançamento financeiro
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenNewFormaModal}
                className="py-2 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Forma de Pagamento</span>
              </button>
            </div>

            {loadingFormas ? (
              <div className="py-8 text-center text-xs text-slate-500">Carregando formas de pagamento...</div>
            ) : formas.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">Nenhuma forma de pagamento cadastrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Nome da Forma de Pagamento</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formas.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-cyan-500" />
                          <span>{f.nome}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleFormaAtivo(f)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                              f.ativo
                                ? "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                                : "bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-500"
                            }`}
                            title="Clique para Ativar/Desativar"
                          >
                            {f.ativo ? "ATIVO" : "INATIVO"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenEditFormaModal(f)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Editar Forma de Pagamento"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteForma(f.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Excluir Forma de Pagamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL ADICIONAR / EDITAR FORMA DE PAGAMENTO */}
        {showFormaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] my-auto overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-cyan-600" />
                  <span>{editingForma ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFormaModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForma} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Forma de Pagamento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PIX, Cartão de Crédito, Boleto, Cheque..."
                    value={formaNome}
                    onChange={(e) => setFormaNome(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formaAtivo ? "true" : "false"}
                    onChange={(e) => setFormaAtivo(e.target.value === "true")}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowFormaModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingForma}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md disabled:opacity-50"
                  >
                    {submittingForma ? "Salvando..." : "Salvar Forma de Pagamento"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 6: GESTÃO SAAS & ASSINATURAS (SUPER ADMIN) */}
        {activeTab === "saas" && isSuperAdmin && (
          <div className="space-y-6">
            {/* Sub-navegação interna da aba SaaS */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl flex-wrap gap-2">
              <div className="flex space-x-2 flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSaasSubTab("empresas")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                    saasSubTab === "empresas"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>🏢 Empresas & Assinaturas ({empresasSaaS.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSaasSubTab("planos");
                    if (Object.keys(saasPlanos).length === 0) carregarPlanosSaaS();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                    saasSubTab === "planos"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>📦 Gestão de Planos, Limites & Preços</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaasSubTab("config")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                    saasSubTab === "config"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>⚙️ Configurações Globais do SaaS</span>
                </button>
              </div>

              {saasSubTab === "empresas" && (
                <button
                  type="button"
                  onClick={handleDispararAvisosWhatsApp}
                  disabled={disparandoAvisos}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                  title="Envia WhatsApp para todas as empresas que estão vencendo nos próximos dias"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{disparandoAvisos ? "Disparando..." : "Disparar Avisos WhatsApp"}</span>
                </button>
              )}
            </div>

            {/* SUB-ABA 1: LISTAGEM DE EMPRESAS & LIBERAÇÃO */}
            {saasSubTab === "empresas" && (
              <div className="space-y-5">
                {/* PAINEL DE INTELIGÊNCIA FINANCEIRA & ANALYTICS SAAS (EXCLUSIVO EMPRESA MESTRE) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {/* CARD 1: MRR SAAS */}
                  <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Receita Mensal SaaS (MRR)
                      </span>
                      <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                        R$ {(summarySaaS?.mrrSaaSTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">/mês</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                      <span>ARR: R$ {(summarySaaS?.arrSaaSTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/ano</span>
                      <span className="font-bold">{summarySaaS?.empresasAtivas || 0} ativas</span>
                    </div>
                  </div>

                  {/* CARD 2: VOLUME DE ALUGUÉIS SOB GESTÃO (VGV) */}
                  <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        Aluguéis sob Gestão (VGV)
                      </span>
                      <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-300">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-blue-800 dark:text-blue-200">
                        R$ {(summarySaaS?.volumeTotalAluguelMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold ml-1">/mês</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-blue-700/80 dark:text-blue-400/80 font-medium">
                      <span>{summarySaaS?.totalContratosAtivosGlobal || 0} contratos ativos</span>
                      <span className="font-bold">Total nos Flats</span>
                    </div>
                  </div>

                  {/* CARD 3: BASE DE EMPRESAS CONTRATANTES */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Empresas Clientes
                      </span>
                      <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-amber-800 dark:text-amber-200">
                        {summarySaaS?.totalEmpresasContratantes || 0}
                      </span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold ml-1">Locadores</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">{summarySaaS?.empresasAtivas || 0} Ativas</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-blue-600 dark:text-blue-400">{summarySaaS?.empresasTrial || 0} Trial</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-rose-600 dark:text-rose-400">{summarySaaS?.empresasExpiradas || 0} Exp.</span>
                    </div>
                  </div>

                  {/* CARD 4: FLATS & TAXA DE OCUPAÇÃO */}
                  <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                        Flats no Ecossistema
                      </span>
                      <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-indigo-800 dark:text-indigo-200">
                        {summarySaaS?.totalFlatsGlobal || 0}
                      </span>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold ml-1">Unidades</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-indigo-700/80 dark:text-indigo-400/80 font-medium">
                      <span>{summarySaaS?.totalFlatsOcupadosGlobal || 0} Ocupados</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-300">{summarySaaS?.taxaOcupacaoGlobal || 0}% Ocupação</span>
                    </div>
                  </div>

                  {/* CARD 5: ARMAZENAMENTO / STORAGE TOTAL */}
                  <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200 dark:border-purple-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                        Storage Total
                      </span>
                      <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300">
                        <HardDrive className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-purple-800 dark:text-purple-200">
                        {summarySaaS?.totalStorageFormattedGlobal || "0 KB"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-purple-700/80 dark:text-purple-400/80 font-medium">
                      <span>Compressão WebP</span>
                      <span className="font-bold text-purple-600 dark:text-purple-300">Otimizado</span>
                    </div>
                  </div>
                </div>

                {/* TABELA DETALHADA DE EMPRESAS CONTRATANTES */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <span>Empresas & Clientes Cadastrados</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {empresasSaaS.length} empresas
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Métricas individuais, portfólio de imóveis, armazenamento consumido e controle de mensalidade SaaS
                      </p>
                    </div>

                    {/* Barra de Busca e Filtro de Status */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Buscar por empresa, CNPJ, e-mail..."
                        value={searchTermEmpresa}
                        onChange={(e) => setSearchTermEmpresa(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 w-48 sm:w-64 focus:outline-none focus:border-amber-500"
                      />

                      <select
                        value={statusFilterEmpresa}
                        onChange={(e) => setStatusFilterEmpresa(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                      >
                        <option value="TODOS">Todos os Status</option>
                        <option value="TRIAL">Em Teste (Trial)</option>
                        <option value="ATIVO">Ativos (Pagos)</option>
                        <option value="EXPIRADO">Expirados</option>
                      </select>

                      <button
                        onClick={loadEmpresasSaaS}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Atualizar lista"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                {loadingEmpresasSaaS ? (
                  <div className="py-8 text-center text-xs text-slate-500">Carregando métricas e empresas cadastradas...</div>
                ) : empresasSaaS.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">Nenhuma empresa encontrada.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                          <th className="py-3 px-3">Empresa / Cidade</th>
                          <th className="py-3 px-3">Admin & Contato</th>
                          <th className="py-3 px-3">Portfólio / Imóveis</th>
                          <th className="py-3 px-3">Storage / Espaço</th>
                          <th className="py-3 px-3">Aluguéis Geridos (VGV)</th>
                          <th className="py-3 px-3">Plano & Valor SaaS</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-center">Expiração</th>
                          <th className="py-3 px-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {empresasSaaS
                          .filter((emp) => {
                            const matchSearch =
                              !searchTermEmpresa.trim() ||
                              emp.nomeFantasia?.toLowerCase().includes(searchTermEmpresa.toLowerCase()) ||
                              emp.cnpj?.includes(searchTermEmpresa) ||
                              emp.email?.toLowerCase().includes(searchTermEmpresa.toLowerCase()) ||
                              emp.telefone?.includes(searchTermEmpresa) ||
                              emp.cidade?.toLowerCase().includes(searchTermEmpresa.toLowerCase()) ||
                              emp.usuarios?.some(
                                (u: any) =>
                                  u.nome?.toLowerCase().includes(searchTermEmpresa.toLowerCase()) ||
                                  u.email?.toLowerCase().includes(searchTermEmpresa.toLowerCase())
                              );

                            const status = emp.statusAcesso?.status;
                            const matchStatus =
                              statusFilterEmpresa === "TODOS" ||
                              (statusFilterEmpresa === "TRIAL" && status === "TRIAL") ||
                              (statusFilterEmpresa === "ATIVO" && status === "ATIVO") ||
                              (statusFilterEmpresa === "EXPIRADO" && status === "EXPIRADO");

                            return matchSearch && matchStatus;
                          })
                          .map((emp) => {
                            const status = emp.statusAcesso;
                            const dataFimFormatada = status?.dataExpiracao
                              ? new Date(status.dataExpiracao).toLocaleDateString("pt-BR")
                              : "—";

                            const telLimpo = emp.telefone?.replace(/\D/g, "");

                            return (
                              <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                {/* EMPRESA & CIDADE */}
                                <td className="py-3.5 px-3">
                                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <span>{emp.nomeFantasia}</span>
                                    {emp.isMestre && (
                                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                                        👑 MESTRE
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{emp.cnpj || "Sem CNPJ"}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {emp.cidade ? `${emp.cidade}/${emp.estado || ""}` : "Brasil"} • Cadastrado em {new Date(emp.createdAt).toLocaleDateString("pt-BR")}
                                  </div>
                                </td>

                                {/* ADMIN & CONTATO */}
                                <td className="py-3.5 px-3">
                                  <div className="text-slate-800 dark:text-slate-200 font-medium">
                                    {emp.usuarios?.[0]?.nome || "Admin"}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>{emp.telefone || emp.email}</span>
                                    {telLimpo && (
                                      <a
                                        href={`https://wa.me/55${telLimpo}?text=Olá!%20Mensagem%20da%20administração%20do%20sistema%20Gestão%20de%20Flats.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-500 p-0.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                                        title="Chamar no WhatsApp"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5 inline" />
                                      </a>
                                    )}
                                    {emp.email && (
                                      <a
                                        href={`mailto:${emp.email}`}
                                        className="text-blue-600 hover:text-blue-500 p-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                                        title="Enviar E-mail"
                                      >
                                        <Mail className="w-3.5 h-3.5 inline" />
                                      </a>
                                    )}
                                  </div>
                                </td>

                                {/* PORTFÓLIO / FLATS */}
                                <td className="py-3.5 px-3">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <span>🏠 {emp.metrics?.totalFlats || 0} Flats</span>
                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                      ({emp.metrics?.flatsOcupados || 0} Ocup. • {emp.metrics?.taxaOcupacao || 0}%)
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    📄 {emp.metrics?.totalContratosAtivos || 0} Contratos Ativos • 👥 {emp.counts?.locatarios || 0} Locatários
                                  </div>
                                </td>

                                {/* STORAGE / ESPAÇO */}
                                <td className="py-3.5 px-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStorageModalEmpresa(emp);
                                      setShowStorageModal(true);
                                    }}
                                    className="text-left group hover:opacity-80 transition cursor-pointer"
                                    title="Clique para ver o detalhamento do armazenamento desta empresa"
                                  >
                                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                      <HardDrive className="w-3.5 h-3.5 text-purple-500 inline shrink-0" />
                                      <span>{emp.storage?.totalFormatted || "0 KB"}</span>
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        / {emp.storage?.maxFormatted || "5 GB"}
                                      </span>
                                    </div>
                                    <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                                      <div
                                        className={`h-full rounded-full ${
                                          (emp.storage?.percentage || 0) > 90
                                            ? "bg-rose-500"
                                            : (emp.storage?.percentage || 0) > 70
                                            ? "bg-amber-500"
                                            : "bg-emerald-500"
                                        }`}
                                        style={{ width: `${Math.max(3, Math.min(100, emp.storage?.percentage || 0))}%` }}
                                      />
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-0.5 group-hover:text-purple-600 transition">
                                      {emp.storage?.percentage || 0}% • Ver Detalhes 🔍
                                    </div>
                                  </button>
                                </td>

                                {/* ALUGUÉIS GERIDOS (VGV) */}
                                <td className="py-3.5 px-3">
                                  <div className="font-bold text-blue-700 dark:text-blue-400">
                                    R$ {(emp.metrics?.volumeAluguelMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    <span className="text-[10px] font-normal text-slate-500">/mês</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    Arrecadado: R$ {(emp.metrics?.totalRecebidoHistorico || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </div>
                                </td>

                                {/* PLANO & MENSALIDADE SAAS */}
                                <td className="py-3.5 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${emp.isMestre ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                                      {emp.isMestre ? "VITALÍCIO" : (emp.planoAtual || "MENSAL")}
                                    </span>
                                  </div>
                                  {!emp.isMestre && (
                                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                                      R$ {(emp.metrics?.mensalidadeSaaS || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                      <span className="text-[9px] font-normal text-slate-400">/mês</span>
                                    </div>
                                  )}
                                </td>

                                {/* STATUS */}
                                <td className="py-3.5 px-3 text-center">
                                  {emp.isMestre ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                                      👑 VITALÍCIO
                                    </span>
                                  ) : (
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                        status?.status === "ATIVO"
                                          ? "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                                          : status?.status === "TRIAL"
                                          ? "bg-blue-100 dark:bg-blue-950/60 border-blue-300 text-blue-700 dark:text-blue-300"
                                          : "bg-rose-100 dark:bg-rose-950/60 border-rose-300 text-rose-700 dark:text-rose-300"
                                      }`}
                                    >
                                      {status?.status === "TRIAL"
                                        ? `TRIAL (${status.diasRestantes}d)`
                                        : status?.status === "ATIVO"
                                        ? "ATIVO"
                                        : "EXPIRADO"}
                                    </span>
                                  )}
                                </td>

                                {/* EXPIRAÇÃO */}
                                <td className="py-3.5 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                  {emp.isMestre ? (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">Vitalício</span>
                                  ) : (
                                    <span className={`text-xs ${status?.status === "EXPIRADO" ? "text-rose-600 dark:text-rose-400 font-bold" : ""}`}>
                                      {dataFimFormatada}
                                    </span>
                                  )}
                                </td>

                                {/* AÇÕES */}
                                <td className="py-3.5 px-3 text-right">
                                  {!emp.isMestre ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenLiberarModal(emp)}
                                        className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-1 transition shadow-xs"
                                        title="Liberar acesso ou alterar plano da empresa"
                                      >
                                        <Unlock className="w-3.5 h-3.5" />
                                        <span>Liberar / Plano</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] font-bold text-amber-500">Mestre</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-ABA 2: GESTÃO DE PLANOS, LIMITES E PREÇOS */}
          {saasSubTab === "planos" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Matriz de Planos, Limites & Preços do SaaS</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Defina os limites de imóveis, usuários, vistorias, armazenamento e crie planos sob medida para clientes especiais com link VIP exclusivo.
                    </p>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenNewPlan}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                      title="Criar novo plano sob medida para clientes específicos"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Novo Plano Customizado</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestaurarPlanosPadrao}
                      disabled={salvandoPlanos}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Restaurar Padrões
                    </button>

                    <button
                      type="button"
                      onClick={handleSalvarPlanosSaaS}
                      disabled={salvandoPlanos}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{salvandoPlanos ? "Salvando..." : "Salvar Configurações"}</span>
                    </button>
                  </div>
                </div>

                {loadingPlanos ? (
                  <div className="text-center py-12 text-xs text-slate-500">Carregando dados dos planos...</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.keys(saasPlanos)
                      .filter((s) => s !== "TRIAL" && s !== "MESTRE")
                      .map((slug) => {
                      const p = saasPlanos[slug] || {};
                      const limits = p.limits || {};
                      const features = p.features || {};

                      const updatePlan = (field: string, val: any) => {
                        setSaasPlanos((prev) => ({
                          ...prev,
                          [slug]: {
                            ...prev[slug],
                            [field]: val,
                          },
                        }));
                      };

                      const updateLimit = (field: string, val: any) => {
                        setSaasPlanos((prev) => ({
                          ...prev,
                          [slug]: {
                            ...prev[slug],
                            limits: {
                              ...(prev[slug]?.limits || {}),
                              [field]: Number(val),
                            },
                          },
                        }));
                      };

                      const updateFeature = (field: string, val: any) => {
                        setSaasPlanos((prev) => ({
                          ...prev,
                          [slug]: {
                            ...prev[slug],
                            features: {
                              ...(prev[slug]?.features || {}),
                              [field]: val,
                            },
                          },
                        }));
                      };

                      return (
                        <div
                          key={slug}
                          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-4 shadow-xs relative ${
                            p.visivelPublico === false
                              ? "border-purple-300 dark:border-purple-800/80 bg-purple-50/10"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          {/* Topo do Card do Plano */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
                            <div className="flex items-center space-x-2">
                              <span className={`p-1.5 px-2.5 rounded-xl font-bold text-xs ${
                                p.visivelPublico === false
                                  ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                              }`}>
                                {slug}
                              </span>
                              <div>
                                <input
                                  type="text"
                                  value={p.name || ""}
                                  onChange={(e) => updatePlan("name", e.target.value)}
                                  className="font-bold text-sm text-slate-900 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 px-1 py-0.5"
                                  placeholder="Nome do Plano"
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 flex-wrap">
                              {p.visivelPublico === false ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>VIP / Oculto</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                  <Globe className="w-2.5 h-2.5" />
                                  <span>Público</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleCopyVipLink(slug)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
                                title="Copiar Link VIP Direto para este plano (/renovar?planoId=...)"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditPlan(slug)}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-bold text-xs flex items-center gap-1"
                                title="Editar avançado (Visibilidade, Clientes VIP, etc.)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Avançado</span>
                              </button>

                              {(p.isCustom || !["ESSENCIAL", "PROFISSIONAL", "GESTAO", "EMPRESARIAL"].includes(slug)) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomPlan(slug)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                                  title="Excluir Plano Personalizado"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Bloco 1: Preços */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                              💰 Tabela de Preços (R$)
                            </span>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">Preço Mensal (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={p.priceMonthly ?? 0}
                                  onChange={(e) => updatePlan("priceMonthly", parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">Equiv. Mensal no Anual</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={p.priceYearlyMonthlyEquivalent ?? 0}
                                  onChange={(e) => updatePlan("priceYearlyMonthlyEquivalent", parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">Preço Anual Total (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={p.priceYearlyTotal ?? 0}
                                  onChange={(e) => updatePlan("priceYearlyTotal", parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bloco 2: Limites Numéricos de Capacidade */}
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                              📊 Limites de Capacidade & Quotas
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">🏢 Imóveis / Flats</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={limits.maxProperties ?? 1}
                                  onChange={(e) => updateLimit("maxProperties", e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">👥 Usuários / Equipe</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={limits.maxUsers ?? 1}
                                  onChange={(e) => updateLimit("maxUsers", e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">✍️ Assinaturas / Mês</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={limits.maxSignaturesPerMonth ?? 5}
                                  onChange={(e) => updateLimit("maxSignaturesPerMonth", e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">💾 Armazenamento (GB)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={limits.maxStorageGB ?? 2}
                                  onChange={(e) => updateLimit("maxStorageGB", e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">🤝 Proprietários / Repasses</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={limits.maxOwners ?? 0}
                                  onChange={(e) => updateLimit("maxOwners", e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">📱 Disparos WhatsApp / Mês</label>
                                <input
                                  type="number"
                                  min="10"
                                  value={limits.maxWhatsAppMessagesPerMonth ?? 150}
                                  onChange={(e) => updateLimit("maxWhatsAppMessagesPerMonth", e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bloco 3: Recursos & Suporte */}
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                              ⚙️ Recursos & Nível de Suporte
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(features.gestaoProprietarios)}
                                  onChange={(e) => updateFeature("gestaoProprietarios", e.target.checked)}
                                  className="rounded text-amber-600"
                                />
                                <span className="text-slate-700 dark:text-slate-300">Gestão de Proprietários</span>
                              </label>

                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(features.repassesAutomaticos)}
                                  onChange={(e) => updateFeature("repassesAutomaticos", e.target.checked)}
                                  className="rounded text-amber-600"
                                />
                                <span className="text-slate-700 dark:text-slate-300">Repasses Automáticos</span>
                              </label>

                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(features.boletosInterBolepix)}
                                  onChange={(e) => updateFeature("boletosInterBolepix", e.target.checked)}
                                  className="rounded text-amber-600"
                                />
                                <span className="text-slate-700 dark:text-slate-300">Boletos Bolepix Inter</span>
                              </label>

                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(features.vistoriasComFotos)}
                                  onChange={(e) => updateFeature("vistoriasComFotos", e.target.checked)}
                                  className="rounded text-amber-600"
                                />
                                <span className="text-slate-700 dark:text-slate-300">Vistorias com Câmera</span>
                              </label>
                            </div>

                            <div className="pt-2">
                              <label className="block text-[10px] text-slate-500 mb-0.5">Nível de Suporte</label>
                              <select
                                value={features.suporteNivel || "PADRAO"}
                                onChange={(e) => updateFeature("suporteNivel", e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100"
                              >
                                <option value="PADRAO">WhatsApp Padrão</option>
                                <option value="PRIORITARIO">Suporte Prioritário</option>
                                <option value="GERENTE_CONTA">Gerente de Conta Dedicado</option>
                                <option value="SLA_DEDICADO">SLA 24/7 Dedicado</option>
                              </select>
                            </div>
                          </div>

                          {/* Bloco 4: Descrição e Recomendado Para */}
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-0.5">Descrição do Plano</label>
                              <input
                                type="text"
                                value={p.description || ""}
                                onChange={(e) => updatePlan("description", e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                                placeholder="Descrição..."
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-0.5">Ideal Para (Recomendação)</label>
                              <input
                                type="text"
                                value={p.idealPara || ""}
                                onChange={(e) => updatePlan("idealPara", e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                                placeholder="Ex: Investidores com até 10 flats..."
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-ABA 3: CONFIGURAÇÃO GLOBAL DO SAAS */}
            {saasSubTab === "config" && (
              <form onSubmit={handleSaveSaasConfig} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Parâmetros de Assinatura, PIX e Mensagens</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Defina dias de teste grátis para novos cadastros, chave PIX para pagamentos e avisos automáticos. Para alterar preços e limites, use a aba{" "}
                    <button
                      type="button"
                      onClick={() => setSaasSubTab("planos")}
                      className="font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                    >
                      📦 Gestão de Planos, Limites & Preços
                    </button>
                  </p>
                </div>

                {/* Bloco 1: Período de Teste Grátis */}
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-3 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Período de Teste Grátis (Trial)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Dias de Teste Grátis Padrão para Novos Cadastros *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        required
                        value={saasDiasTrial}
                        onChange={(e) => setSaasDiasTrial(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">Ex: 7 dias, 15 dias ou 30 dias de teste grátis.</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Dias de Aviso Antes de Expirar (WhatsApp) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        required
                        value={saasDiasAviso}
                        onChange={(e) => setSaasDiasAviso(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">Dispara o aviso de WhatsApp quando faltarem X dias para o fim do teste/plano.</span>
                    </div>
                  </div>
                </div>

                {/* Bloco 2: Dados do PIX para Recebimento */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-3 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-cyan-500" />
                    <span>Dados do PIX para Recebimento das Assinaturas</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chave PIX *</label>
                      <input
                        type="text"
                        required
                        placeholder="contato@pajotech.com.br"
                        value={saasChavePix}
                        onChange={(e) => setSaasChavePix(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Chave</label>
                      <select
                        value={saasTipoPix}
                        onChange={(e) => setSaasTipoPix(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                      >
                        <option value="EMAIL">E-mail</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="CPF">CPF</option>
                        <option value="TELEFONE">Telefone</option>
                        <option value="ALEATORIA">Chave Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Beneficiário (Nome) *</label>
                      <input
                        type="text"
                        required
                        placeholder="PAJO TECNOLOGIA"
                        value={saasNomePix}
                        onChange={(e) => setSaasNomePix(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cidade do PIX *</label>
                      <input
                        type="text"
                        required
                        placeholder="RECIFE"
                        value={saasCidadePix}
                        onChange={(e) => setSaasCidadePix(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco 3: Telefone de Suporte e Mensagem WhatsApp */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-3 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>WhatsApp de Suporte & Template de Mensagem</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Telefone / WhatsApp de Suporte para Receber Comprovantes
                      </label>
                      <input
                        type="text"
                        value={saasTelSuporte}
                        onChange={(e) => setSaasTelSuporte(e.target.value)}
                        className="w-full sm:w-80 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Modelo de Mensagem de Aviso de Expiração via WhatsApp
                      </label>
                      <textarea
                        rows={3}
                        value={saasMsgAviso}
                        onChange={(e) => setSaasMsgAviso(e.target.value)}
                        placeholder="Olá, {{nome}}! Informamos que o período de teste do Gestão de Imóveis para Locação..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 font-mono text-xs"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Tags dinâmicas disponíveis: <code>{"{{nome}}"}</code>, <code>{"{{empresa}}"}</code>, <code>{"{{dias_restantes}}"}</code>, <code>{"{{data_expiracao}}"}</code>, <code>{"{{link_renovacao}}"}</code>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloco 5: Notificações por E-mail do Super Admin */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-3 flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span>Notificações por E-mail do Super Admin</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        E-mail do Super Admin para Receber Alertas *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="pajotecnologia@gmail.com"
                        value={saasEmailAdmin}
                        onChange={(e) => setSaasEmailAdmin(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Recebe e-mails instantâneos sempre que houver novo cadastro (trial) ou confirmação de contratação.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSaasConfig}
                    className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {savingSaasConfig ? "Salvando..." : "Salvar Configurações SaaS"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA: BANCO INTER (BOLETO COM PIX / BOLEPIX) */}
        {activeTab === "inter" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
                  <Zap className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-2">
                    <span>Integração Banco Inter (API Cobrança Bolepix v3)</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      bancoInterAtivo 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                    }`}>
                      {bancoInterAtivo ? "● ATIVO" : "○ INATIVO"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Emita boletos bancários com QR Code Pix acoplado, autenticação mTLS e conciliação automática via Webhook.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTestInter}
                  disabled={testingInter}
                  className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                  title="Testar Conexão mTLS e Token OAuth 2.0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${testingInter ? "animate-spin" : ""}`} />
                  <span>{testingInter ? "Testando..." : "Testar Conexão"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveInter}
                  disabled={savingInter}
                  className="py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingInter ? "Salvando..." : "Salvar Configurações"}</span>
                </button>
              </div>
            </div>

            {/* STATUS DO TESTE AO VIVO */}
            {testInterResult && (
              <div
                className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-3 border shadow-sm ${
                  testInterResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                    : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                }`}
              >
                {testInterResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                <div className="flex-1">
                  <span className="font-bold block">{testInterResult.success ? "Conexão Estabelecida com Sucesso!" : "Falha na Autenticação:"}</span>
                  <span className="font-normal text-[11px]">{testInterResult.message}</span>
                </div>
              </div>
            )}

            {/* SELEÇÃO DE STATUS E AMBIENTE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status da Integração
                </label>
                <div className="flex items-center space-x-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setBancoInterAtivo(!bancoInterAtivo)}
                    className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {bancoInterAtivo ? (
                      <ToggleRight className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400" />
                    )}
                    <span>{bancoInterAtivo ? "Integração Ativa" : "Integração Desativada"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ambiente de Execução
                </label>
                <select
                  value={bancoInterAmbiente}
                  onChange={(e) => setBancoInterAmbiente(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="PRODUCAO">🟢 Produção (Dinheiro Real)</option>
                  <option value="SANDBOX">🟡 Sandbox (Ambiente de Testes)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Conta Corrente Banco Inter (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12345678-9"
                  value={bancoInterContaCorrente}
                  onChange={(e) => setBancoInterContaCorrente(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* CREDENCIAIS OAUTH 2.0 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span>1. Credenciais da Aplicação (Internet Banking Inter)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 12345678-abcd-1234-abcd-1234567890ab"
                    value={bancoInterClientId}
                    onChange={(e) => setBancoInterClientId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Disponível no Internet Banking em Conta Digital &gt; Integrações &gt; Nova Integração.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Client Secret *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInterSecret(!showInterSecret)}
                      className="text-[11px] text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 flex items-center space-x-1"
                    >
                      {showInterSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showInterSecret ? "Ocultar" : "Mostrar"}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showInterSecret ? "text" : "password"}
                      required
                      placeholder="Cole aqui o Client Secret gerado no Inter"
                      value={bancoInterClientSecret}
                      onChange={(e) => setBancoInterClientSecret(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-slate-100 pr-10"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Gerado no Internet Banking juntamente com o Client ID.
                  </span>
                </div>
              </div>
            </div>

            {/* CERTIFICADOS DIGITAIS MTLS (.CRT E .KEY) */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <PenTool className="w-4 h-4 text-orange-500" />
                <span>2. Certificado Digital Mútuo (mTLS)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* UPLOAD DO CERTIFICADO .CRT */}
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <span>📄 Certificado (.crt)</span>
                      {bancoInterHasCertCrt && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                          ✓ Carregado
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Selecione o arquivo <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.crt</code> extraído do arquivo .zip fornecido pelo Banco Inter.
                  </p>
                  <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-orange-500" />
                    <span>Selecionar Arquivo .crt</span>
                    <input
                      type="file"
                      accept=".crt,.pem,.cer"
                      onChange={handleFileUploadCrt}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* UPLOAD DA CHAVE PRIVADA .KEY */}
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <span>🔑 Chave Privada (.key)</span>
                      {bancoInterHasCertKey && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                          ✓ Carregada
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Selecione o arquivo <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.key</code> extraído do arquivo .zip fornecido pelo Banco Inter.
                  </p>
                  <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-orange-500" />
                    <span>Selecionar Arquivo .key</span>
                    <input
                      type="file"
                      accept=".key,.pem"
                      onChange={handleFileUploadKey}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* CONFIGURAÇÃO DO WEBHOOK AUTOMÁTICO */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span>3. Webhook de Conciliação e Baixa Automática</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Quando o locatário pagar via Pix ou Boleto, o Banco Inter notifica este endpoint e o sistema dá baixa imediata no Contas a Receber.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRegisterWebhookInter}
                  disabled={registeringWebhookInter}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-xs disabled:opacity-50 self-start"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${registeringWebhookInter ? "animate-spin" : ""}`} />
                  <span>{registeringWebhookInter ? "Registrando..." : "Registrar Webhook no Inter"}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL de Callback do Webhook (Endpoint Público)
                </label>
                <input
                  type="url"
                  placeholder="https://seudominio.com.br/api/webhooks/banco-inter"
                  value={bancoInterWebhookUrl}
                  onChange={(e) => setBancoInterWebhookUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Deixe em branco para usar automaticamente a URL pública da sua VPS / domínio. Requer conexão HTTPS válida.
                </span>
              </div>
            </div>

            {/* GUIA RÁPIDO DE SUPORTE */}
            <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 text-xs space-y-2">
              <span className="font-bold text-orange-900 dark:text-orange-200 flex items-center space-x-1.5">
                <span>💡 Como obter as credenciais no Banco Inter:</span>
              </span>
              <ol className="list-decimal list-inside text-orange-800 dark:text-orange-300 space-y-1 text-[11px] leading-relaxed">
                <li>Acesse o <strong>Internet Banking PJ do Banco Inter</strong> no computador.</li>
                <li>Vá no menu <strong>Conta Digital &gt; Integrações &gt; Nova Integração</strong>.</li>
                <li>Selecione o escopo obrigatório: <strong>API Cobrança (Boleto com Pix)</strong> para leitura e emissão.</li>
                <li>Baixe o arquivo <code className="font-mono bg-orange-200/60 dark:bg-orange-900/60 px-1 py-0.5 rounded">.zip</code> contendo os certificados <code className="font-mono">.crt</code> e <code className="font-mono">.key</code>.</li>
                <li>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong> gerados e cole nos campos acima.</li>
                <li>Carregue os arquivos <code className="font-mono">.crt</code> e <code className="font-mono">.key</code> e clique em <strong>Testar Conexão</strong>!</li>
              </ol>
            </div>
          </div>
        )}

        {/* MODAL LIBERAR / RENOVAR ACESSO E ATRIBUIR PLANO DE EMPRESA */}
        {showLiberarModal && empresaLiberar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] my-auto overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Atribuir Plano & Liberar Acesso
                    </h3>
                    <p className="text-xs text-slate-500">
                      Defina o plano SaaS, status da assinatura e período de validade
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLiberarModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informações da Empresa */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{empresaLiberar.nomeFantasia}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Atual: {empresaLiberar.planoAtual || "TRIAL"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>CNPJ: {empresaLiberar.cnpj}</span>
                  <span>
                    Validade Atual:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {empresaLiberar.dataFimAcesso ? new Date(empresaLiberar.dataFimAcesso).toLocaleDateString("pt-BR") : "Indefinida"}
                    </strong>
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmarLiberacao} className="space-y-4 text-xs">
                {/* 1. SELEÇÃO DO PLANO ATRIBUÍDO */}
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Plano Atribuído
                  </label>
                  <select
                    value={liberarPlano}
                    onChange={(e) => setLiberarPlano(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {Object.keys(saasPlanos).length > 0 ? (
                      Object.keys(saasPlanos)
                        .filter((slug) => slug !== "MESTRE")
                        .map((slug) => {
                          const p = saasPlanos[slug] || {};
                          return (
                            <option key={slug} value={slug}>
                              {p.name || slug} {p.priceMonthly ? `(R$ ${p.priceMonthly.toFixed(2).replace(".", ",")}/mês)` : ""}
                            </option>
                          );
                        })
                    ) : (
                      <>
                        <option value="ESSENCIAL">Plano Essencial (R$ 79,00/mês)</option>
                        <option value="PROFISSIONAL">Plano Profissional (R$ 149,00/mês)</option>
                        <option value="GESTAO">Plano Gestão (R$ 249,00/mês)</option>
                        <option value="EMPRESARIAL">Plano Empresarial (R$ 399,00/mês)</option>
                        <option value="ENTERPRISE">Plano Enterprise (R$ 699,00/mês)</option>
                        <option value="TRIAL">TRIAL (Teste Grátis)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* 2. STATUS DA ASSINATURA */}
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Status da Assinatura
                  </label>
                  <select
                    value={liberarStatus}
                    onChange={(e) => setLiberarStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="ATIVO">🟢 ATIVO (Acesso Total Liberado)</option>
                    <option value="TRIAL">🔵 TRIAL (Período de Teste Grátis)</option>
                    <option value="BLOQUEADO">🔴 BLOQUEADO (Acesso Suspenso)</option>
                    <option value="EXPIRADO">⚪ EXPIRADO (Aguardando Pagamento)</option>
                  </select>
                </div>

                {/* 3. PERÍODO DE VALIDADE / PRORROGAÇÃO */}
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Validade do Acesso / Prorrogação
                  </label>
                  <select
                    value={liberarTipo}
                    onChange={(e) => setLiberarTipo(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="MESES">Adicionar Meses (ex: +1 mês, +3 meses, +12 meses)</option>
                    <option value="DIAS">Adicionar Dias (ex: +7 dias, +15 dias, +30 dias)</option>
                    <option value="CUSTOM">Definir Data Exata de Vencimento</option>
                    <option value="MANTER">Manter Data Atual (Apenas mudar Plano/Status)</option>
                  </select>
                </div>

                {liberarTipo === "MESES" && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantidade de Meses a Adicionar</label>
                    <select
                      value={liberarQtd}
                      onChange={(e) => setLiberarQtd(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="1">+1 Mês</option>
                      <option value="2">+2 Meses</option>
                      <option value="3">+3 Meses (Trimestral)</option>
                      <option value="6">+6 Meses (Semestral)</option>
                      <option value="12">+12 Meses (1 Ano)</option>
                      <option value="24">+24 Meses (2 Anos)</option>
                    </select>
                  </div>
                )}

                {liberarTipo === "DIAS" && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantidade de Dias a Adicionar</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={liberarQtd}
                      onChange={(e) => setLiberarQtd(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                {liberarTipo === "CUSTOM" && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nova Data de Expiração</label>
                    <input
                      type="date"
                      required
                      value={liberarDataCustom}
                      onChange={(e) => setLiberarDataCustom(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowLiberarModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLiberar}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer transition"
                  >
                    {submittingLiberar ? "Salvando..." : "Salvar & Atribuir Plano"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CRIAR / EDITAR PLANO SAAS PERSONALIZADO */}
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 bg-slate-50/80 dark:bg-slate-950/50">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      {editingPlanSlug ? `Editar Plano: ${planFormData.name || editingPlanSlug}` : "Criar Novo Plano Personalizado"}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Configure os preços, quotas e visibilidade exclusiva do plano SaaS
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form id="formCustomPlan" onSubmit={handleSaveCustomPlan} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* 1. DADOS BÁSICOS */}
                <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>1. Informações Básicas do Plano</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="min-w-0">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Plano *</label>
                      <input
                        type="text"
                        required
                        value={planFormData.name || ""}
                        onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: VIP Construtora"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Código / Slug Único *</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingPlanSlug)}
                        value={planFormData.slug || ""}
                        onChange={(e) => setPlanFormData({ ...planFormData, slug: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: VIP_SILVA"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Badge Visual</label>
                      <input
                        type="text"
                        value={planFormData.badge || ""}
                        onChange={(e) => setPlanFormData({ ...planFormData, badge: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: SOB MEDIDA"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. VISIBILIDADE & EXCLUSIVIDADE */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-3">
                  <span className="font-bold text-purple-900 dark:text-purple-200 block text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>2. Visibilidade & Controle de Acesso</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 cursor-pointer hover:border-purple-400 transition">
                      <input
                        type="radio"
                        name="visibilidade"
                        checked={planFormData.visivelPublico !== false}
                        onChange={() => setPlanFormData({ ...planFormData, visivelPublico: true })}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">🌐 Público para Todos</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">Exibido na Landing Page e na tela /renovar de todos os clientes.</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 cursor-pointer hover:border-purple-400 transition">
                      <input
                        type="radio"
                        name="visibilidade"
                        checked={planFormData.visivelPublico === false}
                        onChange={() => setPlanFormData({ ...planFormData, visivelPublico: false })}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">🔒 Privado / VIP (Oculto)</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">Apenas acessível via link VIP ou pelas empresas autorizadas abaixo.</span>
                      </div>
                    </label>
                  </div>

                  {planFormData.visivelPublico === false && (
                    <div className="pt-2 border-t border-purple-200 dark:border-purple-800/80">
                      <label className="block font-semibold text-purple-900 dark:text-purple-200 mb-1.5 text-[11px]">
                        Empresas Autorizadas a Ver este Plano na tela /renovar:
                      </label>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800">
                        {empresasSaaS.length === 0 ? (
                          <span className="text-[11px] text-slate-400 p-2 block">Nenhuma empresa cadastrada.</span>
                        ) : (
                          empresasSaaS.map((emp) => {
                            const isChecked = (planFormData.empresasAutorizadasIds || []).includes(emp.id);
                            return (
                              <label key={emp.id} className="flex items-center space-x-2.5 text-[11px] cursor-pointer hover:bg-purple-50/50 dark:hover:bg-slate-800/50 p-1.5 rounded-lg transition">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const current = planFormData.empresasAutorizadasIds || [];
                                    if (e.target.checked) {
                                      setPlanFormData({ ...planFormData, empresasAutorizadasIds: [...current, emp.id] });
                                    } else {
                                      setPlanFormData({ ...planFormData, empresasAutorizadasIds: current.filter((id: string) => id !== emp.id) });
                                    }
                                  }}
                                  className="rounded text-purple-600 focus:ring-purple-500"
                                />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{emp.nomeFantasia}</span>
                                <span className="text-slate-400 text-[10px]">({emp.cnpj || emp.email})</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. TABELA DE PREÇOS */}
                <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>3. Valores dos Ciclos de Pagamento</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="min-w-0 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Mensal (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={planFormData.priceMonthly ?? 0}
                        onChange={(e) => setPlanFormData({ ...planFormData, priceMonthly: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="min-w-0 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Trimestral (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={planFormData.priceQuarterly ?? 0}
                        onChange={(e) => setPlanFormData({ ...planFormData, priceQuarterly: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="min-w-0 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Semestral (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={planFormData.priceSemiannual ?? 0}
                        onChange={(e) => setPlanFormData({ ...planFormData, priceSemiannual: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <div className="min-w-0 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Anual Total (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={planFormData.priceYearlyTotal ?? 0}
                        onChange={(e) => {
                          const total = parseFloat(e.target.value) || 0;
                          setPlanFormData({
                            ...planFormData,
                            priceYearlyTotal: total,
                            priceYearlyMonthlyEquivalent: Math.round(total / 12),
                          });
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. LIMITES DE CAPACIDADE */}
                <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>4. Quotas e Limites Operacionais</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <span>🏢</span> <span>Limite Imóveis / Flats</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={planFormData.limits?.maxProperties ?? 10}
                        onChange={(e) => setPlanFormData({
                          ...planFormData,
                          limits: { ...planFormData.limits, maxProperties: parseInt(e.target.value, 10) || 1 },
                        })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <span>👥</span> <span>Limite Usuários / Equipe</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={planFormData.limits?.maxUsers ?? 2}
                        onChange={(e) => setPlanFormData({
                          ...planFormData,
                          limits: { ...planFormData.limits, maxUsers: parseInt(e.target.value, 10) || 1 },
                        })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <span>💾</span> <span>Armazenamento (GB)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={planFormData.limits?.maxStorageGB ?? 5}
                        onChange={(e) => setPlanFormData({
                          ...planFormData,
                          limits: { ...planFormData.limits, maxStorageGB: parseInt(e.target.value, 10) || 1 },
                        })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <span>✍️</span> <span>Assinaturas Digitais / Mês</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={planFormData.limits?.maxSignaturesPerMonth ?? 20}
                        onChange={(e) => setPlanFormData({
                          ...planFormData,
                          limits: { ...planFormData.limits, maxSignaturesPerMonth: parseInt(e.target.value, 10) || 1 },
                        })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <span>📱</span> <span>WhatsApp Msg / Mês</span>
                      </label>
                      <input
                        type="number"
                        min="10"
                        value={planFormData.limits?.maxWhatsAppMessagesPerMonth ?? 500}
                        onChange={(e) => setPlanFormData({
                          ...planFormData,
                          limits: { ...planFormData.limits, maxWhatsAppMessagesPerMonth: parseInt(e.target.value, 10) || 10 },
                        })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <span>🤝</span> <span>Proprietários / Repasses</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={planFormData.limits?.maxOwners ?? 5}
                        onChange={(e) => setPlanFormData({
                          ...planFormData,
                          limits: { ...planFormData.limits, maxOwners: parseInt(e.target.value, 10) || 0 },
                        })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. DESCRIÇÃO & DESTACADOS */}
                <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>5. Descrição e Apresentação</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição do Plano</label>
                      <input
                        type="text"
                        value={planFormData.description || ""}
                        onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Benefícios e destaques..."
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Ideal Para</label>
                      <input
                        type="text"
                        value={planFormData.idealPara || ""}
                        onChange={(e) => setPlanFormData({ ...planFormData, idealPara: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Construtoras com múltiplos prédios..."
                      />
                    </div>
                  </div>
                </div>
              </form>

              {/* Fixed Footer Actions */}
              <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50 dark:bg-slate-950 flex items-center justify-end space-x-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="formCustomPlan"
                  disabled={savingCustomPlan}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingCustomPlan ? "Salvando..." : "Salvar Plano"}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL RAIO-X DE ARMAZENAMENTO / STORAGE POR EMPRESA */}
        {showStorageModal && storageModalEmpresa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] my-auto overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Raio-X de Storage: {storageModalEmpresa.nomeFantasia}

                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStorageModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* CARD DE CONSUMO TOTAL */}
              <div className="bg-purple-50/60 dark:bg-purple-950/40 p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 dark:text-purple-200">Consumo Total em Disco:</span>
                  <span className="font-black text-purple-700 dark:text-purple-300 text-base">
                    {storageModalEmpresa.storage?.totalFormatted || "0 KB"} / {storageModalEmpresa.storage?.maxFormatted || "5 GB"}
                  </span>
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-900/60 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (storageModalEmpresa.storage?.percentage || 0) > 90
                        ? "bg-rose-500"
                        : (storageModalEmpresa.storage?.percentage || 0) > 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.max(3, Math.min(100, storageModalEmpresa.storage?.percentage || 0))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-purple-700 dark:text-purple-400 font-medium">
                  <span>{storageModalEmpresa.storage?.percentage || 0}% da cota do plano utilizada</span>
                  <span>Plano: {storageModalEmpresa.planoAtual || "MENSAL"}</span>
                </div>
              </div>

              {/* DETALHAMENTO POR CATEGORIA */}
              <div className="space-y-2.5 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Detalhamento por Tipo de Mídia:</span>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">🏠</span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Galeria de Flats & Imóveis</span>
                      <span className="text-[10px] text-slate-500">
                        {storageModalEmpresa.storage?.details?.flatsPhotosCount || 0} fotos de alta resolução
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {storageModalEmpresa.storage?.details?.flatsFormatted || "0 KB"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">📋</span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Vistorias & Laudos Periciais</span>
                      <span className="text-[10px] text-slate-500">
                        {storageModalEmpresa.storage?.details?.vistoriasPhotosCount || 0} fotos de vistorias com laudo
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {storageModalEmpresa.storage?.details?.vistoriasFormatted || "0 KB"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">✍️</span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Logomarcas & Assinaturas Digitais</span>
                      <span className="text-[10px] text-slate-500">
                        Logos da imobiliária e rubricas do gestor/usuários
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {storageModalEmpresa.storage?.details?.assetsFormatted || "0 KB"}
                  </span>
                </div>
              </div>

              {/* DICA DE OTIMIZAÇÃO */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  O sistema comprime automaticamente todas as fotos para o formato WebP moderno, reduzindo o tamanho em mais de 90% sem perda de nitidez visual.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowStorageModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Fechar Raio-X
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CONECTAR WHATSAPP (QR CODE) */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-auto overflow-hidden relative">
              {/* Header do Modal */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Conectar WhatsApp via QR Code
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Instância: {evolutionInstance || "Principal"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status ou Sucesso */}
              {qrScanSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg ring-8 ring-emerald-400/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    WhatsApp Conectado com Sucesso! 🎉
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    Sua instância já está autenticada e pronta para disparar mensagens e documentos automaticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Área da Imagem do QR Code */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                    {loadingQrCode ? (
                      <div className="py-12 flex flex-col items-center space-y-3">
                        <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                          Gerando QR Code na Evolution API...
                        </span>
                      </div>
                    ) : qrCodeData?.base64 ? (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qrCodeData.base64}
                            alt="QR Code WhatsApp"
                            className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                          />
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Aguardando leitura pelo celular (auto-detecção ativa)...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                          {qrCodeData?.message || "Não foi possível carregar o QR Code. Certifique-se de que a instância foi criada no servidor."}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenQrModal}
                          className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Tentar Novamente</span>
                        </button>
                      </div>
                    )}

                    {/* Código de Pareamento alternativo se disponível */}
                    {qrCodeData?.pairingCode && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full text-center">
                        <span className="text-[10px] text-slate-400 block mb-1">Ou conecte com o Código de Pareamento:</span>
                        <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                          {qrCodeData.pairingCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Passo a Passo Ilustrado */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 text-xs space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Como conectar seu aparelho:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                      <li>Abra o WhatsApp no seu smartphone</li>
                      <li>
                        Toque em <strong>Mais opções</strong> (Android: ⋮) ou <strong>Configurações</strong> (iPhone: ⚙️)
                      </li>
                      <li>
                        Toque em <strong>Aparelhos conectados</strong> e depois em <strong>Conectar um aparelho</strong>
                      </li>
                      <li>Aponte seu celular para o QR Code acima para sincronizar</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Rodapé do Modal */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleOpenQrModal}
                  disabled={loadingQrCode || qrScanSuccess}
                  className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingQrCode ? "animate-spin" : ""}`} />
                  <span>Recarregar QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação Reutilizável */}
        <ConfirmDialog
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText || "Confirmar"}
          cancelText={confirmModal.cancelText || "Cancelar"}
          variant={confirmModal.variant || "primary"}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </Shell>
  );
}

export default function ParametrosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Carregando parâmetros...</div>}>
      <ParametrosContent />
    </Suspense>
  );
}
