import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSha256, stampDocumentHash } from "@/lib/opentimestamps";
import { getChecklistPDFBase64 } from "@/lib/checklistPdfGenerator";
import { getAppBaseUrl } from "@/lib/baseUrl";
import { sendWhatsAppDocument, sendWhatsAppMessage } from "@/lib/evolutionApi";
import crypto from "crypto";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const contratoId = searchParams.get("contratoId");
  const flatId = searchParams.get("flatId");
  const tipoVistoria = searchParams.get("tipoVistoria") || "ENTRADA";

  try {
    const conditions: any[] = [];
    if (token) {
      conditions.push({ tokenAssinatura: token });
    } else {
      if (contratoId) conditions.push({ contratoId, tipoVistoria });
      if (flatId && flatId !== "flat-geral") conditions.push({ flatId, tipoVistoria });
    }

    if (conditions.length === 0) {
      return NextResponse.json({ error: "Parâmetros insuficientes para busca." }, { status: 400 });
    }

    const vistoria = await prisma.vistoriaChecklist.findFirst({
      where: { OR: conditions },
      include: {
        empresa: true,
        locatario: true,
        flat: {
          include: { local: true },
        },
      },
      orderBy: [
        { statusAssinatura: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ vistoria });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      token,
      vistoriaId,
      contratoId,
      flatId,
      locatarioId,
      tipoVistoria,
      responsavelVistoria,
      itens,
      observacoesGerais,
      laudoImpressoUrl,
      assinaturaBase64,
      statusAssinatura,
      gerarNovoLink,
    } = await request.json();

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";

    let vistoria = null;

    if (token) {
      vistoria = await prisma.vistoriaChecklist.findUnique({
        where: { tokenAssinatura: token },
      });
    }

    if (!vistoria && vistoriaId) {
      vistoria = await prisma.vistoriaChecklist.findUnique({
        where: { id: vistoriaId },
      });
    }

    if (!vistoria && (contratoId || flatId) && tipoVistoria) {
      const conditions: any[] = [];
      if (contratoId) conditions.push({ contratoId, tipoVistoria });
      if (flatId && flatId !== "flat-geral") conditions.push({ flatId, tipoVistoria });

      if (conditions.length > 0) {
        vistoria = await prisma.vistoriaChecklist.findFirst({
          where: { OR: conditions },
          orderBy: [
            { statusAssinatura: "desc" },
            { updatedAt: "desc" },
            { createdAt: "desc" },
          ],
        });
      }
    }

    // Formatar array de itens e observações gerais em JSON
    const itemsArray = Array.isArray(itens) ? itens : (itens?.itens || []);
    const obsText = observacoesGerais || (typeof itens === "object" && !Array.isArray(itens) ? itens?.observacoesGerais : "") || "";
    const structuredData = {
      itens: itemsArray,
      observacoesGerais: obsText,
    };
    const itensJsonString = JSON.stringify(structuredData);

    // Se estiver gerando um NOVO LINK de assinatura para o locatário, força o status para PENDENTE e reseta a assinatura anterior
    const isResetLink = Boolean(gerarNovoLink);
    const targetStatusAssinatura = isResetLink
      ? "PENDENTE"
      : statusAssinatura || (assinaturaBase64 ? "ASSINADO" : laudoImpressoUrl ? "ASSINADO (IMPRESSO)" : vistoria?.statusAssinatura || "PENDENTE");

    const newToken = isResetLink ? crypto.randomBytes(16).toString("hex") : (token || vistoria?.tokenAssinatura || crypto.randomBytes(16).toString("hex"));

    if (vistoria) {
      vistoria = await prisma.vistoriaChecklist.update({
        where: { id: vistoria.id },
        data: {
          contratoId: contratoId || vistoria.contratoId,
          locatarioId: locatarioId || vistoria.locatarioId,
          itensJson: itensJsonString,
          responsavelVistoria: responsavelVistoria || vistoria.responsavelVistoria,
          tokenAssinatura: newToken,
          statusAssinatura: targetStatusAssinatura,
          laudoImpressoUrl: laudoImpressoUrl || (isResetLink ? null : vistoria.laudoImpressoUrl),
          assinaturaLocatarioUrl: assinaturaBase64 ? assinaturaBase64 : (isResetLink ? null : vistoria.assinaturaLocatarioUrl),
          dataAssinaturaLocatario: assinaturaBase64 ? new Date() : (isResetLink ? null : vistoria.dataAssinaturaLocatario),
          ipAssinaturaLocatario: assinaturaBase64 ? clientIp : (isResetLink ? null : vistoria.ipAssinaturaLocatario),
          documentoHashSha256: isResetLink ? null : vistoria.documentoHashSha256,
          otsProofBase64: isResetLink ? null : vistoria.otsProofBase64,
          blockchainStatus: isResetLink ? null : vistoria.blockchainStatus,
        },
      });
    } else {
      let flat = null;
      if (flatId && flatId !== "flat-geral") {
        flat = await prisma.flat.findUnique({ where: { id: flatId } });
      }

      if (!flat) {
        flat = await prisma.flat.findFirst();
      }

      if (!flat) {
        return NextResponse.json({ error: "Nenhum flat cadastrado no sistema." }, { status: 404 });
      }

      vistoria = await prisma.vistoriaChecklist.create({
        data: {
          empresaId: flat.empresaId,
          contratoId: contratoId || null,
          flatId: flat.id,
          locatarioId: locatarioId || null,
          tipoVistoria: tipoVistoria || "ENTRADA",
          responsavelVistoria: responsavelVistoria || "Vistoriador Responsável",
          itensJson: itensJsonString,
          tokenAssinatura: newToken,
          laudoImpressoUrl: laudoImpressoUrl || null,
          statusAssinatura: targetStatusAssinatura,
          assinaturaLocatarioUrl: assinaturaBase64 || null,
          dataAssinaturaLocatario: assinaturaBase64 ? new Date() : null,
          ipAssinaturaLocatario: clientIp,
        },
      });
    }

    // Se a vistoria foi assinada, gerar hash SHA-256 imediato e atualizar flat
    const isAssinado = vistoria.statusAssinatura?.includes("ASSINADO");
    const baseUrl = getAppBaseUrl(request);
    const rawInput = `${vistoria.id}_${vistoria.tipoVistoria}_${vistoria.updatedAt.toISOString()}_${clientIp}`;
    const initialHash = calculateSha256(rawInput);
    const validationUrl = `${baseUrl}/validar?hash=${initialHash}`;

    if (isAssinado) {
      // 1. Atualizar status do flat e contrato imediatamente (< 10ms)
      if (vistoria.flatId) {
        if (vistoria.tipoVistoria === "SAIDA") {
          await prisma.flat.update({
            where: { id: vistoria.flatId },
            data: { status: "DISPONIVEL" },
          });
        } else if (vistoria.tipoVistoria === "ENTRADA") {
          await prisma.flat.update({
            where: { id: vistoria.flatId },
            data: { status: "OCUPADO" },
          });
        }
      }

      if (vistoria.contratoId) {
        if (vistoria.tipoVistoria === "ENTRADA") {
          await prisma.contrato.update({
            where: { id: vistoria.contratoId },
            data: { anexoChecklistEntrada: vistoria.laudoImpressoUrl || vistoria.tokenAssinatura },
          });
        } else if (vistoria.tipoVistoria === "SAIDA") {
          await prisma.contrato.update({
            where: { id: vistoria.contratoId },
            data: { anexoChecklistSaida: vistoria.laudoImpressoUrl || vistoria.tokenAssinatura },
          });
        }
      }

      // 2. Processamento assíncrono em background para OTS e WhatsApp
      (async () => {
        try {
          const fullVistoria = await prisma.vistoriaChecklist.findUnique({
            where: { id: vistoria.id },
            include: { empresa: true, locatario: true, flat: true },
          });

          if (fullVistoria) {
            let qrCodeDataUrl = "";
            try {
              qrCodeDataUrl = await QRCode.toDataURL(validationUrl, { margin: 1, width: 100 });
            } catch (e) {}

            const pdfBase64DataUri = await getChecklistPDFBase64({
              tipoVistoria: fullVistoria.tipoVistoria as any,
              empresaNome: fullVistoria.empresa.nomeFantasia,
              empresaCnpj: fullVistoria.empresa.cnpj,
              empresaEndereco: fullVistoria.empresa.endereco,
              empresaTelefone: fullVistoria.empresa.telefone,
              empresaEmail: fullVistoria.empresa.email,
              empresaLogomarcaUrl: fullVistoria.empresa.logomarcaUrl || undefined,
              locatarioNome: fullVistoria.locatario?.nome || "Locatário",
              locatarioCpf: fullVistoria.locatario?.cpf || "-",
              flatNumero: fullVistoria.flat.numero,
              dataVistoria: fullVistoria.dataVistoria.toLocaleDateString("pt-BR"),
              responsavelVistoria: fullVistoria.responsavelVistoria,
              itens: itemsArray,
              observacoesGerais: obsText,
              empresaAssinaturaUrl: fullVistoria.empresa.assinaturaUrl || undefined,
              locatarioAssinaturaUrl: fullVistoria.assinaturaLocatarioUrl || undefined,
              dataAssinaturaLocatario: fullVistoria.dataAssinaturaLocatario?.toLocaleDateString("pt-BR"),
              ipAssinaturaLocatario: fullVistoria.ipAssinaturaLocatario || undefined,
              documentoHashSha256: initialHash,
              blockchainProtocol: "OpenTimestamps / Bitcoin Blockchain",
              blockchainStatus: "STAMPED",
              dataHashGerado: new Date().toISOString(),
              validationUrl,
              qrCodeDataUrl,
            });

            const pdfBuffer = Buffer.from(pdfBase64DataUri.replace(/^data:application\/pdf;base64,/, ""), "base64");
            const pdfSha256 = calculateSha256(pdfBuffer);
            const otsResult = await stampDocumentHash(pdfSha256);

            await prisma.vistoriaChecklist.update({
              where: { id: vistoria.id },
              data: {
                documentoHashSha256: otsResult.sha256Hex,
                otsProofBase64: otsResult.otsProofBase64,
                blockchainProtocol: otsResult.blockchainProtocol,
                blockchainStatus: otsResult.blockchainStatus,
                dataHashGerado: otsResult.stampedAt,
              },
            });

            // Notificar via WhatsApp
            if (fullVistoria.locatario?.telefone) {
              const config = await prisma.configuracaoParametros.findUnique({
                where: { empresaId: fullVistoria.empresaId },
              });

              if (config && config.evolutionApiUrl && config.evolutionApiKey && config.evolutionInstance) {
                const fileName = `Laudo_Vistoria_${fullVistoria.tipoVistoria}_Flat_${fullVistoria.flat.numero}.pdf`;
                await sendWhatsAppDocument(
                  config,
                  fullVistoria.locatario.telefone,
                  pdfBase64DataUri,
                  fileName,
                  `📋 *Laudo de Vistoria ${fullVistoria.tipoVistoria} Assinado!* (Flat ${fullVistoria.flat.numero})\n🔒 Autenticado em Blockchain.`
                );

                await sendWhatsAppMessage(
                  config,
                  fullVistoria.locatario.telefone,
                  `🔒 *Autenticidade Criptográfica Blockchain*\n\nSeu laudo de vistoria foi ancorado na Blockchain do Bitcoin via OpenTimestamps.\n\nHash SHA-256: *${initialHash}*`
                );

                await sendWhatsAppMessage(config, fullVistoria.locatario.telefone, validationUrl);
              }
            }
          }
        } catch (otsErr) {
          console.error("Erro background OTS vistoria:", otsErr);
        }
      })().catch((err) => console.error("Falha background vistoria:", err));
    }

    // Busca a vistoria atualizada
    const vistoriaFinal = await prisma.vistoriaChecklist.findUnique({
      where: { id: vistoria.id },
      include: { empresa: true, locatario: true, flat: true },
    });

    return NextResponse.json({
      success: true,
      vistoria: vistoriaFinal || vistoria,
      tokenAssinatura: vistoria.tokenAssinatura,
      documentoHashSha256: initialHash,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
