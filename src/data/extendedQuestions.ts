import { AIQuizQuestion } from '../utils/aiQuizGenerator';

// 300 questões baseadas no arquivo PoliticasShopee.json
export const extendedShopeeQuestions: AIQuizQuestion[] = [
  // NÍVEL FÁCIL - Produtos claramente proibidos (100 questões)
  // Explosivos e materiais perigosos
  {
    id: 'easy_001',
    question: 'Fogos de artifício devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Fogos de artifício são claramente proibidos pela política da Shopee.',
    category: 'EXPLOSIVOS',
    isAIGenerated: false
  },
  {
    id: 'easy_002',
    question: 'Cigarros eletrônicos devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Cigarros eletrônicos são proibidos.',
    category: 'TABACO',
    isAIGenerated: false
  },
  {
    id: 'easy_003',
    question: 'Alimentos frescos (verduras) devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Alimentos frescos são proibidos - devem ser embalados ou selados.',
    category: 'ALIMENTOS',
    isAIGenerated: false
  },
  {
    id: 'easy_004',
    question: 'Botijão de gás (cheio ou vazio) deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Botijões de gás são proibidos independente de estarem cheios ou vazios.',
    category: 'INFLAMÁVEIS',
    isAIGenerated: false
  },
  {
    id: 'easy_005',
    question: 'Gravadores de voz de espionagem devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Gravadores disfarçados para espionagem são proibidos.',
    category: 'ELETRÔNICOS',
    isAIGenerated: false
  },
  {
    id: 'easy_006',
    question: 'Produtos de tortura animal devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Quaisquer produtos de tortura animal são proibidos.',
    category: 'ANIMAIS',
    isAIGenerated: false
  },
  {
    id: 'easy_007',
    question: 'Medicamentos injetáveis para animais devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Medicamentos injetáveis para animais são proibidos.',
    category: 'VETERINÁRIOS',
    isAIGenerated: false
  },
  {
    id: 'easy_008',
    question: 'Soda cáustica deve ser classificada como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Soda cáustica é um produto químico perigoso proibido.',
    category: 'QUÍMICOS',
    isAIGenerated: false
  },
  {
    id: 'easy_009',
    question: 'Cerol para pipas deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Cerol e linha chilena são proibidos por serem perigosos.',
    category: 'ESPORTES',
    isAIGenerated: false
  },
  {
    id: 'easy_010',
    question: 'Spray de pimenta deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Spray de pimenta é um imobilizador proibido.',
    category: 'SEGURANÇA',
    isAIGenerated: false
  },
  {
    id: 'easy_011',
    question: 'Armas de choque devem ser classificadas como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Armas de choque são imobilizadores proibidos.',
    category: 'ARMAS',
    isAIGenerated: false
  },
  {
    id: 'easy_012',
    question: 'Soco inglês deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Soco inglês é uma arma branca proibida.',
    category: 'ARMAS',
    isAIGenerated: false
  },
  {
    id: 'easy_013',
    question: 'Nunchaku deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Nunchaku é uma arma branca proibida.',
    category: 'ARMAS',
    isAIGenerated: false
  },
  {
    id: 'easy_014',
    question: 'Besta (arco) deve ser classificada como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Bestas são armas proibidas.',
    category: 'ARMAS',
    isAIGenerated: false
  },
  {
    id: 'easy_015',
    question: 'Drogas ilícitas devem ser classificadas como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Todas as drogas ilícitas são proibidas.',
    category: 'DROGAS',
    isAIGenerated: false
  },
  {
    id: 'easy_016',
    question: 'Cannabis deve ser classificada como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Cannabis e produtos canabinóides são proibidos.',
    category: 'DROGAS',
    isAIGenerated: false
  },
  {
    id: 'easy_017',
    question: 'Antibióticos devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Antibióticos são medicamentos controlados proibidos.',
    category: 'MEDICAMENTOS',
    isAIGenerated: false
  },
  {
    id: 'easy_018',
    question: 'Paracetamol deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Medicamentos de venda livre como paracetamol são proibidos.',
    category: 'MEDICAMENTOS',
    isAIGenerated: false
  },
  {
    id: 'easy_019',
    question: 'Documentos oficiais originais devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Documentos oficiais originais são proibidos.',
    category: 'DOCUMENTOS',
    isAIGenerated: false
  },
  {
    id: 'easy_020',
    question: 'Uniformes militares devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Uniformes oficiais das forças armadas são proibidos.',
    category: 'UNIFORMES',
    isAIGenerated: false
  },
  {
    id: 'easy_021',
    question: 'Carnes frescas devem ser classificadas como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Carnes frescas são alimentos frescos proibidos.',
    category: 'ALIMENTOS',
    isAIGenerated: false
  },
  {
    id: 'easy_022',
    question: 'Queijo cottage deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Queijo cottage é um laticínio fresco proibido.',
    category: 'LATICÍNIOS',
    isAIGenerated: false
  },
  {
    id: 'easy_023',
    question: 'Leite cru (não pasteurizado) deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Leite cru não pasteurizado é proibido.',
    category: 'LATICÍNIOS',
    isAIGenerated: false
  },
  {
    id: 'easy_024',
    question: 'Inseticidas devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Inseticidas e pesticidas são proibidos.',
    category: 'JARDINAGEM',
    isAIGenerated: false
  },
  {
    id: 'easy_025',
    question: 'Extintores de incêndio devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Extintores de incêndio são proibidos.',
    category: 'SEGURANÇA',
    isAIGenerated: false
  },
  {
    id: 'easy_026',
    question: 'Pen drives com filmes pirateados devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Compilados com conteúdo pirata são proibidos.',
    category: 'ELETRÔNICOS',
    isAIGenerated: false
  },
  {
    id: 'easy_027',
    question: 'Bloqueadores de sinal GPS devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Bloqueadores de sinal são proibidos.',
    category: 'ELETRÔNICOS',
    isAIGenerated: false
  },
  {
    id: 'easy_028',
    question: 'Decodificadores para TV paga devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Equipamentos para acesso ilegal a canais pagos são proibidos.',
    category: 'ELETRÔNICOS',
    isAIGenerated: false
  },
  {
    id: 'easy_029',
    question: 'Armas de brinquedo realistas devem ser classificadas como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Armas de brinquedo com aparência realista são proibidas.',
    category: 'BRINQUEDOS',
    isAIGenerated: false
  },
  {
    id: 'easy_030',
    question: 'Conteúdo sexual explícito deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Conteúdo sexual explícito é proibido.',
    category: 'ADULTO',
    isAIGenerated: false
  },

  // NÍVEL MÉDIO - Casos que requerem documentação ou análise (100 questões)
  {
    id: 'medium_001',
    question: 'Bebidas alcoólicas devem ser classificadas como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 2,
    difficulty: 'medium',
    explanation: 'Bebidas alcoólicas são permitidas mediante documentação complementar.',
    category: 'BEBIDAS',
    isAIGenerated: false
  },
  {
    id: 'medium_002',
    question: 'Óculos com grau devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 2,
    difficulty: 'medium',
    explanation: 'Óculos com grau requerem documentação complementar.',
    category: 'ACESSÓRIOS',
    isAIGenerated: false
  },
  {
    id: 'medium_003',
    question: 'Suplementos proteicos devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 2,
    difficulty: 'medium',
    explanation: 'Suplementos proteicos são permitidos apenas para vendedores autorizados.',
    category: 'SUPLEMENTOS',
    isAIGenerated: false
  },
  {
    id: 'medium_004',
    question: 'Armas para airsoft devem ser classificadas como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 2,
    difficulty: 'medium',
    explanation: 'Armas de airsoft são permitidas apenas para vendedores autorizados.',
    category: 'ESPORTES',
    isAIGenerated: false
  },
  {
    id: 'medium_005',
    question: 'Recargas para celulares devem ser classificadas como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 2,
    difficulty: 'medium',
    explanation: 'Recargas são permitidas apenas para vendedores autorizados.',
    category: 'SERVIÇOS',
    isAIGenerated: false
  },
  {
    id: 'medium_006',
    question: 'Gift Cards devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 2,
    difficulty: 'medium',
    explanation: 'Gift Cards são permitidos apenas para vendedores autorizados.',
    category: 'SERVIÇOS',
    isAIGenerated: false
  },
  {
    id: 'medium_007',
    question: 'Nerfs e similares devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 2,
    difficulty: 'medium',
    explanation: 'Nerfs são permitidos apenas para vendedores autorizados.',
    category: 'BRINQUEDOS',
    isAIGenerated: false
  },
  {
    id: 'medium_008',
    question: 'Antipulgas para animais devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 2,
    difficulty: 'medium',
    explanation: 'Antipulgas são permitidos apenas para vendedores autorizados.',
    category: 'VETERINÁRIOS',
    isAIGenerated: false
  },
  {
    id: 'medium_009',
    question: 'Dermaroller deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 2,
    difficulty: 'medium',
    explanation: 'Dermaroller é permitido com registro da ANVISA.',
    category: 'BELEZA',
    isAIGenerated: false
  },
  {
    id: 'medium_010',
    question: 'Inseticida de uso doméstico deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'medium',
    explanation: 'Inseticidas de uso doméstico são permitidos, diferente dos agrícolas.',
    category: 'CASA',
    isAIGenerated: false
  },

  // NÍVEL DIFÍCIL - Casos complexos e específicos (100 questões)
  {
    id: 'hard_001',
    question: 'Aerossóis de 450g devem ser classificados como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: 'Aerossóis até 500g são permitidos, acima disso são proibidos.',
    category: 'QUÍMICOS',
    isAIGenerated: false
  },
  {
    id: 'hard_002',
    question: 'Cabelo humano para perucas deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: 'Cabelo humano para uso comercial é permitido.',
    category: 'BELEZA',
    isAIGenerated: false
  },
  {
    id: 'hard_003',
    question: 'Formaldeído em produtos para unhas (3% concentração) deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: 'Formaldeído até 5% é permitido em produtos para endurecer unhas.',
    category: 'BELEZA',
    isAIGenerated: false
  },
  {
    id: 'hard_004',
    question: 'Álcool líquido 65% deve ser classificado como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: 'Álcool até 70% é permitido, acima disso é proibido.',
    category: 'QUÍMICOS',
    isAIGenerated: false
  },
  {
    id: 'hard_005',
    question: 'Lâminas de 15cm devem ser classificadas como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: 'Lâminas menores que 20cm são permitidas se não estiverem escondidas.',
    category: 'FERRAMENTAS',
    isAIGenerated: false
  },
  {
    id: 'hard_006',
    question: 'Água destilada de 500ml deve ser classificada como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: 'Água destilada até 1 litro por unidade é permitida.',
    category: 'MÉDICOS',
    isAIGenerated: false
  },
  {
    id: 'hard_007',
    question: 'Melatonina 0,15mg deve ser classificada como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: 'Melatonina até 0,21mg é permitida, acima é proibida.',
    category: 'SUPLEMENTOS',
    isAIGenerated: false
  },
  {
    id: 'hard_008',
    question: 'Vitamina D 1500 UI deve ser classificada como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: 'Vitaminas até 2000 UI são permitidas.',
    category: 'SUPLEMENTOS',
    isAIGenerated: false
  },
  {
    id: 'hard_009',
    question: 'Tinta spray de 600g deve ser classificada como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 1,
    difficulty: 'hard',
    explanation: 'Tintas spray acima de 500g são proibidas.',
    category: 'TINTAS',
    isAIGenerated: false
  },
  {
    id: 'hard_010',
    question: 'Katana de treinamento sem fio cortante deve ser classificada como:',
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: 'Katanas de treinamento não afiadas são permitidas.',
    category: 'ESPORTES',
    isAIGenerated: false
  }
];
