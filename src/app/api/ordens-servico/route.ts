import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sp = new URL(request.url).searchParams; const status = sp.get("status"); const flatId = sp.get("flatId");
    const ordens = await prisma.ordemServico.findMany({
      where: { empresaId: session.empresaId, ...(status && status !== "TODOS" ? { status } : {}), ...(flatId ? { flatId } : {}) },
      include: { flat: { include: { local: true } }, locatario: { select: { id: true, nome: true, telefone: true } } },
      orderBy: [{ status: "asc" }, { prazo: "asc" }, { criadoEm: "desc" }],
    });
    return NextResponse.json({ ordens });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.titulo) return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
    const prefix = "OS-" + new Date().toISOString().slice(0,10).replace(/-/g,"");
    const count = await prisma.ordemServico.count({ where: { empresaId: session.empresaId } });
    const ordem = await prisma.ordemServico.create({ data: {
      empresaId: session.empresaId, locatarioId: b.locatarioId || null, flatId: b.flatId || null,
      codigo: prefix + "-" + String(count + 1).padStart(4,"0"), titulo: b.titulo, descricao: b.descricao || null,
      categoria: b.categoria || "MANUTENCAO", prioridade: b.prioridade || "MEDIA", status: b.status || "ABERTA",
      responsavel: b.responsavel || null, fornecedorNome: b.fornecedorNome || null,
      valorEstimado: Number(b.valorEstimado || 0), valorReal: Number(b.valorReal || 0),
      prazo: b.prazo ? new Date(b.prazo) : null, observacao: b.observacao || null, fotosJson: b.fotosJson || null,
    }});
    return NextResponse.json({ ordem });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const b = await request.json(); if (!b.id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    const current = await prisma.ordemServico.findFirst({ where: { id: b.id, empresaId: session.empresaId } });
    if (!current) return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });
    const data: any = {};
    for (const k of ["locatarioId","flatId","titulo","descricao","categoria","prioridade","status","responsavel","fornecedorNome","observacao","fotosJson"]) if (b[k] !== undefined) data[k] = b[k] || null;
    for (const k of ["valorEstimado","valorReal"]) if (b[k] !== undefined) data[k] = Number(b[k] || 0);
    if (b.prazo !== undefined) data.prazo = b.prazo ? new Date(b.prazo) : null;
    if (b.status === "CONCLUIDA" && !current.dataConclusao) data.dataConclusao = new Date();
    if (b.status && b.status !== "CONCLUIDA") data.dataConclusao = null;
    const ordem = await prisma.ordemServico.update({ where: { id: current.id }, data });
    return NextResponse.json({ ordem });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try { const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    await prisma.ordemServico.delete({ where: { id, empresaId: session.empresaId } }); return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}