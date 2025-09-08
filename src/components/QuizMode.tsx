import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Clock, Trophy, Target, Zap, CheckCircle, XCircle, RotateCcw, Play, User, X, List } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseService } from '../services/supabaseService';
import { UserInputModal } from './UserInputModal';
import { LeaderboardModal } from './LeaderboardModal';
// Definindo tipos localmente para evitar problemas de importação
interface AIQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  category?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  created_at: string;
  updated_at: string;
}

// Perguntas baseadas nas políticas da Shopee
const shopeeQuestions: AIQuizQuestion[] = [
  {
    id: 'q1',
    question: 'Uma faca de cozinha de 25cm da categoria "Utensílios Domésticos" deve ser considerada:',
    options: [
      'PERMITIDO',
      'PROIBIDO', 
      'RESTRITO',
      'DEPENDE'
    ],
    correctAnswer: 0,
    difficulty: 'medium',
    explanation: 'Facas de cozinha até 30cm são permitidas na Shopee quando vendidas como utensílios domésticos.',
    category: 'Utensílios e Ferramentas'
  },
  {
    id: 'q2',
    question: 'Bebida alcoólica artesanal da categoria "Bebidas" deve ser considerada:',
    options: [
      'PERMITIDO',
      'PROIBIDO',
      'RESTRITO',
      'DEPENDE'
    ],
    correctAnswer: 2,
    difficulty: 'hard',
    explanation: 'Bebidas alcoólicas são RESTRITAS, exigindo documentação complementar para venda.',
    category: 'Bebidas e Alimentos'
  },
  {
    id: 'q3',
    question: 'Suplemento alimentar sem registro na ANVISA da categoria "Saúde" deve ser considerado:',
    options: [
      'PERMITIDO',
      'PROIBIDO',
      'RESTRITO',
      'DEPENDE'
    ],
    correctAnswer: 1,
    difficulty: 'medium',
    explanation: 'Suplementos sem registro na ANVISA são PROIBIDOS na plataforma.',
    category: 'Saúde e Beleza'
  },
  {
    id: 'q4',
    question: 'Réplica de bolsa de marca famosa da categoria "Acessórios" deve ser considerada:',
    options: [
      'PERMITIDO',
      'PROIBIDO',
      'RESTRITO',
      'DEPENDE'
    ],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'Réplicas e produtos falsificados são estritamente PROIBIDOS na Shopee.',
    category: 'Moda e Acessórios'
  },
  {
    id: 'q5',
    question: 'Como a Shopee lida com disputas entre compradores e vendedores?',
    options: [
      'Sempre favorece o comprador',
      'Sistema de mediação imparcial analisando evidências',
      'Sempre favorece o vendedor',
      'Não intervém em disputas'
    ],
    correctAnswer: 1,
    difficulty: 'medium',
    explanation: 'A Shopee oferece sistema de resolução de disputas baseado em evidências.',
    category: 'Resolução de Disputas'
  },
  {
    id: 'q6',
    question: 'Quais informações pessoais são protegidas pela política de privacidade da Shopee?',
    options: [
      'Apenas dados de pagamento',
      'Nome, endereço, telefone, dados de pagamento e histórico de compras',
      'Apenas histórico de compras',
      'Nenhuma informação é protegida'
    ],
    correctAnswer: 1,
    difficulty: 'hard',
    explanation: 'A Shopee protege ampla gama de dados pessoais conforme legislação de privacidade.',
    category: 'Privacidade e Dados'
  },
  {
    id: 'q7',
    question: 'O que caracteriza spam na plataforma Shopee?',
    options: [
      'Apenas mensagens repetitivas',
      'Mensagens não solicitadas, repetitivas, irrelevantes ou promocionais excessivas',
      'Apenas links externos',
      'Somente mensagens automáticas'
    ],
    correctAnswer: 1,
    difficulty: 'medium',
    explanation: 'Spam inclui diversos tipos de comunicação inadequada que prejudicam a experiência do usuário.',
    category: 'Políticas de Comunicação'
  },
  {
    id: 'q8',
    question: 'Qual é a política da Shopee sobre produtos perigosos?',
    options: [
      'Produtos perigosos são permitidos com aviso',
      'Produtos perigosos são estritamente proibidos',
      'Apenas alguns produtos perigosos são permitidos',
      'Não há restrições'
    ],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: 'A Shopee proíbe produtos que possam causar danos à segurança dos usuários.',
    category: 'Segurança de Produtos'
  },
  {
    id: 'q9',
    question: 'Como funciona o sistema de proteção ao comprador da Shopee?',
    options: [
      'Não oferece proteção',
      'Garantia de reembolso para produtos não recebidos ou não conformes',
      'Proteção apenas para produtos caros',
      'Proteção apenas por 24 horas'
    ],
    correctAnswer: 1,
    difficulty: 'medium',
    explanation: 'A Shopee oferece Garantia Shopee que protege compradores em diversas situações.',
    category: 'Proteção ao Consumidor'
  },
  {
    id: 'q10',
    question: 'O que são práticas comerciais desleais na Shopee?',
    options: [
      'Apenas preços muito baixos',
      'Manipulação de preços, avaliações falsas, informações enganosas',
      'Apenas vendas em grande quantidade',
      'Somente produtos importados'
    ],
    correctAnswer: 1,
    difficulty: 'hard',
    explanation: 'Práticas desleais incluem qualquer comportamento que engane ou prejudique outros usuários.',
    category: 'Práticas Comerciais'
  }
];

