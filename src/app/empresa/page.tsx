"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmpresaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/parametros");
  }, [router]);

  return null;
}
