export const DEFAULT_CONTRATO_HTML = `<h2 style="text-align: center; color: #000000; font-family: Arial, sans-serif; font-weight: bold; font-size: 18px; margin-bottom: 20px;">CONTRATO DE LOCAÇÃO RESIDENCIAL DE FLAT E UNIDADE HABITACIONAL</h2>

<p style="text-align: justify; line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  Pelo presente instrumento particular de locação residencial, de um lado como <strong>LOCADORA</strong> a empresa <strong>{{empresa.razaoSocial}}</strong> (Nome Fantasia: <strong>{{empresa.nomeFantasia}}</strong>), inscrita no CNPJ sob o nº <strong>{{empresa.cnpj}}</strong>, estabelecida no endereço <strong>{{empresa.enderecoCompleto}}</strong>, contato <strong>{{empresa.telefone}}</strong> / <strong>{{empresa.email}}</strong>; e de outro lado como <strong>LOCATÁRIO(A)</strong> o(a) Sr(a). <strong>{{locatario.nome}}</strong>, inscrito(a) no CPF sob o nº <strong>{{locatario.cpf}}</strong>, portador(a) do RG nº <strong>{{locatario.rg}}</strong>, {{locatario.qualificacaoCompleta}}, residente e domiciliado(a) em <strong>{{locatario.endereco}}</strong>, telefone/WhatsApp <strong>{{locatario.telefone}}</strong> e e-mail <strong>{{locatario.email}}</strong>, têm entre si justo e contratado o quanto segue nas cláusulas abaixo discriminadas:
</p>

<hr style="border: 0; border-top: 1px solid #000000; margin: 18px 0;" />

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA PRIMEIRA - DO OBJETO E DESTINAÇÃO:</strong><br/>
  O objeto da presente locação é a unidade habitacional referente ao <strong>Flat nº {{flat.numero}}</strong> integrante do <strong>{{local.nome}}</strong>, localizado na <strong>{{local.endereco}}</strong>. O imóvel é entregue inteiramente mobiliado, decorado e equipado com eletrodomésticos e utensílios operacionais descritos e vistoriados no <strong>Laudo de Vistoria de Entrada</strong>, destinando-se única e exclusivamente para uso residencial do(a) LOCATÁRIO(A).
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA SEGUNDA - DA VIGÊNCIA E PRAZO:</strong><br/>
  O prazo de locação é de <strong>{{duracao}}</strong> ({{contrato.validadeMeses}} meses), iniciando-se no dia <strong>{{contrato.dataEmissao}}</strong> e encerrando-se no dia <strong>{{contrato.dataFinal}}</strong>, data em que o(a) LOCATÁRIO(A) obriga-se a restituir o imóvel totalmente livre e desocupado, em perfeitas condições de conservação e limpeza.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA TERCEIRA - DO VALOR DO ALUGUEL E FORMA DE PAGAMENTO:</strong><br/>
  O valor do aluguel mensal ajustado é de <strong>{{contrato.valorMensal}}</strong> ({{contrato.valorExtenso}}), devendo ser pago impreterivelmente até o dia <strong>{{contrato.diaVencimento}}</strong> de cada mês subsequente ao de vencimento.<br/>
  Parágrafo Único: O pagamento deverá ser efetuado via <strong>{{contrato.formaPagamento}}</strong> no Banco <strong>{{contrato.bancoNome}}</strong>, Dados da Conta/PIX: <strong>{{contrato.bancoDadosConta}}</strong>, servindo o comprovante de transferência bancária ou recibo emitido como quitação oficial.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA QUARTA - DA MULTA E JUROS POR ATRASO:</strong><br/>
  O não pagamento do aluguel até a data de vencimento estipulada acarretará ao(à) LOCATÁRIO(A) a incidência automática de multa moratória de <strong>{{contrato.multaAtrasoPercentual}}%</strong> sobre o valor do débito, acrescida de juros de mora de <strong>{{contrato.jurosAtrasoPercentual}}%</strong> ao mês e correção monetária pro rata die até a data da efetiva liquidação.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA QUINTA - DA CAUÇÃO E GARANTIA:</strong><br/>
  A título de garantia locatícia, o(a) LOCATÁRIO(A) presta uma caução no valor de <strong>{{contrato.valorCaucao}}</strong>, correspondente a <strong>{{contrato.caucaoParcelas}} parcela(s)</strong> de aluguel. A quantia prestada será restituída ao final da locação após a entrega das chaves e vistoria de saída, deduzidos eventuais débitos em aberto ou reparos no imóvel.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA SEXTA - DA MULTA RESCISÓRIA POR CANCELAMENTO ANTECIPADO:</strong><br/>
  Em caso de rescisão antecipada do presente contrato por iniciativa do(a) LOCATÁRIO(A) antes do término do prazo estipulado na Cláusula Segunda, será cobrada uma multa rescisória compensatória equivalente a <strong>{{contrato.multaRescisaoMeses}} meses de aluguel</strong>, calculada proporcionalmente ao tempo restante do contrato.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA SÉTIMA - DA MANUTENÇÃO, CONSERVAÇÃO E VISTORIA:</strong><br/>
  O(A) LOCATÁRIO(A) declara ter recebido o imóvel em perfeitas condições de uso, habitabilidade, limpeza, pintura, encanamento e funcionamento elétrico e hidráulico conforme especificado no Laudo de Vistoria de Entrada, obrigando-se a devolvê-lo nas mesmas condições.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA OITAVA - DA ASSINATURA DIGITAL E AUDITORIA EM BLOCKCHAIN:</strong><br/>
  As partes contratantes declaram expressamente que reconhecem como válida, legal, autêntica e vinculante a assinatura deste instrumento por meio eletrônico / digital, em conformidade com a legislação vigente, aceitando os registros de data, hora, IP e ancoragem de auditoria no protocolo Blockchain.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  E, por estarem assim justas e contratadas, as partes assinam o presente contrato em meio digital para que produza seus jurídicos e legais efeitos.
</p>

<br/><br/>

<table style="width: 100%; margin-top: 30px; text-align: center; color: #000000; font-family: Arial, sans-serif;">
  <tr>
    <td style="width: 50%; color: #000000; vertical-align: top;">
      ___________________________________<br/>
      <strong>{{empresa.nomeFantasia}}</strong><br/>
      {{empresa.cnpj}}<br/>
      LOCADORA
    </td>
    <td style="width: 50%; color: #000000; vertical-align: top;">
      ___________________________________<br/>
      <strong>{{locatario.nome}}</strong><br/>
      CPF: {{locatario.cpf}}<br/>
      LOCATÁRIO(A)
    </td>
  </tr>
</table>`;

