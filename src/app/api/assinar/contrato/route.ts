import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSha256, stampDocumentHash } from "@/lib/opentimestamps";
import { getContratoPDFBase64 } from "@/lib/contractPdfGenerator";
import { getAppBaseUrl } from "@/lib/baseUrl";
import { sendWhatsAppDocument, sendWhatsAppMessage } from "@/lib/evolutionApi";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token de assinatura é obrigatório." }, { status: 400 });
  }

  try {
    const contrato = await prisma.contrato.findUnique({
      where: { tokenAssinatura: token },
      include: {
        empresa: true,
        locatario: true,
        flat: {
          include: { local: true },
        },
        modeloContrato: true,
      },
    });

    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado ou link expirado." }, { status: 404 });
    }

    // Busca a vistoria de entrada vinculada ao contrato ou ao flat
    const vistoriaEntradaRaw = await prisma.vistoriaChecklist.findFirst({
      where: {
        OR: [
          { contratoId: contrato.id, tipoVistoria: "ENTRADA" },
          { flatId: contrato.flatId, tipoVistoria: "ENTRADA" },
        ],
      },
      orderBy: [
        { statusAssinatura: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    let vistoriaEntrada = null;
    if (vistoriaEntradaRaw) {
      let itens = [];
      let observacoesGerais = "";
      try {
        const parsed = JSON.parse(vistoriaEntradaRaw.itensJson);
        itens = Array.isArray(parsed) ? parsed : (parsed.itens || []);
        observacoesGerais = parsed.observacoesGerais || "";
      } catch (e) {}

      vistoriaEntrada = {
        id: vistoriaEntradaRaw.id,
        responsavel: vistoriaEntradaRaw.responsavelVistoria,
        dataVistoria: vistoriaEntradaRaw.dataVistoria ? new Date(vistoriaEntradaRaw.dataVistoria).toLocaleDateString("pt-BR") : undefined,
        statusAssinatura: vistoriaEntradaRaw.statusAssinatura,
        assinaturaLocatarioUrl: vistoriaEntradaRaw.assinaturaLocatarioUrl,
        laudoImpressoUrl: vistoriaEntradaRaw.laudoImpressoUrl,
        itens,
        observacoesGerais,
      };
    }

    return NextResponse.json({ contrato, vistoriaEntrada });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, assinaturaBase64 } = await request.json();

    if (!token || !assinaturaBase64) {
      return NextResponse.json({ error: "Token e assinatura em imagem são obrigatórios." }, { status: 400 });
    }

    const contrato = await prisma.contrato.findUnique({
      where: { tokenAssinatura: token },
      include: {
        empresa: true,
        locatario: true,
        flat: {
          include: { local: true },
        },
        modeloContrato: true,
      },
    });

    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const dataAssinatura = new Date();

    // Busca e atualiza a Vistoria de Entrada para assinada também
    const vistoriaEntradaRaw = await prisma.vistoriaChecklist.findFirst({
      where: {
        OR: [
          { contratoId: contrato.id, tipoVistoria: "ENTRADA" },
          { flatId: contrato.flatId, tipoVistoria: "ENTRADA" },
        ],
      },
      orderBy: [
        { statusAssinatura: "desc" },
        { updatedAt: "desc" },
      ],
    });

    let vistoriaEntradaPDF = undefined;
    if (vistoriaEntradaRaw) {
      // Se a vistoria ainda não estiver assinada, atualiza com a assinatura do locatário
      if (vistoriaEntradaRaw.statusAssinatura !== "ASSINADO") {
        await prisma.vistoriaChecklist.update({
          where: { id: vistoriaEntradaRaw.id },
          data: {
            contratoId: contrato.id,
            locatarioId: contrato.locatarioId,
            statusAssinatura: "ASSINADO",
            assinaturaLocatarioUrl: assinaturaBase64,
            dataAssinaturaLocatario: dataAssinatura,
            ipAssinaturaLocatario: clientIp,
          },
        });
      }

      let itens = [];
      let observacoesGerais = "";
      try {
        const parsed = JSON.parse(vistoriaEntradaRaw.itensJson);
        itens = Array.isArray(parsed) ? parsed : (parsed.itens || []);
        observacoesGerais = parsed.observacoesGerais || "";
      } catch (e) {}

      vistoriaEntradaPDF = {
        responsavel: vistoriaEntradaRaw.responsavelVistoria,
        dataVistoria: vistoriaEntradaRaw.dataVistoria ? new Date(vistoriaEntradaRaw.dataVistoria).toLocaleDateString("pt-BR") : undefined,
        statusAssinatura: "ASSINADO",
        itens,
        observacoesGerais,
      };
    }

    // 1. Gerar Hash inicial para URL de Validação
    const rawHashInput = `${contrato.id}_${contrato.locatario.cpf}_${dataAssinatura.toISOString()}_${clientIp}`;
    const initialHash = calculateSha256(rawHashInput);

    const baseUrl = getAppBaseUrl(request);
    const validationUrl = `${baseUrl}/validar?hash=${initialHash}`;
    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(validationUrl, { margin: 1, width: 100 });
    } catch (e) {
      console.warn("Erro ao gerar QR Code:", e);
    }

    // 2. Gerar o PDF com a Assinatura, Selo Criptográfico, QR Code e Anexo I de Vistoria
    const pdfBase64DataUri = await getContratoPDFBase64({
      empresaNome: contrato.empresa.nomeFantasia,
      empresaCnpj: contrato.empresa.cnpj,
      empresaEndereco: contrato.empresa.endereco,
      empresaTelefone: contrato.empresa.telefone,
      empresaEmail: contrato.empresa.email,
      empresaLogomarcaUrl: contrato.empresa.logomarcaUrl || undefined,
      empresaAssinaturaUrl: contrato.empresa.assinaturaUrl || undefined,
      locatarioNome: contrato.locatario.nome,
      locatarioCpf: contrato.locatario.cpf,
      locatarioRg: contrato.locatario.rg || undefined,
      locatarioTelefone: contrato.locatario.telefone,
      flatNumero: contrato.flat.numero,
      localNome: contrato.flat.local?.nome,
      valorMensal: contrato.valorMensal,
      tipoValidade: contrato.tipoValidade,
      validadeMeses: contrato.validadeMeses,
      validadeDias: contrato.validadeDias || undefined,
      dataEmissao: contrato.dataEmissao.toLocaleDateString("pt-BR"),
      dataFinal: contrato.dataFinal.toLocaleDateString("pt-BR"),
      conteudoHtml: contrato.modeloContrato?.conteudoHtml || undefined,
      statusAssinatura: "ASSINADO",
      locatarioAssinaturaUrl: assinaturaBase64,
      dataAssinaturaLocatario: dataAssinatura.toLocaleDateString("pt-BR"),
      ipAssinaturaLocatario: clientIp,
      documentoHashSha256: initialHash,
      blockchainProtocol: "OpenTimestamps / Bitcoin Blockchain",
      blockchainStatus: "STAMPED",
      dataHashGerado: dataAssinatura.toISOString(),
      validationUrl,
      qrCodeDataUrl,
      vistoriaEntrada: vistoriaEntradaPDF,
    });

    // 3. Calcular Hash SHA-256 exato do PDF final gerado
    const pdfBuffer = Buffer.from(pdfBase64DataUri.replace(/^data:application\/pdf;base64,/, ""), "base64");
    const pdfSha256 = calculateSha256(pdfBuffer);

    // 4. Ancorar na Blockchain do Bitcoin via OpenTimestamps
    const otsResult = await stampDocumentHash(pdfSha256);

    // 5. Salvar a Assinatura e Prova Blockchain no Banco de Dados
    const updatedContrato = await prisma.contrato.update({
      where: { id: contrato.id },
      data: {
        statusAssinatura: "ASSINADO",
        assinaturaLocatarioUrl: assinaturaBase64,
        dataAssinaturaLocatario: dataAssinatura,
        ipAssinaturaLocatario: clientIp,
        documentoHashSha256: otsResult.sha256Hex,
        otsProofBase64: otsResult.otsProofBase64,
        blockchainProtocol: otsResult.blockchainProtocol,
        blockchainStatus: otsResult.blockchainStatus,
        dataHashGerado: otsResult.stampedAt,
      },
    });

    // 6. Tentar enviar comprovante assinado via WhatsApp (se configurado)
    try {
      if (contrato.locatario.telefone) {
        const config = await prisma.configuracaoParametros.findUnique({
          where: { empresaId: contrato.empresaId },
        });

        if (config && config.evolutionApiUrl && config.evolutionApiKey && config.evolutionInstance) {
          const fileName = `Contrato_Assinado_Flat_${contrato.flat.numero}.pdf`;
          await sendWhatsAppDocument(
            config,
            contrato.locatario.telefone,
            pdfBase64DataUri,
            fileName,
            `📄 *Contrato de Locação Assinado!* (Flat ${contrato.flat.numero})\n🔒 Autenticado em Blockchain.`
          );

          const linkValidacaoFinal = `${baseUrl}/validar?hash=${otsResult.sha256Hex}`;
          await sendWhatsAppMessage(
            config,
            contrato.locatario.telefone,
            `🔒 *Autenticidade Criptográfica Blockchain*\n\nSeu contrato foi ancorado na Blockchain do Bitcoin via OpenTimestamps.\n\nHash SHA-256: *${otsResult.sha256Hex}*`
          );

          // Mensagem isolada com link para garantir clique no WhatsApp mobile!
          await sendWhatsAppMessage(config, contrato.locatario.telefone, linkValidacaoFinal);
        }
      }
    } catch (waErr) {
      console.warn("Aviso ao enviar WhatsApp pós-assinatura de contrato:", waErr);
    }

    return NextResponse.json({
      success: true,
      contrato: updatedContrato,
      documentoHashSha256: otsResult.sha256Hex,
      validationUrl: `${baseUrl}/validar?hash=${otsResult.sha256Hex}`,
    });
  } catch (error: any) {
    console.error("Erro ao assinar contrato:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
