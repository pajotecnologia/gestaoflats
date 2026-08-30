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
} from "lucide-react";

function ParametrosContent() {
  const searchParams = useSearchParams();
  const abaParam = searchParams.get("aba");
  const [activeTab, setActiveTab] = useState<"empresa" | "evolution" | "email" | "funcionarios" | "formas" | "saas">("empresa");
  const [empresa, setEmpresa] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Sync tab reativamente do parâmetro URL ?aba=
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          const superAdmin = Boolean(data.user.isSuperAdmin);
          setIsSuperAdmin(superAdmin);
          if (abaParam && ["empresa", "evolution", "email", "funcionarios", "formas", "saas"].includes(abaParam)) {
            if (abaParam === "saas" && !superAdmin) {
              setActiveTab("empresa");
            } else {
              setActiveTab(abaParam as any);
            }
          }
        }
      })
      .catch(() => {
        if (abaParam && ["empresa", "evolution", "email", "funcionarios", "formas"].includes(abaParam)) {
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

  // Form SMTP Gmail / Email Server
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [savingSmtp, setSavingSmtp] = useState(false);

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
  const [submittingFunc, setSubmittingFunc] = useState(false);
  const [errorFunc, setErrorFunc] = useState("");

  const [testEmailDestino, setTestEmailDestino] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Estados do SaaS & Assinaturas
  const [saasSubTab, setSaasSubTab] = useState<"empresas" | "config">("empresas");
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

  // Gestão de Empresas
  const [empresasSaaS, setEmpresasSaaS] = useState<any[]>([]);
  const [summarySaaS, setSummarySaaS] = useState<any>(null);
  const [loadingEmpresasSaaS, setLoadingEmpresasSaaS] = useState(false);
  const [searchTermEmpresa, setSearchTermEmpresa] = useState("");
  const [statusFilterEmpresa, setStatusFilterEmpresa] = useState("TODOS");
  const [showLiberarModal, setShowLiberarModal] = useState(false);
  const [empresaLiberar, setEmpresaLiberar] = useState<any>(null);
  const [liberarTipo, setLiberarTipo] = useState<"MESES" | "DIAS" | "CUSTOM">("MESES");
  const [liberarQtd, setLiberarQtd] = useState(1);
  const [liberarPlano, setLiberarPlano] = useState("MENSAL");
  const [liberarDataCustom, setLiberarDataCustom] = useState("");
  const [submittingLiberar, setSubmittingLiberar] = useState(false);
  const [disparandoAvisos, setDisparandoAvisos] = useState(false);

  const [savingAll, setSavingAll] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

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
    setEmpresaLiberar(emp);
    setLiberarTipo("MESES");
    setLiberarQtd(1);
    setLiberarPlano("MENSAL");
    setLiberarDataCustom("");
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
          status: "ATIVO",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowLiberarModal(false);
        await loadEmpresasSaaS();
        setFeedback({ type: "success", message: `✅ ${data.message || "Acesso liberado com sucesso!"}` });
      } else {
        alert(data.error || "Erro ao liberar acesso");
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setSubmittingLiberar(false);
    }
  };

  const handleDispararAvisosWhatsApp = async () => {
    if (!confirm("Deseja disparar agora os avisos de vencimento de teste/plano para todas as empresas com expiração próxima?")) return;
    setDisparandoAvisos(true);
    try {
      const res = await fetch("/api/saas/avisos-expiracao", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await loadEmpresasSaaS();
        setFeedback({
          type: "success",
          message: `✅ Avisos processados! Total verificadas: ${data.totalVerificadas}, Avisos: ${data.avisosProcessados}.`,
        });
      } else {
        setFeedback({ type: "error", message: `❌ Erro ao disparar avisos: ${data.error}` });
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: `❌ Erro: ${e.message}` });
    } finally {
      setDisparandoAvisos(false);
    }
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

  useEffect(() => {
    loadData();
    loadFuncionarios();
    loadFormas();
    loadSaasConfig();
    loadEmpresasSaaS();
    if (typeof window !== "undefined" && window.location.hash) {
      if (window.location.hash.includes("evolution")) setActiveTab("evolution");
      if (window.location.hash.includes("smtp") || window.location.hash.includes("email")) setActiveTab("email");
      if (window.location.hash.includes("funcionarios")) setActiveTab("funcionarios");
      if (window.location.hash.includes("formas")) setActiveTab("formas");
      if (window.location.hash.includes("saas")) setActiveTab("saas");
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
        setFeedback({ type: "success", message: "Forma de pagamento salva com sucesso!" });
      } else {
        alert(data.error || "Erro ao salvar forma de pagamento");
      }
    } catch (err: any) {
      alert(`Erro: ${err.message || err}`);
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

  const handleDeleteForma = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta forma de pagamento?")) return;
    try {
      const res = await fetch(`/api/formas-pagamento?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadFormas();
      } else {
        alert("Não foi possível excluir esta forma de pagamento.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenNewFuncModal = () => {
    setEditingFunc(null);
    setNomeFunc("");
    setEmailFunc("");
    setSenhaFunc("");
    setCargoFunc("OPERADOR");
    setStatusFunc("ATIVO");
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorFunc(data.error || "Erro ao salvar funcionário.");
        setSubmittingFunc(false);
        return;
      }

      setShowFuncModal(false);
      setFeedback({ type: "success", message: `✅ Funcionário ${nomeFunc} salvo com sucesso!` });
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

  const handleTestEvolution = async () => {
    setTestingEvolution(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/parametros/test-connection", {
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
        setStatusConexao("DESCONECTADO");
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
      alert("Por favor, digite um e-mail de destino no campo de teste.");
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

  const handleSaveAll = async () => {
    setSavingAll(true);
    setFeedback({ type: "", message: "" });

    try {
      const [resEmp, resParam] = await Promise.all([
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
      ]);

      if (resEmp.ok && resParam.ok) {
        setFeedback({ type: "success", message: "✅ Todas as configurações de todas as abas foram salvas com sucesso!" });
        loadData();
      } else {
        setFeedback({ type: "error", message: "Erro ao atualizar dados no servidor." });
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

        {/* CONTROLE DE ABAS INTERATIVAS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab("empresa")}
            className={`px-5 py-3 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
              activeTab === "empresa"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-900"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>🏢 Empresa & Assinatura</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("evolution")}
            className={`px-5 py-3 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
              activeTab === "evolution"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-slate-900"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 Evolution API (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`px-5 py-3 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
              activeTab === "email"
                ? "border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-slate-900"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>📧 Servidor E-mail (SMTP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("funcionarios")}
            className={`px-5 py-3 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
              activeTab === "funcionarios"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-slate-900"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>👥 Funcionários & Equipe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("formas")}
            className={`px-5 py-3 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
              activeTab === "formas"
                ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-slate-900"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>💳 Formas de Pagamento</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("saas")}
              className={`px-5 py-3 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
                activeTab === "saas"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-slate-900"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>⚡ Gestão SaaS & Assinaturas</span>
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

              {/* QUADRO DE DESENHO DA ASSINATURA DA EMPRESA */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <PenTool className="w-4 h-4 text-blue-600" />
                    <span>Quadro de Desenho da Assinatura Oficial da Empresa:</span>
                  </span>
                  {assinaturaUrl && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Assinatura Gravada</span>
                    </span>
                  )}
                </div>

                <SignaturePad onSaveSignature={(base64) => setAssinaturaUrl(base64)} />

                <div className="flex items-center space-x-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Arquivo de Assinatura (PNG/JPG)</span>
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
                              setAssinaturaUrl(reader.result as string);
                              setFeedback({ type: "success", message: "Arquivo de assinatura carregado! Clique em 'Salvar Dados da Empresa' para confirmar." });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {assinaturaUrl && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Assinatura Atual Registrada:</span>
                    <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block">
                      <img src={assinaturaUrl} alt="Assinatura da Empresa" className="h-14 object-contain" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: EVOLUTION API */}
        {activeTab === "evolution" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Integrador Evolution API (WhatsApp)</h2>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
                    statusConexao === "CONECTADO"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                      : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusConexao === "CONECTADO" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  <span>Status: {statusConexao}</span>
                </span>

                <button
                  type="button"
                  onClick={handleSaveEvolution}
                  disabled={savingEvolution}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEvolution ? "Salvar..." : "Salvar Evolution API"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestEvolution}
                  disabled={testingEvolution}
                  className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-200 dark:border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingEvolution ? "animate-spin text-emerald-500" : ""}`} />
                  <span>{testingEvolution ? "Testando..." : "Testar Instância WhatsApp"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  URL da Evolution API
                </label>
                <input
                  type="text"
                  value={evolutionApiUrl}
                  onChange={(e) => setEvolutionApiUrl(e.target.value)}
                  placeholder="ex: https://api.evolution.suaempresa.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  API Key Global
                </label>
                <input
                  type="password"
                  value={evolutionApiKey}
                  onChange={(e) => setEvolutionApiKey(e.target.value)}
                  placeholder="Global API Key da Evolution"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  value={evolutionInstance}
                  onChange={(e) => setEvolutionInstance(e.target.value)}
                  placeholder="ex: empresa_recife"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
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
                <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Usuários & Funcionários da Empresa</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gerencie os acessos, cargos e senhas da equipe com acesso ao sistema.
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
                            title="Editar Funcionário"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>{editingFunc ? "Editar Funcionário" : "Novo Funcionário"}</span>
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

              <form onSubmit={handleSubmitFuncionario} className="space-y-3 text-xs">
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
                    {submittingFunc ? "Salvando..." : "Salvar Funcionário"}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
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
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl">
              <div className="flex space-x-2">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                      <span className="font-bold text-indigo-600 dark:text-indigo-300">{summarySaaS?.taxaOcupacaoGlobal || 0}% Ocupação Média</span>
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
                        Métricas individuais, portfólio de imóveis, receita gerada e controle de mensalidade SaaS
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
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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

            {/* SUB-ABA 2: CONFIGURAÇÃO GLOBAL DO SAAS */}
            {saasSubTab === "config" && (
              <form onSubmit={handleSaveSaasConfig} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Parâmetros de Assinatura, PIX e Mensagens</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Defina dias de teste grátis para novos cadastros, valores dos planos e chave PIX para pagamentos
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

                {/* Bloco 2: Valores dos Planos SaaS */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-3 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Valores dos Planos (R$)</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plano Mensal (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={saasValorMensal}
                        onChange={(e) => setSaasValorMensal(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plano Trimestral (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={saasValorTrimestral}
                        onChange={(e) => setSaasValorTrimestral(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plano Semestral (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={saasValorSemestral}
                        onChange={(e) => setSaasValorSemestral(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plano Anual (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={saasValorAnual}
                        onChange={(e) => setSaasValorAnual(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco 3: Dados do PIX para Recebimento */}
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

                {/* Bloco 4: Telefone de Suporte e Mensagem WhatsApp */}
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
                        placeholder="Olá, {{nome}}! Informamos que o período de teste do Gestão de Flats..."
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

        {/* MODAL LIBERAR / RENOVAR ACESSO DE EMPRESA */}
        {showLiberarModal && empresaLiberar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Unlock className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Liberar / Renovar Acesso
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLiberarModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500 block">Empresa:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{empresaLiberar.nomeFantasia}</span>
                <span className="text-slate-400 text-[11px] block">{empresaLiberar.cnpj}</span>
              </div>

              <form onSubmit={handleConfirmarLiberacao} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Período de Liberação</label>
                  <select
                    value={liberarTipo}
                    onChange={(e) => setLiberarTipo(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value="MESES">Meses (ex: 1 mês, 3 meses, 12 meses)</option>
                    <option value="DIAS">Dias (ex: 7 dias, 15 dias, 30 dias)</option>
                    <option value="CUSTOM">Data de Vencimento Específica</option>
                  </select>
                </div>

                {liberarTipo === "MESES" && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantidade de Meses</label>
                    <select
                      value={liberarQtd}
                      onChange={(e) => {
                        const qtd = Number(e.target.value);
                        setLiberarQtd(qtd);
                        if (qtd === 1) setLiberarPlano("MENSAL");
                        else if (qtd === 3) setLiberarPlano("TRIMESTRAL");
                        else if (qtd === 6) setLiberarPlano("SEMESTRAL");
                        else if (qtd === 12) setLiberarPlano("ANUAL");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="1">+1 Mês (Plano Mensal)</option>
                      <option value="3">+3 Meses (Plano Trimestral)</option>
                      <option value="6">+6 Meses (Plano Semestral)</option>
                      <option value="12">+12 Meses (Plano Anual)</option>
                    </select>
                  </div>
                )}

                {liberarTipo === "DIAS" && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantidade de Dias</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={liberarQtd}
                      onChange={(e) => setLiberarQtd(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
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
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Identificação do Plano</label>
                  <select
                    value={liberarPlano}
                    onChange={(e) => setLiberarPlano(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value="TRIAL">TRIAL (Teste Grátis)</option>
                    <option value="MENSAL">MENSAL</option>
                    <option value="TRIMESTRAL">TRIMESTRAL</option>
                    <option value="SEMESTRAL">SEMESTRAL</option>
                    <option value="ANUAL">ANUAL</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowLiberarModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLiberar}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md disabled:opacity-50"
                  >
                    {submittingLiberar ? "Liberando..." : "Confirmar Liberação"}
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

export default function ParametrosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Carregando parâmetros...</div>}>
      <ParametrosContent />
    </Suspense>
  );
}