// Produtos baseados EXCLUSIVAMENTE no PoliticasShopee.json para geração de perguntas pela IA
const productExamplesFromPolicies = [
  { item: 'Armações de óculos sem grau', category: 'ACESSÓRIOS DE MODA', answer: 'PERMITIDO', explanation: 'Armações de óculos sem grau são permitidas.' },
  { item: 'Bolo de pote sem selagem industrial', category: 'ALIMENTOS E BEBIDAS', answer: 'PROIBIDO', explanation: 'Bolos com cobertura ou recheio sem selagem industrial são proibidos.' },
  { item: 'Carne seca', category: 'ALIMENTOS E BEBIDAS', answer: 'PERMITIDO', explanation: 'Carne seca é permitida por ser processada e embalada.' },
  { item: 'Queijo ricota', category: 'LATICÍNIOS', answer: 'PROIBIDO', explanation: 'Queijos frescos como cottage e ricota são proibidos.' },
  { item: 'Queijo parmesão', category: 'LATICÍNIOS', answer: 'PERMITIDO', explanation: 'Queijo parmesão é permitido por ser processado.' },
  { item: 'Ratoeiras', category: 'ANIMAIS DOMÉSTICOS', answer: 'PROIBIDO', explanation: 'Produtos destinados à captura de espécies são proibidos.' },
  { item: 'Coleira de pet', category: 'ANIMAIS DOMÉSTICOS', answer: 'PERMITIDO', explanation: 'Coleiras de pet são permitidas.' },
  { item: 'Suplementos alimentares para animais', category: 'MEDICAMENTOS VETERINÁRIOS', answer: 'PERMITIDO', explanation: 'Suplementos alimentares e vitaminas são permitidos para todos sellers.' },
  { item: 'Microfones de gravação profissional', category: 'GRAVADORES DE VOZ', answer: 'PERMITIDO', explanation: 'Gravadores convencionais para uso profissional são permitidos.' },
  { item: 'Cinzeiros de decoração', category: 'TABACO / NICOTINA / CIGARROS ELETRÔNICOS', answer: 'PERMITIDO', explanation: 'Cinzeiros de decoração são permitidos.' },
  { item: 'Narguilé', category: 'TABACO / NICOTINA / CIGARROS ELETRÔNICOS', answer: 'PROIBIDO', explanation: 'Narguilé é proibido.' },
  { item: 'Estalinhos', category: 'EXPLOSIVOS', answer: 'PROIBIDO', explanation: 'Estalinhos, bombinhas, biribinhas são proibidos.' },
  { item: 'Aerossóis até 500g', category: 'EXPLOSIVOS', answer: 'PERMITIDO', explanation: 'Aerossóis como desodorante, protetor solar até 500 gramas são permitidos.' },
  { item: 'Isqueiro elétrico', category: 'INFLAMÁVEIS', answer: 'PERMITIDO', explanation: 'Isqueiro elétrico, isqueiro sem gás são permitidos.' },
  { item: 'Fósforos', category: 'INFLAMÁVEIS', answer: 'PROIBIDO', explanation: 'Fósforos são proibidos.' },
  { item: 'Asbesto (amianto)', category: 'TÓXICO E NOCIVOS', answer: 'PROIBIDO', explanation: 'Asbesto (amianto) em materiais de construção é proibido.' },
  { item: 'Cabelo humano para uso comercial', category: 'PARTES DO CORPO HUMANO', answer: 'PERMITIDO', explanation: 'Cabelo humano ou perucas para uso comercial são permitidos.' },
  { item: 'Esqueletos humanos', category: 'PARTES DO CORPO HUMANO', answer: 'PROIBIDO', explanation: 'Pele, ossos, esqueletos, córneas, partes do corpo são proibidos.' },
  { item: 'Bandeiras de grupos extremistas', category: 'POLÍTICA / RELIGIÃO', answer: 'PROIBIDO', explanation: 'Bandeiras e insígnias de grupos extremistas são proibidas.' },
  { item: 'Barras de ouro', category: 'MOEDA FÍSICA / CRÉDITOS', answer: 'PROIBIDO', explanation: 'Barras de ouro, prata, bronze, níquel, platina são proibidas.' }
];

