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
    question: "Qual é o limite de tamanho para facas permitidas na Shopee?",
    options: ["25cm", "30cm", "35cm", "40cm"],
    correctAnswer: 1,
    category: "ARMAS",
    explanation: "Facas com lâmina acima de 30cm são consideradas armas brancas e são proibidas."
  },
  {
    id: "2",
    question: "Bebidas alcoólicas na Shopee são:",
    options: ["Permitidas sem restrições", "Totalmente proibidas", "Restritas com documentação", "Permitidas apenas cervejas"],
    correctAnswer: 2,
    category: "BEBIDAS ALCOÓLICAS",
    explanation: "Bebidas alcoólicas são RESTRITAS e requerem apresentação de documentação complementar."
  },
  {
    id: "3",
    question: "Qual é o limite de concentração de álcool permitido em produtos de limpeza?",
    options: ["50%", "60%", "70%", "80%"],
    correctAnswer: 2,
    category: "PRODUTOS QUÍMICOS",
    explanation: "Produtos com concentração de álcool acima de 70% são proibidos."
  },
  {
    id: "4",
    question: "Câmeras escondidas são classificadas como:",
    options: ["Permitidas", "Proibidas", "Restritas", "Depende do tamanho"],
    correctAnswer: 1,
    category: "CÂMERAS E DRONES",
    explanation: "Câmeras escondidas são PROIBIDAS por violarem a privacidade."
  },
  {
    id: "5",
    question: "Suplementos alimentares na Shopee são:",
    options: ["Permitidos sem restrições", "Totalmente proibidos", "Restritos com documentação", "Permitidos apenas vitaminas"],
    correctAnswer: 2,
    category: "SUPLEMENTOS ALIMENTARES",
    explanation: "Suplementos alimentares são RESTRITOS e requerem apresentação de documentação complementar."
  },
  {
    id: "6",
    question: "Pistolas de pintura são consideradas:",
    options: ["Armas proibidas", "Ferramentas permitidas", "Restritas", "Depende da potência"],
    correctAnswer: 1,
    category: "FERRAMENTAS",
    explanation: "Pistolas de pintura são FERRAMENTAS para trabalho e são permitidas, não são consideradas armas."
  },
  {
    id: "7",
    question: "Qual é o limite de peso para baterias de lítio?",
    options: ["100g", "500g", "1kg", "2kg"],
    correctAnswer: 1,
    category: "BATERIAS",
    explanation: "Baterias de lítio acima de 100g têm restrições especiais de transporte."
  },
  {
    id: "8",
    question: "Produtos com CBD são:",
    options: ["Permitidos", "Proibidos", "Restritos", "Permitidos apenas óleos"],
    correctAnswer: 1,
    category: "PRODUTOS FARMACÊUTICOS",
    explanation: "Produtos com CBD são PROIBIDOS na Shopee Brasil."
  },
  {
    id: "9",
    question: "Estilingues de brinquedo são:",
    options: ["Sempre proibidos", "Permitidos se for brinquedo", "Restritos", "Depende do material"],
    correctAnswer: 1,
    category: "BRINQUEDOS",
    explanation: "Estilingues de brinquedo são PERMITIDOS, diferente de estilingues reais que são proibidos."
  },
  {
    id: "10",
    question: "Maçaricos são classificados como:",
    options: ["Ferramentas permitidas", "Proibidos", "Restritos", "Depende do uso"],
    correctAnswer: 1,
    category: "FERRAMENTAS",
    explanation: "Maçaricos são PROIBIDOS por serem ferramentas inflamáveis perigosas."
  },
  {
    id: "11",
    question: "Qual é o limite de potência para lasers permitidos?",
    options: ["1mW", "5mW", "10mW", "Todos são proibidos"],
    correctAnswer: 0,
    category: "ELETRÔNICOS",
    explanation: "Lasers acima de 1mW são considerados perigosos e são proibidos."
  },
  {
    id: "12",
    question: "Produtos de tabaco são:",
    options: ["Permitidos", "Proibidos", "Restritos", "Permitidos apenas cigarros eletrônicos"],
    correctAnswer: 1,
    category: "TABACO",
    explanation: "Todos os produtos de tabaco são PROIBIDOS na Shopee."
  },
  {
    id: "13",
    question: "Walkie-talkies são:",
    options: ["Sempre permitidos", "Sempre proibidos", "Restritos com documentação", "Depende da frequência"],
    correctAnswer: 2,
    category: "TELECOMUNICAÇÕES",
    explanation: "Walkie-talkies são RESTRITOS e requerem autorização da Anatel."
  },
  {
    id: "14",
    question: "Qual é o limite de decibéis para alarmes pessoais?",
    options: ["100dB", "120dB", "140dB", "Não há limite"],
    correctAnswer: 1,
    category: "SEGURANÇA",
    explanation: "Alarmes pessoais acima de 120dB podem causar danos auditivos e são restritos."
  },
  {
    id: "15",
    question: "Ímãs de neodímio são:",
    options: ["Sempre permitidos", "Proibidos se muito fortes", "Restritos", "Permitidos apenas pequenos"],
    correctAnswer: 1,
    category: "MATERIAIS PERIGOSOS",
    explanation: "Ímãs de neodímio muito fortes são PROIBIDOS por riscos de segurança."
  },
  {
    id: "16",
    question: "Produtos veterinários são:",
    options: ["Permitidos", "Proibidos", "Restritos com receita", "Permitidos apenas shampoos"],
    correctAnswer: 2,
    category: "PRODUTOS VETERINÁRIOS",
    explanation: "Produtos veterinários são RESTRITOS e requerem documentação específica."
  },
  {
    id: "17",
    question: "Qual é a classificação de espelhos retrovisores para motos?",
    options: ["Permitidos", "Proibidos", "Restritos", "Depende do modelo da moto"],
    correctAnswer: 0,
    category: "ACESSÓRIOS AUTOMOTIVOS",
    explanation: "Espelhos retrovisores são acessórios de segurança e são PERMITIDOS."
  },
  {
    id: "18",
    question: "Produtos com mercúrio são:",
    options: ["Permitidos em pequenas quantidades", "Totalmente proibidos", "Restritos", "Permitidos apenas termômetros"],
    correctAnswer: 1,
    category: "MATERIAIS PERIGOSOS",
    explanation: "Produtos contendo mercúrio são PROIBIDOS por serem altamente tóxicos."
  },
  {
    id: "19",
    question: "Drones de brinquedo são:",
    options: ["Sempre proibidos", "Permitidos se pequenos", "Restritos", "Permitidos sem câmera"],
    correctAnswer: 1,
    category: "DRONES",
    explanation: "Drones de brinquedo pequenos (até 250g) são PERMITIDOS, acima disso são restritos."
  },
  {
    id: "20",
    question: "Qual é o limite de voltagem para produtos eletrônicos?",
    options: ["110V", "220V", "Não há limite específico", "Depende do produto"],
    correctAnswer: 3,
    category: "ELETRÔNICOS",
    explanation: "O limite de voltagem DEPENDE DO PRODUTO específico e suas certificações de segurança."
  }
];

export const getRandomQuestions = (count: number = 10): QuizQuestion[] => {
  const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
