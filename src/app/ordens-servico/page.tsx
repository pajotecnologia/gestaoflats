"use client";

import React, { useEffect, useState, useMemo } from "react";
import Shell from "@/components/layout/Shell";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Building2,
  User,
  Calendar,
  DollarSign,
  Edit3,
  Trash2,
  X,
  Check,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle,
  Tag,
  Hammer,
  Droplet,
  Zap,
  Wind,
  Paintbrush,
  Brush,
  CreditCard,
  ExternalLink,
  Receipt,
  Truck,
  FileText,
  Upload,
  Image as ImageIcon,
  Eye,
  Download,
  Camera,
  Printer,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/validation";
import { toast } from "sonner";
import { generateOrdemServicoPDF } from "@/lib/ordemServicoPdfGenerator";

export interface NotaMaterialAnexo {
  id: string;
  url: string;
  nome: string;
  tipo: "IMAGEM" | "PDF" | "DOCUMENTO";
  tamanho?: number;
  criadoEm: string;
}

interface OrdemServico {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
  status: "ABERTA" | "EM_EXECUCAO" | "CONCLUIDA" | "CANCELADA";
  responsavel: string | null;
  fornecedorNome: string | null;
  valorEstimado: number;
  valorReal: number;
  dataAbertura: string;
  prazo: string | null;
  dataConclusao: string | null;
  observacao: string | null;
  fotosJson?: string | null;
  contaPagarId?: string | null;
  empresa?: {
    id: string;
    nomeFantasia: string;
    razaoSocial: string;
    cnpj: string;
    telefone?: string | null;
    email?: string | null;
    endereco?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
    logomarcaUrl?: string | null;
  } | null;
  contaPagar?: {
    id: string;
    valor: number;
    valorPago?: number;
    status: string;
    dataVencimento: string;
    dataPagamento?: string | null;
    formaPagamento?: string | null;
  } | null;
  flat?: {
    id: string;
    numero: string;
    tipoImovel?: string;
    empresa?: {
      id: string;
      nomeFantasia: string;
      razaoSocial: string;
      cnpj: string;
      telefone?: string | null;
      email?: string | null;
      endereco?: string | null;
      bairro?: string | null;
      cidade?: string | null;
      estado?: string | null;
      cep?: string | null;
      logomarcaUrl?: string | null;
    } | null;
    local?: {
      id: string;
      nome: string;
    };
  } | null;
  locatario?: {
    id: string;
    nome: string;
    telefone: string;
  } | null;
}

const formatTipoImovel = (tipo?: string) => {
  if (!tipo) return "Imóvel";
  const t = String(tipo).toUpperCase();
  if (t === "CHACARA") return "Chácara";
  if (t === "SALAO") return "Salão de Festas";
  if (t === "CASA") return "Casa";
  if (t === "APARTAMENTO") return "Apartamento";
  if (t === "FLAT") return "Flat";
  return tipo;
};

const CATEGORIAS = [
  { id: "MANUTENCAO", label: "Manutenção Geral", icon: Wrench },
  { id: "ELETRICA", label: "Elétrica", icon: Zap },
  { id: "HIDRAULICA", label: "Hidráulica", icon: Droplet },
  { id: "AR_CONDICIONADO", label: "Ar-condicionado", icon: Wind },
  { id: "PINTURA", label: "Pintura", icon: Paintbrush },
  { id: "LIMPEZA", label: "Limpeza & Higienização", icon: Brush },
  { id: "ALVENARIA", label: "Alvenaria & Reforma", icon: Hammer },
  { id: "OUTRO", label: "Outro", icon: Tag },
];

