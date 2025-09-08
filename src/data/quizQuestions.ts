export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  explanation: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "1",
    question: "Óculos com grau devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 2,
    category: "ACESSÓRIOS DE MODA",
    explanation: "Óculos com grau são permitidos mediante apresentação de documentação complementar."
  },
  {
    id: "2",
    question: "Alimentos frescos (alface, couve, espinafre) devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "ALIMENTOS E BEBIDAS",
    explanation: "Não são permitidos alimentos frescos e produtos caseiros."
  },
  {
    id: "3",
    question: "Bebidas alcoólicas devem ser classificadas como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 2,
    category: "BEBIDAS ALCOÓLICAS",
    explanation: "Produto permitido mediante apresentação de documentação complementar (exceto bebidas caseiras que são proibidas)."
  },
  {
    id: "4",
    question: "Laticínios não-pasteurizados devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "LATICÍNIOS",
    explanation: "Proibida a venda de laticínios não-pasteurizados."
  },
  {
    id: "5",
    question: "Produtos de tortura animal devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "ANIMAIS DOMÉSTICOS",
    explanation: "Quaisquer produtos de tortura animal são proibidos."
  },
  {
    id: "6",
    question: "Medicamentos injetáveis para animais devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "MEDICAMENTOS VETERINÁRIOS",
    explanation: "São proibidos medicamentos para animais que devam ser ministrados por profissionais, por exemplo, medicamentos injetáveis."
  },
  {
    id: "7",
    question: "Gravadores de voz de espionagem devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "GRAVADORES DE VOZ",
    explanation: "São proibidos gravadores de voz de espionagem."
  },
  {
    id: "8",
    question: "Equipamentos para duplicar chaves de carro devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "AUTOMÓVEIS E MOTOCICLETAS",
    explanation: "Equipamentos que permitam duplicar ou clonar sinais de acesso a sistemas fechados são proibidos."
  },
  {
    id: "9",
    question: "Cigarros eletrônicos devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "TABACO / NICOTINA / CIGARROS ELETRÔNICOS",
    explanation: "Cigarros eletrônicos, vaporizadores ou piteiras são proibidos."
  },
  {
    id: "10",
    question: "Fogos de artifício devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "EXPLOSIVOS",
    explanation: "Fogos de artifício e materiais pirotécnicos perigosos são proibidos."
  },
  {
    id: "11",
    question: "Botijão de gás (cheio ou vazio) deve ser classificado como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "INFLAMÁVEIS",
    explanation: "Botijão de gás (cheio ou vazio) é proibido."
  },
  {
    id: "12",
    question: "Mercúrio e sal de mercúrio devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "TÓXICO E NOCIVOS",
    explanation: "Mercúrio e sal de mercúrio são substâncias que podem causar morte ou ferimentos."
  },
  {
    id: "13",
    question: "Material biológico de origem humana (sangue, plasma) deve ser classificado como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "PARTES DO CORPO HUMANO",
    explanation: "Material biológico de origem humana: hormônios, sangue, plasma, sêmen, óvulos, fluídos biológicos são proibidos."
  },
  {
    id: "14",
    question: "Produtos com símbolos de suástica devem ser classificados como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "POLÍTICA / RELIGIÃO",
    explanation: "Quaisquer produtos contendo o símbolo da suásticas são proibidos."
  },
  {
    id: "15",
    question: "Dinheiro falso que reproduza moedas reais deve ser classificado como:",
    options: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
    correctAnswer: 1,
    category: "MOEDA FÍSICA / CRÉDITOS",
    explanation: "Dinheiro cenográfico, dinheiro falso, dinheiro de brincadeira que reproduza de forma idêntica moedas nacionais ou estrangeiras são proibidos."
  }
];

export const getRandomQuestions = (count: number = 10): QuizQuestion[] => {
  const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
