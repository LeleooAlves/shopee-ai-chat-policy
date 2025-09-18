import { GoogleGenerativeAI } from '@google/generative-ai';
import politicasData from '../data/PoliticasShopee.json';

const API_KEY = 'AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE';
const genAI = new GoogleGenerativeAI(API_KEY);

// Lista de modelos para quiz em ordem de preferência
const QUIZ_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash', 
  'gemini-2.5-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

// Contador para alternância de modelos do quiz
let quizModelIndex = 0;

// Função para obter o próximo modelo do quiz
function getNextQuizModel(): string {
  const model = QUIZ_MODELS[quizModelIndex % QUIZ_MODELS.length];
  quizModelIndex++;
  console.log(`Usando modelo para quiz: ${model} (index: ${quizModelIndex - 1})`);
  return model;
}

const QUIZ_SYSTEM_INSTRUCTION = `Você é um especialista em políticas da Shopee responsável por criar perguntas de quiz educativas.

OBJETIVO: Criar perguntas técnicas e neutras sobre limites, especificações e regulamentações da Shopee.

FORMATO OBRIGATÓRIO DAS PERGUNTAS:
- Perguntas sobre limites técnicos específicos (decibéis, voltagem, tamanho, concentração, etc.)
- Alternativas com valores numéricos ou classificações técnicas
- EVITAR alternativas que induzem a resposta (como "Não há limite", "Todos são permitidos")
- Todas as alternativas devem ser tecnicamente plausíveis

EXEMPLOS DE PERGUNTAS CORRETAS:
1. "Qual é o limite de decibéis para alarmes pessoais?"
   - 100dB / 120dB / 140dB / 160dB

2. "Qual é o tamanho máximo permitido para facas de cozinha?"
   - 20cm / 25cm / 30cm / 35cm

3. "Qual concentração máxima de álcool é permitida em produtos de limpeza?"
   - 50% / 70% / 80% / 90%

4. "Qual é a potência máxima para lasers em produtos eletrônicos?"
   - Classe 1 / Classe 2 / Classe 3A / Classe 3B

EVITAR PERGUNTAS COMO:
- "Qual item é PROIBIDO?" (induz resposta)
- "Qual item é PERMITIDO?" (induz resposta)
- Alternativas óbvias como "Não há limite" ou "Todos são permitidos"

CATEGORIAS PARA FOCAR:
- Segurança (alarmes, dispositivos de proteção)
- Eletrônicos (voltagem, potência, classificações)
- Cuidados com a pele (concentrações, ingredientes)
- Utensílios domésticos (tamanhos, materiais)
- Ferramentas (especificações técnicas)
- Bebidas e alimentos (percentuais, aditivos)`;

function createQuizModel(modelName: string) {
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: QUIZ_SYSTEM_INSTRUCTION,
  });
}

