"use client";

import React, { useState, useEffect, useRef } from "react";
import Shell from "@/components/layout/Shell";
import { replaceContractVariables } from "@/lib/validation";
import {
  FileCode,
  Maximize2,
  Minimize2,
  Eye,
  Save,
  Tag,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  FileText,
  Printer,
  Sparkles,
  Type,
  Layout,
  Scissors,
  Copy,
  Check,
  Plus,
  Trash2,
  GripVertical,
  Move,
  User,
  Home,
  Building,
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ModelosContratoPage() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [conteudoHtml, setConteudoHtml] = useState(
    `<h2 style="text-align: center; color: #1e3a8a; font-family: Arial, sans-serif;">CONTRATO DE LOCAÇÃO DE FLAT RESIDENCIAL</h2>
<p style="text-align: justify; line-height: 1.6;">Pelo presente instrumento particular de locação residencial, de um lado como <strong>LOCADORA</strong> a empresa <strong>{{empresa_nome}}</strong>, e de outro lado como <strong>LOCATÁRIO(A)</strong> o(a) Sr(a). <strong>{{locatario_nome}}</strong>, inscrito(a) no CPF sob o nº <strong>{{cpf}}</strong>.</p>
<hr />
<p style="line-height: 1.6;"><strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O imóvel objeto desta locação é o <strong>Flat nº {{flat_numero}}</strong>, totalmente mobiliado, decorado e equipado com todos os utensílios conforme laudo de vistoria.</p>
<p style="line-height: 1.6;"><strong>CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO:</strong> O aluguel mensal ajustado é de <strong>{{valor_mensal}}</strong>, devendo ser pago impreterivelmente até a data de vencimento de cada mês de vigência.</p>
<p style="line-height: 1.6;"><strong>CLÁUSULA TERCEIRA - DA VIGÊNCIA:</strong> O contrato vigorará a partir da data de assinatura, com término previsto para <strong>{{data_fim}}</strong>.</p>
<br/><br/>
<table style="width: 100%; margin-top: 40px; text-align: center;">
  <tr>
    <td style="width: 50%;">___________________________________<br/><strong>{{empresa_nome}}</strong><br/>Locadora</td>
    <td style="width: 50%;">___________________________________<br/><strong>{{locatario_nome}}</strong><br/>Locatário(a)</td>
  </tr>
</table>`
  );

  const [selectedModeloId, setSelectedModeloId] = useState<string | null>(null);

  const defaultContentHtml = `<h2 style="text-align: center; color: #1e3a8a; font-family: Arial, sans-serif;">CONTRATO DE LOCAÇÃO DE FLAT RESIDENCIAL</h2>
<p style="text-align: justify; line-height: 1.6;">Pelo presente instrumento particular de locação residencial, de um lado como <strong>LOCADORA</strong> a empresa <strong>{{empresa.nomeFantasia}}</strong>, e de outro lado como <strong>LOCATÁRIO(A)</strong> o(a) Sr(a). <strong>{{locatario.nome}}</strong>, inscrito(a) no CPF sob o nº <strong>{{locatario.cpf}}</strong>.</p>
<hr />
<p style="line-height: 1.6;"><strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O imóvel objeto desta locação é o <strong>Flat nº {{flat.numero}}</strong> do <strong>{{local.nome}}</strong>, totalmente mobiliado, decorado e equipado com todos os utensílios conforme laudo de vistoria.</p>
<p style="line-height: 1.6;"><strong>CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO:</strong> O aluguel mensal ajustado é de <strong>{{contrato.valorMensal}}</strong> ({{contrato.valorExtenso}}), devendo ser pago impreterivelmente até a data de vencimento de cada mês de vigência.</p>
<p style="line-height: 1.6;"><strong>CLÁUSULA TERCEIRA - DA VIGÊNCIA:</strong> O contrato vigorará pelo período de <strong>{{contrato.validadeMeses}}</strong>, com início em <strong>{{contrato.dataEmissao}}</strong> e término previsto para <strong>{{contrato.dataFinal}}</strong>.</p>
<br/><br/>
<table style="width: 100%; margin-top: 40px; text-align: center;">
  <tr>
    <td style="width: 50%;">___________________________________<br/><strong>{{empresa.nomeFantasia}}</strong><br/>Locadora</td>
    <td style="width: 50%;">___________________________________<br/><strong>{{locatario.nome}}</strong><br/>Locatário(a)</td>
  </tr>
</table>`;

  const [activeWordTab, setActiveWordTab] = useState<"inicio" | "inserir" | "layout">("inicio");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<"editor" | "preview">("editor");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [wordCount, setWordCount] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);

  const handleSelectModelo = (mod: any) => {
    setSelectedModeloId(mod.id);
    setTitulo(mod.titulo);
    setConteudoHtml(mod.conteudoHtml);
  };

  const handleNovoModelo = () => {
    setSelectedModeloId(null);
    setTitulo("");
    setConteudoHtml(defaultContentHtml);
  };

  const handleDeleteModelo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente excluir este modelo de contrato?")) return;

    try {
      const res = await fetch(`/api/modelos-contrato?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedback("✅ Modelo de contrato excluído com sucesso!");
        if (selectedModeloId === id) {
          handleNovoModelo();
        }
        loadModelos();
      } else {
        const data = await res.json();
        setFeedback(`❌ Erro ao excluir: ${data.error}`);
      }
    } catch (err: any) {
      setFeedback(`❌ Erro ao conectar ao servidor.`);
    }
  };

  const loadModelos = async () => {
    try {
      const res = await fetch("/api/modelos-contrato");
      const data = await res.json();
      setModelos(data.modelos || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadModelos();
  }, []);

  useEffect(() => {
    // Contar palavras no documento Word
    const text = conteudoHtml.replace(/<[^>]*>/g, " ");
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [conteudoHtml]);

  const execCmd = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setConteudoHtml(editorRef.current.innerHTML);
    }
  };

  const handleInsertTag = (tag: string) => {
    if (activeViewMode !== "editor") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
      execCmd("insertHTML", ` <strong>${tag}</strong> `);
    } else {
      setConteudoHtml((prev) => prev + ` <strong>${tag}</strong> `);
    }
  };

  const [selectedTagCategory, setSelectedTagCategory] = useState<string>("TODAS");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [showTagsPanel, setShowTagsPanel] = useState(true);

  const handleDragStartTag = (e: React.DragEvent, tag: string) => {
    e.dataTransfer.setData("text/plain", tag);
    e.dataTransfer.setData("text/html", ` <strong>${tag}</strong> `);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropEditor = () => {
    setTimeout(() => {
      if (editorRef.current) {
        setConteudoHtml(editorRef.current.innerHTML);
      }
    }, 50);
  };

  const tagsCategorizadas = [
    {
      id: "locatario",
      categoria: "Locatário",
      corBadge: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      tags: [
        { label: "Nome do Locatário", tag: "{{locatario.nome}}" },
        { label: "CPF do Locatário", tag: "{{locatario.cpf}}" },
        { label: "RG do Locatário", tag: "{{locatario.rg}}" },
        { label: "Data de Nascimento", tag: "{{locatario.dataNascimento}}" },
        { label: "Telefone / WhatsApp", tag: "{{locatario.telefone}}" },
        { label: "E-mail do Locatário", tag: "{{locatario.email}}" },
        { label: "Endereço do Locatário", tag: "{{locatario.endereco}}" },
      ],
    },
    {
      id: "imovel",
      categoria: "Imóvel / Flat",
      corBadge: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      tags: [
        { label: "Número do Flat", tag: "{{flat.numero}}" },
        { label: "Status do Flat", tag: "{{flat.status}}" },
        { label: "Descrição do Flat", tag: "{{flat.descricao}}" },
        { label: "Valor Padrão do Flat", tag: "{{flat.valorPadrao}}" },
        { label: "Nome do Condomínio", tag: "{{local.nome}}" },
        { label: "Endereço do Condomínio", tag: "{{local.endereco}}" },
      ],
    },
    {
      id: "contrato",
      categoria: "Contrato & Valores",
      corBadge: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      tags: [
        { label: "Valor Mensal (R$)", tag: "{{contrato.valorMensal}}" },
        { label: "Valor por Extenso", tag: "{{contrato.valorExtenso}}" },
        { label: "Vigência (Meses)", tag: "{{contrato.validadeMeses}}" },
        { label: "Data de Início", tag: "{{contrato.dataEmissao}}" },
        { label: "Data de Término", tag: "{{contrato.dataFinal}}" },
        { label: "Status da Assinatura", tag: "{{contrato.statusAssinatura}}" },
        { label: "Data da Assinatura", tag: "{{contrato.dataAssinatura}}" },
        { label: "IP da Assinatura", tag: "{{contrato.ipAssinatura}}" },
      ],
    },
    {
      id: "empresa",
      categoria: "Empresa / Locadora",
      corBadge: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      tags: [
        { label: "Nome Fantasia", tag: "{{empresa.nomeFantasia}}" },
        { label: "Razão Social", tag: "{{empresa.razaoSocial}}" },
        { label: "CNPJ da Empresa", tag: "{{empresa.cnpj}}" },
        { label: "Telefone da Empresa", tag: "{{empresa.telefone}}" },
        { label: "E-mail da Empresa", tag: "{{empresa.email}}" },
        { label: "Endereço da Empresa", tag: "{{empresa.endereco}}" },
      ],
    },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !conteudoHtml) return;

    setSaving(true);
    setFeedback("");

    try {
      const res = await fetch("/api/modelos-contrato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedModeloId, titulo, conteudoHtml }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback(`❌ Erro: ${data.error}`);
      } else {
        setFeedback("✅ Modelo de contrato salvo com sucesso!");
        if (data.modelo?.id) {
          setSelectedModeloId(data.modelo.id);
        }
        loadModelos();
      }
    } catch (err) {
      setFeedback("❌ Erro ao conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  };

  const getPreviewHtml = () => {
    const mockContrato = {
      id: "CTR-2026-001",
      valorMensal: 2500,
      validadeMeses: 12,
      dataEmissao: new Date(),
      dataFinal: new Date(Date.now() + 365 * 86400000),
      status: "ATIVO",
      statusAssinatura: "ASSINADO",
      dataAssinaturaLocatario: new Date(),
      ipAssinaturaLocatario: "187.54.21.90",
      locatario: {
        nome: "Dra. Mariana Silva Ribeiro",
        cpf: "123.456.789-00",
        rg: "9.876.543 SSP/PE",
        dataNascimento: "15/04/1988",
        email: "mariana.ribeiro@email.com",
        telefone: "(87) 99654-0551",
        endereco: "Av. Boa Viagem, 1500, Apt 101, Recife - PE",
      },
      flat: {
        numero: "101",
        status: "DISPONIVEL",
        descricao: "Flat vista para o mar totalmente mobiliado",
        valorPadrao: 2500,
        local: {
          nome: "Condomínio Edifício Mar Azul",
          endereco: "Av. Beira Mar, 100, Recife - PE",
        },
      },
      empresa: {
        nomeFantasia: "Prime Gestão Imobiliária",
        razaoSocial: "Prime Gestão e Empreendimentos LTDA",
        cnpj: "12.345.678/0001-90",
        telefone: "(81) 3344-5566",
        email: "contato@primegestao.com.br",
        endereco: "Rua do Imperador, 250, Recife - PE",
      },
    };
    return replaceContractVariables(conteudoHtml, mockContrato);
  };

  const tagsDisponiveis = [
    // Locatário
    { label: "Nome Locatário", tag: "{{locatario.nome}}" },
    { label: "CPF Locatário", tag: "{{locatario.cpf}}" },
    { label: "RG Locatário", tag: "{{locatario.rg}}" },
    { label: "Tel/WhatsApp", tag: "{{locatario.telefone}}" },
    { label: "E-mail Locatário", tag: "{{locatario.email}}" },
    { label: "Endereço Locatário", tag: "{{locatario.endereco}}" },
    // Imóvel / Flat
    { label: "Nº Flat", tag: "{{flat.numero}}" },
    { label: "Nome Condomínio", tag: "{{local.nome}}" },
    { label: "Endereço Condomínio", tag: "{{local.endereco}}" },
    // Contrato / Gestão
    { label: "Valor Mensal (R$)", tag: "{{contrato.valorMensal}}" },
    { label: "Valor Extenso", tag: "{{contrato.valorExtenso}}" },
    { label: "Vigência (Meses)", tag: "{{contrato.validadeMeses}}" },
    { label: "Data Início", tag: "{{contrato.dataEmissao}}" },
    { label: "Data Término", tag: "{{contrato.dataFinal}}" },
    // Empresa
    { label: "Nome Empresa", tag: "{{empresa.nomeFantasia}}" },
    { label: "CNPJ Empresa", tag: "{{empresa.cnpj}}" },
  ];

  return (
    <Shell>
      <div className={`space-y-4 ${isFullscreen ? "fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 p-4 overflow-y-auto" : ""}`}>
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>Editor de Contratos Word</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  Word Layout A4
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Edição visual avançada estilo Microsoft Word com suporte a tags dinâmicas
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Salvando..." : "Salvar Documento"}</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm">
            {feedback}
          </div>
        )}

        {/* PAINEL SUPERIOR: MODELOS DE CONTRATO SALVOS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Modelos de Contrato Cadastrados ({modelos.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleNovoModelo}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Criar Novo Modelo em Branco</span>
            </button>
          </div>

          {modelos.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              Nenhum modelo de contrato salvo ainda. Digite o título e conteúdo abaixo e clique em <strong>Salvar Documento</strong>.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {modelos.map((mod) => {
                const isSelected = selectedModeloId === mod.id || titulo === mod.titulo;
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleSelectModelo(mod)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 relative group ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-400"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate block">
                          {mod.titulo}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Atualizado: {new Date(mod.updatedAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {isSelected ? "✏️ Editando..." : "👉 Carregar no Editor"}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteModelo(mod.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition"
                        title="Excluir Modelo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Título do Documento Word */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex items-center space-x-3">
          <FileText className="w-4 h-4 text-blue-600" />
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do Documento Word (ex: Contrato Padrão de Flat Anual 2026)"
            className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none placeholder-slate-400"
          />
        </div>

        {/* ESTRUTURA DO MICROSOFT WORD: Ribbon Toolbar + Folha A4 */}
        <div className="bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Ribbon Header (Abas do Word: Início, Inserir, Layout) */}
          <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800 px-4 pt-2 flex items-center justify-between">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveWordTab("inicio")}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition ${
                  activeWordTab === "inicio"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t border-x border-slate-300 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Início (Página Inicial)
              </button>
              <button
                onClick={() => setActiveWordTab("inserir")}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition ${
                  activeWordTab === "inserir"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t border-x border-slate-300 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Inserir Tags & Tabelas
              </button>
              <button
                onClick={() => setActiveWordTab("layout")}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition ${
                  activeWordTab === "layout"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t border-x border-slate-300 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Layout da Página A4
              </button>
            </div>

            <div className="flex items-center space-x-1 pb-1">
              <button
                onClick={() => setActiveViewMode("editor")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  activeViewMode === "editor"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                Modo Edição
              </button>
              <button
                onClick={() => setActiveViewMode("preview")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                  activeViewMode === "preview"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pré-Visualização</span>
              </button>
            </div>
          </div>

          {/* Ribbon Toolbar Controls (Estilo Word) */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 p-2.5 flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
            {activeWordTab === "inicio" && (
              <>
                {/* Formatação Básica */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => execCmd("bold")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-bold"
                    title="Negrito (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("italic")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded italic"
                    title="Itálico (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("underline")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded underline"
                    title="Sublinhado (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("strikeThrough")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded line-through"
                    title="Tachado"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                </div>

                {/* Alinhamento */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => execCmd("justifyLeft")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Alinhar à Esquerda"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("justifyCenter")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Centralizar"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("justifyRight")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Alinhar à Direita"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("justifyFull")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Justificar"
                  >
                    <AlignJustify className="w-4 h-4" />
                  </button>
                </div>

                {/* Listas e Títulos */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => execCmd("insertUnorderedList")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Lista com Marcadores"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("insertOrderedList")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    title="Lista Numerada"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("formatBlock", "<h2>")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-xs font-bold"
                    title="Título H2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => execCmd("formatBlock", "<p>")}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-xs"
                    title="Parágrafo Normal"
                  >
                    P
                  </button>
                </div>
              </>
            )}

            {activeWordTab === "inserir" && (
              <div className="w-full space-y-3 py-1">
                {/* Filtros de Categoria e Pesquisa de Tags */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Move className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Caixa de Ferramentas de Tags (Arraste para soltar na folha A4 ou clique para inserir no cursor):
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        placeholder="Buscar tag..."
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none placeholder-slate-400 w-36 sm:w-48"
                      />
                    </div>

                    <div className="flex items-center space-x-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSelectedTagCategory("TODAS")}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                          selectedTagCategory === "TODAS"
                            ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTagCategory("locatario")}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                          selectedTagCategory === "locatario"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-blue-600"
                        }`}
                      >
                        👤 Locatário
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTagCategory("imovel")}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                          selectedTagCategory === "imovel"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"
                        }`}
                      >
                        🏠 Imóvel
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTagCategory("contrato")}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                          selectedTagCategory === "contrato"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
                        }`}
                      >
                        📄 Contrato
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTagCategory("empresa")}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                          selectedTagCategory === "empresa"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-amber-600"
                        }`}
                      >
                        🏢 Empresa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grade de Tags Organizadas com visualização da sintaxe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {tagsCategorizadas
                    .filter((cat) => selectedTagCategory === "TODAS" || cat.id === selectedTagCategory)
                    .map((cat) => {
                      const filteredTags = cat.tags.filter(
                        (t) =>
                          t.label.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                          t.tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
                      );

                      if (filteredTags.length === 0) return null;

                      return (
                        <div
                          key={cat.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${cat.corBadge}`}>
                              {cat.categoria}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">{filteredTags.length} tags</span>
                          </div>

                          <div className="space-y-1.5">
                            {filteredTags.map((item) => (
                              <div
                                key={item.tag}
                                draggable={true}
                                onDragStart={(e) => handleDragStartTag(e, item.tag)}
                                onClick={() => handleInsertTag(item.tag)}
                                className="group p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200/80 dark:border-slate-800 transition cursor-grab active:cursor-grabbing flex items-center justify-between shadow-sm hover:shadow hover:border-blue-300 dark:hover:border-blue-700 select-none"
                                title="Arraste para soltar no texto da folha A4 ou clique para inserir no cursor"
                              >
                                <div className="flex items-center space-x-2 overflow-hidden">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition flex-shrink-0" />
                                  <div className="truncate">
                                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">
                                      {item.label}
                                    </span>
                                    <code className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block truncate">
                                      {item.tag}
                                    </code>
                                  </div>
                                </div>
                                <Move className="w-3 h-3 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-1" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {activeWordTab === "layout" && (
              <div className="flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Formato do Papel: A4 (210mm x 297mm)</span>
                <span>Margens: Padrão 2.5cm</span>
                <span>Orientação: Retrato</span>
              </div>
            )}
          </div>

          {/* FOLHA A4 DO WORD (CANVAS DO DOCUMENTO) */}
          <div className="p-8 sm:p-12 overflow-x-auto flex justify-center bg-slate-300 dark:bg-slate-950/80 min-h-[700px]">
            {activeViewMode === "editor" ? (
              <div
                className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 p-12 sm:p-16 shadow-2xl border border-slate-300 rounded-sm focus:outline-none space-y-4 font-serif text-sm leading-relaxed relative"
              >
                {/* Régua superior simulada do Word */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[8px] text-slate-400 px-12 select-none">
                  <span>0cm</span>
                  <span>5cm</span>
                  <span>10cm</span>
                  <span>15cm</span>
                  <span>21cm</span>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setConteudoHtml(e.currentTarget.innerHTML)}
                  onDrop={handleDropEditor}
                  onDragOver={(e) => e.preventDefault()}
                  dangerouslySetInnerHTML={{ __html: conteudoHtml }}
                  className="mt-4 focus:outline-none min-h-[900px]"
                />
              </div>
            ) : (
              <div className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 p-12 sm:p-16 shadow-2xl border border-slate-300 rounded-sm space-y-4 font-serif text-sm leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
              </div>
            )}
          </div>

          {/* Barra de Status do Word (Rodapé) */}
          <div className="bg-blue-700 text-white px-4 py-1.5 text-[11px] font-medium flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>Página 1 de 1</span>
              <span>{wordCount} palavras</span>
              <span>Português (Brasil)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Layout de Impressão</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
