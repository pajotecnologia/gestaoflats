import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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
      orderBy: { createdAt: "desc" },
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
    } = await request.json();

    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";

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
          orderBy: { createdAt: "desc" },
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

    const targetStatusAssinatura = statusAssinatura || (assinaturaBase64 ? "ASSINADO" : laudoImpressoUrl ? "ASSINADO (IMPRESSO)" : vistoria?.statusAssinatura || "PENDENTE");

    if (vistoria) {
      vistoria = await prisma.vistoriaChecklist.update({
        where: { id: vistoria.id },
        data: {
          contratoId: contratoId || vistoria.contratoId,
          locatarioId: locatarioId || vistoria.locatarioId,
          itensJson: itensJsonString,
          responsavelVistoria: responsavelVistoria || vistoria.responsavelVistoria,
          statusAssinatura: targetStatusAssinatura,
          laudoImpressoUrl: laudoImpressoUrl || vistoria.laudoImpressoUrl,
          assinaturaLocatarioUrl: assinaturaBase64 || vistoria.assinaturaLocatarioUrl,
          dataAssinaturaLocatario: assinaturaBase64 ? new Date() : vistoria.dataAssinaturaLocatario,
          ipAssinaturaLocatario: clientIp,
        },
      });
    } else {
      const newToken = token || crypto.randomBytes(16).toString("hex");

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

    // Se a vistoria foi assinada (digitalmente ou impresso):
    // 1. Se for Vistoria de SAÍDA: altera o status do flat para DISPONIVEL
    // 2. Se for Vistoria de ENTRADA: altera o status do flat para OCUPADO
    const isAssinado = vistoria.statusAssinatura?.includes("ASSINADO");
    if (isAssinado && vistoria.flatId) {
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

    return NextResponse.json({
      success: true,
      vistoria,
      tokenAssinatura: vistoria.tokenAssinatura,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
