import jsPDF from "jspdf";

export interface PDFDocumentHeaderData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  tituloDocumento: string;
  subtituloDocumento?: string;
  variant?: "blue" | "white";
}

export interface HeaderEntityData {
  nome: string;
  cnpj: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  logomarcaUrl?: string;
}

/**
 * Resolve os dados para cabeçalho do documento (PDF/Visualização),
 * priorizando as informações e logomarca do Condomínio (Local) e aplicando fallback harmonioso na Empresa.
 */
export function resolveHeaderData(
  local?: {
    nome?: string | null;
    razaoSocial?: string | null;
    cnpj?: string | null;
    endereco?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
    telefone?: string | null;
    email?: string | null;
    logomarcaUrl?: string | null;
  } | null,
  empresa?: {
    nomeFantasia?: string | null;
    razaoSocial?: string | null;
    cnpj?: string | null;
    endereco?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
    telefone?: string | null;
    email?: string | null;
    logomarcaUrl?: string | null;
  } | null
): HeaderEntityData {
  const localLogomarca = local?.logomarcaUrl && local.logomarcaUrl.trim() ? local.logomarcaUrl.trim() : undefined;
  const empresaLogomarca = empresa?.logomarcaUrl && empresa.logomarcaUrl.trim() ? empresa.logomarcaUrl.trim() : undefined;
  const logomarcaUrl = localLogomarca || empresaLogomarca;

  // Montagem do endereço formatado do condomínio
  const localEnderecoCompleto = local?.endereco
    ? [
        local.endereco,
        local.bairro ? `Bairro ${local.bairro}` : "",
        local.cidade && local.estado ? `${local.cidade}/${local.estado}` : local.cidade || local.estado || "",
        local.cep ? `CEP ${local.cep}` : "",
      ].filter(Boolean).join(", ")
    : undefined;

  // Montagem do endereço formatado da empresa
  const empresaEnderecoCompleto = empresa?.endereco
    ? [
        empresa.endereco,
        empresa.bairro ? `Bairro ${empresa.bairro}` : "",
        empresa.cidade && empresa.estado ? `${empresa.cidade}/${empresa.estado}` : empresa.cidade || empresa.estado || "",
        empresa.cep ? `CEP ${empresa.cep}` : "",
      ].filter(Boolean).join(", ")
    : undefined;

  const nome = (local?.razaoSocial || local?.nome || empresa?.nomeFantasia || empresa?.razaoSocial || "Gestão Imobiliária").trim();
  const cnpj = (local?.cnpj || empresa?.cnpj || "00.000.000/0001-00").trim();
  const endereco = localEnderecoCompleto || local?.endereco || empresaEnderecoCompleto || empresa?.endereco || undefined;
  const telefone = local?.telefone || empresa?.telefone || undefined;
  const email = local?.email || empresa?.email || undefined;

  return {
    nome,
    cnpj,
    endereco,
    telefone,
    email,
    logomarcaUrl,
  };
}

/**
 * Converte qualquer formato de imagem (WebP, JPEG, PNG, Data URI, URL)
 * para um Data URI PNG 100% compatível com o motor do jsPDF.
 */
export async function ensurePngDataUrl(logoUrl?: string | null): Promise<string | null> {
  if (!logoUrl || !logoUrl.trim()) return null;
  const trimmed = logoUrl.trim();

  // Se não estiver no browser (ex: SSR), retorna como está
  if (typeof window === "undefined" || typeof document === "undefined" || typeof Image === "undefined") {
    return trimmed;
  }

  // Se já for PNG data URI puro, não precisa converter
  if (trimmed.startsWith("data:image/png;base64,")) {
    return trimmed;
  }

  try {
    return await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const width = img.naturalWidth || img.width || 300;
          const height = img.naturalHeight || img.height || 300;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const pngData = canvas.toDataURL("image/png");
            resolve(pngData);
            return;
          }
        } catch (err) {
          console.warn("Falha ao converter canvas para PNG:", err);
        }
        resolve(trimmed);
      };
      img.onerror = (err) => {
        console.warn("Falha ao carregar imagem para conversão PNG:", err);
        resolve(trimmed);
      };
      img.src = trimmed;
    });
  } catch {
    return trimmed;
  }
}

/**
 * Converte qualquer formato de assinatura (WebP, JPEG, PNG, Data URI, URL)
 * para um Data URI PNG com fundo branco garantido (#ffffff), eliminando
 * qualquer risco de renderização com fundo preto no motor do jsPDF e leitores de PDF.
 */