// Função para gerar pergunta pela IA baseada nas políticas reais
const generateAIQuestion = (usedProducts: Set<string>): AIQuizQuestion => {
  // Filtra produtos não utilizados
  const availableProducts = productExamplesFromPolicies.filter(product => 
    !usedProducts.has(`${product.item}_${product.category}`)
  );
  
  // Se não há produtos disponíveis, reinicia o conjunto
  if (availableProducts.length === 0) {
    usedProducts.clear();
    return generateAIQuestion(usedProducts);
  }
  
  const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
  const difficulties = ['easy', 'medium', 'hard'];
  
  // Marca produto como usado
  usedProducts.add(`${product.item}_${product.category}`);
  
  return {
    id: `ai_${Date.now()}_${Math.random()}`,
    question: `${product.item} deve ser classificado como:`,
    options: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
    correctAnswer: ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'].indexOf(product.answer),
    difficulty: difficulties[Math.floor(Math.random() * difficulties.length)] as 'easy' | 'medium' | 'hard',
    explanation: product.explanation,
    category: product.category
  };
};

// Função para gerar perguntas híbridas (60% IA + 40% pré-prontas)
const generateAIQuizQuestions = async (count: number, difficulty: string): Promise<AIQuizQuestion[]> => {
  // Tempo de carregamento para simular processamento IA
  const loadingTime = 2000 + Math.random() * 3000; // 2-5 segundos
  await new Promise(resolve => setTimeout(resolve, loadingTime));

  let filteredQuestions = shopeeQuestions;

  // Filtra por dificuldade se especificada
  if (difficulty !== 'all') {
    filteredQuestions = shopeeQuestions.filter(q => q.difficulty === difficulty);
  }

  const aiQuestionsCount = Math.ceil(count * 0.6); // 60% IA
  const presetQuestionsCount = count - aiQuestionsCount; // 40% pré-prontas

  // Set para controlar produtos já utilizados
  const usedProducts = new Set<string>();
  const usedPresetIds = new Set<string>();
  const allUsedQuestions = new Set<string>();

  // Gera perguntas da IA sem repetições
  const aiQuestions: AIQuizQuestion[] = [];
  for (let i = 0; i < aiQuestionsCount; i++) {
    const question = generateAIQuestion(usedProducts);
    const questionKey = `${question.question}_${question.correctAnswer}`;
    if (!allUsedQuestions.has(questionKey)) {
      allUsedQuestions.add(questionKey);
      aiQuestions.push(question);
    } else {
      // Se repetiu, tenta novamente
      i--;
    }
  }

  // Seleciona perguntas pré-prontas sem repetições
  const shuffledPreset = [...filteredQuestions].sort(() => Math.random() - 0.5);
  const presetQuestions: AIQuizQuestion[] = [];
  
  for (const question of shuffledPreset) {
    if (presetQuestions.length >= presetQuestionsCount) break;
    const questionKey = `${question.question}_${question.correctAnswer}`;
    if (!usedPresetIds.has(question.id) && !allUsedQuestions.has(questionKey)) {
      usedPresetIds.add(question.id);
      allUsedQuestions.add(questionKey);
      presetQuestions.push(question);
    }
  }

  // Combina e embaralha
  const allQuestions = [...aiQuestions, ...presetQuestions];
  return allQuestions.sort(() => Math.random() - 0.5).slice(0, count);
};


