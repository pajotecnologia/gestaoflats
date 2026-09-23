"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { getMediaUrl } from "@/lib/media";
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Shield,
  User,
  Sparkles,
  X,
  AlertCircle,
} from "lucide-react";

export function TenantSelector() {
  const { activeTenant, userRole, tenants, switchTenant, createTenant, isLoading, isAdmin } = useTenant();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form State para Novo Tenant
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTenant = async (tenantId: string) => {
    setDropdownOpen(false);
    await switchTenant(tenantId);
  };

  const handleOpenCreateModal = () => {
    setDropdownOpen(false);
    setName("");
    setCnpj("");
    setEmail("");
    setTelefone("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("O nome da organização é obrigatório.");
      return;
    }
    setCreating(true);
    setErrorMsg("");
    const success = await createTenant({
      name: name.trim(),
      cnpj: cnpj.trim() || undefined,
      email: email.trim() || undefined,
      telefone: telefone.trim() || undefined,
    });
    setCreating(false);
    if (success) {
      setModalOpen(false);
    }
  };

  if (!activeTenant && isLoading) {
    return (
      <div className="flex items-center space-x-2.5 p-2 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 animate-pulse">
        <div className="w-8 h-8 rounded-xl bg-slate-300 dark:bg-zinc-800 shrink-0" />
        <div className="space-y-1 flex-1">
          <div className="w-20 h-3.5 bg-slate-300 dark:bg-zinc-800 rounded" />
          <div className="w-12 h-2.5 bg-slate-300 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  const roleLabel = isAdmin ? "Admin" : "Membro";

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Botão Seletor Principal */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs transition-all duration-200 text-left cursor-pointer group"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          {activeTenant?.logomarcaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getMediaUrl(activeTenant.logomarcaUrl)}
              alt={activeTenant.name}
              className="w-8 h-8 rounded-xl object-cover border border-slate-300 dark:border-zinc-700 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-xs">
              {activeTenant?.name ? activeTenant.name.charAt(0).toUpperCase() : "O"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-xs text-slate-900 dark:text-zinc-100 truncate block">
                {activeTenant?.name || "Minha Organização"}
              </span>
            </div>
            <div className="flex items-center space-x-1 mt-0.5">
              <span
                className={`inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                  isAdmin
                    ? "bg-indigo-50 dark:bg-indigo-950/90 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
                }`}
              >
                {isAdmin ? <Shield className="w-2.5 h-2.5 mr-0.5" /> : <User className="w-2.5 h-2.5 mr-0.5" />}
                {roleLabel}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                {tenants.length > 1 ? `(${tenants.length} orgs)` : "SaaS"}
              </span>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${
            dropdownOpen ? "rotate-180 text-indigo-500" : "group-hover:text-slate-600 dark:group-hover:text-zinc-300"
          }`}
        />
      </button>

      {/* Menu Suspenso (Dropdown) */}
      {dropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 p-2 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-900 mb-1 flex justify-between items-center">
            <span>Organizações Disponíveis</span>
            <span className="text-indigo-500 font-mono">{tenants.length}</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
            {tenants.map((t) => {
              const isActive = t.id === activeTenant?.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTenant(t.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 font-semibold"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                      }`}
                    >
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate font-medium">{t.name}</p>
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500">
                        {t.role === "admin" ? "Admin" : "Membro"}
                      </span>
                    </div>
                  </div>

                  {isActive && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Botão Nova Organização */}
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/40 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Organização</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Criar Nova Organização */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base">
                    Criar Organização
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Você será automaticamente o <strong>Administrador</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Nome da Empresa / Imobiliária *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Prime Imóveis & Flats"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  CNPJ (Opcional)
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 text-xs rounded-xl font-mono bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    WhatsApp de Contato
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition cursor-pointer"
                >
                  {creating ? "Criando..." : "Criar & Conectar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default TenantSelector;
