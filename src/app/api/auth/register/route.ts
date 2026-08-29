import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createAccessToken, createRefreshToken, setAuthCookies } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nomeEmpresa,
      razaoSocial,
      cnpj,
      email,
      telefone,
      nomeAdmin,
      password,
      endereco,
      cidade,
      estado,
    } = body;

    // Validações obrigatórias
    if (!nomeEmpresa || !email || !password || !nomeAdmin) {
      return NextResponse.json(
        { error: "Nome da empresa, nome do administrador, e-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const emailLimpo = email.trim().toLowerCase();

    // Verificar se já existe usuário com este e-mail
    const existingUser = await prisma.usuario.findUnique({
      where: { email: emailLimpo },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este endereço de e-mail." },
        { status: 409 }
      );
    }

    const senhaHash = await hashPassword(password);

    // Modelo de contrato padrão com tags dinâmicas para a nova empresa
    const modeloPadraoHtml = `<h2 style="text-align: center; color: #000000; font-weight: bold; margin-bottom: 20px;">CONTRATO DE LOCAÇÃO RESIDENCIAL / POR TEMPORADA</h2>

<p style="color: #000000; line-height: 1.6; margin-bottom: 14px;"><strong>LOCADOR:</strong> {{empresa.nome}}, inscrita no CNPJ sob o nº {{empresa.cnpj}}, com sede em {{empresa.endereco}}.</p>

<p style="color: #000000; line-height: 1.6; margin-bottom: 14px;"><strong>LOCATÁRIO:</strong> {{locatario.nome}}, inscrito no CPF sob o nº {{locatario.cpf}}, RG {{locatario.rg}}, residente e domiciliado em {{locatario.endereco}}, telefone {{locatario.telefone}}.</p>

<p style="color: #000000; line-height: 1.6; margin-bottom: 14px;"><strong>OBJETO:</strong> O presente contrato tem por objeto a locação do imóvel/flat nº <strong>{{flat.numero}}</strong>, situado no condomínio/local <strong>{{local.nome}}</strong>, localizado em {{local.endereco}}.</p>

<p style="color: #000000; line-height: 1.6; margin-bottom: 14px;"><strong>CLÁUSULA PRIMEIRA - DO VALOR E VENCIMENTO:</strong> O valor do aluguel mensal é de <strong>{{contrato.valor}}</strong> ({{contrato.valor_extenso}}), devendo ser pago até o dia <strong>{{contrato.dia_vencimento}}</strong> de cada mês, através de <strong>{{contrato.forma_pagamento}}</strong>.</p>

<p style="color: #000000; line-height: 1.6; margin-bottom: 14px;"><strong>CLÁUSULA SEGUNDA - DA VIGÊNCIA:</strong> O prazo de vigência desta locação é de <strong>{{contrato.duracao}}</strong>, com início em <strong>{{contrato.data_emissao}}</strong> e término previsto para <strong>{{contrato.data_final}}</strong>.</p>

<p style="color: #000000; line-height: 1.6; margin-bottom: 14px;"><strong>CLÁUSULA TERCEIRA - DAS PENALIDADES:</strong> Em caso de mora no pagamento, incidirá multa de {{contrato.multa_atraso}}% e juros de mora de {{contrato.juros_atraso}}% ao mês.</p>

<p style="color: #000000; line-height: 1.6; margin-bottom: 14px;"><strong>CLÁUSULA QUARTA - DO FORO:</strong> As partes elegem o foro da comarca local para dirimir quaisquer dúvidas decorrentes do presente instrumento.</p>

<div style="margin-top: 40px; text-align: center; color: #000000;">
  <p>{{empresa.cidade}}, {{contrato.data_emissao}}</p>
</div>`;

    // Transação atômica para criar todo o ecossistema da nova empresa SaaS
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar Empresa
      const novaEmpresa = await tx.empresa.create({
        data: {
          nomeFantasia: nomeEmpresa.trim(),
          razaoSocial: (razaoSocial || nomeEmpresa).trim(),
          cnpj: (cnpj || "00.000.000/0001-00").trim(),
          email: emailLimpo,
          telefone: (telefone || "").trim(),
          endereco: (endereco || "Endereço Principal").trim(),
          cidade: cidade?.trim() || null,
          estado: estado?.trim() || null,
        },
      });

      // 2. Criar Usuário Administrador
      const novoUsuario = await tx.usuario.create({
        data: {
          empresaId: novaEmpresa.id,
          nome: nomeAdmin.trim(),
          email: emailLimpo,
          senhaHash,
          cargo: "ADMIN",
          status: "ATIVO",
        },
      });

      // 3. Criar Parâmetros Iniciais da Empresa
      await tx.configuracaoParametros.create({
        data: {
          empresaId: novaEmpresa.id,
          statusConexao: "DESCONECTADO",
          smtpHost: "smtp.gmail.com",
          smtpPort: 465,
          smtpSecure: true,
        },
      });

      // 4. Criar Formas de Pagamento Padrão
      await tx.formaPagamento.createMany({
        data: [
          { empresaId: novaEmpresa.id, nome: "PIX", ativo: true },
          { empresaId: novaEmpresa.id, nome: "Boleto Bancário", ativo: true },
          { empresaId: novaEmpresa.id, nome: "Cartão de Crédito", ativo: true },
          { empresaId: novaEmpresa.id, nome: "Transferência Bancária", ativo: true },
          { empresaId: novaEmpresa.id, nome: "Dinheiro em Espécie", ativo: true },
        ],
      });

      // 5. Criar Modelo de Contrato Inicial
      await tx.modeloContrato.create({
        data: {
          empresaId: novaEmpresa.id,
          titulo: "Contrato de Locação Residencial / Temporada",
          conteudoHtml: modeloPadraoHtml,
        },
      });

      return {
        empresa: novaEmpresa,
        usuario: novoUsuario,
      };
    });

    // 6. Gerar Sessão JWT e autenticar imediatamente
    const tokenPayload = {
      userId: result.usuario.id,
      empresaId: result.empresa.id,
      email: result.usuario.email,
      nome: result.usuario.nome,
      cargo: result.usuario.cargo,
      empresaNome: result.empresa.nomeFantasia,
    };

    const accessToken = await createAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(tokenPayload);

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      message: "Empresa cadastrada e inicializada com sucesso no SaaS!",
      user: {
        id: result.usuario.id,
        nome: result.usuario.nome,
        email: result.usuario.email,
        cargo: result.usuario.cargo,
        empresa: {
          id: result.empresa.id,
          nomeFantasia: result.empresa.nomeFantasia,
        },
      },
    });
  } catch (error: any) {
    console.error("Erro no cadastro de nova empresa SaaS:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao cadastrar nova empresa." },
      { status: 500 }
    );
  }
}
