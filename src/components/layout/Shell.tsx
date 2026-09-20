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
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import FloatingAlertsHub from "@/components/alertas/FloatingAlertsHub";
import { TenantSelector } from "@/components/tenants/TenantSelector";

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
        { label: "Contratos Encerrados", href: "/contratos/encerrados", icon: CheckCircle2 },
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
    { label: "Banco Inter (Bolepix)", href: "/parametros?aba=inter", aba: "inter", icon: Zap },
    ...(user?.isSuperAdmin
      ? [{ label: "⚡ Gestão SaaS & Assinaturas", href: "/parametros?aba=saas", aba: "saas", icon: Sparkles }]
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
    if (pathname === "/contratos/encerrados") return { section: "Contratos", page: "Contratos Encerrados (Histórico)" };
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
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors duration-200">
      {/* Sidebar Desktop (Inspirado no estilo Profound / SaaSFrame) */}
      <aside className="hidden md:flex flex-col w-64 h-full border-r border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-3.5 space-y-3 flex-shrink-0 select-none">
        
        {/* Seletor de Organizações Multitenant */}
        <TenantSelector />

        <nav className="flex-1 space-y-4 overflow-y-auto pr-1 text-xs">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-2.5">
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
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold border-l-[3px] border-indigo-600 dark:border-indigo-500 shadow-xs shadow-indigo-500/10"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
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
          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-2.5">
              RELATÓRIOS & CONFIGURAÇÃO
            </span>

            {/* RELATÓRIOS */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setRelatoriosExpanded(!relatoriosExpanded)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isRelatoriosActive
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border-l-[3px] border-indigo-600 dark:border-indigo-500"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <BarChart3 className={`w-4 h-4 ${isRelatoriosActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500"}`} />
                  <span>Relatórios</span>
                </div>
                {relatoriosExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                )}
              </button>

              {relatoriosExpanded && (
                <div className="ml-3 pl-2.5 border-l border-slate-200 dark:border-zinc-800 mt-1 space-y-0.5">
                  {relatoriosSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = isRelatoriosActive && currentAba === sub.aba;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setCurrentAba(sub.aba)}
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                          isSubActive
                            ? "bg-indigo-600 text-white font-bold shadow-xs"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
                        }`}
                      >
                        <SubIcon className={`w-3 h-3 ${isSubActive ? "text-white" : "text-slate-400 dark:text-zinc-500"}`} />
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
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isParametrosActive
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border-l-[3px] border-indigo-600 dark:border-indigo-500"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <SlidersHorizontal className={`w-4 h-4 ${isParametrosActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500"}`} />
                  <span>Parâmetros</span>
                </div>
                {parametrosExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                )}
              </button>

              {parametrosExpanded && (
                <div className="ml-3 pl-2.5 border-l border-slate-200 dark:border-zinc-800 mt-1 space-y-0.5">
                  {parametrosSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = isParametrosActive && currentParametrosAba === sub.aba;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setCurrentParametrosAba(sub.aba)}
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                          isSubActive
                            ? "bg-indigo-600 text-white font-bold shadow-xs"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
                        }`}
                      >
                        <SubIcon className={`w-3 h-3 ${isSubActive ? "text-white" : "text-slate-400 dark:text-zinc-500"}`} />
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {user?.isSuperAdmin && (
              <Link
                href="/parametros?aba=saas"
                className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all duration-200"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>⚡ Gestão SaaS</span>
              </Link>
            )}
          </div>
        </nav>

        {/* Rodapé do Menu Lateral: Mestre Vitalício / Status do Plano & Versão */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800/80 space-y-2 select-none">
          {statusAcesso && (
            statusAcesso.isMestre || user?.isSuperAdmin ? (
              <Link
                href="/parametros?aba=saas"
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20"
                title="Empresa Mestre - Acesso Vitalício Irrestrito (Gerenciamento do SaaS)"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex flex-col text-left leading-tight truncate">
                    <span className="font-extrabold text-[11px] text-amber-700 dark:text-amber-300">👑 Mestre Vitalício</span>
                    <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-medium truncate">Acesso Irrestrito</span>
                  </div>
                </div>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 opacity-80 shrink-0" />
              </Link>
            ) : (
              <Link
                href="/renovar"
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-xs ${
                  statusAcesso.isExpirado
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                    : statusAcesso.isTrial
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
                title="Clique para gerenciar sua assinatura e ver planos"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Zap className="w-4 h-4 shrink-0" />
                  <div className="flex flex-col text-left leading-tight truncate">
                    <span className="font-bold text-[11px]">
                      {statusAcesso.isExpirado
                        ? "Assinatura Expirada"
                        : statusAcesso.isTrial
                        ? "Teste Grátis"
                        : "Plano Ativo"}
                    </span>
                    <span className="text-[9px] opacity-75 leading-none mt-0.5 truncate">
                      {statusAcesso.isExpirado
                        ? "Reativar agora"
                        : statusAcesso.diasRestantes !== undefined && statusAcesso.diasRestantes !== null
                        ? `${statusAcesso.diasRestantes} dia${statusAcesso.diasRestantes === 1 ? "" : "s"} restantes`
                        : "Ativo"}
                    </span>
                  </div>
                </div>
              </Link>
            )
          )}

          {/* Badge de Versão Oficial no Rodapé do Menu */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400 text-[10px] font-semibold">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Versão do Sistema</span>
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{SYSTEM_VERSION}</span>
          </div>
        </div>
      </aside>

      {/* Area Conteúdo Mobile Header + Topbar + Main */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
        {/* Topbar Estilo Profound (Breadcrumbs + Action Hub) */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 dark:text-zinc-500 font-medium hidden sm:inline">{breadcrumb.section}</span>
              <span className="text-slate-400 dark:text-zinc-600 hidden sm:inline">/</span>
              <span className="font-bold text-slate-800 dark:text-zinc-100">{breadcrumb.page}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Botão de Ajuda / Manual (?) no Topo */}
            <Link
              href="/ajuda"
              className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-zinc-800/80 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all duration-200"
              title="Manual do Sistema e Ajuda (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>

            {/* Central de Alertas e Notificações (Topbar Bell) */}
            <button
              onClick={() => setAlertasOpen(true)}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-zinc-900/80 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-800/80 transition-all duration-200"
              title="Abrir Central de Alertas e Notificações"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-zinc-950" />
            </button>

            {/* Alternar Tema Escuro / Claro */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900/80 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-800/80 transition-all duration-200"
              title={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Perfil do Usuário */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800/80">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm shadow-indigo-500/20">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 max-w-[100px] truncate">
                {user?.nome || "Carregando..."}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-300 text-xs font-semibold transition-all duration-200 shrink-0"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Drawer Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 p-4 space-y-3 z-40 max-h-[80vh] overflow-y-auto">
            {/* Seletor Multitenant Mobile */}
            <div className="pb-3 border-b border-slate-200/80 dark:border-zinc-800/80">
              <TenantSelector />
            </div>

            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase px-3">
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
                        className={`flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/20"
                            : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
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
                                ? "bg-indigo-700 text-white"
                                : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
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

            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase px-3">Relatórios:</span>
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
                    className={`flex items-center space-x-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium transition-all duration-200 ${
                      isSubActive
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
                    }`}
                  >
                    <SubIcon className="w-4 h-4" />
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase px-3">Parâmetros do Sistema:</span>
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
                    className={`flex items-center space-x-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium transition-all duration-200 ${
                      isSubActive
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
                    }`}
                  >
                    <SubIcon className="w-4 h-4" />
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Rodapé do Menu Mobile: Mestre / Status & Versão */}
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2 select-none">
              {statusAcesso && (
                statusAcesso.isMestre || user?.isSuperAdmin ? (
                  <Link
                    href="/parametros?aba=saas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all duration-200 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="font-extrabold text-xs">👑 Mestre Vitalício</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-md text-amber-700 dark:text-amber-300 font-bold">Irrestrito</span>
                  </Link>
                ) : (
                  <Link
                    href="/renovar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all duration-200 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>{statusAcesso.isTrial ? "Teste Grátis" : "Plano Ativo"}</span>
                    </div>
                    <span className="text-[10px] opacity-75">
                      {statusAcesso.diasRestantes} dias restantes
                    </span>
                  </Link>
                )
              )}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 text-[10px] font-semibold border border-slate-200/60 dark:border-zinc-800/80">
                <span>Versão do Sistema</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{SYSTEM_VERSION}</span>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between">
          <div className="max-w-7xl w-full mx-auto">{children}</div>

          {/* RODAPÉ DAS TELAS APÓS LOGIN */}
          <footer className="mt-8 pt-4 text-center text-xs font-medium text-slate-500 dark:text-zinc-400 border-t border-slate-200 dark:border-zinc-800/80">
            Desenvolvimento: <a href="https://pajotecnologia.com.br" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">pajotecnologia.com.br</a> (87)996540551
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
    <Suspense fallback={<div className="min-h-screen bg-slate-100 dark:bg-zinc-950 p-4">{children}</div>}>
      <ShellContent>{children}</ShellContent>
    </Suspense>
  );
}
