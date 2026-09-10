"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getMediaUrl } from "@/lib/media";
import { SYSTEM_VERSION } from "@/lib/version";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  FileText,
  DollarSign,
  TrendingUp,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  SlidersHorizontal,
  FileCode,
  Truck,
  Building,
  BarChart3,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  CreditCard,
  MessageSquare,
  Mail,
  Zap,
  BookOpen,
  Sparkles,
  Clock,
  ShieldCheck,
  Calendar,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";
import FloatingAlertsHub from "@/components/alertas/FloatingAlertsHub";

interface ShellProps {
  children: React.ReactNode;
}

function ShellContent({ children }: ShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const abaParam = searchParams?.get("aba");

  const [currentAba, setCurrentAba] = useState("checklist");
  const [currentParametrosAba, setCurrentParametrosAba] = useState("empresa");

  const [alertasOpen, setAlertasOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [relatoriosExpanded, setRelatoriosExpanded] = useState(false);
  const [parametrosExpanded, setParametrosExpanded] = useState(false);
  const [user, setUser] = useState<{
    nome: string;
    email: string;
    empresaNome: string;
    logomarcaUrl?: string;
    cargo?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
  const [statusAcesso, setStatusAcesso] = useState<{
    status: string;
    planoAtual: string;
    isTrial: boolean;
    isExpirado: boolean;
    isMestre?: boolean;
    diasRestantes: number;
    dataExpiracao: string | null;
    podeAcessar: boolean;
  } | null>(null);

  // Sincronizar estado dos menus apenas quando estiver na respectiva página
  useEffect(() => {
    if (pathname.startsWith("/relatorios")) {
      setRelatoriosExpanded(true);
      setCurrentAba(abaParam || "checklist");
    } else {
      setRelatoriosExpanded(false);
    }

    if (pathname.startsWith("/parametros")) {
      setParametrosExpanded(true);
      setCurrentParametrosAba(abaParam || "empresa");
    } else {
      setParametrosExpanded(false);
    }
  }, [pathname, abaParam]);

  // Sync state with HTML class / localStorage on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Fetch authenticated user once on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser({
            nome: data.user.nome,
            email: data.user.email,
            empresaNome: data.user.empresa?.nomeFantasia || 'Prime Flats',
            logomarcaUrl: data.user.empresa?.logomarcaUrl,
            cargo: data.user.cargo,
            isSuperAdmin: Boolean(data.user.isSuperAdmin),
          });
          if (data.user.statusAcesso) {
            setStatusAcesso(data.user.statusAcesso);
            // Se expirado e não estiver nas páginas liberadas, redireciona para renovação
            if (
              data.user.statusAcesso.isExpirado &&
              !pathname.startsWith("/renovar") &&
              !pathname.startsWith("/ajuda") &&
              !pathname.startsWith("/parametros")
            ) {
              router.push("/renovar");
            }
          }
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const navSections = [
    {
      title: "PRINCIPAL",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Agenda de Reservas", href: "/agenda", icon: Calendar, badge: "Diárias" },
      ],
    },
    {
      title: "IMÓVEIS & CADASTROS",
      items: [
        { label: "Flats & Imóveis", href: "/flats", icon: Building2 },
        { label: "Locatários", href: "/locatarios", icon: UserCheck },
        { label: "Proprietários", href: "/proprietarios", icon: Users },
        { label: "Fornecedores", href: "/fornecedores", icon: Truck },
      ],
    },
    {
      title: "CONTRATOS & VISTORIAS",
      items: [
        { label: "Modelos de Contrato", href: "/contratos/modelos", icon: FileCode },
        { label: "Modelos de Checklist", href: "/checklists", icon: SlidersHorizontal },
        { label: "Vistorias & Checklists", href: "/vistorias", icon: ClipboardCheck },
        { label: "Gestão de Contratos", href: "/contratos", icon: FileText },
      ],
    },
    {
      title: "FINANCEIRO",
      items: [
        { label: "Contas a Receber", href: "/financeiro/receber", icon: TrendingUp },
        { label: "Contas a Pagar", href: "/financeiro/pagar", icon: DollarSign },
        { label: "Repasses a Proprietários", href: "/financeiro/repasses", icon: CreditCard },
      ],
    },
  ];

  const relatoriosSubItems = [
    { label: "Contratos & Blockchain", href: "/relatorios?aba=contratos", aba: "contratos", icon: FileText },
    { label: "Checklist (Em Branco)", href: "/relatorios?aba=checklist", aba: "checklist", icon: ClipboardCheck },
    { label: "Relatório - Contas a Receber", href: "/relatorios?aba=receber", aba: "receber", icon: TrendingUp },
    { label: "Relatório - Contas a Pagar", href: "/relatorios?aba=pagar", aba: "pagar", icon: DollarSign },
    { label: "Fluxo de Caixa Diário", href: "/relatorios?aba=fluxo", aba: "fluxo", icon: BarChart3 },
  ];

  const parametrosSubItems = [
    { label: "Dados da Empresa", href: "/parametros?aba=empresa", aba: "empresa", icon: Building2 },
    { label: "WhatsApp (Evolution API)", href: "/parametros?aba=evolution", aba: "evolution", icon: MessageSquare },
    { label: "Servidor de E-mail", href: "/parametros?aba=email", aba: "email", icon: Mail },
    { label: "Usuários & Permissões", href: "/parametros?aba=funcionarios", aba: "funcionarios", icon: Users },
    { label: "Formas de Pagamento", href: "/parametros?aba=formas", aba: "formas", icon: CreditCard },
    ...(user?.isSuperAdmin
      ? [{ label: "⚡ Gestão SaaS & Assinaturas", href: "/parametros?aba=saas", aba: "saas", icon: Zap }]
      : []),
  ];

  const isRelatoriosActive = pathname.startsWith("/relatorios");
  const isParametrosActive = pathname.startsWith("/parametros");

  // Rótulo da Página Atual para o Breadcrumb Topbar
  const getPageTitle = () => {
    if (pathname === "/dashboard") return { section: "Visão Geral", page: "Dashboard de Indicadores" };
    if (pathname === "/agenda") return { section: "Locações", page: "Agenda de Reservas por Diária" };
    if (pathname === "/flats") return { section: "Imóveis", page: "Flats & Condomínios" };
    if (pathname === "/vistorias") return { section: "Vistorias", page: "Vistorias & Checklists de Imóveis" };
    if (pathname === "/checklists") return { section: "Contratos & Vistorias", page: "Modelos de Checklist" };
    if (pathname === "/locatarios") return { section: "Cadastros", page: "Gestão de Locatários" };
    if (pathname === "/proprietarios") return { section: "Cadastros", page: "Gestão de Proprietários (Locadores)" };
    if (pathname === "/fornecedores") return { section: "Cadastros", page: "Gestão de Fornecedores" };
    if (pathname === "/contratos/modelos") return { section: "Contratos", page: "Modelos de Contrato" };
    if (pathname === "/contratos") return { section: "Contratos", page: "Gestão de Contratos e Aluguéis" };
    if (pathname === "/financeiro/receber") return { section: "Financeiro", page: "Contas a Receber" };
    if (pathname === "/financeiro/pagar") return { section: "Financeiro", page: "Contas a Pagar" };
    if (pathname === "/financeiro/repasses") return { section: "Financeiro", page: "Repasses a Proprietários" };
    if (pathname.startsWith("/relatorios")) return { section: "Auditoria", page: "Relatórios do Sistema" };
    if (pathname.startsWith("/parametros")) return { section: "Sistema", page: "Parâmetros e Integrações" };
    if (pathname === "/ajuda") return { section: "Suporte", page: "Manual do Usuário" };
    return { section: "Gestão", page: "Painel Principal" };
  };

  const breadcrumb = getPageTitle();

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Desktop (Inspirado no estilo Profound / SaaSFrame) */}
      <aside className="hidden md:flex flex-col w-64 h-full border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/95 backdrop-blur p-3.5 space-y-3 flex-shrink-0 select-none">
        
        {/* Workspace Card Header */}
        <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 shadow-xs">
          {user?.logomarcaUrl ? (
            <img
              src={getMediaUrl(user.logomarcaUrl)}
              alt="Logo"
              className="w-9 h-9 rounded-xl object-cover border border-slate-300 dark:border-slate-600 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20 text-sm shrink-0">
              {user?.empresaNome ? user.empresaNome.charAt(0).toUpperCase() : "P"}
            </div>
          )}
          <div className="overflow-hidden min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-tight truncate">
              {user?.empresaNome || "Prime Flats"}
            </h1>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase block truncate">
              Locações & Temporadas
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto pr-1 text-xs">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2.5">
                {section.title}
              </span>
              <div className="space-y-0.5 pt-0.5">
                {section.items.map((item: any) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/contratos"
                      ? pathname === "/contratos"
                      : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-blue-600/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold border-l-[3px] border-blue-600 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* SEÇÃO CONFIGURAÇÕES & RELATÓRIOS (Colapsáveis por padrão) */}
          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2.5">
              RELATÓRIOS & CONFIGURAÇÃO
            </span>

            {/* RELATÓRIOS */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setRelatoriosExpanded(!relatoriosExpanded)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isRelatoriosActive
                    ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border-l-[3px] border-blue-600"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <BarChart3 className={`w-4 h-4 ${isRelatoriosActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                  <span>Relatórios</span>
                </div>
                {relatoriosExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {relatoriosExpanded && (
                <div className="ml-3 pl-2.5 border-l border-slate-200 dark:border-slate-800 mt-1 space-y-0.5">
                  {relatoriosSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = isRelatoriosActive && currentAba === sub.aba;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setCurrentAba(sub.aba)}
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          isSubActive
                            ? "bg-blue-600 text-white font-bold shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <SubIcon className={`w-3 h-3 ${isSubActive ? "text-white" : "text-slate-400"}`} />
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PARÂMETROS DO SISTEMA */}
            <div>
              <button
                type="button"
                onClick={() => setParametrosExpanded(!parametrosExpanded)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isParametrosActive
                    ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border-l-[3px] border-blue-600"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <SlidersHorizontal className={`w-4 h-4 ${isParametrosActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                  <span>Parâmetros</span>
                </div>
                {parametrosExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {parametrosExpanded && (
                <div className="ml-3 pl-2.5 border-l border-slate-200 dark:border-slate-800 mt-1 space-y-0.5">
                  {parametrosSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = isParametrosActive && currentParametrosAba === sub.aba;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setCurrentParametrosAba(sub.aba)}
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          isSubActive
                            ? "bg-blue-600 text-white font-bold shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <SubIcon className={`w-3 h-3 ${isSubActive ? "text-white" : "text-slate-400"}`} />
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MANUAL */}
            <Link
              href="/ajuda"
              className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                pathname === "/ajuda"
                  ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border-l-[3px] border-blue-600"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Manual do Sistema</span>
            </Link>

            {user?.isSuperAdmin && (
              <Link
                href="/parametros?aba=saas"
                className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>⚡ Gestão SaaS</span>
              </Link>
            )}
          </div>
        </nav>
      </aside>

      {/* Area Conteúdo Mobile Header + Topbar + Main */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
        {/* Topbar Estilo Profound (Breadcrumbs + Action Hub) */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 font-medium hidden sm:inline">{breadcrumb.section}</span>
              <span className="text-slate-400 hidden sm:inline">/</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{breadcrumb.page}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Badge de Empresa MESTRE ou Teste Grátis / Assinatura */}
            {statusAcesso && (
              statusAcesso.isMestre || user?.isSuperAdmin ? (
                <Link
                  href="/parametros?aba=saas"
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold transition shadow-xs bg-amber-500/10 text-amber-500 border border-amber-500/25 hover:bg-amber-500/20"
                  title="Empresa Mestre - Acesso Vitalício Irrestrito (Gerenciamento do SaaS)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">👑 MESTRE (Vitalício)</span>
                  <span className="sm:hidden">👑 MESTRE</span>
                </Link>
              ) : (
                <Link
                  href="/renovar"
                  className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                    statusAcesso.isExpirado
                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20"
                      : statusAcesso.isTrial
                      ? statusAcesso.diasRestantes <= 3
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20"
                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                  }`}
                  title="Clique para gerenciar sua assinatura e ver planos"
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex flex-col text-left leading-tight">
                    <span className="hidden sm:inline font-bold">
                      {statusAcesso.isExpirado
                        ? "⚠️ Expirado - Renovar"
                        : statusAcesso.isTrial
                        ? "Teste Grátis"
                        : "Plano Ativo"}
                    </span>
                    <span className="sm:hidden font-bold">
                      {statusAcesso.isExpirado
                        ? "Renovar"
                        : statusAcesso.isTrial
                        ? "Teste"
                        : "Ativo"}
                    </span>
                    <span className="text-[9px] font-medium opacity-75 leading-none mt-0.5">
                      {statusAcesso.isExpirado
                        ? "Reativar agora"
                        : statusAcesso.diasRestantes !== undefined && statusAcesso.diasRestantes !== null
                        ? `${statusAcesso.diasRestantes} dia${statusAcesso.diasRestantes === 1 ? "" : "s"}`
                        : "Ativo"}
                    </span>
                  </div>
                </Link>
              )
            )}

            {/* Link para Manual do Sistema */}
            <Link
              href="/ajuda"
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              title="Manual de Primeiros Passos e Ajuda"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>Manual</span>
            </Link>

            {/* Central de Alertas e Notificações (Topbar Bell) */}
            <button
              onClick={() => setAlertasOpen(true)}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Abrir Central de Alertas e Notificações"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>

            {/* Alternar Tema Escuro / Claro */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Badge de Versão Atual do Sistema */}
            <div
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-extrabold text-xs shadow-xs select-none"
              title="Versão Oficial do Sistema Gestão de Imóveis para Locação"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Versão: {SYSTEM_VERSION}</span>
              <span className="sm:hidden">{SYSTEM_VERSION}</span>
            </div>

            {/* Perfil do Usuário */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                {user?.nome || "Carregando..."}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-300 text-xs font-semibold transition"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Drawer Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-3 z-40 max-h-[80vh] overflow-y-auto">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase px-3">
                  {section.title}
                </span>
                <div className="space-y-1">
                  {section.items.map((item: any) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/contratos"
                        ? pathname === "/contratos"
                        : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                          isActive
                            ? "bg-blue-600 text-white font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                              isActive
                                ? "bg-blue-700 text-white"
                                : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-3">Relatórios:</span>
              {relatoriosSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = isRelatoriosActive && currentAba === sub.aba;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => {
                      setCurrentAba(sub.aba);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium ${
                      isSubActive
                        ? "bg-blue-600 text-white font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <SubIcon className="w-4 h-4" />
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-3">Parâmetros do Sistema:</span>
              {parametrosSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = isParametrosActive && currentParametrosAba === sub.aba;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => {
                      setCurrentParametrosAba(sub.aba);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium ${
                      isSubActive
                        ? "bg-blue-600 text-white font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <SubIcon className="w-4 h-4" />
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
          <div className="max-w-7xl w-full mx-auto">{children}</div>

          {/* RODAPÉ DAS TELAS APÓS LOGIN */}
          <footer className="mt-8 pt-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
            Desenvolvimento: <a href="https://pajotecnologia.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">pajotecnologia.com.br</a> (87)996540551
          </footer>
        </main>
      </div>

      {/* Central Flutuante de Alertas e Notificações */}
      <FloatingAlertsHub
        isExternalOpen={alertasOpen}
        onExternalToggle={() => setAlertasOpen((prev) => !prev)}
        showFloatingButton={true}
      />
    </div>
  );
}

export default function Shell({ children }: ShellProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4">{children}</div>}>
      <ShellContent>{children}</ShellContent>
    </Suspense>
  );
}
