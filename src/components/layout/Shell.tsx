"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const [currentAba, setCurrentAba] = useState("checklist");
  const [currentParametrosAba, setCurrentParametrosAba] = useState("empresa");

  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [relatoriosExpanded, setRelatoriosExpanded] = useState(true);
  const [parametrosExpanded, setParametrosExpanded] = useState(true);
  const [user, setUser] = useState<{ nome: string; email: string; empresaNome: string; logomarcaUrl?: string } | null>(null);

  // Auto-expandir relatórios/parâmetros e sincronizar aba ativa
  useEffect(() => {
    if (pathname.startsWith("/relatorios")) {
      setRelatoriosExpanded(true);
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        setCurrentAba(urlParams.get("aba") || "checklist");
      }
    }
    if (pathname.startsWith("/parametros")) {
      setParametrosExpanded(true);
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        setCurrentParametrosAba(urlParams.get("aba") || "empresa");
      }
    }
  }, [pathname]);

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
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Flats & Condomínios", href: "/flats", icon: Building2 },
    { label: "Locatários", href: "/locatarios", icon: Users },
    { label: "Fornecedores", href: "/fornecedores", icon: Truck },
    { label: "Modelos de Contrato", href: "/contratos/modelos", icon: FileCode },
    { label: "Gestão de Contratos", href: "/contratos", icon: FileText },
    { label: "Contas a Receber", href: "/financeiro/receber", icon: TrendingUp },
    { label: "Contas a Pagar", href: "/financeiro/pagar", icon: DollarSign },
  ];

  const relatoriosSubItems = [
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
  ];

  const isRelatoriosActive = pathname.startsWith("/relatorios");
  const isParametrosActive = pathname.startsWith("/parametros");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur p-4 space-y-6 flex-shrink-0">
        <div className="flex items-center space-x-3 px-2">
          {user?.logomarcaUrl ? (
            <img
              src={user.logomarcaUrl}
              alt="Logo"
              className="w-9 h-9 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-semibold text-white shadow-md shadow-blue-500/20 text-sm">
              F
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate">
              {user?.empresaNome || "Prime Flats"}
            </h1>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium tracking-wide uppercase">
              SaaS Imobiliário
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* MENU PAI DE RELATÓRIOS COM SUB-MENUS */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setRelatoriosExpanded(!relatoriosExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isRelatoriosActive
                  ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className={`w-4 h-4 ${isRelatoriosActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                <span>Relatórios</span>
              </div>
              {relatoriosExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* SUB-MENUS DE RELATÓRIOS */}
            {relatoriosExpanded && (
              <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 mt-1 space-y-1">
                {relatoriosSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = isRelatoriosActive && currentAba === sub.aba;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-[11px] font-medium transition-all ${
                        isSubActive
                          ? "bg-blue-600 text-white font-bold shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-white" : "text-slate-400"}`} />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* MENU PAI DE PARÂMETROS DO SISTEMA COM SUB-MENUS */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setParametrosExpanded(!parametrosExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isParametrosActive
                  ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <SlidersHorizontal className={`w-4 h-4 ${isParametrosActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                <span>Parâmetros do Sistema</span>
              </div>
              {parametrosExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* SUB-MENUS DE PARÂMETROS */}
            {parametrosExpanded && (
              <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 mt-1 space-y-1">
                {parametrosSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = isParametrosActive && currentParametrosAba === sub.aba;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-[11px] font-medium transition-all ${
                        isSubActive
                          ? "bg-blue-600 text-white font-bold shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-white" : "text-slate-400"}`} />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Área Direita: Header Bar + Conteúdo + Rodapé */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar Superior (Topo à Direita) */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 sm:px-6 flex items-center justify-between z-30 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{user?.empresaNome || "Prime Gestão Imobiliária"}</span>
            </div>
          </div>

          {/* Dados do Usuário, Alternância de Tema & Sair (Topo Direita) */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center text-xs">
                {user?.nome ? user.nome.charAt(0) : "U"}
              </div>
              <div className="text-left hidden md:block">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[140px]">
                  {user?.nome || "Carregando..."}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] truncate max-w-[140px]">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
              title={darkMode ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

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
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-1.5 z-40">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium ${
                    isActive
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-3">Relatórios:</span>
              {relatoriosSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = isRelatoriosActive && currentAba === sub.aba;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => setMobileMenuOpen(false)}
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
                    onClick={() => setMobileMenuOpen(false)}
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
          <div>{children}</div>

          {/* RODAPÉ DAS TELAS APÓS LOGIN */}
          <footer className="mt-8 pt-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
            Desenvolvimento: <a href="https://pajotecnologia.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">pajotecnologia.com.br</a> (87)996540551
          </footer>
        </main>
      </div>
    </div>
  );
}
