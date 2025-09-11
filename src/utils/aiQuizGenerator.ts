import PoliticasShopee from '@/data/PoliticasShopee.json';
import { quizQuestions, getRandomQuestions } from '@/data/quizQuestions';
import { generateQuizWithGemini } from '@/services/geminiQuizService';

export interface AIQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isAIGenerated?: boolean;
}

// Função para gerar perguntas combinando pré-prontas e IA (Gemini 2.5 Pro)
export const generateAIQuizQuestions = async (count: number = 10, difficulty: 'easy' | 'medium' | 'hard' = 'medium', usedIds: Set<string> = new Set()): Promise<AIQuizQuestion[]> => {
  const questions: AIQuizQuestion[] = [];
  
  // Dividir entre perguntas pré-prontas (40%) e Gemini 2.5 Pro (60%)
  const preBuiltCount = Math.floor(count * 0.4);
  const geminiCount = count - preBuiltCount;
  
  try {
    // Filtrar perguntas pré-prontas que não foram usadas
    const availablePreBuilt = getRandomQuestions(preBuiltCount * 3) // Buscar mais para ter opções
      .filter(q => !usedIds.has(`pre-${q.id}`));
    
    // Selecionar apenas as necessárias
    const selectedPreBuilt = availablePreBuilt.slice(0, preBuiltCount);
    
    selectedPreBuilt.forEach((q, index) => {
      const questionId = `pre-${q.id}`;
      questions.push({
        id: questionId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        category: q.category,
        explanation: q.explanation,
        difficulty: difficulty
      });
    });
    
    // Gerar perguntas com Gemini 2.5 Pro (sempre únicas por serem geradas dinamicamente)
    const geminiQuestions = await generateQuizWithGemini(geminiCount, difficulty);
    
    // Adicionar timestamp para garantir IDs únicos do Gemini
    const uniqueGeminiQuestions = geminiQuestions.map((q, index) => ({
      ...q,
      id: `gemini-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
    }));
    
    questions.push(...uniqueGeminiQuestions);
    
  } catch (error) {
    console.error('Erro ao gerar perguntas com Gemini:', error);
    
    // Fallback: usar apenas perguntas pré-prontas não usadas se Gemini falhar
    const availableFallback = getRandomQuestions(count * 2)
      .filter(q => !usedIds.has(`fallback-${q.id}`));
    
    const selectedFallback = availableFallback.slice(0, count);
    
    return selectedFallback.map((q, index) => ({
      id: `fallback-${q.id}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      category: q.category,
      explanation: q.explanation,
      difficulty: difficulty
    }));
  }

  // Embaralhar todas as perguntas
  return shuffleArray(questions);
};

const generateQuestionFromCategory = (category: any, index: number): AIQuizQuestion | null => {
  const content = category.conteudo;
  
  // Extrair exemplos proibidos e permitidos
  const prohibitedMatch = content.match(/Exemplos de itens proibidos:(.*?)(?=Exemplos de itens permitidos|$)/s);
  const allowedMatch = content.match(/Exemplos de itens permitidos:(.*?)(?=Exemplos de itens|$)/s);
  
  if (!prohibitedMatch && !allowedMatch) return null;

  const prohibitedItems = prohibitedMatch ? extractItems(prohibitedMatch[1]) : [];
  const allowedItems = allowedMatch ? extractItems(allowedMatch[1]) : [];

  // Tipos de perguntas possíveis
  const questionTypes = [
    'prohibited_identification',
    'allowed_identification', 
    'category_classification',
    'policy_understanding',
    'comparison_question'
  ];

  const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
  
  return generateQuestionByType(questionType, category, prohibitedItems, allowedItems, index);
};

const extractItems = (text: string): string[] => {
  return text
    .split(/[;\n]/)
    .map(item => item.trim())
    .filter(item => item.length > 3 && !item.includes('----------------'))
    .slice(0, 8); // Limitar a 8 itens por categoria
};

const generateQuestionByType = (
  type: string, 
  category: any, 
  prohibited: string[], 
  allowed: string[], 
  index: number
): AIQuizQuestion => {
  const categoryName = category.nome.replace(/^\d+\.?\s*/, '');
  
  switch (type) {
    case 'prohibited_identification':
      return generateNeutralQuestion(categoryName, prohibited, allowed, index);
    
    case 'allowed_identification':
      return generateNeutralQuestion(categoryName, prohibited, allowed, index);
    
    case 'category_classification':
      return generateCategoryQuestion(categoryName, prohibited, allowed, index);
    
    case 'policy_understanding':
      return generatePolicyQuestion(categoryName, category.conteudo, index);
    
    default:
      return generateComparisonQuestion(categoryName, prohibited, allowed, index);
  }
};

