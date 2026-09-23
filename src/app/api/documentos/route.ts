import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sp = new URL(request.url).searchParams;
    const locatarioId = sp.get("locatarioId");
    const documentos = await prisma.clienteDocumento.findMany({
      where: { empresaId: session.empresaId, ...(locatarioId ? { locatarioId } : {}) },
      include: { contrato: { select: { id: true, dataFinal: true, status: true, flat: { select: { numero: true } } } } },
      orderBy: [{ validade: "asc" }, { criadoEm: "desc" }],
    });
    return NextResponse.json({ documentos });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.locatarioId || !b.tipo || !b.titulo) return NextResponse.json({ error: "Locatário, tipo e título são obrigatórios." }, { status: 400 });
    const loc = await prisma.locatario.findFirst({ where: { id: b.locatarioId, empresaId: session.empresaId } });
    if (!loc) return NextResponse.json({ error: "Locatário não encontrado." }, { status: 404 });
    const doc = await prisma.clienteDocumento.create({ data: {
      empresaId: session.empresaId, locatarioId: b.locatarioId, contratoId: b.contratoId || null,
      tipo: b.tipo, titulo: b.titulo, descricao: b.descricao || null, arquivoUrl: b.arquivoUrl || null,
      mimeType: b.mimeType || null, tamanhoBytes: b.tamanhoBytes ? Number(b.tamanhoBytes) : null,
      dataDocumento: b.dataDocumento ? new Date(b.dataDocumento) : null, validade: b.validade ? new Date(b.validade) : null,
      status: b.status || "ATIVO",
    }});
    return NextResponse.json({ documento: doc });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const b = await request.json(); if (!b.id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    const doc = await prisma.clienteDocumento.findFirst({ where: { id: b.id, empresaId: session.empresaId } });
    if (!doc) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    const data: any = {};
    for (const k of ["tipo","titulo","descricao","arquivoUrl","mimeType","status"]) if (b[k] !== undefined) data[k] = b[k] || null;
    if (b.validade !== undefined) data.validade = b.validade ? new Date(b.validade) : null;
    if (b.dataDocumento !== undefined) data.dataDocumento = b.dataDocumento ? new Date(b.dataDocumento) : null;
    if (b.tamanhoBytes !== undefined) data.tamanhoBytes = b.tamanhoBytes ? Number(b.tamanhoBytes) : null;
    const updated = await prisma.clienteDocumento.update({ where: { id: doc.id }, data });
    return NextResponse.json({ documento: updated });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    await prisma.clienteDocumento.delete({ where: { id, empresaId: session.empresaId } });
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}