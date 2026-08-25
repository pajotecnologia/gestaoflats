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
  FileText,
  Plus,
  Trash2,
  GripVertical,
  Move,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Paintbrush,
} from "lucide-react";

export default function ModelosContratoPage() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [selectedModeloId, setSelectedModeloId] = useState<string | null>(null);

  // Função utilitária que converte QUALQUER cor de texto azul/colorida existente para PRETO PURO (#000000)
  const forceBlackText = (html: string) => {
    if (!html) return html;
    return html
      .replace(/color:\s*#[0-9a-fA-F]{3,6}/gi, "color: #000000")
      .replace(/color:\s*rgba?\([^)]+\)/gi, "color: #000000")
      .replace(/color:\s*blue/gi, "color: #000000")
      .replace(/color:\s*navy/gi, "color: #000000");
  };

  const defaultContentHtml = `<h2 style="text-align: center; color: #000000; font-family: Arial, sans-serif; font-weight: bold;">CONTRATO DE LOCAÇÃO DE FLAT RESIDENCIAL</h2>
<p style="text-align: justify; line-height: 1.6; color: #000000; font-family: Arial, sans-serif;">Pelo presente instrumento particular de locação residencial, de um lado como <strong>LOCADORA</strong> a empresa <strong>{{empresa.nomeFantasia}}</strong>, e de outro lado como <strong>LOCATÁRIO(A)</strong> o(a) Sr(a). <strong>{{locatario.nome}}</strong>, inscrito(a) no CPF sob o nº <strong>{{locatario.cpf}}</strong>.</p>
<hr style="border: 0; border-top: 1px solid #000000; margin: 15px 0;" />
<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif;"><strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O imóvel objeto desta locação é o <strong>Flat nº {{flat.numero}}</strong> do <strong>{{local.nome}}</strong>, totalmente mobiliado, decorado e equipado com todos os utensílios conforme laudo de vistoria.</p>
<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif;"><strong>CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO:</strong> O aluguel mensal ajustado é de <strong>{{contrato.valorMensal}}</strong> ({{contrato.valorExtenso}}), devendo ser pago impreterivelmente até a data de vencimento de cada mês de vigência.</p>
<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif;"><strong>CLÁUSULA TERCEIRA - DA VIGÊNCIA:</strong> O contrato vigorará pelo período de <strong>{{contrato.validadeMeses}}</strong>, com início em <strong>{{contrato.dataEmissao}}</strong> e término previsto para <strong>{{contrato.dataFinal}}</strong>.</p>
<br/><br/>
<table style="width: 100%; margin-top: 40px; text-align: center; color: #000000; font-family: Arial, sans-serif;">
  <tr>
    <td style="width: 50%; color: #000000;">___________________________________<br/><strong>{{empresa.nomeFantasia}}</strong><br/>Locadora</td>
    <td style="width: 50%; color: #000000;">___________________________________<br/><strong>{{locatario.nome}}</strong><br/>Locatário(a)</td>
  </tr>
</table>`;

  const [activeWordTab, setActiveWordTab] = useState<"inicio" | "inserir" | "layout">("inicio");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<"editor" | "preview">("editor");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [previewHtmlContent, setPreviewHtmlContent] = useState("");
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // Carregar modelos do banco de dados
  const loadModelos = async () => {
    try {
      const res = await fetch("/api/modelos-contrato");
      const data = await res.json();
      setModelos(data.modelos || []);
    } catch (err) {
      console.error("Erro ao carregar modelos:", err);
    }
  };

  useEffect(() => {
    loadModelos();
  }, []);

  // Preencher o editor de forma 100% não-controlada (sem re-renders ao digitar)
  const setEditorHtml = (htmlContent: string) => {
    if (editorRef.current) {
      const cleanBlackHtml = forceBlackText(htmlContent);
      editorRef.current.innerHTML = cleanBlackHtml;
      updateWordCount();
    }
  };

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      setEditorHtml(defaultContentHtml);
    }
  }, []);

  const updateWordCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      const words = text.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
    }
  };

  const handleSelectModelo = (mod: any) => {
    setSelectedModeloId(mod.id);
    setTitulo(mod.titulo);
    setEditorHtml(mod.conteudoHtml || defaultContentHtml);
    setFeedback(`📄 Modelo "${mod.titulo}" carregado! Texto convertido para Preto Puro (#000000).`);
  };

  const handleNovoModelo = () => {
    setSelectedModeloId(null);
    setTitulo("");
    setEditorHtml(defaultContentHtml);
    setFeedback("✨ Novo modelo em branco pronto para edição.");
  };

  const handleForceBlackAllText = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = forceBlackText(editorRef.current.innerHTML);
      setFeedback("🎨 Todo o texto do contrato foi convertido para Preto Puro (#000000)!");
    }
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

  const execCmd = (command: string, value: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);

    // Garante que a cor permaneça preta
    if (command === "foreColor" || command === "formatBlock") {
      handleForceBlackAllText();
    } else {
      updateWordCount();
    }
  };

  // Arrastar e Soltar (Drag & Drop) de Tags no Editor A4
  const handleDragStartTag = (e: React.DragEvent, tag: string) => {
    e.dataTransfer.setData("text/plain", tag);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOverCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDraggingOverCanvas) {
      setIsDraggingOverCanvas(true);
    }
  };

  const handleDragLeaveCanvas = () => {
    setIsDraggingOverCanvas(false);
  };

  const handleDropTagOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(false);

    const tag = e.dataTransfer.getData("text/plain");
    if (!tag || !editorRef.current) return;

    let range: Range | null = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if ((e as any).rangeParent) {
      range = document.createRange();
      range.setStart((e as any).rangeParent, (e as any).rangeOffset);
      range.collapse(true);
    }

    if (range && editorRef.current.contains(range.startContainer)) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }

      const strongNode = document.createElement("strong");
      strongNode.style.color = "#000000";
      strongNode.innerText = ` ${tag} `;

      range.deleteContents();
      range.insertNode(strongNode);

      range.setStartAfter(strongNode);
      range.collapse(true);

      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }

      updateWordCount();
      setFeedback(`📍 Tag "${tag}" inserida na posição do mouse!`);
    } else {
      // Se soltar na folha A4 fora de um nó específico, insere no final
      handleInsertTag(tag);
    }
  };

  const handleInsertTag = (tag: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
      execCmd("insertHTML", `<strong style="color:#000000;"> ${tag} </strong>`);
    } else {
      editorRef.current.innerHTML += `<p style="line-height:1.6; color:#000000;"><strong style="color:#000000;">${tag}</strong></p>`;
    }
    updateWordCount();
    setFeedback(`📍 Tag "${tag}" inserida no texto!`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawHtml = editorRef.current ? editorRef.current.innerHTML : "";
    const cleanHtml = forceBlackText(rawHtml);

    if (!titulo.trim()) {
      setFeedback("⚠️ Por favor, informe um Título para o modelo de contrato.");
      return;
    }

    if (!cleanHtml.trim()) {
      setFeedback("⚠️ O conteúdo do contrato não pode estar vazio.");
      return;
    }

    setSaving(true);
    setFeedback("");

    try {
      const res = await fetch("/api/modelos-contrato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedModeloId, titulo: titulo.trim(), conteudoHtml: cleanHtml }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback(`❌ Erro ao salvar: ${data.error}`);
      } else {
        setFeedback("✅ Modelo de contrato salvo com sucesso em texto preto!");
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

  const handleTogglePreview = () => {
    if (activeViewMode === "editor") {
      const rawHtml = editorRef.current ? editorRef.current.innerHTML : defaultContentHtml;
      const cleanHtml = forceBlackText(rawHtml);

      const mockContrato = {
        id: "CTR-2026-001",
        valorMensal: 2500,
        validadeMeses: 12,
        dataEmissao: new Date(),
        dataFinal: new Date(Date.now() + 365 * 86400000),
        status: "ATIVO",
        statusAssinatura: "ASSINADO",
        dataAssinaturaLocatario: new Date(),
        ipAssinaturaLocatario: "191.243.216.169",
        locatario: {
          nome: "Dra. Mariana Silva Ribeiro",
          cpf: "746.926.314-49",
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
          nomeFantasia: "Residencial & Flats Prime",
          razaoSocial: "Prime Gestão e Empreendimentos LTDA",
          cnpj: "12.345.678/0001-90",
          telefone: "(81) 3344-5566",
          email: "contato@primegestao.com.br",
          endereco: "Rua do Imperador, 250, Recife - PE",
        },
      };
      setPreviewHtmlContent(replaceContractVariables(cleanHtml, mockContrato));
      setActiveViewMode("preview");
    } else {
      setActiveViewMode("editor");
    }
  };

  const [selectedTagCategory, setSelectedTagCategory] = useState<string>("TODAS");
  const [tagSearchQuery, setTagSearchQuery] = useState("");

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
                  Word Layout A4 (Preto Puro)
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Digitação 100% estável sem pulo de cursor • Arraste e solte tags com o mouse no local desejado
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleForceBlackAllText}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              title="Converte instantaneamente qualquer texto azul para Preto Puro (#000000)"
            >
              <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
              <span>Forçar Texto Preto</span>
            </button>

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
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
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
              Nenhum modelo de contrato salvo ainda. Digite o título e o texto abaixo na folha A4 e clique em <strong>Salvar Documento</strong>.
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
                Início (Formatação)
              </button>
              <button
                onClick={() => setActiveWordTab("inserir")}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition ${
                  activeWordTab === "inserir"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t border-x border-slate-300 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Inserir Tags (Arrastar & Soltar)
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
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeViewMode === "editor"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                Modo Edição (A4)
              </button>
              <button
                onClick={handleTogglePreview}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeViewMode === "preview"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pré-Visualização Real</span>
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

                <button
                  type="button"
                  onClick={handleForceBlackAllText}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center space-x-1.5 transition"
                  title="Converte todo o texto para Preto (#000000)"
                >
                  <Paintbrush className="w-3.5 h-3.5 text-amber-600" />
                  <span>Limpar Cores (Texto Preto)</span>
                </button>
              </>
            )}

            {activeWordTab === "inserir" && (
              <div className="w-full space-y-3 py-1">
                {/* Filtros de Categoria e Pesquisa de Tags */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Move className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Arraste com o mouse qualquer tag abaixo e solte diretamente em qualquer local do texto A4:
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

                {/* Grade de Tags Organizadas com suporte a Arrastar & Soltar */}
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
                                title="Arraste para soltar no local desejado da folha A4 ou clique para inserir no cursor"
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
                <span>Cor do Texto: Preto Puro (#000000)</span>
              </div>
            )}
          </div>

          {/* FOLHA A4 DO WORD (CANVAS UNCONTROLLED COM DROPZONE DESTACADO) */}
          <div className="p-8 sm:p-12 overflow-x-auto flex justify-center bg-slate-300 dark:bg-slate-950/80 min-h-[700px]">
            {activeViewMode === "editor" ? (
              <div
                onDragOver={handleDragOverCanvas}
                onDragLeave={handleDragLeaveCanvas}
                onDrop={handleDropTagOnCanvas}
                className={`w-full max-w-[800px] min-h-[1050px] bg-white text-black p-12 sm:p-16 shadow-2xl border transition-all duration-200 rounded-sm focus:outline-none space-y-4 font-serif text-sm leading-relaxed relative ${
                  isDraggingOverCanvas
                    ? "border-4 border-dashed border-blue-600 ring-8 ring-blue-500/30 bg-blue-50/10 scale-[1.01]"
                    : "border-slate-300"
                }`}
                style={{ color: "#000000" }}
              >
                {/* Visual Feedback ao arrastar tag sobre a folha A4 */}
                {isDraggingOverCanvas && (
                  <div className="absolute inset-x-0 top-6 z-20 pointer-events-none flex justify-center">
                    <span className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg animate-bounce flex items-center gap-1.5">
                      <Move className="w-4 h-4" />
                      Solte a tag aqui para inserir no local desejado!
                    </span>
                  </div>
                )}

                {/* Régua superior simulada do Word */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[8px] text-slate-400 px-12 select-none">
                  <span>0cm</span>
                  <span>5cm</span>
                  <span>10cm</span>
                  <span>15cm</span>
                  <span>21cm</span>
                </div>

                {/* Editor Não-Controlado nativo: Zero re-renders do React durante a digitação */}
                <div
                  ref={editorRef}
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onKeyUp={updateWordCount}
                  className="mt-4 focus:outline-none min-h-[900px] text-black font-serif text-sm leading-relaxed"
                  style={{ color: "#000000" }}
                />
              </div>
            ) : (
              <div
                className="w-full max-w-[800px] min-h-[1050px] bg-white text-black p-12 sm:p-16 shadow-2xl border border-slate-300 rounded-sm space-y-4 font-serif text-sm leading-relaxed"
                style={{ color: "#000000" }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtmlContent }}
                  style={{ color: "#000000" }}
                />
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
              <span>Layout de Impressão A4</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
