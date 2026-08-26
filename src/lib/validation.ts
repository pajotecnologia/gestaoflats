/**
 * Validação Matemática Estrita de CPF (Dígitos Verificadores)
 */
export function validateCPF(cpfRaw: string): boolean {
  if (!cpfRaw) return false;
  const cpf = cpfRaw.replace(/\D/g, "");

  if (cpf.length !== 11) return false;

  // Elimina CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação do 1º Dígito Verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  // Validação do 2º Dígito Verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
}

/**
 * Formata CPF para o padrão 000.000.000-00
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Formata CNPJ para o padrão 00.000.000/0001-00
 */
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/**
 * Formata telefone / WhatsApp no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(value: string): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : "";
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Formata valores monetários em R$ Real Brasileiro
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

/**
 * Sanitização básica de entradas HTML/Texto contra XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

export function numberToWordsBRL(value: number): string {
  if (!value || isNaN(value)) return "Zero reais";
  const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  const integerPart = Math.floor(value);
  const centsPart = Math.round((value - integerPart) * 100);

  function convertGroup(num: number): string {
    if (num === 0) return "";
    if (num === 100) return "cem";
    let str = "";
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    const t = Math.floor(remainder / 10);
    const u = remainder % 10;

    if (h > 0) str += hundreds[h];
    if (remainder > 0) {
      if (str) str += " e ";
      if (remainder < 10) str += units[remainder];
      else if (remainder < 20) str += teens[remainder - 10];
      else {
        str += tens[t];
        if (u > 0) str += " e " + units[u];
      }
    }
    return str;
  }

  let words = "";
  if (integerPart === 0) {
    words = "zero reais";
  } else {
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const remainderUnits = integerPart % 1000;

    if (thousands > 0) {
      if (thousands === 1) words += "um mil";
      else words += convertGroup(thousands) + " mil";
    }
    if (remainderUnits > 0) {
      if (words) words += " e ";
      words += convertGroup(remainderUnits);
    }
    words += integerPart === 1 ? " real" : " reais";
  }

  if (centsPart > 0) {
    words += " e " + convertGroup(centsPart) + (centsPart === 1 ? " centavo" : " centavos");
  }

  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Substitui dinamicamente todas as variáveis de template do contrato
 * Suporta tags em notação de ponto ou underscore (ex: {{locatario.nome}}, {{locatario_nome}}, {{cpf}}, {{flat.numero}}, etc.)
 */