export default function OrdensServicoPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [imprimindoOSId, setImprimindoOSId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("TODAS");
  const [filtroFlatId, setFiltroFlatId] = useState<string>("");

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrdem, setEditingOrdem] = useState<OrdemServico | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingNotas, setUploadingNotas] = useState(false);

  // Modal de Visualização de Notas Fiscais
  const [viewingNotasOrdem, setViewingNotasOrdem] = useState<OrdemServico | null>(null);
  const [selectedNotaPreview, setSelectedNotaPreview] = useState<NotaMaterialAnexo | null>(null);

  // Formulário
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    flatId: "",
    locatarioId: "",
    categoria: "MANUTENCAO",
    prioridade: "MEDIA",
    responsavel: "",
    fornecedorId: "",
    fornecedorNome: "",
    valorEstimado: "",
    valorReal: "",
    prazo: "",
    observacao: "",
    lancarContaPagar: true,
    formaPagamento: "PIX",
    pago: false,
    notas: [] as NotaMaterialAnexo[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resOrdens, resFlats, resLocatarios, resFornecedores, resFormas, resMe, resEmpresa] = await Promise.all([
        fetch("/api/ordens-servico").then((r) => r.json()),
        fetch("/api/flats").then((r) => r.json()),
        fetch("/api/locatarios").then((r) => r.json()),
        fetch("/api/fornecedores").then((r) => r.json()).catch(() => ({ fornecedores: [] })),
        fetch("/api/formas-pagamento").then((r) => r.json()).catch(() => ({ formas: [] })),
        fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ user: null })),
        fetch("/api/empresa").then((r) => r.json()).catch(() => null),
      ]);

      setOrdens(resOrdens.ordens || []);
      setFlats(resFlats.flats || []);
      setLocatarios(resLocatarios.locatarios || []);
      setFornecedores(resFornecedores.fornecedores || []);
      setFormasPagamento(resFormas.formas || []);

      if (resEmpresa && resEmpresa.nomeFantasia) {
        setEmpresaData(resEmpresa);
      } else if (resMe?.user?.empresa) {
        setEmpresaData(resMe.user.empresa);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar ordens de serviço.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImprimirOS = async (ordem: OrdemServico) => {
    try {
      setImprimindoOSId(ordem.id);
      const toastId = toast.loading(`Gerando PDF da O.S. ${ordem.codigo}...`);

      await generateOrdemServicoPDF(ordem, empresaData);

      toast.dismiss(toastId);
      toast.success(`PDF da O.S. ${ordem.codigo} gerado com sucesso!`);
    } catch (err: any) {
      console.error("Erro ao gerar PDF da O.S.:", err);
      toast.error("Erro ao gerar documento da O.S.: " + (err.message || err));
    } finally {
      setImprimindoOSId(null);
    }
  };

  const parseNotas = (fotosJson?: string | null): NotaMaterialAnexo[] => {
    if (!fotosJson) return [];
    try {
      const parsed = JSON.parse(fotosJson);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          if (typeof item === "string") {
            return {
              id: `nota_str_${idx}`,
              url: item,
              nome: `Nota/Comprovante ${idx + 1}`,
              tipo: item.startsWith("data:application/pdf") ? "PDF" : "IMAGEM",
              criadoEm: new Date().toISOString(),
            };
          }
          return item;
        });
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleOpenCreate = () => {
    setEditingOrdem(null);
    setForm({
      titulo: "",
      descricao: "",
      flatId: flats[0]?.id || "",
      locatarioId: "",
      categoria: "MANUTENCAO",
      prioridade: "MEDIA",
      responsavel: "",
      fornecedorId: "",
      fornecedorNome: "",
      valorEstimado: "",
      valorReal: "",
      prazo: new Date().toISOString().split("T")[0],
      observacao: "",
      lancarContaPagar: true,
      formaPagamento: "PIX",
      pago: false,
      notas: [],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ordem: OrdemServico) => {
    setEditingOrdem(ordem);
    const notasCarregadas = parseNotas(ordem.fotosJson);

    setForm({
      titulo: ordem.titulo || "",
      descricao: ordem.descricao || "",
      flatId: ordem.flat?.id || "",
      locatarioId: ordem.locatario?.id || "",
      categoria: ordem.categoria || "MANUTENCAO",
      prioridade: ordem.prioridade || "MEDIA",
      responsavel: ordem.responsavel || "",
      fornecedorId: "",
      fornecedorNome: ordem.fornecedorNome || "",
      valorEstimado: ordem.valorEstimado ? String(ordem.valorEstimado) : "",
      valorReal: ordem.valorReal ? String(ordem.valorReal) : "",
      prazo: ordem.prazo ? new Date(ordem.prazo).toISOString().split("T")[0] : "",
      observacao: ordem.observacao || "",
      lancarContaPagar: !!ordem.contaPagarId || true,
      formaPagamento: ordem.contaPagar?.formaPagamento || "PIX",
      pago: ordem.contaPagar?.status === "PAGO",
      notas: notasCarregadas,
    });
    setModalOpen(true);
  };

  // Upload Múltiplo de Notas de Compra de Material
  const handleUploadNotas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingNotas(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("notaFiles", files[i]);
    }

    try {
      const res = await fetch("/api/ordens-servico/upload-nota", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.notas) {
        setForm((prev) => ({
          ...prev,
          notas: [...prev.notas, ...data.notas],
        }));
        toast.success(`${data.notas.length} comprovante(s)/nota(s) anexada(s) com sucesso!`);
      } else {
        toast.error(data.error || "Erro ao fazer upload dos comprovantes.");
      }
    } catch (err: any) {
      toast.error("Erro ao enviar arquivos: " + (err.message || err));
    } finally {
      setUploadingNotas(false);
      e.target.value = "";
    }
  };

  const handleRemoverNota = (id: string) => {
    setForm((prev) => ({
      ...prev,
      notas: prev.notas.filter((n) => n.id !== id),
    }));
    toast.info("Nota/Comprovante removido.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast.warning("Informe o título da ordem de serviço.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        ...form,
        valorEstimado: form.valorEstimado ? parseFloat(form.valorEstimado) : 0,
        valorReal: form.valorReal ? parseFloat(form.valorReal) : 0,
        prazo: form.prazo || null,
        flatId: form.flatId || null,
        locatarioId: form.locatarioId || null,
        fornecedorId: form.fornecedorId || null,
        fotosJson: JSON.stringify(form.notas),
      };

      let res;
      if (editingOrdem) {
        res = await fetch("/api/ordens-servico", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingOrdem.id, ...payload }),
        });
      } else {
        res = await fetch("/api/ordens-servico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar ordem de serviço.");
        return;
      }

      if (data.contaPagarCriada) {
        toast.success("Ordem de serviço salva e despesa lançada no Contas a Pagar!");
      } else {
        toast.success(editingOrdem ? "Ordem de serviço atualizada!" : "Ordem de serviço aberta com sucesso!");
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (ordem: OrdemServico, newStatus: string) => {
    try {
      const res = await fetch("/api/ordens-servico", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ordem.id, status: newStatus }),
      });

      if (!res.ok) {
        toast.error("Erro ao atualizar status da ordem.");
        return;
      }

      toast.success(
        newStatus === "CONCLUIDA"
          ? "Ordem de serviço marcada como Concluída!"
          : newStatus === "EM_EXECUCAO"
          ? "Ordem de serviço colocada em Execução!"
          : "Status da ordem atualizado."
      );
      loadData();
    } catch (err) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ordem de serviço?")) return;
    try {
      const res = await fetch(`/api/ordens-servico?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erro ao excluir ordem de serviço.");
        return;
      }
      toast.success("Ordem de serviço excluída com sucesso.");
      loadData();
    } catch (err) {
      toast.error("Erro ao excluir.");
    }
  };

  // Filtragem e Métricas
  const ordensFiltradas = useMemo(() => {
    return ordens.filter((ordem) => {
      const matchSearch =
        ordem.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ordem.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ordem.descricao && ordem.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ordem.responsavel && ordem.responsavel.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ordem.flat && ordem.flat.numero.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = filtroStatus === "TODOS" || ordem.status === filtroStatus;
      const matchPrioridade = filtroPrioridade === "TODAS" || ordem.prioridade === filtroPrioridade;
      const matchFlat = !filtroFlatId || ordem.flat?.id === filtroFlatId;

      return matchSearch && matchStatus && matchPrioridade && matchFlat;
    });
  }, [ordens, searchTerm, filtroStatus, filtroPrioridade, filtroFlatId]);

  const stats = useMemo(() => {
    const total = ordens.length;
    const abertas = ordens.filter((o) => o.status === "ABERTA").length;
    const emExecucao = ordens.filter((o) => o.status === "EM_EXECUCAO").length;
    const concluidas = ordens.filter((o) => o.status === "CONCLUIDA").length;
    const custoTotalReal = ordens.reduce((acc, o) => acc + (o.valorReal || 0), 0);
    const custoEstimadoTotal = ordens.reduce((acc, o) => acc + (o.valorEstimado || 0), 0);
    const contasLancadas = ordens.filter((o) => o.contaPagarId).length;

    return { total, abertas, emExecucao, concluidas, custoTotalReal, custoEstimadoTotal, contasLancadas };
  }, [ordens]);

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "URGENTE":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900";
      case "ALTA":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900";
      case "MEDIA":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONCLUIDA":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900";
      case "EM_EXECUCAO":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900";
      case "CANCELADA":
        return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900";
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                Ordens de Serviço & Manutenção
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Abertura de chamados, compra de materiais, notas fiscais e lançamento automático no Contas a Pagar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/financeiro"
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Ver Caixa do Dia</span>
            </Link>

            <Link
              href="/financeiro/pagar"
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Contas a Pagar</span>
            </Link>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Ordem de Serviço</span>
            </button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Abertas / Pendentes</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">
              {stats.abertas}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Em Execução</span>
              <Wrench className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {stats.emExecucao}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Concluídas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.concluidas}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Custo Total de O.S</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-zinc-100 mt-1">
              {formatCurrency(stats.custoTotalReal || stats.custoEstimadoTotal)}
            </p>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código, título, técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100"
              >
                <option value="TODOS">Status: Todos</option>
                <option value="ABERTA">Status: Abertas</option>
                <option value="EM_EXECUCAO">Status: Em Execução</option>
                <option value="CONCLUIDA">Status: Concluídas</option>
                <option value="CANCELADA">Status: Canceladas</option>
              </select>
            </div>

            <div>
              <select
                value={filtroPrioridade}
                onChange={(e) => setFiltroPrioridade(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100"
              >
                <option value="TODAS">Prioridade: Todas</option>
                <option value="URGENTE">Prioridade: Urgente</option>
                <option value="ALTA">Prioridade: Alta</option>
                <option value="MEDIA">Prioridade: Média</option>
                <option value="BAIXA">Prioridade: Baixa</option>
              </select>
            </div>

            <div>
              <select
                value={filtroFlatId}
                onChange={(e) => setFiltroFlatId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100"
              >
                <option value="">Filtrar por Imóvel: Todos</option>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {formatTipoImovel(f.tipoImovel)} {f.numero} ({f.local?.nome || "Condomínio"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Ordens de Serviço */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Carregando ordens de serviço...</span>
          </div>
        ) : ordensFiltradas.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
              Nenhuma ordem de serviço encontrada
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || filtroStatus !== "TODOS"
                ? "Tente ajustar os filtros de busca."
                : "Clique no botão acima para abrir a primeira ordem de serviço de manutenção."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ordensFiltradas.map((ordem) => {
              const prazoDate = ordem.prazo ? new Date(ordem.prazo).toLocaleDateString("pt-BR") : null;
              const valorExibicao = Number(ordem.valorReal || 0) > 0 ? ordem.valorReal : ordem.valorEstimado;
              const notasAnexadas = parseNotas(ordem.fotosJson);

              return (
                <div
                  key={ordem.id}
                  className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 shadow-xs hover:border-blue-500/40 transition flex flex-col justify-between space-y-3"
                >
                  {/* Cabeçalho do Card */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        {ordem.codigo}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                            ordem.prioridade
                          )}`}
                        >
                          {ordem.prioridade}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                            ordem.status
                          )}`}
                        >
                          {ordem.status === "EM_EXECUCAO"
                            ? "Em Execução"
                            : ordem.status === "CONCLUIDA"
                            ? "Concluída"
                            : ordem.status === "CANCELADA"
                            ? "Cancelada"
                            : "Aberta"}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 leading-snug">
                      {ordem.titulo}
                    </h3>

                    {ordem.descricao && (
                      <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {ordem.descricao}
                      </p>
                    )}
                  </div>

                  {/* Informações de Vínculo: Imóvel e Locatário */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/80 dark:border-zinc-800/80 text-xs space-y-2">
                    {ordem.flat && (
                      <div className="flex items-center space-x-1.5 text-slate-700 dark:text-zinc-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">
                          {formatTipoImovel(ordem.flat.tipoImovel)} {ordem.flat.numero}
                        </span>
                        {ordem.flat.local?.nome && (
                          <span className="text-slate-400 text-[11px]">({ordem.flat.local.nome})</span>
                        )}
                      </div>
                    )}

                    {ordem.locatario && (
                      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-zinc-400 text-[11px]">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{ordem.locatario.nome}</span>
                      </div>
                    )}

                    {ordem.responsavel && (
                      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-zinc-400 text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Prestador: {ordem.responsavel}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-zinc-800/60 text-slate-500">
                      <span>Prazo: {prazoDate || "Não informado"}</span>
                      {valorExibicao > 0 && (
                        <span className="font-bold text-slate-900 dark:text-zinc-200">
                          {formatCurrency(valorExibicao)}
                        </span>
                      )}
                    </div>

                    {/* Vínculo Financeiro com Contas a Pagar */}
                    {ordem.contaPagar ? (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                            Contas a Pagar:
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              ordem.contaPagar.status === "PAGO"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                            }`}
                          >
                            {ordem.contaPagar.status === "PAGO" ? "Quitado" : "Pendente"}
                          </span>
                        </div>
                        <Link
                          href="/financeiro/pagar"
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-0.5"
                        >
                          <span>Ver no Financeiro</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    ) : valorExibicao > 0 ? (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400">
                        <span>Despesa não lançada</span>
                        <button
                          onClick={() => handleOpenEdit(ordem)}
                          className="font-bold underline cursor-pointer"
                        >
                          Lançar no Pagar
                        </button>
                      </div>
                    ) : null}

                    {/* Notas Fiscais e Comprovantes Anexados */}
                    {notasAnexadas.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-slate-600 dark:text-zinc-400 text-[10px]">
                          <FileText className="w-3 h-3 text-blue-500" />
                          <span className="font-bold">{notasAnexadas.length} comprovante(s) / NF</span>
                        </div>
                        <button
                          onClick={() => setViewingNotasOrdem(ordem)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-0.5 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Notas</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      {ordem.status === "ABERTA" && (
                        <button
                          onClick={() => handleUpdateStatus(ordem, "EM_EXECUCAO")}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-400 font-bold text-[10px] transition cursor-pointer"
                        >
                          Iniciar Execução
                        </button>
                      )}
                      {ordem.status === "EM_EXECUCAO" && (
                        <button
                          onClick={() => handleUpdateStatus(ordem, "CONCLUIDA")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Concluir O.S.</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleImprimirOS(ordem)}
                        disabled={imprimindoOSId === ordem.id}
                        title="Imprimir O.S. (PDF oficial com fotos e comprovantes)"
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                      >
                        {imprimindoOSId === ordem.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        ) : (
                          <Printer className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(ordem)}
                        title="Editar O.S. e Comprovantes"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ordem.id)}
                        title="Excluir O.S."
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: NOVA OU EDITAR O.S. COM UPLOAD MÚLTIPLO DE NOTAS FISCAIS */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-zinc-100">
              {/* Header do Modal */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                      {editingOrdem ? `Editar Ordem de Serviço (${editingOrdem.codigo})` : "Nova Ordem de Serviço"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Preencha os dados, anexe as notas fiscais de compra e lance automaticamente no financeiro
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Formulário com Labels Claras */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Título do Chamado */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Título da Ordem de Serviço *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ex: Troca de disjuntor elétrico / Manutenção no Ar-condicionado"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 2. Descrição Detalhada */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Descrição do Problema / Serviço
                  </label>
                  <textarea
                    rows={2}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Descreva detalhes do defeito, materiais necessários ou especificações técnicas..."
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl p-3 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>

                {/* 3. Imóvel e Categoria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Imóvel / Espaço Vinculado
                    </label>
                    <select
                      value={form.flatId}
                      onChange={(e) => setForm({ ...form, flatId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                    >
                      <option value="">-- Nenhum Imóvel Específico --</option>
                      {flats.map((f) => (
                        <option key={f.id} value={f.id}>
                          {formatTipoImovel(f.tipoImovel)} {f.numero} ({f.local?.nome || "Condomínio / Local"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Categoria do Serviço
                    </label>
                    <select
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                    >
                      {CATEGORIAS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Solicitante / Locatário e Nível de Prioridade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Locatário / Solicitante
                    </label>
                    <select
                      value={form.locatarioId}
                      onChange={(e) => setForm({ ...form, locatarioId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100"
                    >
                      <option value="">-- Sem Locatário Vinculado --</option>
                      {locatarios.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.nome} ({loc.telefone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Nível de Prioridade *
                    </label>
                    <select
                      value={form.prioridade}
                      onChange={(e) => setForm({ ...form, prioridade: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-semibold"
                    >
                      <option value="BAIXA">🟢 Baixa (Rotina)</option>
                      <option value="MEDIA">🟡 Média (Padrão)</option>
                      <option value="ALTA">🟠 Alta (Importante)</option>
                      <option value="URGENTE">🔴 Urgente (Imediata)</option>
                    </select>
                  </div>
                </div>

                {/* 5. Fornecedor e Responsável */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Fornecedor / Loja de Material Cadastrada
                    </label>
                    <select
                      value={form.fornecedorId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        const sel = fornecedores.find((f) => f.id === selId);
                        setForm({
                          ...form,
                          fornecedorId: selId,
                          fornecedorNome: sel ? sel.razaoSocial : form.fornecedorNome,
                          responsavel: sel ? sel.razaoSocial : form.responsavel,
                        });
                      }}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-semibold"
                    >
                      <option value="">-- Digitar nome livre abaixo --</option>
                      {fornecedores.map((forn) => (
                        <option key={forn.id} value={forn.id}>
                          {forn.razaoSocial} {forn.cnpj ? `(${forn.cnpj})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Responsável / Nome do Prestador
                    </label>
                    <input
                      type="text"
                      value={form.responsavel}
                      onChange={(e) => setForm({ ...form, responsavel: e.target.value, fornecedorNome: e.target.value })}
                      placeholder="Ex: João Eletricista / Casa dos Disjuntores"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* 6. Prazo e Forma de Pagamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Prazo Limite / Vencimento
                    </label>
                    <input
                      type="date"
                      value={form.prazo}
                      onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      Forma de Pagamento Prevista
                    </label>
                    <select
                      value={form.formaPagamento}
                      onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-semibold"
                    >
                      <option value="PIX">PIX</option>
                      <option value="BOLETO">Boleto Bancário</option>
                      <option value="TRANSFERENCIA">Transferência / TED</option>
                      <option value="DINHEIRO">Dinheiro / Espécie</option>
                      <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                      <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    </select>
                  </div>
                </div>

                {/* 7. Bloco Financeiro com Integração no Contas a Pagar */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30 dark:border-emerald-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black text-slate-900 dark:text-zinc-100">
                        Custos & Lançamento no Contas a Pagar
                      </span>
                    </div>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.lancarContaPagar}
                        onChange={(e) => setForm({ ...form, lancarContaPagar: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Lançar no Contas a Pagar
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Valor Estimado (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.valorEstimado}
                        onChange={(e) => setForm({ ...form, valorEstimado: e.target.value })}
                        placeholder="0,00"
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        Valor Real / Final (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.valorReal}
                        onChange={(e) => setForm({ ...form, valorReal: e.target.value })}
                        placeholder="0,00"
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Opção se a despesa já foi quitada */}
                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.pago}
                        onChange={(e) => setForm({ ...form, pago: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span>Marcar despesa como <strong>PAGA</strong> imediatamente</span>
                    </label>

                    <span className="text-[10px] text-slate-400">
                      Gera lançamento com status {form.pago ? "PAGO (Caixa do Dia)" : "PENDENTE"}
                    </span>
                  </div>
                </div>

                {/* 8. UPLOAD MÚLTIPLO DE NOTAS FISCAIS & COMPROVANTES DE MATERIAL */}
                <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/30 dark:border-blue-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100">
                          Notas Fiscais & Comprovantes de Material
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Faça upload de fotos, recibos ou PDFs das compras de peças e materiais
                        </p>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingNotas ? "Enviando..." : "Anexar Notas"}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleUploadNotas}
                        disabled={uploadingNotas}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Lista / Miniaturas de Notas Anexadas */}
                  {form.notas.length === 0 ? (
                    <div className="py-4 text-center border-2 border-dashed border-slate-300 dark:border-zinc-800 rounded-xl bg-white/60 dark:bg-zinc-900/60 text-slate-400 text-xs">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span>Nenhum comprovante ou nota fiscal anexada a esta O.S.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {form.notas.map((nota) => (
                        <div
                          key={nota.id}
                          className="group relative p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between space-x-2 shadow-xs"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {nota.tipo === "PDF" ? (
                              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : (
                              <img
                                src={nota.url}
                                alt={nota.nome}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                              />
                            )}
                            <div className="truncate">
                              <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate" title={nota.nome}>
                                {nota.nome}
                              </p>
                              <span className="text-[9px] text-slate-400">{nota.tipo}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <a
                              href={nota.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-blue-500 transition"
                              title="Visualizar Comprovante"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoverNota(nota.id)}
                              className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                              title="Remover Comprovante"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 9. Observações Internas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Observações Internas
                  </label>
                  <input
                    type="text"
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    placeholder="Notas adicionais, número de nota fiscal, garantia das peças..."
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Botões do Modal */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-zinc-800">
                  <div>
                    {editingOrdem && (
                      <button
                        type="button"
                        onClick={() => handleImprimirOS(editingOrdem)}
                        disabled={imprimindoOSId === editingOrdem.id}
                        className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer border border-blue-200 dark:border-blue-900"
                      >
                        {imprimindoOSId === editingOrdem.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        ) : (
                          <Printer className="w-3.5 h-3.5" />
                        )}
                        <span>Imprimir O.S. (PDF)</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs cursor-pointer transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{saving ? "Salvando..." : editingOrdem ? "Salvar Alterações" : "Criar Ordem de Serviço"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE VISUALIZAÇÃO DE COMPROVANTES DA O.S */}
        {viewingNotasOrdem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-zinc-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">
                      Comprovantes & Notas Fiscais ({viewingNotasOrdem.codigo})
                    </h3>
                    <p className="text-xs text-slate-500">
                      {viewingNotasOrdem.titulo} • Total de anexos: {parseNotas(viewingNotasOrdem.fotosJson).length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingNotasOrdem(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {parseNotas(viewingNotasOrdem.fotosJson).map((nota) => (
                  <div
                    key={nota.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      {nota.tipo === "PDF" ? (
                        <div className="h-32 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex flex-col items-center justify-center text-rose-600 space-y-1">
                          <FileText className="w-8 h-8" />
                          <span className="text-[11px] font-bold">Documento PDF</span>
                        </div>
                      ) : (
                        <img
                          src={nota.url}
                          alt={nota.nome}
                          className="h-32 w-full object-cover rounded-xl border border-slate-200 dark:border-zinc-800 cursor-pointer hover:opacity-90 transition"
                          onClick={() => window.open(nota.url, "_blank")}
                        />
                      )}
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-2 truncate" title={nota.nome}>
                        {nota.nome}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
                      <span className="text-[10px] text-slate-400">
                        {nota.criadoEm ? new Date(nota.criadoEm).toLocaleDateString("pt-BR") : ""}
                      </span>
                      <a
                        href={nota.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Abrir</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  onClick={() => handleImprimirOS(viewingNotasOrdem)}
                  disabled={imprimindoOSId === viewingNotasOrdem.id}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  {imprimindoOSId === viewingNotasOrdem.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Printer className="w-3.5 h-3.5" />
                  )}
                  <span>Imprimir O.S. com Fotos</span>
                </button>
                <button
                  onClick={() => setViewingNotasOrdem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
