"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FuncionariosPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/parametros#funcionarios");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-xs text-slate-500 font-semibold bg-slate-50 dark:bg-slate-950">
      Redirecionando para Parâmetros do Sistema (Aba Funcionários)...
    </div>
  );
}
