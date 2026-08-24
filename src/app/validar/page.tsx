"use me";
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  UploadCloud,
  Search,
  Lock,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  Info,
  Calendar,
  Building,
  User,
  Home,
  FileText,
} from "lucide-react";

interface AuditResult {
  found: boolean;
  tipoDocumento?: string;
  hash?: string;
  protocol?: string;
  status?: string;
  dataHashGerado?: string;
  otsProofBase64?: string;
  detalhes?: {
    empresaNome?: string;
    empresaCnpj?: string;
    locatarioNome?: string;
    locatarioCpf?: string;
    flatNumero?: string;
    localNome?: string;
    valorMensal?: number;
    validadeMeses?: number;
    dataEmissao?: string;
    dataFinal?: string;
    dataVistoria?: string;
    responsavelVistoria?: string;
    dataAssinatura?: string;
    ipAssinatura?: string;
  };
  otsVerification?: {
    verified: boolean;
    message: string;
  };
  message?: string;
}

function ValidarContent() {
  const searchParams = useSearchParams();
  const initialHash = searchParams.get("hash") || "";

  const [inputHash, setInputHash] = useState(initialHash);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialHash) {
      consultarPorHash(initialHash);
    }
  }, [initialHash]);

  const consultarPorHash = async (hashToSearch: string) => {
    if (!hashToSearch || hashToSearch.trim().length < 10) {
      setErrorMsg("Por favor, informe um Hash SHA-256 válido com 64 caracteres.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch(`/api/validar?hash=${encodeURIComponent(hashToSearch.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setResult({
          found: false,
          hash: hashToSearch,
          message: data.message || data.error || "Documento não localizado no registro público.",
        });
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setErrorMsg("Erro de conexão com o servidor de validação.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Por favor, selecione um arquivo de documento em formato .PDF.");
      return;
    }

    setSelectedFile(file);
    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/validar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          found: false,
          hash: data.hash || "Calculado via PDF",
          message: data.message || data.error || "O arquivo PDF enviado não corresponde a nenhum documento assinado no sistema.",
        });
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setErrorMsg("Falha ao enviar arquivo para validação.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadOtsProof = () => {
    if (!result?.otsProofBase64) return;
    const otsBytes = Buffer.from(result.otsProofBase64, "base64");
    const blob = new Blob([otsBytes], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Prova_Blockchain_Bitcoin_${result.hash?.substring(0, 10)}.ots`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 font-sans">
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Portal Público de Validação Criptográfica
            </h1>
            <p className="text-xs text-slate-400">
              Auditoria de Autenticidade e Prova de Existência em Blockchain (Bitcoin)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          Rede Bitcoin (OpenTimestamps)
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl my-8 space-y-8">
        {/* Banner Explicativo */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-base font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Como funciona a auditoria digital?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Cada contrato de locação e laudo de vistoria assinado no sistema gera uma pegada digital única (**Hash SHA-256**). Essa pegada é ancorada de forma imutável na **Blockchain do Bitcoin**. Qualquer alteração de 1 único caractere no documento invalida a assinatura.
          </p>
        </div>

        {/* Input & Upload Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Selecione como deseja verificar:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opção A: Upload de PDF */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl bg-slate-950/50 transition-colors group cursor-pointer relative">
              <input
                type="file"
                accept=".pdf"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-blue-400 transition-colors mb-3" />
              <span className="text-sm font-medium text-slate-200 group-hover:text-blue-300">
                {selectedFile ? selectedFile.name : "Arrastar ou Selecionar PDF"}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Calcula o Hash SHA-256 e valida na hora
              </span>
            </div>

            {/* Opção B: Cole o Hash SHA-256 */}
            <div className="flex flex-col justify-between p-6 border border-slate-800 rounded-xl bg-slate-950/50 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">
                  Ou digite o Hash SHA-256 (64 caracteres):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputHash}
                    onChange={(e) => setInputHash(e.target.value)}
                    placeholder="Ex: e3b0c44298fc1c149afbf4c8996fb92427ae..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={() => consultarPorHash(inputHash)}
                disabled={loading || !inputHash.trim()}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <span className="animate-pulse">Consultando Blockchain...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Verificar Autenticidade
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Audit Result Card */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {result.found ? (
              <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-950/20">
                {/* Status Bar */}
                <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                        Documento Autêntico e Íntegro
                      </h3>
                      <p className="text-xs text-slate-300">
                        Ancorado e Registrado na Blockchain do Bitcoin (OpenTimestamps)
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-full">
                    {result.tipoDocumento}
                  </span>
                </div>

                {/* Detalhes do Documento */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Grid de Informações */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Building className="w-3.5 h-3.5 text-blue-400" />
                        Empresa Emissora
                      </div>
                      <p className="text-xs font-semibold text-slate-200">
                        {result.detalhes?.empresaNome}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        CNPJ: {result.detalhes?.empresaCnpj}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        Locatário Assinante
                      </div>
                      <p className="text-xs font-semibold text-slate-200">
                        {result.detalhes?.locatarioNome}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        CPF: {result.detalhes?.locatarioCpf}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Home className="w-3.5 h-3.5 text-blue-400" />
                        Unidade / Imóvel
                      </div>
                      <p className="text-xs font-semibold text-slate-200">
                        Flat {result.detalhes?.flatNumero}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {result.detalhes?.localNome || "Local Cadastrado"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        Data da Assinatura
                      </div>
                      <p className="text-xs font-semibold text-slate-200">
                        {result.detalhes?.dataAssinatura
                          ? new Date(result.detalhes.dataAssinatura).toLocaleString("pt-BR")
                          : "Data Registrada"}
                      </p>
                      <p className="text-[10px] text-emerald-400">
                        IP: {result.detalhes?.ipAssinatura || "Registrado"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 sm:col-span-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        Protocolo Blockchain
                      </div>
                      <p className="text-xs font-semibold text-slate-200">
                        {result.protocol}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {result.otsVerification?.message || "Selo criptográfico validado na rede descentralizada."}
                      </p>
                    </div>
                  </div>

                  {/* Hash Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        Pegada Digital SHA-256 (64 caracteres):
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.hash || "")}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Hash
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-slate-300 break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      {result.hash}
                    </p>
                  </div>

                  {/* Download Proof Button */}
                  {result.otsProofBase64 && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={downloadOtsProof}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4 text-blue-400" />
                        Baixar Prova Blockchain (.ots)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 sm:p-8 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-rose-400">
                  Documento Não Autenticado ou Adulterado
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                  {result.message || "O Hash SHA-256 consultado não coincide com nenhum contrato ou laudo assinado no sistema."}
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 max-w-lg mx-auto break-all">
                  Hash Consultado: {result.hash}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        Desenvolvimento: pajotecnologia.com.br (87)996540551 • Sistema de Gestão de Locações & Blockchain
      </footer>
    </div>
  );
}

export default function ValidarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Carregando portal de validação...</div>}>
      <ValidarContent />
    </Suspense>
  );
}
