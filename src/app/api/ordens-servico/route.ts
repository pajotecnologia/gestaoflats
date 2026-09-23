import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const sp = new URL(request.url).searchParams;
    const status = sp.get("status");
    const flatId = sp.get("flatId");

    const ordens = await prisma.ordemServico.findMany({
      where: {
        empresaId: session.empresaId,
        ...(status && status !== "TODOS" ? { status } : {}),
        ...(flatId ? { flatId } : {}),
      },
      include: {
        flat: { include: { local: true } },
        locatario: { select: { id: true, nome: true, telefone: true } },
        contaPagar: {
          select: {
            id: true,
            valor: true,
            valorPago: true,
            status: true,
            dataVencimento: true,
            dataPagamento: true,
            formaPagamento: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { prazo: "asc" }, { criadoEm: "desc" }],
    });

    return NextResponse.json({ ordens });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const b = await request.json();
    if (!b.titulo) {
      return NextResponse.json({ error: "Título da ordem de serviço é obrigatório." }, { status: 400 });
    }

    const prefix = "OS-" + new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.ordemServico.count({ where: { empresaId: session.empresaId } });
    const codigo = prefix + "-" + String(count + 1).padStart(4, "0");

    const valorEstimado = Number(b.valorEstimado || 0);
    const valorReal = Number(b.valorReal || 0);
    const valorDespesa = valorReal > 0 ? valorReal : valorEstimado;

    let contaPagarId: string | null = null;

    // Se houver valor financeiro e não for desmarcado explicitamente, lançar no Contas a Pagar
    const deveLancarContaPagar = b.lancarContaPagar !== false && valorDespesa > 0;

    if (deveLancarContaPagar) {
      let localId = b.localId || null;
      if (!localId && b.flatId) {
        const flat = await prisma.flat.findUnique({
          where: { id: b.flatId },
          select: { localId: true },
        });
        localId = flat?.localId || null;
      }

      const statusConta = (b.status === "CONCLUIDA" && b.pago) ? "PAGO" : "PENDENTE";
      const dataVenc = b.prazo ? new Date(b.prazo) : new Date();

      const contaPagar = await prisma.contaPagar.create({
        data: {
          empresaId: session.empresaId,
          flatId: b.flatId || null,
          localId: localId || null,
          fornecedorId: b.fornecedorId || null,
          descricao: `O.S [${codigo}] - ${b.titulo}${b.fornecedorNome ? ` (${b.fornecedorNome})` : ""}`,
          valor: valorDespesa,
          valorPago: statusConta === "PAGO" ? valorDespesa : 0,
          formaPagamento: b.formaPagamento || null,
          dataCompra: new Date(),
          dataVencimento: dataVenc,
          dataPagamento: statusConta === "PAGO" ? new Date() : null,
          status: statusConta,
          observacao: `Lançado automaticamente via Ordem de Serviço ${codigo}. Categoria: ${b.categoria || "MANUTENCAO"}. Responsável: ${b.responsavel || "N/D"}.`,
        },
      });

      contaPagarId = contaPagar.id;
    }

    const ordem = await prisma.ordemServico.create({
      data: {
        empresaId: session.empresaId,
        locatarioId: b.locatarioId || null,
        flatId: b.flatId || null,
        codigo,
        titulo: b.titulo,
        descricao: b.descricao || null,
        categoria: b.categoria || "MANUTENCAO",
        prioridade: b.prioridade || "MEDIA",
        status: b.status || "ABERTA",
        responsavel: b.responsavel || null,
        fornecedorNome: b.fornecedorNome || null,
        valorEstimado,
        valorReal,
        prazo: b.prazo ? new Date(b.prazo) : null,
        observacao: b.observacao || null,
        fotosJson: b.fotosJson || null,
        contaPagarId,
      },
      include: {
        flat: { include: { local: true } },
        locatario: true,
        contaPagar: true,
      },
    });

    return NextResponse.json({ ordem, contaPagarCriada: !!contaPagarId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const b = await request.json();
    if (!b.id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    const current = await prisma.ordemServico.findFirst({
      where: { id: b.id, empresaId: session.empresaId },
      include: { contaPagar: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });
    }

    const data: any = {};
    for (const k of [
      "locatarioId",
      "flatId",
      "titulo",
      "descricao",
      "categoria",
      "prioridade",
      "status",
      "responsavel",
      "fornecedorNome",
      "observacao",
      "fotosJson",
    ]) {
      if (b[k] !== undefined) data[k] = b[k] || null;
    }

    for (const k of ["valorEstimado", "valorReal"]) {
      if (b[k] !== undefined) data[k] = Number(b[k] || 0);
    }

    if (b.prazo !== undefined) data.prazo = b.prazo ? new Date(b.prazo) : null;
    if (b.status === "CONCLUIDA" && !current.dataConclusao) data.dataConclusao = new Date();
    if (b.status && b.status !== "CONCLUIDA") data.dataConclusao = null;

    const valorEstimado = b.valorEstimado !== undefined ? Number(b.valorEstimado) : current.valorEstimado;
    const valorReal = b.valorReal !== undefined ? Number(b.valorReal) : current.valorReal;
    const valorDespesa = valorReal > 0 ? valorReal : valorEstimado;

    let contaPagarId = current.contaPagarId;

    // Sincronização ou criação de Conta a Pagar
    if (current.contaPagarId) {
      // Atualizar conta a pagar existente
      const updateContaData: any = {};
      if (valorDespesa > 0) {
        updateContaData.valor = valorDespesa;
      }
      if (b.titulo || b.fornecedorNome) {
        const tit = b.titulo || current.titulo;
        const forn = b.fornecedorNome !== undefined ? b.fornecedorNome : current.fornecedorNome;
        updateContaData.descricao = `O.S [${current.codigo}] - ${tit}${forn ? ` (${forn})` : ""}`;
      }
      if (b.prazo) {
        updateContaData.dataVencimento = new Date(b.prazo);
      }
      if (b.status === "CONCLUIDA" && b.pago) {
        updateContaData.status = "PAGO";
        updateContaData.valorPago = valorDespesa;
        updateContaData.dataPagamento = new Date();
      } else if (b.status === "CONCLUIDA" && current.contaPagar?.status === "PENDENTE") {
        // Se concluiu mas não pagou, mantém pendente para baixa manual no financeiro
      }
      if (b.formaPagamento) {
        updateContaData.formaPagamento = b.formaPagamento;
      }
      if (b.fornecedorId !== undefined) {
        updateContaData.fornecedorId = b.fornecedorId || null;
      }

      if (Object.keys(updateContaData).length > 0) {
        await prisma.contaPagar.update({
          where: { id: current.contaPagarId },
          data: updateContaData,
        });
      }
    } else if (b.lancarContaPagar !== false && valorDespesa > 0) {
      // Criar nova Conta a Pagar caso a O.S não tivesse
      let localId = b.localId || null;
      const targetFlatId = b.flatId !== undefined ? b.flatId : current.flatId;
      if (!localId && targetFlatId) {
        const flat = await prisma.flat.findUnique({
          where: { id: targetFlatId },
          select: { localId: true },
        });
        localId = flat?.localId || null;
      }

      const statusConta = (b.status === "CONCLUIDA" && b.pago) ? "PAGO" : "PENDENTE";
      const dataVenc = b.prazo ? new Date(b.prazo) : (current.prazo || new Date());

      const novaConta = await prisma.contaPagar.create({
        data: {
          empresaId: session.empresaId,
          flatId: targetFlatId || null,
          localId: localId || null,
          fornecedorId: b.fornecedorId || null,
          descricao: `O.S [${current.codigo}] - ${b.titulo || current.titulo}${b.fornecedorNome ? ` (${b.fornecedorNome})` : ""}`,
          valor: valorDespesa,
          valorPago: statusConta === "PAGO" ? valorDespesa : 0,
          formaPagamento: b.formaPagamento || null,
          dataCompra: new Date(),
          dataVencimento: dataVenc,
          dataPagamento: statusConta === "PAGO" ? new Date() : null,
          status: statusConta,
          observacao: `Lançado automaticamente via Ordem de Serviço ${current.codigo}.`,
        },
      });

      contaPagarId = novaConta.id;
      data.contaPagarId = contaPagarId;
    }

    const ordem = await prisma.ordemServico.update({
      where: { id: current.id },
      data,
      include: {
        flat: { include: { local: true } },
        locatario: true,
        contaPagar: true,
      },
    });

    return NextResponse.json({ ordem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    const ordem = await prisma.ordemServico.findFirst({
      where: { id, empresaId: session.empresaId },
    });

    if (ordem?.contaPagarId) {
      const conta = await prisma.contaPagar.findUnique({
        where: { id: ordem.contaPagarId },
      });
      // Se a despesa ainda estiver pendente, removemos para evitar resíduo financeiro
      if (conta && conta.status === "PENDENTE") {
        await prisma.contaPagar.delete({ where: { id: conta.id } });
      }
    }

    await prisma.ordemServico.delete({
      where: { id, empresaId: session.empresaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}