interface QuizResult {
  score: number;
  totalQuestions: number;
  timeUsed: number;
  date: Date;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

const QuizMode: React.FC = () => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [questions, setQuestions] = useState<AIQuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [teamName, setTeamName] = useState('');
  
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0); // Tempo decorrido em segundos
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [showResult, setShowResult] = useState(false);
  const [ranking, setRanking] = useState<QuizResult[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [globalRanking, setGlobalRanking] = useState<any[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);

  // Timer crescente
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Carregar ranking do localStorage na inicialização
  useEffect(() => {
    const savedRanking = localStorage.getItem('quizRanking');
    if (savedRanking) {
      const parsedRanking = JSON.parse(savedRanking).map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
      setRanking(parsedRanking);
    }
    
    const savedUserData = localStorage.getItem('shopee-quiz-user-data');
    if (savedUserData) {
      const userData = JSON.parse(savedUserData);
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setTeamName(userData.teamName || '');
    }
    
    loadGlobalRanking();
  }, []);

  // Carregar ranking global do Supabase
  const loadGlobalRanking = async () => {
    try {
      const data = await supabaseService.getGlobalRanking(10);
      setGlobalRanking(data);
    } catch (error) {
      console.error('Erro ao carregar ranking global:', error);
    }
  };

  // Salvar dados do usuário no localStorage sempre que mudarem
  useEffect(() => {
    if (firstName || lastName || teamName) {
      const userData = { firstName, lastName, teamName };
      localStorage.setItem('shopee-quiz-user-data', JSON.stringify(userData));
    }
  }, [firstName, lastName, teamName]);

  const getRandomLoadingMessage = () => {
    const messages = [
      'Aguarde, formulando perguntas e respostas...',
      'Enquanto formulo o quiz, que tal ir se preparando?',
      'Preparando desafios baseados nas políticas da Shopee...',
      'Criando perguntas personalizadas para você...',
      'Analisando políticas e gerando questões...',
      'Montando um quiz especial com base nas diretrizes...',
      'Organizando perguntas de diferentes categorias...',
      'Preparando um mix de questões pré-prontas e personalizadas...'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleUserSubmit = (firstName: string, lastName: string, teamName: string) => {
    setFirstName(firstName);
    setLastName(lastName);
    setTeamName(teamName);
    setShowUserModal(false);
    startQuiz();
  };

  const startQuiz = async () => {
    setIsGeneratingQuestions(true);
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setTimeElapsed(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setShowAnswerFeedback(false);
    
    try {
      const generatedQuestions = await generateAIQuizQuestions(10, selectedDifficulty);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Erro ao gerar perguntas:', error);
      toast.error('Erro ao gerar perguntas do quiz');
      setGameState('menu');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleStartQuiz = () => {
    startQuiz();
  };

  const selectAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const nextQuestion = () => {
    if (selectedAnswer !== null) {
      const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
      
      // Mostrar feedback visual
      setShowAnswerFeedback(true);
      
      // Salvar resposta do usuário
      setUserAnswers(prev => [...prev, selectedAnswer]);
      
      if (isCorrect) {
        setScore(prev => prev + 1);
      }

      // Aguardar 1.5 segundos antes de prosseguir
      setTimeout(() => {
        setShowAnswerFeedback(false);
        
        if (currentQuestion + 1 < questions.length) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
        } else {
          finishQuiz();
        }
      }, 1500);
    }
  };

  const finishQuiz = async () => {
    const difficultyPoints = { easy: 1, medium: 2, hard: 3 };
    const finalScore = score * difficultyPoints[selectedDifficulty];
    
    // Salvar resultado no Supabase
    try {
      await supabaseService.saveQuizResult(
        firstName,
        lastName,
        teamName,
        score,
        timeElapsed,
        finalScore,
        selectedDifficulty,
        questions.length
      );
      toast.success('Resultado salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
      toast.error('Erro ao salvar resultado do quiz');
    }

    const result: QuizResult = {
      score: finalScore,
      totalQuestions: questions.length,
      timeUsed: timeElapsed,
      date: new Date(),
    };

    // Adicionar ao ranking local
    const newRanking = [...ranking, result].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeUsed - b.timeUsed;
    });
    setRanking(newRanking);
    localStorage.setItem('quizRanking', JSON.stringify(newRanking));

    // Recarregar ranking global após salvar
    loadGlobalRanking();

    setGameState('finished');
  };

  const exitQuiz = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setGameState('menu');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setUserAnswers([]);
    setShowExitModal(false);
  };

  const resetQuiz = () => {
    setGameState('menu');
    setCurrentQuestion(0);
    setScore(0);
    setTimeElapsed(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setUserAnswers([]);
    setFirstName('');
    setLastName('');
    setTeamName('');
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen flex items-start justify-center py-8 px-4 pb-16">
        <div className="max-w-7xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Formulário de Registro */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Informações do Participante
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Seu nome"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Seu sobrenome"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Nome do seu time"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dificuldade
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => setSelectedDifficulty('easy')}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        selectedDifficulty === 'easy'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-xs">🟢</div>
                      <div>Fácil</div>
                      <div className="text-xs mt-1">1 ponto/acerto</div>
                    </button>
                    <button
                      onClick={() => setSelectedDifficulty('medium')}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        selectedDifficulty === 'medium'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-xs">🟡</div>
                      <div>Médio</div>
                      <div className="text-xs mt-1">2 pontos/acerto</div>
                    </button>
                    <button
                      onClick={() => setSelectedDifficulty('hard')}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        selectedDifficulty === 'hard'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-xs">🔴</div>
                      <div>Difícil</div>
                      <div className="text-xs mt-1">3 pontos/acerto</div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2 text-gray-600 dark:text-gray-300">
                      <p>• 10 perguntas</p>
                      <p>• Sem limite de tempo</p>
                      <p>• Múltipla escolha</p>
                      <p>• Fácil: 1 ponto por acerto</p>
                      <p>• Médio: 2 pontos por acerto</p>
                      <p>• Difícil: 3 pontos por acerto</p>
                    </div>
                    <button
                      onClick={handleStartQuiz}
                      disabled={isGeneratingQuestions}
                      className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
                    >
                      {isGeneratingQuestions ? 'Preparando Quiz...' : 'Começar Quiz'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ranking Global */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ranking Global
                </h2>
                <Button
                  onClick={loadGlobalRanking}
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                >
                  🔄
                </Button>
              </div>
              
              {globalRanking.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhum resultado ainda</p>
                  <p className="text-xs">Seja o primeiro!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {globalRanking.slice(0, 5).map((entry, index) => (
                    <div
                      key={`${entry.name}-${entry.date?.getTime()}`}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        index === 0 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' 
                          : index === 1
                          ? 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200'
                          : index === 2
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'
                          : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                        {index === 1 && <span className="text-gray-400 text-sm font-bold">🥈</span>}
                        {index === 2 && <span className="text-amber-600 text-sm font-bold">🥉</span>}
                        {index > 2 && <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-500">#{index + 1}</span>}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {entry.name}
                          </p>
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {entry.team}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="font-medium">
                            {entry.correctAnswers || 0}/{entry.totalQuestions || 10} ({entry.score} pts)
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.floor(entry.timeUsed / 60)}:{(entry.timeUsed % 60).toString().padStart(2, '0')}
                          </span>
                          <Badge 
                            variant={entry.difficulty === 'easy' ? 'secondary' : entry.difficulty === 'medium' ? 'default' : 'destructive'} 
                            className="text-xs px-1 py-0"
                          >
                            {entry.difficulty === 'easy' ? '🟢 Fácil' : entry.difficulty === 'medium' ? '🟡 Médio' : '🔴 Difícil'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {globalRanking.length > 5 && (
                    <div className="text-center pt-2">
                      <Button
                        onClick={() => setShowLeaderboard(true)}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Ver todos ({globalRanking.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Popup de Carregamento */}
        {isGeneratingQuestions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
                
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Preparando Quiz
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {loadingMessage}
                </p>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    💡 Selecionando as melhores perguntas para você!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'playing' && questions.length > 0 && questions[currentQuestion]) {
    const question = questions[currentQuestion];
    
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 min-h-screen flex flex-col">
        {/* Header com progresso, timer e botão sair */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              Pergunta {currentQuestion + 1}/10
            </span>
            <div className="w-full sm:w-48 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / 10) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatTime(timeElapsed)}
              </span>
            </div>
            
            <button
              onClick={exitQuiz}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 flex-shrink-0"
              title="Sair do Quiz"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Modal de Confirmação de Saída */}
        {showExitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Confirmar Saída
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Tem certeza que deseja sair do quiz? Todo o progresso será perdido.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelExit}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <Button 
                  onClick={() => setShowUserModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar Quiz
                </Button>
                
                <Button 
                  onClick={() => setShowLeaderboard(true)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Ver Ranking Global
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pergunta */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6 flex-1 flex flex-col">
          <div className="mb-2">
            <span className="text-sm text-orange-600 font-medium">
              {question?.category || 'Categoria'}
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            {question?.question || 'Carregando pergunta...'}
          </h2>

          <div className="space-y-3 flex-1">
            {question?.options?.map((option, index) => {
              let buttonClass = 'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ';
              let circleClass = 'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold ';
              
              if (showAnswerFeedback) {
                if (index === question?.correctAnswer) {
                  buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20';
                  circleClass += 'border-green-500 bg-green-500 text-white';
                } else if (selectedAnswer === index && index !== question?.correctAnswer) {
                  buttonClass += 'border-red-500 bg-red-50 dark:bg-red-900/20';
                  circleClass += 'border-red-500 bg-red-500 text-white';
                } else {
                  buttonClass += 'border-gray-200 dark:border-gray-600';
                  circleClass += 'border-gray-300 dark:border-gray-500';
                }
              } else if (selectedAnswer === index) {
                buttonClass += 'border-orange-600 bg-orange-50 dark:bg-orange-900/20';
                circleClass += 'border-orange-600 bg-orange-600 text-white';
              } else {
                buttonClass += 'border-gray-200 dark:border-gray-600 hover:border-orange-300 hover:bg-gray-50 dark:hover:bg-gray-700';
                circleClass += 'border-gray-300 dark:border-gray-500';
              }
              
              return (
                <button
                  key={index}
                  onClick={() => !showAnswerFeedback && selectAnswer(index)}
                  disabled={showAnswerFeedback}
                  className={buttonClass}
                >
                  <div className="flex items-center gap-3">
                    <span className={circleClass}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">{option}</span>
                    {showAnswerFeedback && index === question.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                    {showAnswerFeedback && selectedAnswer === index && index !== question.correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t dark:border-gray-600 flex justify-center sm:justify-end">
            <button
              onClick={nextQuestion}
              disabled={selectedAnswer === null || showAnswerFeedback}
              className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold min-h-[48px]"
            >
              {showAnswerFeedback ? 'Aguarde...' : (currentQuestion + 1 === (questions?.length || 0) ? 'Finalizar' : 'Próxima')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const percentage = (score / (questions?.length || 1)) * 100;
    
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 text-center">
          <div className="mb-6">
            {percentage >= 80 ? (
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            )}
            
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Quiz Finalizado!
            </h2>
            
            <div className={`text-4xl font-bold mb-4 ${getScoreColor(score, questions?.length || 0)}`}>
              {score}/{questions?.length || 0}
            </div>
            
            <div className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              {percentage.toFixed(0)}% de acertos
            </div>
            
            {/* Mostrar dificuldade e multiplicador */}
            <div className="text-sm bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-gray-600 dark:text-gray-300">Dificuldade:</span>
                <span className={`font-semibold ${
                  selectedDifficulty === 'easy' ? 'text-green-600' :
                  selectedDifficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedDifficulty === 'easy' ? '🟢 Fácil' :
                   selectedDifficulty === 'medium' ? '🟡 Médio' : '🔴 Difícil'}
                </span>
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Multiplicador: {selectedDifficulty === 'easy' ? '1.0x' : selectedDifficulty === 'medium' ? '1.5x' : '2.0x'}
              </div>
              {selectedDifficulty !== 'easy' && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pontuação base: {Math.round(score / (selectedDifficulty === 'medium' ? 1.5 : 2.0))} → Final: {score}
                </div>
              )}
            </div>
            
            <div className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Tempo usado: {formatTime(timeElapsed)}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold flex items-center justify-center gap-2"
            >
              <List className="w-5 h-5" />
              Revisar Respostas
            </button>
            
            <button
              onClick={startQuiz}
              disabled={isGeneratingQuestions}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
            >
              {isGeneratingQuestions ? 'Preparando Quiz...' : 'Tentar Novamente'}
            </button>
            
            <button
              onClick={resetQuiz}
              className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 font-semibold"
            >
              Voltar ao Menu
            </button>
          </div>
          
          {/* Modal de Revisão */}
          {showReviewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2 md:mx-0">
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Revisão das Respostas
                    </h3>
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {questions.map((q, qIndex) => {
                      const userAnswer = userAnswers[qIndex];
                      const isCorrect = userAnswer === q.correctAnswer;
                      
                      return (
                        <div key={qIndex} className="border dark:border-gray-600 rounded-lg p-3 md:p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {qIndex + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-orange-600 font-medium mb-1">
                                {q.category}
                              </div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm md:text-base">
                                {q.question}
                              </h4>
                              
                              <div className="space-y-2">
                                {q.options.map((option, oIndex) => {
                                  let optionClass = 'p-3 rounded-lg border ';
                                  
                                  if (oIndex === q.correctAnswer) {
                                    optionClass += 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200';
                                  } else if (userAnswer === oIndex && oIndex !== q.correctAnswer) {
                                    optionClass += 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
                                  } else {
                                    optionClass += 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300';
                                  }
                                  
                                  return (
                                    <div key={oIndex} className={`${optionClass} text-sm md:text-base`}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {String.fromCharCode(65 + oIndex)})
                                        </span>
                                        <span>{option}</span>
                                        {oIndex === q.correctAnswer && (
                                          <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                        )}
                                        {userAnswer === oIndex && oIndex !== q.correctAnswer && (
                                          <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {!isCorrect && (
                                <div className="mt-3 p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Explicação:</strong> {q.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 md:mt-6 flex justify-center md:justify-end">
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="w-full md:w-auto px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* User Input Modal */}
      <UserInputModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSubmit={handleUserSubmit}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Rest of the component content */}
      <div>Quiz content here...</div>
    </div>
  );
};

export default QuizMode;
