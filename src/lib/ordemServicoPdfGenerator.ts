import jsPDF from "jspdf";
import { drawStandardPDFHeader, ensurePngDataUrl } from "./pdfHeaderBuilder";
import { formatCurrency } from "./validation";
import { NotaMaterialAnexo } from "@/app/ordens-servico/page";

export interface OrdemServicoPDFData {
  codigo: string;
  titulo: string;
  descricao?: string | null;
  categoria: string;
  prioridade: string;
  status: string;
  responsavel?: string | null;
  fornecedorNome?: string | null;
  valorEstimado?: number;
  valorReal?: number;
  dataAbertura: string;
  prazo?: string | null;
  dataConclusao?: string | null;
  observacao?: string | null;
  flatNumero?: string | null;
  localNome?: string | null;
  tipoImovel?: string | null;
  locatarioNome?: string | null;
  locatarioTelefone?: string | null;
  contaPagarStatus?: string | null;
  formaPagamento?: string | null;
  notasAnexadas?: NotaMaterialAnexo[];

  // Dados da Empresa / Cabeçalho
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
}

export async function buildOrdemServicoPDFDoc(data: OrdemServicoPDFData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. Cabeçalho Padrão White Clean
  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome || "Gestão Imobiliária",
    empresaCnpj: data.empresaCnpj || "00.000.000/0001-00",
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: `ORDEM DE SERVIÇO & MANUTENÇÃO - ${data.codigo}`,
    subtituloDocumento: `Emissão: ${new Date(data.dataAbertura || Date.now()).toLocaleDateString("pt-BR")}`,
    variant: "white",
  });

  let y = 56;

  // 2. Banner de Status e Prioridade
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text(`CÓDIGO: ${data.codigo}`, margin + 4, y + 6);
  doc.text(`CATEGORIA: ${data.categoria}`, margin + 60, y + 6);

  const statusLabel =
    data.status === "CONCLUIDA"
      ? "CONCLUÍDA"
      : data.status === "EM_EXECUCAO"
      ? "EM EXECUÇÃO"
      : data.status === "CANCELADA"
      ? "CANCELADA"
      : "ABERTA / PENDENTE";

  doc.text(`STATUS: ${statusLabel}`, margin + 4, y + 11);
  doc.text(`PRIORIDADE: ${data.prioridade}`, margin + 60, y + 11);

  const prazoDisplay = data.prazo
    ? new Date(data.prazo).toLocaleDateString("pt-BR")
    : "Não informado";
  doc.text(`PRAZO LIMITE: ${prazoDisplay}`, margin + 120, y + 11);

  y += 18;

  // 3. Título da Ordem de Serviço
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(data.titulo, margin, y);
  y += 6;

  // 4. Seção: Imóvel & Solicitante | Prestador & Custos
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, "FD");

  // Coluna Esquerda: Imóvel e Solicitante
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text("DADOS DO IMÓVEL & SOLICITANTE", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const imovelText = data.flatNumero
    ? `${data.tipoImovel || "Imóvel"} ${data.flatNumero}${data.localNome ? ` (${data.localNome})` : ""}`
    : "Nenhum imóvel específico vinculado";
  doc.text(`• Unidade: ${imovelText}`, margin + 4, y + 11);

  const locatarioText = data.locatarioNome
    ? `${data.locatarioNome}${data.locatarioTelefone ? ` - Tel: ${data.locatarioTelefone}` : ""}`
    : "Solicitação direta da administração / sem locatário";
  doc.text(`• Solicitante: ${locatarioText}`, margin + 4, y + 17);

  const dataAberturaStr = new Date(data.dataAbertura || Date.now()).toLocaleDateString("pt-BR");
  doc.text(`• Abertura: ${dataAberturaStr}`, margin + 4, y + 23);
  if (data.dataConclusao) {
    doc.text(`• Conclusão: ${new Date(data.dataConclusao).toLocaleDateString("pt-BR")}`, margin + 4, y + 29);
  }

  // Coluna Direita: Técnico / Fornecedor e Custos
  const col2X = margin + 95;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text("PRESTADOR & CUSTOS FINANCEIROS", col2X, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const prestadorText = data.responsavel || data.fornecedorNome || "A definir";
  doc.text(`• Prestador / Técnico: ${prestadorText}`, col2X, y + 11);

  const vEstimado = formatCurrency(data.valorEstimado || 0);
  const vReal = formatCurrency(data.valorReal || 0);
  doc.text(`• Custo Estimado: ${vEstimado}`, col2X, y + 17);
  doc.text(`• Custo Real / Final: ${vReal}`, col2X, y + 23);

  const statusFin = data.contaPagarStatus === "PAGO" ? "QUITADO / PAGO" : "PENDENTE NO CONTAS A PAGAR";
  doc.text(`• Financeiro: ${statusFin}${data.formaPagamento ? ` (${data.formaPagamento})` : ""}`, col2X, y + 29);

  y += 38;

  // 5. Descrição Detalhada do Serviço / Problema
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Descrição do Serviço Solicitado:", margin, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const descText = data.descricao || "Nenhum detalhe adicional informado na abertura deste chamado.";
  const descLines = doc.splitTextToSize(descText, contentWidth);
  doc.text(descLines, margin, y);
  y += descLines.length * 4.5 + 4;

  // 6. Observações Internas / Garantia
  if (data.observacao) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Observações & Termos Técnicos:", margin, y);
    y += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const obsLines = doc.splitTextToSize(data.observacao, contentWidth);
    doc.text(obsLines, margin, y);
    y += obsLines.length * 4 + 4;
  }

  // 7. Galeria de Fotos / Notas Fiscais e Comprovantes em Anexo
  const notas = data.notasAnexadas || [];
  if (notas.length > 0) {
    if (y > pageHeight - 65) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text(`Comprovantes, Notas Fiscais & Fotos em Anexo (${notas.length}):`, margin, y);
    y += 6;

    const imgWidth = 42;
    const imgHeight = 32;
    const gap = 4;
    const maxCols = 4;

    for (let i = 0; i < notas.length; i++) {
      const nota = notas[i];
      const col = i % maxCols;
      const row = Math.floor(i / maxCols);

      const posX = margin + col * (imgWidth + gap);
      const posY = y + row * (imgHeight + gap + 6);

      if (posY + imgHeight > pageHeight - 35) {
        doc.addPage();
        y = 20;
        i--;
        continue;
      }

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(posX, posY, imgWidth, imgHeight, 1.5, 1.5, "FD");

      if (nota.tipo === "PDF") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(225, 29, 72);
        doc.text("DOCUMENTO PDF", posX + imgWidth / 2, posY + 14, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Comprovante Anexado", posX + imgWidth / 2, posY + 20, { align: "center" });
      } else if (nota.url) {
        try {
          const pngUrl = await ensurePngDataUrl(nota.url);
          if (pngUrl) {
            doc.addImage(pngUrl, "PNG", posX + 1, posY + 1, imgWidth - 2, imgHeight - 2);
          }
        } catch {
          // Fallback de texto se falhar decodificação
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text("Foto Anexada", posX + imgWidth / 2, posY + imgHeight / 2, { align: "center" });
        }
      }

      // Legenda da foto/nota
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      const nomeShort = (nota.nome || `Nota ${i + 1}`).substring(0, 25);
      doc.text(nomeShort, posX + imgWidth / 2, posY + imgHeight + 3.5, { align: "center" });
    }

    const totalRows = Math.ceil(notas.length / maxCols);
    y += totalRows * (imgHeight + gap + 6) + 4;
  }

  // 8. Quadro de Assinaturas
  if (y > pageHeight - 45) {
    doc.addPage();
    y = 25;
  } else {
    y = Math.max(y + 8, pageHeight - 45);
  }

  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);

  const sigWidth = 75;
  const sig1X = margin + 8;
  const sig2X = margin + contentWidth - sigWidth - 8;

  // Assinatura 1: Prestador / Técnico
  doc.line(sig1X, y + 15, sig1X + sigWidth, y + 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.responsavel || data.fornecedorNome || "Prestador de Serviço / Técnico", sig1X + sigWidth / 2, y + 19, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Responsável pela Execução", sig1X + sigWidth / 2, y + 23, { align: "center" });

  // Assinatura 2: Gestor / Solicitante
  doc.line(sig2X, y + 15, sig2X + sigWidth, y + 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.empresaNome || "Gestão Imobiliária / Solicitante", sig2X + sigWidth / 2, y + 19, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Aprovação & Visto de Recebimento", sig2X + sigWidth / 2, y + 23, { align: "center" });

  // Rodapé Oficial de Créditos
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${p} de ${totalPages} • Ordem de Serviço ${data.codigo}`,
      margin,
      pageHeight - 6
    );
    doc.text(
      "Desenvolvimento: pajotecnologia.com.br (87)996540551",
      pageWidth - margin,
      pageHeight - 6,
      { align: "right" }
    );
  }

  return doc;
}

export function mapOrdemServicoToPDFData(ordem: any, extraEmpresaData?: any): OrdemServicoPDFData {
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
              nome: `Comprovante / Anexo ${idx + 1}`,
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

  // Empresa ao qual o imóvel pertence (prioridade máxima para a empresa do flat ou da ordem)
  const emp = ordem.flat?.empresa || ordem.empresa || extraEmpresaData || null;

  const empresaEnderecoCompleto = emp?.endereco
    ? [
        emp.endereco,
        emp.bairro ? `Bairro ${emp.bairro}` : "",
        emp.cidade && emp.estado ? `${emp.cidade}/${emp.estado}` : emp.cidade || emp.estado || "",
        emp.cep ? `CEP ${emp.cep}` : "",
      ].filter(Boolean).join(", ")
    : extraEmpresaData?.empresaEndereco || undefined;

  const empresaNome = (
    emp?.nomeFantasia ||
    emp?.razaoSocial ||
    extraEmpresaData?.empresaNome ||
    extraEmpresaData?.nomeFantasia ||
    extraEmpresaData?.razaoSocial ||
    "Gestão Imobiliária"
  ).trim();

  const empresaCnpj = (
    emp?.cnpj ||
    extraEmpresaData?.empresaCnpj ||
    extraEmpresaData?.cnpj ||
    "00.000.000/0001-00"
  ).trim();

  const empresaTelefone =
    emp?.telefone || extraEmpresaData?.empresaTelefone || extraEmpresaData?.telefone || undefined;
  const empresaEmail =
    emp?.email || extraEmpresaData?.empresaEmail || extraEmpresaData?.email || undefined;
  const empresaLogomarcaUrl = (
    emp?.logomarcaUrl ||
    extraEmpresaData?.empresaLogomarcaUrl ||
    extraEmpresaData?.logomarcaUrl ||
    ""
  ).trim() || undefined;

  return {
    codigo: ordem.codigo || "OS-0000",
    titulo: ordem.titulo || "Ordem de Serviço",
    descricao: ordem.descricao,
    categoria: ordem.categoria || "MANUTENCAO",
    prioridade: ordem.prioridade || "MEDIA",
    status: ordem.status || "ABERTA",
    responsavel: ordem.responsavel,
    fornecedorNome: ordem.fornecedorNome,
    valorEstimado: ordem.valorEstimado,
    valorReal: ordem.valorReal,
    dataAbertura: ordem.dataAbertura || new Date().toISOString(),
    prazo: ordem.prazo,
    dataConclusao: ordem.dataConclusao,
    observacao: ordem.observacao,
    flatNumero: ordem.flat?.numero,
    localNome: ordem.flat?.local?.nome,
    tipoImovel: ordem.flat?.tipoImovel,
    locatarioNome: ordem.locatario?.nome,
    locatarioTelefone: ordem.locatario?.telefone,
    contaPagarStatus: ordem.contaPagar?.status,
    formaPagamento: ordem.contaPagar?.formaPagamento,
    notasAnexadas: parseNotas(ordem.fotosJson),

    empresaNome,
    empresaCnpj,
    empresaEndereco: empresaEnderecoCompleto,
    empresaTelefone,
    empresaEmail,
    empresaLogomarcaUrl,
  };
}

export async function generateOrdemServicoPDF(
  ordemOrData: OrdemServicoPDFData | any,
  headerData?: any
): Promise<void> {
  const data: OrdemServicoPDFData =
    headerData !== undefined || (ordemOrData && !ordemOrData.empresaNome)
      ? mapOrdemServicoToPDFData(ordemOrData, headerData)
      : ordemOrData;

  const doc = await buildOrdemServicoPDFDoc(data);
  const fileName = `Ordem_Servico_${(data.codigo || "OS").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  doc.save(fileName);
}

export async function getOrdemServicoPDFBase64(
  ordemOrData: OrdemServicoPDFData | any,
  headerData?: any
): Promise<string> {
  const data: OrdemServicoPDFData =
    headerData !== undefined || (ordemOrData && !ordemOrData.empresaNome)
      ? mapOrdemServicoToPDFData(ordemOrData, headerData)
      : ordemOrData;

  const doc = await buildOrdemServicoPDFDoc(data);
  return doc.output("datauristring");
}
