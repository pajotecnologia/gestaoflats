import jsPDF from "jspdf";
import { drawStandardPDFHeader } from "./pdfHeaderBuilder";

export interface BlankChecklistPDFData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  flatNumero?: string;
  condominioNome?: string;
  locatarioNome?: string;
  locatarioCpf?: string;
  responsavelVistoria?: string;
}

export const defaultBlankChecklistCategories = [
  {
    categoria: "Estrutura & Paredes",
    itens: [
      "Pintura e integridade das paredes e teto",
      "Portas, fechaduras e chaves (entregues)",
      "Janelas, vidros e cortinas/persianas",
    ],
  },
  {
    categoria: "Móveis & Marcenaria",
    itens: [
      "Cama box e colchão (sem manchas/avarias)",
      "Armários do quarto e cozinha (portas e gavetas)",
      "Sofá / Poltrona e mesa com cadeiras",
    ],
  },
  {
    categoria: "Eletrodomésticos",
    itens: [
      "Ar Condicionado (funcionamento e controle)",
      "Geladeira / Frigobar (limpo e congelando)",
      "Televisão / Controle remoto funcionando",
      "Micro-ondas e Cooktop",
    ],
  },
  {
    categoria: "Hidráulica & Elétrica",
    itens: [
      "Torneiras, pias e chuveiro elétrico",
      "Iluminação / Lâmpadas de todos os cômodos",
    ],
  },
  {
    categoria: "Enxoval & Utensílios",
    itens: [
      "Jogo de lençóis, toalhas e travesseiros",
    ],
  },
];

export function buildBlankChecklistPDFDoc(data: BlankChecklistPDFData): jsPDF {
  const doc = new jsPDF();

  // Cabeçalho Padrão com Logomarca e Dados da Empresa
  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj,
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: "FICHA DE CHECKLIST DE VISTORIA (PREENCHIMENTO MANUAL)",
    subtituloDocumento: "Ficha impressa para conferência de itens e assinaturas a mão",
    variant: "white",
  });

  let y = 54;

  // Caixa de Tipo de Vistoria (Seleção Manual)
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, 182, 8, "F");
  doc.setDrawColor(209, 213, 219);
  doc.rect(14, y, 182, 8, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text("TIPO DE VISTORIA:   [   ] VISTORIA DE ENTRADA     [   ] VISTORIA DE SAÍDA", 18, y + 5.5);

  y += 12;

  // Quadro de Identificação Manual
  doc.setFillColor(249, 250, 251);
  doc.rect(14, y, 182, 22, "F");
  doc.setDrawColor(209, 213, 219);
  doc.rect(14, y, 182, 22, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);

  const flatTxt = data.flatNumero ? `Flat nº: ${data.flatNumero}` : "Flat nº: ________________________";
  const condTxt = data.condominioNome ? `Condomínio: ${data.condominioNome}` : "Condomínio: ________________________";
  doc.text(flatTxt, 18, y + 6);
  doc.text(condTxt, 110, y + 6);

  const locTxt = data.locatarioNome ? `Locatário: ${data.locatarioNome}` : "Locatário: _____________________________________________";
  const cpfTxt = data.locatarioCpf ? `CPF: ${data.locatarioCpf}` : "CPF: ______________________";
  doc.text(locTxt, 18, y + 13);
  doc.text(cpfTxt, 135, y + 13);

  const respTxt = data.responsavelVistoria ? `Vistoriador: ${data.responsavelVistoria}` : "Vistoriador: ___________________________________________";
  doc.text(respTxt, 18, y + 19);
  doc.text("Data Vistoria: ____ / ____ / ________", 135, y + 19);

  y += 27;

  // Instrução
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("Instruções: Marque o estado do item e escreva observações pontuais se houver avaria ou ressalva.", 14, y);

  y += 5;

  // Tabela por Categorias de Tópicos
  defaultBlankChecklistCategories.forEach((catGroup) => {
    // Verificar se cabe na página
    if (y > 240) {
      doc.addPage();
      y = 15;
    }

    // Cabeçalho da Categoria
    doc.setFillColor(30, 58, 138);
    doc.rect(14, y, 182, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(catGroup.categoria.toUpperCase(), 18, y + 4.5);

    y += 6;

    catGroup.itens.forEach((itemText) => {
      if (y > 260) {
        doc.addPage();
        y = 15;
      }

      doc.setDrawColor(229, 231, 235);
      doc.rect(14, y, 182, 13, "S");

      // Texto do Item
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(31, 41, 55);
      doc.text(itemText, 18, y + 5);

      // Opções de Checkbox [ ] OK   [ ] Atenção   [ ] Avaria
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(55, 65, 81);
      doc.text("[   ] OK       [   ] Atenção       [   ] Avaria", 125, y + 5);

      // Linha de Observação Manual Pontilhada
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("Obs: .........................................................................................................................................................................", 18, y + 10.5);

      y += 13;
    });

    y += 3;
  });

  // Campo de Observações Gerais Pontilhadas
  if (y > 230) {
    doc.addPage();
    y = 15;
  }

  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, 182, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);
  doc.text("OBSERVAÇÕES GERAIS DA VISTORIA:", 18, y + 3.8);

  y += 5;

  doc.setDrawColor(209, 213, 219);
  doc.rect(14, y, 182, 18, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text("...........................................................................................................................................................................................................", 18, y + 5);
  doc.text("...........................................................................................................................................................................................................", 18, y + 10);
  doc.text("...........................................................................................................................................................................................................", 18, y + 15);

  y += 22;

  // Quadro de Assinaturas Manuais
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  doc.setDrawColor(209, 213, 219);
  doc.line(20, y + 12, 90, y + 12);
  doc.line(110, y + 12, 180, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);
  doc.text("VISTORIADOR RESPONSÁVEL", 55, y + 16, { align: "center" });
  doc.text("LOCATÁRIO (A)", 145, y + 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text("Assinatura a mão", 55, y + 20, { align: "center" });
  doc.text("Assinatura a mão", 145, y + 20, { align: "center" });

  // Rodapé do Desenvolvedor
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 280, 196, 280);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 286, { align: "center" });

  return doc;
}

export function generateBlankChecklistPDF(data: BlankChecklistPDFData) {
  const doc = buildBlankChecklistPDFDoc(data);
  const flatName = data.flatNumero ? data.flatNumero.replace(/\s+/g, "_") : "Geral";
  doc.save(`Ficha_Vistoria_Em_Branco_Flat_${flatName}.pdf`);
}
