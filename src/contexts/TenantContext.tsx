"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/Toast";

export type TenantRole = "admin" | "member";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
  logomarcaUrl?: string | null;
  status?: string | null;
  plano?: string | null;
  createdAt?: string | null;
}

export interface TenantContextType {
  activeTenant: Tenant | null;
  userRole: TenantRole;
  tenants: Tenant[];
  switchTenant: (tenantId: string) => Promise<boolean>;
  createTenant: (data: {
    name: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
  }) => Promise<boolean>;
  refreshTenants: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [userRole, setUserRole] = useState<TenantRole>("member");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch("/api/tenants");
      if (!res.ok) {
        throw new Error("Erro ao carregar organizações.");
      }
      const data = await res.json();
      setActiveTenant(data.activeTenant || null);
      setUserRole(data.userRole || "member");
      setTenants(data.tenants || []);
    } catch (err) {
      console.error("Erro no TenantContext:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const switchTenant = async (tenantId: string): Promise<boolean> => {
    if (activeTenant?.id === tenantId) return true;
    setIsLoading(true);
    try {
      const res = await fetch("/api/tenants/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Não foi possível alternar a organização.");
        setIsLoading(false);
        return false;
      }

      toast.success(`Organização alternada para ${data.activeTenant?.name || "nova empresa"}.`);
      
      // Recarregar dados e redirecionar / recarregar estado da aplicação
      await fetchTenants();
      window.location.reload();
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao alternar organização.");
      setIsLoading(false);
      return false;
    }
  };

  const createTenant = async (data: {
    name: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.error || "Erro ao criar organização.");
        setIsLoading(false);
        return false;
      }

      toast.success("Organização criada com sucesso! Você é o Administrador.");
      
      // Alternar automaticamente para a nova organização
      if (resData.tenant?.id) {
        await switchTenant(resData.tenant.id);
      } else {
        await fetchTenants();
      }
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Erro de rede ao criar organização.");
      setIsLoading(false);
      return false;
    }
  };

  const isAdmin = userRole === "admin" || activeTenant?.role === "admin";

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        userRole,
        tenants,
        switchTenant,
        createTenant,
        refreshTenants: fetchTenants,
        isLoading,
        isAdmin,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant deve ser utilizado dentro de um <TenantProvider />");
  }
  return context;
}
