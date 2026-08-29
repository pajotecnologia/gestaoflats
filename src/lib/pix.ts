import QRCode from "qrcode";

/**
 * Função para calcular o CRC16 (CCITT-FALSE) do padrão Pix Banco Central (BR Code)
 */
function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export interface PixPayloadParams {
  chave: string;
  nomeBeneficiario: string;
  cidadeBeneficiario: string;
  valor?: number;
  identificador?: string; // TXID
  descricao?: string;
}

/**
 * Gera a string do Pix Copia e Cola (EMV QRCPS / BR Code)
 */
export function generatePixPayload({
  chave,
  nomeBeneficiario,
  cidadeBeneficiario,
  valor,
  identificador = "PAGSAAS",
}: PixPayloadParams): string {
  // Limpar e formatar campos
  const cleanChave = chave.trim();
  const cleanNome = (nomeBeneficiario || "PAJO TECNOLOGIA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 25)
    .toUpperCase();
  const cleanCidade = (cidadeBeneficiario || "RECIFE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 15)
    .toUpperCase();
  const cleanTxid = (identificador || "PAGSAAS")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 25);

  // 00: Payload Format Indicator
  let payload = formatField("00", "01");

  // 26: Merchant Account Information (Pix)
  const gui = formatField("00", "br.gov.bcb.pix");
  const key = formatField("01", cleanChave);
  payload += formatField("26", `${gui}${key}`);

  // 52: Merchant Category Code (0000 ou 5411)
  payload += formatField("52", "0000");

  // 53: Transaction Currency (986 = BRL)
  payload += formatField("53", "986");

  // 54: Transaction Amount
  if (valor && valor > 0) {
    payload += formatField("54", valor.toFixed(2));
  }

  // 58: Country Code (BR)
  payload += formatField("58", "BR");

  // 59: Merchant Name
  payload += formatField("59", cleanNome);

  // 60: Merchant City
  payload += formatField("60", cleanCidade);

  // 62: Additional Data Field Template (TxID)
  const txidField = formatField("05", cleanTxid);
  payload += formatField("62", txidField);

  // 63: CRC16 (Calculado sobre o payload com '6304')
  payload += "6304";
  const crc = calculateCRC16(payload);

  return `${payload}${crc}`;
}

/**
 * Gera imagem QR Code do PIX em formato Data URI Base64
 */
export async function generatePixQRCode(pixCopiaCola: string): Promise<string> {
  try {
    return await QRCode.toDataURL(pixCopiaCola, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar QR Code PIX:", error);
    return "";
  }
}