// Função auxiliar para delay no quiz
function delayQuiz(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para gerar conteúdo com fallback para quiz
async function generateQuizWithFallback(prompt: string, retryCount: number = 0): Promise<any> {
  const selectedModel = getNextQuizModel();
  
  try {
    const model = createQuizModel(selectedModel);
    const result = await model.generateContent(prompt);
    return await result.response;
  } catch (error: any) {
    console.error(`Erro com modelo de quiz ${selectedModel} (tentativa ${retryCount + 1}):`, error);
    
    const isRetryableError = 
      error?.message?.includes('503') || 
      error?.message?.includes('overloaded') ||
      error?.message?.includes('Service Unavailable') ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('429');
    
    if (isRetryableError && retryCount < 3) {
      const delayTime = 1500 * Math.pow(1.3, retryCount);
      console.log(`Modelo ${selectedModel} sobrecarregado. Tentando próximo modelo após ${delayTime}ms...`);
      await delayQuiz(delayTime);
      return generateQuizWithFallback(prompt, retryCount + 1);
    }
    
    throw error;
  }
}

export interface AIQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const generateQuizWithGemini = async (count: number = 5, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<AIQuizQuestion[]> => {
  try {
    
    // Preparar contexto das políticas
    const politicasTexto = politicasData.categorias
      .map(categoria => `${categoria.nome}\n${categoria.conteudo}`)
      .join('\n\n');

    const difficultyInstructions = {
      easy: 'Perguntas básicas sobre conceitos fundamentais das políticas, com alternativas mais distintas.',
      medium: 'Perguntas sobre especificações técnicas e limites específicos, com alternativas moderadamente próximas.',
      hard: 'Perguntas complexas sobre casos específicos e nuances das políticas, com alternativas muito próximas que exigem conhecimento detalhado.'
    };

    const prompt = `POLÍTICAS DA SHOPEE:
${politicasTexto}

TAREFA: Criar ${count} perguntas de quiz técnicas e neutras baseadas nas políticas acima.

NÍVEL DE DIFICULDADE: ${difficulty.toUpperCase()}
${difficultyInstructions[difficulty]}

REQUISITOS OBRIGATÓRIOS:
1. Cada pergunta deve ser sobre limites técnicos específicos (números, classificações, especificações)
2. 4 alternativas por pergunta, todas tecnicamente plausíveis
3. EVITAR alternativas que induzem a resposta
4. Focar em conhecimento técnico real das políticas
5. Variar as categorias (segurança, eletrônicos, cuidados pessoais, etc.)
6. Ajustar complexidade conforme o nível de dificuldade selecionado

FORMATO DE SAÍDA (JSON):
{
  "questions": [
    {
      "question": "Qual é o limite de decibéis para alarmes pessoais?",
      "options": ["100dB", "120dB", "140dB", "160dB"],
      "correctAnswer": 2,
      "category": "SEGURANÇA",
      "explanation": "Alarmes pessoais devem ter no máximo 140dB para serem considerados seguros segundo as políticas da Shopee.",
      "difficulty": "medium"
    }
  ]
}

IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional.`;

    const response = await generateQuizWithFallback(prompt);
    let text = response.text();

    // Limpar possível markdown do JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const jsonResponse = JSON.parse(text);
      const questions = jsonResponse.questions || [];

      return questions.map((q: any, index: number) => ({
        id: `gemini-q-${Date.now()}-${index}`,
        question: q.question || `Pergunta ${index + 1}`,
        options: q.options || ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        correctAnswer: q.correctAnswer || 0,
        category: q.category || 'GERAL',
        explanation: q.explanation || 'Explicação não disponível.',
        difficulty: difficulty
      }));

    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      console.log('Resposta recebida:', text);
      
      // Fallback para perguntas pré-definidas se o JSON falhar
      return getFallbackQuestions(count, difficulty);
    }

  } catch (error) {
    console.error('Erro ao gerar quiz com Gemini:', error);
    return getFallbackQuestions(count, difficulty);
  }
};

// Perguntas de fallback caso a IA falhe
const getFallbackQuestions = (count: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): AIQuizQuestion[] => {
  const fallbackQuestions = [
    {
      id: 'fallback-1',
      question: 'Qual é o limite de decibéis para alarmes pessoais?',
      options: ['100dB', '120dB', '140dB', '160dB'],
      correctAnswer: 2,
      category: 'SEGURANÇA',
      explanation: 'Alarmes pessoais devem ter no máximo 140dB para serem considerados seguros.',
      difficulty: difficulty
    },
    {
      id: 'fallback-2',
      question: 'Qual é o tamanho máximo permitido para facas de cozinha?',
      options: ['20cm', '25cm', '30cm', '35cm'],
      correctAnswer: 2,
      category: 'UTENSÍLIOS DOMÉSTICOS',
      explanation: 'Facas com lâmina superior a 30cm são consideradas armas brancas.',
      difficulty: difficulty
    },
    {
      id: 'fallback-3',
      question: 'Qual concentração máxima de álcool é permitida em produtos de limpeza?',
      options: ['50%', '70%', '80%', '90%'],
      correctAnswer: 1,
      category: 'PRODUTOS DE LIMPEZA',
      explanation: 'Produtos com concentração alcoólica superior a 70% requerem documentação especial.',
      difficulty: difficulty
    },
    {
      id: 'fallback-4',
      question: 'Qual é a potência máxima permitida para lasers em produtos eletrônicos?',
      options: ['Classe 1', 'Classe 2', 'Classe 3A', 'Classe 3B'],
      correctAnswer: 0,
      category: 'ELETRÔNICOS',
      explanation: 'Apenas lasers Classe 1 são permitidos em produtos de consumo geral por questões de segurança.',
      difficulty: difficulty
    },
    {
      id: 'fallback-5',
      question: 'Qual é a voltagem máxima para dispositivos eletrônicos portáteis?',
      options: ['12V', '24V', '48V', '110V'],
      correctAnswer: 1,
      category: 'ELETRÔNICOS',
      explanation: 'Dispositivos portáteis devem operar com no máximo 24V para segurança do usuário.',
      difficulty: difficulty
    }
  ];

  return fallbackQuestions.slice(0, count);
};

export default {
  generateQuizWithGemini,
  getFallbackQuestions
};
