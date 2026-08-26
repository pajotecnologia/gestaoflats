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