export async function ensureCleanSignaturePngDataUrl(signatureUrl?: string | null): Promise<string | null> {
  if (!signatureUrl || !signatureUrl.trim()) return null;
  const trimmed = signatureUrl.trim();

  // Se não estiver no browser (ex: SSR), retorna como está
  if (typeof window === "undefined" || typeof document === "undefined" || typeof Image === "undefined") {
    return trimmed;
  }

  try {
    return await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const width = img.naturalWidth || img.width || 450;
          const height = img.naturalHeight || img.height || 180;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // 1. Preenche fundo branco sólido (#ffffff)
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);

            // 2. Desenha a assinatura com fidelidade
            ctx.drawImage(img, 0, 0, width, height);

            // 3. Exporta como PNG puro
            const pngData = canvas.toDataURL("image/png");
            resolve(pngData);
            return;
          }
        } catch (err) {
          console.warn("Falha ao converter assinatura para PNG com fundo branco:", err);
        }
        resolve(trimmed);
      };
      img.onerror = (err) => {
        console.warn("Falha ao carregar assinatura para conversão:", err);
        resolve(trimmed);
      };
      img.src = trimmed;
    });
  } catch {
    return trimmed;
  }
}

/**
 * Desenha o Cabeçalho Padrão Unificado com Logomarca e Dados da Empresa / Condomínio
 * Variante 100% White Clean (Sem Banner Azul de Fundo)
 */
export function drawStandardPDFHeader(doc: jsPDF, data: PDFDocumentHeaderData) {
  // 1. Banner Principal (Sempre Branco / White Clean)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 36, "F");
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(0, 36, 210, 36);

  // 2. Logomarca da Empresa / Condomínio ou Emblema com Inicial
  let hasLogo = false;
  if (data.empresaLogomarcaUrl && data.empresaLogomarcaUrl.trim()) {
    try {
      const logoUrl = data.empresaLogomarcaUrl.trim();
      let format = "PNG";
      if (
        logoUrl.toLowerCase().includes(".jpg") ||
        logoUrl.toLowerCase().includes(".jpeg") ||
        logoUrl.includes("image/jpeg")
      ) {
        format = "JPEG";
      } else if (
        logoUrl.toLowerCase().includes(".png") ||
        logoUrl.includes("image/png")
      ) {
        format = "PNG";
      }

      doc.addImage(logoUrl, format, 12, 5, 26, 26);
      hasLogo = true;
    } catch (e) {
      console.warn("Falha ao adicionar logomarca ao PDF:", e);
      hasLogo = false;
    }
  }

  if (!hasLogo) {
    // Emblema da Empresa / Condomínio com a Inicial do Nome
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(12, 6, 24, 24, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const initial = (data.empresaNome || "P").trim().charAt(0).toUpperCase();
    doc.text(initial, 24, 22, { align: "center" });
  }

  // 3. Informações da Empresa / Condomínio (Tipografia Elegante em Azul Marinho e Cinza)
  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text((data.empresaNome || "EMPRESA").toUpperCase(), 42, 14);

  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const cnpjStr = data.empresaCnpj ? `CNPJ: ${data.empresaCnpj}` : "";
  const telStr = data.empresaTelefone ? `Tel: ${data.empresaTelefone}` : "";
  const infoLinha1 = [cnpjStr, telStr].filter(Boolean).join("  •  ");
  doc.text(infoLinha1, 42, 20);

  const emailStr = data.empresaEmail ? `E-mail: ${data.empresaEmail}` : "";
  const endStr = data.empresaEndereco || "";
  const infoLinha2 = [emailStr, endStr].filter(Boolean).join("  •  ");
  doc.text(infoLinha2.slice(0, 85), 42, 26);

  // 4. Faixa Secundária do Título do Documento (Sub-header Cinza Claro)
  const hasSub = Boolean(data.subtituloDocumento && data.subtituloDocumento.trim());
  const subHeaderHeight = hasSub ? 15 : 13;

  doc.setFillColor(243, 244, 246);
  doc.rect(0, 36, 210, subHeaderHeight, "F");

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");

  const titleText = (data.tituloDocumento || "DOCUMENTO").toUpperCase();
  const fontSize = titleText.length > 50 ? 9 : titleText.length > 38 ? 9.5 : 10.5;
  doc.setFontSize(fontSize);

  if (hasSub) {
    doc.text(titleText, 105, 42.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(data.subtituloDocumento!.trim(), 105, 48, { align: "center" });
  } else {
    doc.text(titleText, 105, 44.5, { align: "center" });
  }

  // Linha Divisória de Acabamento
  doc.setLineWidth(0.5);
  doc.setDrawColor(209, 213, 219);
  doc.line(0, 36 + subHeaderHeight, 210, 36 + subHeaderHeight);
}

