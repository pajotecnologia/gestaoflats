import { prisma } from "@/lib/prisma";

/**
 * Sincroniza e calcula automaticamente os repasses aos proprietários
 * com base nas contas a receber e pagamentos recebidos dos contratos de flats de terceiros.
 */
export async function sincronizarRepassesEmpresa(empresaId: string, mesReferencia?: string) {
  try {
    const whereContas: any = {
      empresaId,
      numeroParcela: { not: 0 }, // Ignora depósito caução
      contrato: {
        flat: {
          proprietarioId: { not: null },
        },
      },
    };

    if (mesReferencia) {
      whereContas.mesReferencia = mesReferencia;
    }

    const parcelas = await prisma.contaReceber.findMany({
      where: whereContas,
      include: {
        contrato: {
          include: {
            flat: {
              include: {
                proprietario: true,
                local: true,
              },
            },
            locatario: true,
          },
        },
      },
    });

    for (const p of parcelas) {
      const flat = p.contrato?.flat;
      const prop = flat?.proprietario;
      if (!flat || !prop) continue;

      const mes =
        p.mesReferencia ||
        (p.dataVencimento
          ? p.dataVencimento.toISOString().substring(0, 7)
          : new Date().toISOString().substring(0, 7));

      const repasseExistente = await prisma.repasseProprietario.findFirst({
        where: {
          empresaId,
          mesReferencia: mes,
          OR: [
            { contaReceberId: p.id },
            { contratoId: p.contratoId, flatId: flat.id },
          ],
        },
      });

      const bruto = Number(p.valorPago || p.valor || p.contrato?.valorMensal || 0);
      const taxaPerc =
        flat.taxaAdministracao !== null && flat.taxaAdministracao !== undefined
          ? flat.taxaAdministracao
          : prop.taxaAdministracaoPadrao !== null && prop.taxaAdministracaoPadrao !== undefined
          ? prop.taxaAdministracaoPadrao
          : 10.0;

      const taxaValor = Number(((bruto * taxaPerc) / 100).toFixed(2));
      const descontos = repasseExistente?.valorDescontos || 0;
      const liquido = Number((bruto - taxaValor - descontos).toFixed(2));

      if (repasseExistente) {
        // Se a conta receber foi paga ou alterada e os valores diferem, sincroniza
        if (
          repasseExistente.valorBrutoAluguel !== bruto ||
          repasseExistente.valorTaxaAdmin !== taxaValor ||
          !repasseExistente.contaReceberId
        ) {
          await prisma.repasseProprietario.update({
            where: { id: repasseExistente.id },
            data: {
              contaReceberId: p.id,
              valorBrutoAluguel: bruto,
              taxaAdminPercentual: taxaPerc,
              valorTaxaAdmin: taxaValor,
              valorLiquidoRepasse: liquido,
            },
          });
        }
      } else {
        // Cria novo registro de repasse calculado
        await prisma.repasseProprietario.create({
          data: {
            empresaId,
            proprietarioId: prop.id,
            flatId: flat.id,
            contratoId: p.contratoId,
            contaReceberId: p.id,
            mesReferencia: mes,
            valorBrutoAluguel: bruto,
            taxaAdminPercentual: taxaPerc,
            valorTaxaAdmin: taxaValor,
            valorDescontos: 0,
            valorLiquidoRepasse: liquido,
            dataVencimento: p.dataVencimento || new Date(),
            status: "PENDENTE",
            formaPagamento: prop.tipoChavePix ? "PIX" : "PIX",
            observacoes:
              p.status === "PAGO"
                ? `Repasse calculado a partir do pagamento recebido (${p.formaPagamento || "PIX"})`
                : `Repasse previsto para o aluguel Ref: ${mes}`,
          },
        });
      }
    }
  } catch (error) {
    console.error("Erro ao sincronizar repasses da empresa:", error);
  }
}
