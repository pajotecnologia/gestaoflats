import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSha256, verifyOtsProof } from "@/lib/opentimestamps";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash")?.trim();

  if (!hash) {
    return NextResponse.json({ error: "Hash SHA-256 é obrigatório para consulta." }, { status: 400 });
  }

  return await buscarEVerificarDocumento(hash);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo PDF não enviado." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfSha256 = calculateSha256(buffer);

    return await buscarEVerificarDocumento(pdfSha256);
  } catch (error: any) {
    console.error("Erro ao validar arquivo PDF enviado:", error);
    return NextResponse.json({ error: error.message || "Falha ao processar arquivo PDF." }, { status: 500 });
  }
}

async function buscarEVerificarDocumento(sha256Hex: string) {
  try {
    // 1. Procurar em Contratos
    const contrato = await prisma.contrato.findFirst({
      where: { documentoHashSha256: sha256Hex },
      include: {
        empresa: true,
        locatario: true,
        flat: { include: { local: true } },
      },
    });

    if (contrato) {
      const otsVerification = await verifyOtsProof(
        contrato.documentoHashSha256!,
        contrato.otsProofBase64 || ""
      );

      return NextResponse.json({
        found: true,
        tipoDocumento: "CONTRATO DE LOCAÇÃO",
        hash: contrato.documentoHashSha256,
        protocol: contrato.blockchainProtocol || "OpenTimestamps / Bitcoin Blockchain",
        status: contrato.blockchainStatus || "STAMPED",
        dataHashGerado: contrato.dataHashGerado || contrato.dataAssinaturaLocatario || contrato.updatedAt,
        otsProofBase64: contrato.otsProofBase64,
        detalhes: {
          empresaNome: contrato.empresa.nomeFantasia,
          empresaCnpj: contrato.empresa.cnpj,
          locatarioNome: contrato.locatario.nome,
          locatarioCpf: contrato.locatario.cpf,
          flatNumero: contrato.flat.numero,
          localNome: contrato.flat.local?.nome,
          valorMensal: contrato.valorMensal,
          validadeMeses: contrato.validadeMeses,
          dataEmissao: contrato.dataEmissao,
          dataFinal: contrato.dataFinal,
          dataAssinatura: contrato.dataAssinaturaLocatario,
          ipAssinatura: contrato.ipAssinaturaLocatario,
        },
        otsVerification,
      });
    }

    // 2. Procurar em Vistorias
    const vistoria = await prisma.vistoriaChecklist.findFirst({
      where: { documentoHashSha256: sha256Hex },
      include: {
        empresa: true,
        locatario: true,
        flat: { include: { local: true } },
      },
    });

    if (vistoria) {
      const otsVerification = await verifyOtsProof(
        vistoria.documentoHashSha256!,
        vistoria.otsProofBase64 || ""
      );

      return NextResponse.json({
        found: true,
        tipoDocumento: `LAUDO DE VISTORIA (${vistoria.tipoVistoria})`,
        hash: vistoria.documentoHashSha256,
        protocol: vistoria.blockchainProtocol || "OpenTimestamps / Bitcoin Blockchain",
        status: vistoria.blockchainStatus || "STAMPED",
        dataHashGerado: vistoria.dataHashGerado || vistoria.dataAssinaturaLocatario || vistoria.updatedAt,
        otsProofBase64: vistoria.otsProofBase64,
        detalhes: {
          empresaNome: vistoria.empresa.nomeFantasia,
          empresaCnpj: vistoria.empresa.cnpj,
          locatarioNome: vistoria.locatario?.nome || "Locatário",
          locatarioCpf: vistoria.locatario?.cpf || "-",
          flatNumero: vistoria.flat.numero,
          localNome: vistoria.flat.local?.nome,
          responsavelVistoria: vistoria.responsavelVistoria,
          dataVistoria: vistoria.dataVistoria,
          dataAssinatura: vistoria.dataAssinaturaLocatario,
          ipAssinatura: vistoria.ipAssinaturaLocatario,
        },
        otsVerification,
      });
    }

    return NextResponse.json(
      {
        found: false,
        hash: sha256Hex,
        message: "Nenhum documento assinado com este Hash SHA-256 foi localizado no sistema.",
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Erro na busca e verificação de documento:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