const generateNeutralQuestion = (
  categoryName: string, 
  prohibited: string[], 
  allowed: string[], 
  index: number
): AIQuizQuestion => {
  // Criar perguntas neutras sobre especificações técnicas e limites
  const neutralQuestions = [
    {
      question: `Qual é o limite de decibéis para alarmes pessoais?`,
      options: ['100dB', '120dB', '140dB', 'Não há limite'],
      correctAnswer: 2,
      explanation: 'Alarmes pessoais devem ter no máximo 140dB para serem considerados seguros.'
    },
    {
      question: `Qual dos seguintes itens é PERMITIDO na categoria "${categoryName}"?`,
      options: [],
      correctAnswer: 0,
      explanation: ''
    },
    {
      question: `Qual é a concentração máxima de álcool permitida em produtos de limpeza?`,
      options: ['50%', '70%', '80%', '90%'],
      correctAnswer: 1,
      explanation: 'Produtos com concentração alcoólica superior a 70% requerem documentação especial.'
    },
    {
      question: `Qual é o tamanho máximo permitido para facas de cozinha?`,
      options: ['20cm', '25cm', '30cm', '35cm'],
      correctAnswer: 2,
      explanation: 'Facas com lâmina superior a 30cm são consideradas armas brancas.'
    }
  ];

  // Se temos itens disponíveis, criar pergunta específica da categoria
  if (allowed.length > 0 || prohibited.length > 0) {
    const allItems = [...allowed, ...prohibited];
    if (allItems.length >= 4) {
      const correctItem = allowed.length > 0 ? 
        allowed[Math.floor(Math.random() * allowed.length)] :
        prohibited[Math.floor(Math.random() * prohibited.length)];
      
      const wrongOptions = allItems
        .filter(item => item !== correctItem)
        .slice(0, 3);
      
      const options = shuffleArray([correctItem, ...wrongOptions]);
      const correctAnswer = options.indexOf(correctItem);
      
      return {
        id: `ai-q-${index + 1}`,
        question: `Qual dos seguintes itens é PERMITIDO na categoria "${categoryName}"?`,
        options,
        correctAnswer,
        category: categoryName,
        explanation: allowed.includes(correctItem) ? 
          `${correctItem} está em conformidade com as políticas da Shopee.` :
          `${correctItem} não é permitido nesta categoria.`,
        difficulty: 'medium'
      };
    }
  }

  // Usar pergunta neutra padrão
  const selectedQ = neutralQuestions[Math.floor(Math.random() * (neutralQuestions.length - 1))];
  
  return {
    id: `ai-q-${index + 1}`,
    question: selectedQ.question,
    options: selectedQ.options,
    correctAnswer: selectedQ.correctAnswer,
    category: categoryName,
    explanation: selectedQ.explanation,
    difficulty: 'medium'
  };
};

const generateProhibitedQuestion = (
  categoryName: string, 
  prohibited: string[], 
  allowed: string[], 
  index: number
): AIQuizQuestion => {
  return generateNeutralQuestion(categoryName, prohibited, allowed, index);
};

const generateAllowedQuestion = (
  categoryName: string, 
  prohibited: string[], 
  allowed: string[], 
  index: number
): AIQuizQuestion => {
  return generateNeutralQuestion(categoryName, prohibited, allowed, index);
};

const generateCategoryQuestion = (
  categoryName: string, 
  prohibited: string[], 
  allowed: string[], 
  index: number
): AIQuizQuestion => {
  const allItems = [...prohibited, ...allowed];
  if (allItems.length === 0) return generatePolicyQuestion(categoryName, '', index);

  const correctItem = allItems[Math.floor(Math.random() * allItems.length)];
  const wrongCategories = getRandomCategoryNames(3).filter(cat => cat !== categoryName);

  const options = shuffleArray([categoryName, ...wrongCategories]);
  const correctAnswer = options.indexOf(categoryName);

  return {
    id: `ai-q-${index + 1}`,
    question: `Em qual categoria se enquadra o produto "${correctItem}"?`,
    options,
    correctAnswer,
    category: categoryName,
    explanation: `${correctItem} se enquadra nesta categoria conforme as diretrizes da Shopee.`,
    difficulty: 'hard'
  };
};