export const CONTRATO_CHACARA_EVENTOS_HTML = `<h2 style="text-align: center; color: #000000; font-family: Arial, sans-serif; font-weight: bold; font-size: 18px; margin-bottom: 20px;">CONTRATO DE LOCAÇÃO DE CHÁCARA PARA EVENTOS E TEMPORADA</h2>

<p style="text-align: justify; line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>LOCADOR (Proprietário / Administradora):</strong><br/>
  <strong>Nome / Razão Social:</strong> {{empresa.razaoSocial}} (Nome Fantasia: {{empresa.nomeFantasia}})<br/>
  <strong>CPF / CNPJ:</strong> {{empresa.cnpj}}<br/>
  <strong>Endereço:</strong> {{empresa.enderecoCompleto}}<br/>
  <strong>Telefone / E-mail:</strong> {{empresa.telefone}} / {{empresa.email}}
</p>

<p style="text-align: justify; line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>LOCATÁRIO (Cliente / Organizador):</strong><br/>
  <strong>Nome completo:</strong> {{locatario.nome}}<br/>
  <strong>CPF / CNPJ:</strong> {{locatario.cpf}} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>RG:</strong> {{locatario.rg}}<br/>
  <strong>Qualificação:</strong> {{locatario.qualificacaoCompleta}}<br/>
  <strong>Endereço:</strong> {{locatario.endereco}}<br/>
  <strong>Telefone / WhatsApp:</strong> {{locatario.telefone}} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>E-mail:</strong> {{locatario.email}}
</p>

<hr style="border: 0; border-top: 1px solid #000000; margin: 18px 0;" />

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA 1ª – DO OBJETO</strong><br/>
  O presente contrato tem como objeto a locação por temporada do imóvel denominado <strong>{{local.nome}}</strong> (Espaço / Chácara nº <strong>{{flat.numero}}</strong>), situada em <strong>{{local.enderecoCompleto}}</strong>, exclusivamente para a realização do evento e confraternização (<strong>{{flat.descricao}}</strong>), respeitadas as normas vigentes e a capacidade máxima estipulada para o imóvel.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA 2ª – DO PRAZO E HORÁRIO</strong><br/>
  A locação terá o prazo total de <strong>{{duracao}}</strong>, com início em <strong>{{contrato.dataEmissao}}</strong> e término impreterivelmente em <strong>{{contrato.dataFinal}}</strong>.<br/>
  <strong>Parágrafo único:</strong> A permanência do LOCATÁRIO após o horário estipulado gerará multa diária / por hora excedente calculada proporcionalmente ao valor da diária, sem prejuízo da exigência de desocupação imediata.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA 3ª – DO VALOR E FORMA DE PAGAMENTO</strong><br/>
  O valor total da locação é de <strong>{{contrato.valorMensal}}</strong> ({{contrato.valorExtenso}}), que deverá ser pago via <strong>{{contrato.formaPagamento}}</strong> (Banco: <strong>{{contrato.bancoNome}}</strong>, Chave PIX / Conta: <strong>{{contrato.bancoDadosConta}}</strong>), da seguinte forma:<br/>
  <strong>a) Sinal / Reserva:</strong> R$ <strong>{{contrato.valorCaucao}}</strong> pagos via PIX / Transferência na data de assinatura deste contrato para garantia de reserva da data;<br/>
  <strong>b) Saldo Restante:</strong> Saldo complementar quitado até a data de entrada no imóvel / vencimento em <strong>{{contrato.diaVencimento}}</strong>, sendo condição indispensável para a entrega das chaves e liberação do acesso.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA 4ª – DAS REGRAS E DA LEI DO SILÊNCIO</strong><br/>
  O LOCATÁRIO obriga-se a respeitar rigorosamente a legislação vigente sobre o limite de som e perturbação do sossego público:<br/>
  <strong>I.</strong> O som automotivo ou amplificado externo deverá respeitar o limite de decibéis permitido por lei e ser reduzido / desligado impreterivelmente às <strong>22:00 horas</strong> (conforme a lei do silêncio local e regulamento do condomínio/chácara);<br/>
  <strong>II.</strong> É expressamente proibido estacionar veículos em locais que obstruam a circulação de vizinhos, vias de acesso ou portões de serviço.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA 5ª – DOS DANOS E DA LIMPEZA</strong><br/>
  O imóvel é entregue limpo e em perfeito estado de conservação, devendo ser devolvido nas mesmas condições:<br/>
  <strong>I.</strong> O LOCATÁRIO responsabiliza-se civil e criminalmente por quaisquer danos causados ao patrimônio, móveis, plantas, piscina ou instalações da chácara, sejam causados por si, seus prestadores de serviço ou seus convidados;<br/>
  <strong>II.</strong> O lixo produzido no evento deve ser recolhido e acondicionado em sacos próprios e resistentes nos locais indicados pelo LOCADOR.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA 6ª – DO CANCELAMENTO E DESISTÊNCIA</strong><br/>
  Em caso de desistência por parte do LOCATÁRIO com menos de 30 (trinta) dias de antecedência da data agendada para o evento, o valor do sinal não será devolvido, retido como taxa indenizatória compensatória.
</p>

<p style="line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px;">
  <strong>CLÁUSULA 7ª – DO FORO</strong><br/>
  Para dirimir quaisquer dúvidas oriundas deste contrato, as partes elegem o foro da Comarca de <strong>{{empresa.cidade}} - {{empresa.estado}}</strong>.
</p>

<p style="text-align: right; line-height: 1.6; color: #000000; font-family: Arial, sans-serif; font-size: 13px; margin-top: 25px;">
  {{empresa.cidade}} - {{empresa.estado}}, {{contrato.dataEmissao}}.
</p>

<br/><br/>

<table style="width: 100%; margin-top: 30px; text-align: center; color: #000000; font-family: Arial, sans-serif;">
  <tr>
    <td style="width: 50%; color: #000000; vertical-align: top;">
      ___________________________________<br/>
      <strong>{{empresa.nomeFantasia}}</strong><br/>
      CNPJ: {{empresa.cnpj}}<br/>
      <strong>LOCADOR</strong>
    </td>
    <td style="width: 50%; color: #000000; vertical-align: top;">
      ___________________________________<br/>
      <strong>{{locatario.nome}}</strong><br/>
      CPF: {{locatario.cpf}}<br/>
      <strong>LOCATÁRIO</strong>
    </td>
  </tr>
</table>`;

export const SYSTEM_CONTRACT_TEMPLATES = [
  {
    id: "padrao-flat",
    titulo: "Contrato Padrão de Locação Residencial de Flat",
    descricao: "Ideal para locação residencial de flats, apartamentos e estúdios.",
    conteudoHtml: DEFAULT_CONTRATO_HTML,
  },
  {
    id: "chacara-eventos",
    titulo: "Contrato de Locação de Chácara para Eventos",
    descricao: "Contrato para locação por temporada de chácaras, sítios, casas de campo e espaços de eventos com regras de barulho e caução.",
    conteudoHtml: CONTRATO_CHACARA_EVENTOS_HTML,
  },
];
