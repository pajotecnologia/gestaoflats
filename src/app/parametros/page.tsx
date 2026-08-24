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
} from "lucide-react";

function ParametrosContent() {
  const searchParams = useSearchParams();
  const abaParam = searchParams.get("aba");
  const [activeTab, setActiveTab] = useState<"empresa" | "evolution" | "email" | "funcionarios" | "formas">("empresa");
  const [empresa, setEmpresa] = useState<any>(null);

  // Sync tab reativamente do parâmetro URL ?aba=
  useEffect(() => {
    if (abaParam && ["empresa", "evolution", "email", "funcionarios", "formas"].includes(abaParam)) {
      setActiveTab(abaParam as any);
    }
  }, [abaParam]);

  // Form Empresa
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [emailEmpresa, setEmailEmpresa] = useState("");
  const [telefoneEmpresa, setTelefoneEmpresa] = useState("");
  const [enderecoEmpresa, setEnderecoEmpresa] = useState("");
  const [logomarcaUrl, setLogomarcaUrl] = useState("");
  const [assinaturaUrl, setAssinaturaUrl] = useState("");
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

  const [savingAll, setSavingAll] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

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
        setLogomarcaUrl(resEmpresa.empresa.logomarcaUrl || "");
        setAssinaturaUrl(resEmpresa.empresa.assinaturaUrl || "");
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
    if (typeof window !== "undefined" && window.location.hash) {
      if (window.location.hash.includes("evolution")) setActiveTab("evolution");
      if (window.location.hash.includes("smtp") || window.location.hash.includes("email")) setActiveTab("email");
      if (window.location.hash.includes("funcionarios")) setActiveTab("funcionarios");
      if (window.location.hash.includes("formas")) setActiveTab("formas");
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
          logomarcaUrl,
          assinaturaUrl,
        }),
      });

      if (res.ok) {
        setFeedback({ type: "success", message: "✅ Dados da empresa e Assinatura Digital salvos com sucesso!" });
      } else {
        setFeedback({ type: "error", message: "❌ Erro ao salvar dados da empresa." });
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
            assinaturaUrl,
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

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    required
                    value={enderecoEmpresa}
                    onChange={(e) => setEnderecoEmpresa(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
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