const generatePolicyQuestion = (
  categoryName: string, 
  content: string, 
  index: number
): AIQuizQuestion => {
  const policyQuestions = [
    {
      question: `Qual é o limite de tamanho para facas de cozinha?`,
      options: [
        '20cm',
        '25cm', 
        '30cm',
        '35cm'
      ],
      correctAnswer: 2,
      explanation: `Facas com lâmina superior a 30cm são consideradas armas brancas e não são permitidas.`
    },
    {
      question: `Qual concentração máxima de álcool é permitida em produtos de limpeza?`,
      options: [
        '50%',
        '70%',
        '80%',
        '90%'
      ],
      correctAnswer: 1,
      explanation: `Produtos com concentração alcoólica superior a 70% requerem documentação especial.`
    },
    {
      question: `Qual é a potência máxima permitida para lasers em produtos eletrônicos?`,
      options: [
        'Classe 1',
        'Classe 2',
        'Classe 3A',
        'Classe 3B'
      ],
      correctAnswer: 0,
      explanation: `Apenas lasers Classe 1 são permitidos em produtos de consumo geral por questões de segurança.`
    }
  ];

  const selectedQ = policyQuestions[Math.floor(Math.random() * policyQuestions.length)];

  return {
    id: `ai-q-${index + 1}`,
    question: selectedQ.question,
    options: selectedQ.options,
    correctAnswer: selectedQ.correctAnswer,
    category: categoryName,
    explanation: selectedQ.explanation,
    difficulty: 'easy'
  };
};

const generateComparisonQuestion = (
  categoryName: string, 
  prohibited: string[], 
  allowed: string[], 
  index: number
): AIQuizQuestion => {
  if (prohibited.length === 0 || allowed.length === 0) {
    return generatePolicyQuestion(categoryName, '', index);
  }

  // Criar pergunta neutra sobre limites ou especificações
  const neutralQuestions = [
    {
      question: `Qual é o limite de decibéis para alarmes pessoais?`,
      options: ['100dB', '120dB', '140dB', 'Não há limite'],
      correctAnswer: 2,
      explanation: 'Alarmes pessoais devem ter no máximo 140dB para serem considerados seguros.'
    },
    {
      question: `Qual é a voltagem máxima permitida para dispositivos eletrônicos portáteis?`,
      options: ['12V', '24V', '48V', '110V'],
      correctAnswer: 1,
      explanation: 'Dispositivos portáteis devem operar com no máximo 24V para segurança do usuário.'
    },
    {
      question: `Qual é o peso máximo permitido para produtos da categoria "${categoryName}"?`,
      options: ['1kg', '2kg', '5kg', 'Sem limite específico'],
      correctAnswer: 3,
      explanation: 'Esta categoria não possui limite específico de peso, mas deve seguir regulamentações de transporte.'
    }
  ];

  const selectedQ = neutralQuestions[Math.floor(Math.random() * neutralQuestions.length)];

  return {
    id: `ai-q-${index + 1}`,
    question: selectedQ.question,
    options: selectedQ.options,
    correctAnswer: selectedQ.correctAnswer,
    category: categoryName,
    explanation: selectedQ.explanation,
    difficulty: 'medium'
  };
};

// Funções auxiliares
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getRandomAllowedFromOtherCategories = (count: number): string[] => {
  const otherCategories = (PoliticasShopee as any).categorias.filter((cat: any) => 
    cat.conteudo && cat.conteudo.includes('Exemplos de itens permitidos')
  );
  
  const items: string[] = [];
  for (let i = 0; i < count && i < otherCategories.length; i++) {
    const category = otherCategories[Math.floor(Math.random() * otherCategories.length)];
    const allowedMatch = category.conteudo.match(/Exemplos de itens permitidos:(.*?)(?=Exemplos|$)/s);
    if (allowedMatch) {
      const allowedItems = extractItems(allowedMatch[1]);
      if (allowedItems.length > 0) {
        items.push(allowedItems[Math.floor(Math.random() * allowedItems.length)]);
      }
    }
  }
  return items;
};

const getRandomProhibitedFromOtherCategories = (count: number): string[] => {
  const otherCategories = (PoliticasShopee as any).categorias.filter((cat: any) => 
    cat.conteudo && cat.conteudo.includes('Exemplos de itens proibidos')
  );
  
  const items: string[] = [];
  for (let i = 0; i < count && i < otherCategories.length; i++) {
    const category = otherCategories[Math.floor(Math.random() * otherCategories.length)];
    const prohibitedMatch = category.conteudo.match(/Exemplos de itens proibidos:(.*?)(?=Exemplos|$)/s);
    if (prohibitedMatch) {
      const prohibitedItems = extractItems(prohibitedMatch[1]);
      if (prohibitedItems.length > 0) {
        items.push(prohibitedItems[Math.floor(Math.random() * prohibitedItems.length)]);
      }
    }
  }
  return items;
};

const getRandomCategoryNames = (count: number): string[] => {
  const categories = (PoliticasShopee as any).categorias
    .filter((cat: any) => cat.nome && !cat.nome.includes('----------------'))
    .map((cat: any) => cat.nome.replace(/^\d+\.?\s*/, ''))
    .slice(0, 20); // Pegar apenas as primeiras 20 categorias válidas
  
  const selected: string[] = [];
  for (let i = 0; i < count && i < categories.length; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    if (!selected.includes(randomCategory)) {
      selected.push(randomCategory);
    }
  }
  return selected;
};
