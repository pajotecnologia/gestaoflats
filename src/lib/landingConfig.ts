export interface LandingFaqItem {
  pergunta: string;
  resposta: string;
}

export interface LandingPageConfig {
  heroBadge?: string;
  heroTitle?: string;
  heroTitleHighlight?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroVideoUrl?: string; // Link de vídeo demonstrativo (YouTube, etc)
  
  // Contato Comercial & WhatsApp
  whatsappComercial?: string; // Ex: "(87) 99654-0551" ou "5587996540551"
  whatsappMensagemPadrao?: string;
  emailComercial?: string;
  
  // Banner de Alerta / Promoção no topo
  bannerAtivo?: boolean;
  bannerTexto?: string;
  bannerLink?: string;
  
  // Seção de Recursos / Benefícios
  beneficiosTitulo?: string;
  beneficiosSubtitulo?: string;
  
  // Seção de Planos
  planosTitulo?: string;
  planosSubtitulo?: string;
  
  // Perguntas Frequentes (FAQ)
  faqItems?: LandingFaqItem[];
}

export const DEFAULT_LANDING_CONFIG: LandingPageConfig = {
  heroBadge: "🚀 Plataforma SaaS nº 1 para Gestão de Imóveis, Flats & Chácaras",
  heroTitle: "Contratos Digitais, Vistorias com Fotos e Bolepix",
  heroTitleHighlight: "sem complicação",
  heroSubtitle: "A solução completa para automatizar sua carteira de locação residencial, flats, studios e chácaras por temporada em um único painel inteligente.",
  heroCtaText: "Experimente Grátis por 7 Dias",
  heroVideoUrl: "",
  
  whatsappComercial: "(87) 99654-0551",
  whatsappMensagemPadrao: "Olá! Gostaria de saber mais sobre o sistema IMOB e tirar dúvidas sobre os planos.",
  emailComercial: "contato@pajotech.com.br",
  
  bannerAtivo: false,
  bannerTexto: "🔥 Oferta Especial: Ganhe 10% de desconto na contratação do plano anual!",
  bannerLink: "#planos",
  
  beneficiosTitulo: "Tudo que você precisa para gerenciar seus imóveis com máxima eficiência",
  beneficiosSubtitulo: "Elimine burocracias manuais e dê um salto de profissionalismo na gestão dos seus contratos e recebimentos.",
  
  planosTitulo: "Planos dimensionados para o tamanho da sua operação",
  planosSubtitulo: "Você não paga para desbloquear o sistema — você paga conforme sua carteira de imóveis cresce.",
  
  faqItems: [
    {
      pergunta: "Como funciona o período de teste grátis (Trial)?",
      resposta: "Você tem 7 dias de acesso completo a todas as funcionalidades do sistema para cadastrar imóveis, emitir contratos, fazer vistorias fotográficas e testar as integrações sem custo e sem necessidade de cartão de crédito antecipado."
    },
    {
      pergunta: "A assinatura digital nos contratos tem validade jurídica?",
      resposta: "Sim! O sistema coleta data, hora, endereço IP, geolocalização e carimbo de autenticação em conformidade com a MP 2.200-2/2001 e a Lei 14.063/2020."
    },
    {
      pergunta: "Como funciona a emissão de boletos com Pix (Bolepix) pelo Banco Inter?",
      resposta: "O IMOB é integrado via API v3 com o Banco Inter. Você gera boletos registrados com QR Code Pix em 1 clique e, quando o locatário realiza o pagamento, o sistema dá baixa automática como PAGO em menos de 2 segundos."
    },
    {
      pergunta: "Posso utilizar no celular ou tablet para vistorias presenciais?",
      resposta: "Sim! A plataforma é totalmente responsiva e permite tirar fotos diretamente pela câmera do celular durante a vistoria de entrada ou saída, anexando os laudos ao contrato em tempo real."
    }
  ]
};
