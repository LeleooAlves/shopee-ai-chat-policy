import PoliticasShopee from '@/data/PoliticasShopee.json';
import { quizQuestions, getRandomQuestions } from '@/data/quizQuestions';

export interface AIQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Função para gerar perguntas combinando pré-prontas e IA
export const generateAIQuizQuestions = (count: number = 10): AIQuizQuestion[] => {
  const questions: AIQuizQuestion[] = [];
  const usedCategories = new Set<string>();
  
  // Combinar perguntas pré-prontas com geradas por IA (50/50)
  const halfCount = Math.floor(count / 2);
  const remainingCount = count - halfCount;
  
  // Adicionar perguntas pré-prontas
  const preBuiltQuestions = getRandomQuestions(halfCount);
  preBuiltQuestions.forEach((q, index) => {
    questions.push({
      id: `pre-${q.id}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      category: q.category,
      explanation: q.explanation,
      difficulty: 'medium' as const
    });
  });
  
  // Filtrar categorias válidas (com conteúdo substantivo)
  const validCategories = (PoliticasShopee as any).categorias.filter((cat: any) => 
    cat.conteudo && 
    cat.conteudo.length > 100 && 
    !cat.conteudo.includes('--------------------------------------------------------------------------------') &&
    cat.conteudo.includes('Exemplos de itens')
  );

  // Gerar perguntas por IA para completar
  for (let i = 0; i < remainingCount; i++) {
    let selectedCategory;
    let attempts = 0;
    do {
      selectedCategory = validCategories[Math.floor(Math.random() * validCategories.length)];
      attempts++;
    } while (usedCategories.has(selectedCategory.nome) && attempts < 20);
    
    if (attempts < 20) {
      usedCategories.add(selectedCategory.nome);
    }

    const question = generateQuestionFromCategory(selectedCategory, halfCount + i);
    if (question) {
      questions.push(question);
    }
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
      return generateProhibitedQuestion(categoryName, prohibited, allowed, index);
    
    case 'allowed_identification':
      return generateAllowedQuestion(categoryName, prohibited, allowed, index);
    
    case 'category_classification':
      return generateCategoryQuestion(categoryName, prohibited, allowed, index);
    
    case 'policy_understanding':
      return generatePolicyQuestion(categoryName, category.conteudo, index);
    
    default:
      return generateComparisonQuestion(categoryName, prohibited, allowed, index);
  }
};

const generateProhibitedQuestion = (
  categoryName: string, 
  prohibited: string[], 
  allowed: string[], 
  index: number
): AIQuizQuestion => {
  if (prohibited.length === 0) {
    return generateAllowedQuestion(categoryName, prohibited, allowed, index);
  }

  const correctItem = prohibited[Math.floor(Math.random() * prohibited.length)];
  const wrongOptions = [
    ...allowed.slice(0, 2),
    ...getRandomAllowedFromOtherCategories(1)
  ].filter(Boolean).slice(0, 3);

  const options = shuffleArray([correctItem, ...wrongOptions]);
  const correctAnswer = options.indexOf(correctItem);

  return {
    id: `ai-q-${index + 1}`,
    question: `Qual dos seguintes itens é PROIBIDO na categoria "${categoryName}"?`,
    options,
    correctAnswer,
    category: categoryName,
    explanation: `${correctItem} não é permitido nesta categoria segundo as políticas da Shopee.`,
    difficulty: 'medium'
  };
};

const generateAllowedQuestion = (
  categoryName: string, 
  prohibited: string[], 
  allowed: string[], 
  index: number
): AIQuizQuestion => {
  if (allowed.length === 0) {
    return generateProhibitedQuestion(categoryName, prohibited, allowed, index);
  }

  const correctItem = allowed[Math.floor(Math.random() * allowed.length)];
  const wrongOptions = [
    ...prohibited.slice(0, 2),
    ...getRandomProhibitedFromOtherCategories(1)
  ].filter(Boolean).slice(0, 3);

  const options = shuffleArray([correctItem, ...wrongOptions]);
  const correctAnswer = options.indexOf(correctItem);

  return {
    id: `ai-q-${index + 1}`,
    question: `Qual dos seguintes itens é PERMITIDO na categoria "${categoryName}"?`,
    options,
    correctAnswer,
    category: categoryName,
    explanation: `${correctItem} está em conformidade com as políticas da Shopee para esta categoria.`,
    difficulty: 'medium'
  };
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
      question: `Segundo as políticas da Shopee, qual é a regra principal para produtos da categoria "${categoryName}"?`,
      options: [
        'Todos os produtos são permitidos sem restrições',
        'Produtos devem seguir regulamentações específicas da categoria',
        'Apenas produtos importados são permitidos',
        'Somente produtos com certificação internacional'
      ],
      correctAnswer: 1,
      explanation: `Esta categoria requer conformidade com regulamentações específicas da Shopee.`
    },
    {
      question: `Na categoria "${categoryName}", qual é o critério mais importante para determinar se um produto é permitido?`,
      options: [
        'Preço do produto',
        'Marca do fabricante',
        'Conformidade com as políticas de segurança e regulamentação',
        'Popularidade do produto'
      ],
      correctAnswer: 2,
      explanation: `A conformidade com diretrizes de segurança é fundamental para aprovação de produtos.`
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

  const prohibitedItem = prohibited[Math.floor(Math.random() * prohibited.length)];
  const allowedItem = allowed[Math.floor(Math.random() * allowed.length)];

  const options = shuffleArray([
    `${prohibitedItem} é proibido e ${allowedItem} é permitido`,
    `${prohibitedItem} é permitido e ${allowedItem} é proibido`,
    `Ambos são proibidos`,
    `Ambos são permitidos`
  ]);

  const correctAnswer = options.indexOf(`${prohibitedItem} é proibido e ${allowedItem} é permitido`);

  return {
    id: `ai-q-${index + 1}`,
    question: `Na categoria "${categoryName}", qual é a classificação correta para estes produtos?`,
    options,
    correctAnswer,
    category: categoryName,
    explanation: `${prohibitedItem} não atende aos critérios enquanto ${allowedItem} está em conformidade com as políticas.`,
    difficulty: 'hard'
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