export function replaceContractVariables(templateHtml: string, contrato: any): string {
  if (!templateHtml) return "";
  if (!contrato) return templateHtml;

  const locatario = contrato.locatario || {};
  const flat = contrato.flat || {};
  const local = flat.local || {};
  const empresa = contrato.empresa || {};

  const valorNum = Number(contrato.valorMensal || flat.valorPadrao || 0);
  const valorFormatado = formatCurrency(valorNum);
  const valorExtenso = numberToWordsBRL(valorNum);

  const dataEmissaoFormatada = contrato.dataEmissao
    ? new Date(contrato.dataEmissao).toLocaleDateString("pt-BR")
    : contrato.createdAt
    ? new Date(contrato.createdAt).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  const dataFimFormatada = contrato.dataFinal
    ? new Date(contrato.dataFinal).toLocaleDateString("pt-BR")
    : "";

  const dataNascimentoFormatada = locatario.dataNascimento
    ? new Date(locatario.dataNascimento).toLocaleDateString("pt-BR")
    : locatario.dataNascimento || "";

  const dataAssinaturaFormatada = contrato.dataAssinaturaLocatario
    ? new Date(contrato.dataAssinaturaLocatario).toLocaleDateString("pt-BR")
    : "";

  const isDias = contrato.tipoValidade === "DIAS";
  const duracaoTexto = isDias
    ? `${contrato.validadeDias || contrato.validadeMeses} ${contrato.validadeDias === 1 ? "dia" : "dias"}`
    : `${contrato.validadeMeses || 1} ${contrato.validadeMeses === 1 ? "mês" : "meses"}`;
  const validadeMeses = contrato.validadeMeses ? `${contrato.validadeMeses} meses` : "";
  const flatDesc = flat.numero ? (local.nome ? `${local.nome} - Flat ${flat.numero}` : `Flat ${flat.numero}`) : "";

  const replacements: Record<string, string> = {
    // LOCATÁRIO (Notação por ponto & underscore)
    "locatario.nome": locatario.nome || "",
    "locatario_nome": locatario.nome || "",
    "nome_locatario": locatario.nome || "",
    "locatario": locatario.nome || "",
    "nome": locatario.nome || "",
    "inquilino": locatario.nome || "",

    "locatario.cpf": locatario.cpf || "",
    "locatario_cpf": locatario.cpf || "",
    "cpf_locatario": locatario.cpf || "",
    "cpf": locatario.cpf || "",

    "locatario.rg": locatario.rg || "",
    "locatario_rg": locatario.rg || "",
    "rg_locatario": locatario.rg || "",
    "rg": locatario.rg || "",

    "locatario.dataNascimento": dataNascimentoFormatada,
    "locatario_data_nascimento": dataNascimentoFormatada,
    "data_nascimento_locatario": dataNascimentoFormatada,
    "data_nascimento": dataNascimentoFormatada,

    "locatario.email": locatario.email || "",
    "locatario_email": locatario.email || "",
    "email_locatario": locatario.email || "",
    "email": locatario.email || "",

    "locatario.telefone": locatario.telefone || "",
    "locatario_telefone": locatario.telefone || "",
    "telefone_locatario": locatario.telefone || "",
    "telefone": locatario.telefone || "",
    "whatsapp": locatario.telefone || "",

    "locatario.endereco": locatario.endereco || "",
    "locatario_endereco": locatario.endereco || "",
    "endereco_locatario": locatario.endereco || "",
    "endereco": locatario.endereco || "",

    "locatario.estadoCivil": locatario.estadoCivil || "Solteiro(a)",
    "locatario_estado_civil": locatario.estadoCivil || "Solteiro(a)",
    "estado_civil": locatario.estadoCivil || "Solteiro(a)",

    "locatario.profissao": locatario.profissao || "",
    "locatario_profissao": locatario.profissao || "",
    "profissao": locatario.profissao || "",

    "locatario.nacionalidade": locatario.nacionalidade || "Brasileiro(a)",
    "locatario_nacionalidade": locatario.nacionalidade || "Brasileiro(a)",
    "nacionalidade": locatario.nacionalidade || "Brasileiro(a)",

    "locatario.qualificacaoCompleta": `${locatario.nome || ""}${locatario.nacionalidade ? `, ${locatario.nacionalidade.toLowerCase()}` : ""}${locatario.estadoCivil ? `, ${locatario.estadoCivil.toLowerCase()}` : ""}${locatario.profissao ? `, ${locatario.profissao.toLowerCase()}` : ""}${locatario.cpf ? `, inscrito(a) no CPF sob o nº ${locatario.cpf}` : ""}${locatario.rg ? `, portador(a) do RG nº ${locatario.rg}` : ""}${locatario.endereco ? `, residente e domiciliado(a) em ${locatario.endereco}` : ""}`,
    "qualificacao_completa": `${locatario.nome || ""}${locatario.nacionalidade ? `, ${locatario.nacionalidade.toLowerCase()}` : ""}${locatario.estadoCivil ? `, ${locatario.estadoCivil.toLowerCase()}` : ""}${locatario.profissao ? `, ${locatario.profissao.toLowerCase()}` : ""}${locatario.cpf ? `, inscrito(a) no CPF sob o nº ${locatario.cpf}` : ""}${locatario.rg ? `, portador(a) do RG nº ${locatario.rg}` : ""}${locatario.endereco ? `, residente e domiciliado(a) em ${locatario.endereco}` : ""}`,

    // IMÓVEL / FLAT / CONDOMÍNIO
    "flat.numero": flat.numero ? String(flat.numero) : "",
    "flat_numero": flat.numero ? String(flat.numero) : "",
    "numero_flat": flat.numero ? String(flat.numero) : "",
    "flat": flatDesc,
    "unidade": flatDesc,

    "flat.status": flat.status || "",
    "flat_status": flat.status || "",

    "flat.descricao": flat.descricao || "",
    "flat_descricao": flat.descricao || "",

    "flat.valorPadrao": formatCurrency(Number(flat.valorPadrao || 0)),
    "flat_valor_padrao": formatCurrency(Number(flat.valorPadrao || 0)),

    "local.nome": local.nome || "",
    "local_nome": local.nome || "",
    "condominio_nome": local.nome || "",
    "condominio": local.nome || "",
    "empreendimento": local.nome || "",

    "local.endereco": local.endereco || "",
    "local_endereco": local.endereco || "",
    "condominio_endereco": local.endereco || "",

    // CONTRATO / GESTÃO DE CONTRATOS
    "contrato.id": contrato.id ? String(contrato.id).slice(0, 8).toUpperCase() : "",
    "contrato_id": contrato.id ? String(contrato.id).slice(0, 8).toUpperCase() : "",
    "numero_contrato": contrato.id ? String(contrato.id).slice(0, 8).toUpperCase() : "",

    "contrato.valorMensal": valorFormatado,
    "valor_mensal": valorFormatado,
    "valor": valorFormatado,
    "aluguel": valorFormatado,
    "valor_aluguel": valorFormatado,

    "contrato.valorExtenso": `${valorFormatado} (${valorExtenso})`,
    "valor_extenso": valorExtenso,
    "valor_mensal_extenso": `${valorFormatado} (${valorExtenso})`,

    "contrato.tipoValidade": contrato.tipoValidade || "MESES",
    "tipo_validade": contrato.tipoValidade || "MESES",

    "contrato.validadeMeses": validadeMeses,
    "validade_meses": validadeMeses,
    "contrato.validadeDias": contrato.validadeDias ? `${contrato.validadeDias} dias` : "",
    "validade_dias": contrato.validadeDias ? `${contrato.validadeDias} dias` : "",

    "duracao": duracaoTexto,
    "duracao_contrato": duracaoTexto,
    "vigencia": duracaoTexto,
    "prazo_meses": duracaoTexto,

    "contrato.dataEmissao": dataEmissaoFormatada,
    "data_emissao": dataEmissaoFormatada,
    "data_inicio": dataEmissaoFormatada,
    "data_contrato": dataEmissaoFormatada,

    "contrato.dataFinal": dataFimFormatada,
    "data_final": dataFimFormatada,
    "data_fim": dataFimFormatada,
    "data_termino": dataFimFormatada,

    "contrato.status": contrato.status || "",
    "contrato_status": contrato.status || "",

    "contrato.statusAssinatura": contrato.statusAssinatura || "",
    "status_assinatura": contrato.statusAssinatura || "",

    "contrato.dataAssinatura": dataAssinaturaFormatada,
    "data_assinatura": dataAssinaturaFormatada,

    "contrato.ipAssinatura": contrato.ipAssinaturaLocatario || "",
    "ip_assinatura": contrato.ipAssinaturaLocatario || "",

    // NOVAS CONDIÇÕES FINANCEIRAS DO CONTRATO
    "contrato.diaVencimento": contrato.diaVencimento !== undefined && contrato.diaVencimento !== null ? String(contrato.diaVencimento) : "5",
    "dia_vencimento": contrato.diaVencimento !== undefined && contrato.diaVencimento !== null ? String(contrato.diaVencimento) : "5",
    "vencimento_dia": contrato.diaVencimento !== undefined && contrato.diaVencimento !== null ? String(contrato.diaVencimento) : "5",
    "pagamento_dia": contrato.diaVencimento !== undefined && contrato.diaVencimento !== null ? String(contrato.diaVencimento) : "5",

    "contrato.formaPagamento": contrato.formaPagamento || "PIX",
    "forma_pagamento": contrato.formaPagamento || "PIX",
    "forma_pagto": contrato.formaPagamento || "PIX",

    "contrato.bancoNome": contrato.bancoNome || "",
    "banco_nome": contrato.bancoNome || "",
    "nome_banco": contrato.bancoNome || "",
    "banco": contrato.bancoNome || "",

    "contrato.bancoDadosConta": contrato.bancoDadosConta || "",
    "dados_conta": contrato.bancoDadosConta || "",
    "conta_bancaria": contrato.bancoDadosConta || "",
    "pix_dados": contrato.bancoDadosConta || "",

    "contrato.multaAtrasoPercentual": contrato.multaAtrasoPercentual !== undefined && contrato.multaAtrasoPercentual !== null ? `${contrato.multaAtrasoPercentual}%` : "2%",
    "multa_percentual": contrato.multaAtrasoPercentual !== undefined && contrato.multaAtrasoPercentual !== null ? `${contrato.multaAtrasoPercentual}%` : "2%",
    "multa_atraso": contrato.multaAtrasoPercentual !== undefined && contrato.multaAtrasoPercentual !== null ? `${contrato.multaAtrasoPercentual}%` : "2%",
    "multa": contrato.multaAtrasoPercentual !== undefined && contrato.multaAtrasoPercentual !== null ? `${contrato.multaAtrasoPercentual}%` : "2%",

    "contrato.jurosAtrasoPercentual": contrato.jurosAtrasoPercentual !== undefined && contrato.jurosAtrasoPercentual !== null ? `${contrato.jurosAtrasoPercentual}%` : "1%",
    "juros_percentual": contrato.jurosAtrasoPercentual !== undefined && contrato.jurosAtrasoPercentual !== null ? `${contrato.jurosAtrasoPercentual}%` : "1%",
    "juros_atraso": contrato.jurosAtrasoPercentual !== undefined && contrato.jurosAtrasoPercentual !== null ? `${contrato.jurosAtrasoPercentual}%` : "1%",
    "juros": contrato.jurosAtrasoPercentual !== undefined && contrato.jurosAtrasoPercentual !== null ? `${contrato.jurosAtrasoPercentual}%` : "1%",

    "contrato.valorCaucao": formatCurrency(Number(contrato.valorCaucao || 0)),
    "valor_caucao": formatCurrency(Number(contrato.valorCaucao || 0)),
    "caucao": formatCurrency(Number(contrato.valorCaucao || 0)),

    "contrato.caucaoParcelas": contrato.caucaoParcelas !== undefined && contrato.caucaoParcelas !== null ? `${contrato.caucaoParcelas}` : "0",
    "caucao_parcelas": contrato.caucaoParcelas !== undefined && contrato.caucaoParcelas !== null ? `${contrato.caucaoParcelas}` : "0",
    "caucao_meses": contrato.caucaoParcelas !== undefined && contrato.caucaoParcelas !== null ? `${contrato.caucaoParcelas}` : "0",

    "contrato.multaRescisaoMeses": contrato.multaRescisaoMeses !== undefined && contrato.multaRescisaoMeses !== null ? `${contrato.multaRescisaoMeses}` : "3",
    "multa_rescisao_meses": contrato.multaRescisaoMeses !== undefined && contrato.multaRescisaoMeses !== null ? `${contrato.multaRescisaoMeses}` : "3",
    "multa_rescisao": contrato.multaRescisaoMeses !== undefined && contrato.multaRescisaoMeses !== null ? `${contrato.multaRescisaoMeses}` : "3",
    "multa_cancelamento": contrato.multaRescisaoMeses !== undefined && contrato.multaRescisaoMeses !== null ? `${contrato.multaRescisaoMeses}` : "3",

    // EMPRESA / LOCADORA
    "empresa.nomeFantasia": empresa.nomeFantasia || "Locadora",
    "empresa_nome": empresa.nomeFantasia || "Locadora",
    "nome_empresa": empresa.nomeFantasia || "Locadora",
    "locadora_nome": empresa.nomeFantasia || "Locadora",
    "locador": empresa.nomeFantasia || "Locadora",
    "locadora": empresa.nomeFantasia || "Locadora",

    "empresa.razaoSocial": empresa.razaoSocial || empresa.nomeFantasia || "",
    "empresa_razao_social": empresa.razaoSocial || empresa.nomeFantasia || "",
    "razao_social": empresa.razaoSocial || empresa.nomeFantasia || "",

    "empresa.cnpj": empresa.cnpj || "",
    "empresa_cnpj": empresa.cnpj || "",
    "cnpj_empresa": empresa.cnpj || "",
    "cnpj": empresa.cnpj || "",

    "empresa.telefone": empresa.telefone || "",
    "empresa_telefone": empresa.telefone || "",

    "empresa.email": empresa.email || "",
    "empresa_email": empresa.email || "",

    "empresa.endereco": empresa.endereco || "",
    "empresa_endereco": empresa.endereco || "",
    "empresa_logradouro": empresa.endereco || "",
    "rua_empresa": empresa.endereco || "",

    "empresa.bairro": empresa.bairro || "",
    "empresa_bairro": empresa.bairro || "",
    "bairro_empresa": empresa.bairro || "",

    "empresa.cidade": empresa.cidade || "",
    "empresa_cidade": empresa.cidade || "",
    "cidade_empresa": empresa.cidade || "",

    "empresa.estado": empresa.estado || "",
    "empresa_estado": empresa.estado || "",
    "uf_empresa": empresa.estado || "",

    "empresa.cep": empresa.cep || "",
    "empresa_cep": empresa.cep || "",
    "cep_empresa": empresa.cep || "",

    "empresa.enderecoCompleto": [
      empresa.endereco,
      empresa.bairro ? `Bairro ${empresa.bairro}` : "",
      empresa.cidade && empresa.estado ? `${empresa.cidade}/${empresa.estado}` : empresa.cidade || empresa.estado || "",
      empresa.cep ? `CEP ${empresa.cep}` : "",
    ].filter(Boolean).join(", "),
    "empresa_endereco_completo": [
      empresa.endereco,
      empresa.bairro ? `Bairro ${empresa.bairro}` : "",
      empresa.cidade && empresa.estado ? `${empresa.cidade}/${empresa.estado}` : empresa.cidade || empresa.estado || "",
      empresa.cep ? `CEP ${empresa.cep}` : "",
    ].filter(Boolean).join(", "),
  };

  let result = templateHtml;

  // Substituição de todas as chaves
  for (const [key, value] of Object.entries(replacements)) {
    // Escapar pontos e caracteres especiais para a expressão regular
    const escapedKey = key.replace(/\./g, "\\.");
    const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, "gi");
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Formata mês de referência para o padrão MM/YYYY (XX/XXXX)
 * Ex: "2026-08" -> "08/2026", "2026-08-15" -> "08/2026", "8/2026" -> "08/2026"
 */
export function formatMesReferencia(mesRef?: string | null): string {
  if (!mesRef || !mesRef.trim()) return "-";
  const str = mesRef.trim();

  // Trata separador hífen (ex: 2026-08 ou 08-2026)
  if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length >= 2) {
      if (parts[0].length === 4) {
        // YYYY-MM ou YYYY-MM-DD
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        return `${month}/${year}`;
      } else if (parts[1].length === 4) {
        // MM-YYYY
        const month = parts[0].padStart(2, "0");
        const year = parts[1];
        return `${month}/${year}`;
      }
    }
  }

  // Trata separador barra (ex: 08/2026 ou 8/2026 ou 2026/08)
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 2) {
      if (parts[0].length === 4) {
        // YYYY/MM
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        return `${month}/${year}`;
      } else {
        // MM/YYYY
        const month = parts[0].padStart(2, "0");
        const year = parts[1].length === 2 ? `20${parts[1]}` : parts[1];
        return `${month}/${year}`;
      }
    }
  }

  return str;
}
