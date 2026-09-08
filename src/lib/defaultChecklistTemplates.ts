export interface ChecklistTopico {
  topico: string;
  itens: string[];
}

export interface DefaultChecklistTemplate {
  titulo: string;
  tipoImovel: "FLAT" | "SALAO" | "CHACARA" | "OUTRO";
  descricao: string;
  topicos: ChecklistTopico[];
}

export const DEFAULT_CHECKLIST_TEMPLATES: DefaultChecklistTemplate[] = [
  {
    titulo: "Vistoria Residencial / Flats / Apartamentos",
    tipoImovel: "FLAT",
    descricao: "Modelo padrão completo para imóveis residenciais, flats, kitnets e apartamentos por temporada ou mensal.",
    topicos: [
      {
        topico: "Estrutura & Paredes",
        itens: [
          "Pintura e integridade das paredes e teto",
          "Portas, fechaduras e chaves (entregues)",
          "Janelas, vidros e cortinas/persianas",
          "Piso, rodapés e revestimentos",
        ],
      },
      {
        topico: "Móveis & Marcenaria",
        itens: [
          "Cama box e colchão (sem manchas/avarias)",
          "Armários do quarto e cozinha (portas e gavetas)",
          "Sofá / Poltrona e almofadas",
          "Mesa de jantar e cadeiras",
        ],
      },
      {
        topico: "Eletrodomésticos",
        itens: [
          "Ar Condicionado (funcionamento e controle)",
          "Geladeira / Frigobar (limpo e congelando)",
          "Televisão / Controle remoto funcionando",
          "Micro-ondas e Cooktop / Fogão",
        ],
      },
      {
        topico: "Hidráulica & Elétrica",
        itens: [
          "Torneiras, pias e chuveiro elétrico",
          "Iluminação / Lâmpadas de todos os cômodos",
          "Tomadas e interruptores (testados)",
          "Vaso sanitário, assento e descarga",
        ],
      },
      {
        topico: "Enxoval & Utensílios",
        itens: [
          "Jogo de lençóis, toalhas e travesseiros",
          "Pratos, copos, talheres e panelas",
          "Kit limpeza (vassoura, rodo, balde)",
        ],
      },
    ],
  },
  {
    titulo: "Salão de Festas & Espaço de Eventos",
    tipoImovel: "SALAO",
    descricao: "Modelo completo para locação de salões de festas, recepções, conferências e eventos com áreas de buffet e som.",
    topicos: [
      {
        topico: "Acesso, Segurança & Estrutura",
        itens: [
          "Portão de acesso e fechaduras",
          "Piso do salão principal limpo e sem trincas",
          "Pintura das paredes e colunas",
          "Extintores de incêndio dentro do prazo",
          "Luminárias de emergência e saídas de fuga",
        ],
      },
      {
        topico: "Climatização & Iluminação",
        itens: [
          "Aparelhos de Ar-condicionado e controles remotos",
          "Iluminação central e spots decorativos",
          "Ventiladores de teto/parede",
          "Quadro de disjuntores e tomadas 110V/220V",
        ],
      },
      {
        topico: "Mobiliário & Decoração",
        itens: [
          "Mesas redondas e retangulares",
          "Cadeiras (quantidade e integridade)",
          "Mesa principal / Aparador de buffet",
          "Palco / Púlpito e cortinas",
        ],
      },
      {
        topico: "Cozinha & Área de Apoio / Buffet",
        itens: [
          "Bancadas de granito / inox limpas",
          "Freezer horizontal e geladeira industrial",
          "Fogão / Forno industrial",
          "Pias, torneiras e ralos desobstruídos",
          "Lixeiras grandes com tampa",
        ],
      },
      {
        topico: "Sanitários (Masculino, Feminino & PCD)",
        itens: [
          "Vasos sanitários com assentos e tampas",
          "Descargas, torneiras e pias funcionando",
          "Espelhos sem trincas ou manchas",
          "Dispenser de sabonete e suporte de papel",
        ],
      },
    ],
  },
  {
    titulo: "Chácara, Sítio & Casa de Campo",
    tipoImovel: "CHACARA",
    descricao: "Modelo para locação por temporada ou diárias em chácaras, sítios, casas de praia e áreas de lazer com piscina.",
    topicos: [
      {
        topico: "Área Externa, Lazer & Piscina",
        itens: [
          "Piscina (água tratada, bordas e azulejos)",
          "Bomba e filtro da piscina funcionando",
          "Ducha externa e lava-pés",
          "Campo de futebol / Quadra de areia e redes",
          "Gramado e cercamento/muros da propriedade",
        ],
      },
      {
        topico: "Área Gourmet & Quiosque",
        itens: [
          "Churrasqueira, grelhas e espetos",
          "Forno e fogão a lenha / Cooktop",
          "Freezer de bebidas / Cervejeira",
          "Mesas e bancos rústicos de madeira",
          "Pia, torneira e balcão de atendimento",
        ],
      },
      {
        topico: "Casa Principal & Acomodações",
        itens: [
          "Sala de estar e sofás",
          "Camas de casal e solteiro / Beliches",
          "Colchões extras para hóspedes",
          "Ventiladores e ar-condicionado dos quartos",
          "Cozinha interna e eletrodomésticos",
          "Banheiros internos com chuveiros",
        ],
      },
      {
        topico: "Instalações Gerais & Suprimentos",
        itens: [
          "Poço artesiano / Bomba d'água funcionando",
          "Nível das caixas d'água",
          "Iluminação externa, refletores e postes",
          "Portão eletrônico / Cadeados de acesso",
          "Botijão de gás (reserva)",
        ],
      },
    ],
  },
];
