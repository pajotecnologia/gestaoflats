"use client";

import React, { useState } from "react";
import { Building2, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { SYSTEM_VERSION } from "@/lib/version";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Credenciais inválidas. Tente novamente.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setErrorMsg("Erro ao conectar ao servidor. Tente novamente em instantes.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 selection:bg-blue-500 selection:text-white">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="flex-1 flex items-center justify-center relative z-10 py-12">
        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-2">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Gestão de Flats SaaS
            </h1>
            <p className="text-xs text-slate-400">
              Sistema de Controle Imobiliário, Contratos e Financeiro
            </p>
            <div className="pt-1 flex justify-center">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-950/90 border border-blue-800 text-blue-300 text-[11px] font-extrabold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Versão: {SYSTEM_VERSION}</span>
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@primeflats.com.br"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha
                </label>
                <a
                  href="/recuperar-senha"
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Acessando..." : "Entrar no Sistema"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/50 flex items-center justify-center space-x-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ambiente Seguro com Criptografia SSL</span>
          </div>
        </div>
      </div>

      {/* RODAPÉ DA TELA DE LOGIN */}
      <footer className="py-4 text-center text-xs font-medium text-slate-400 relative z-10 border-t border-slate-800/80">
        Desenvolvimento: <a href="https://pajotecnologia.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">pajotecnologia.com.br</a> (87)996540551
      </footer>
    </div>
  );
}
