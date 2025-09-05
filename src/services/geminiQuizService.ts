import { GoogleGenerativeAI } from '@google/generative-ai';
import politicasData from '../data/PoliticasShopee.json';

const API_KEY = 'AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE';
const genAI = new GoogleGenerativeAI(API_KEY);

// Usar Gemini 2.5 Pro especificamente para o quiz
const QUIZ_MODEL = 'gemini-2.5-pro';

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

function createQuizModel() {
  return genAI.getGenerativeModel({
    model: QUIZ_MODEL,
    systemInstruction: QUIZ_SYSTEM_INSTRUCTION,
  });
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
    const model = createQuizModel();
    
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
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
