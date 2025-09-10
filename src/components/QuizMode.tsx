import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { User, Clock, Target, Trophy, ChevronRight, Users, Medal, Crown, Star, Plus, X, CheckCircle, XCircle, List } from 'lucide-react';
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
  category: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isAIGenerated?: boolean;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  created_at: string;
  updated_at: string;
}

import { extendedShopeeQuestions } from '../data/extendedQuestions';

// Usar questões expandidas do arquivo externo
const shopeeQuestions = extendedShopeeQuestions;

// Produtos baseados EXCLUSIVAMENTE no PoliticasShopee.json para geração de perguntas pela IA
const productExamplesFromPolicies = [
  { item: 'Armações de óculos sem grau', category: 'ACESSÓRIOS', answer: 'PERMITIDO', explanation: 'Armações de óculos sem grau são permitidas conforme política da Shopee.' },
  { item: 'Bolo de pote sem selagem industrial', category: 'ALIMENTOS', answer: 'PROIBIDO', explanation: 'Bolos com cobertura ou recheio sem selagem industrial são proibidos.' },
  { item: 'Carne seca embalada', category: 'ALIMENTOS', answer: 'PERMITIDO', explanation: 'Carne seca processada e embalada industrialmente é permitida.' },
  { item: 'Queijo ricota fresco', category: 'LATICÍNIOS', answer: 'PROIBIDO', explanation: 'Queijos frescos como cottage e ricota são proibidos.' },
  { item: 'Queijo parmesão curado', category: 'LATICÍNIOS', answer: 'PERMITIDO', explanation: 'Queijo parmesão curado é permitido por ser processado.' },
  { item: 'Ratoeiras e armadilhas', category: 'ANIMAIS', answer: 'PROIBIDO', explanation: 'Produtos destinados à captura de animais são proibidos.' },
  { item: 'Coleira para pets', category: 'ANIMAIS', answer: 'PERMITIDO', explanation: 'Acessórios para pets como coleiras são permitidos.' },
  { item: 'Spray de pimenta', category: 'SEGURANÇA', answer: 'PROIBIDO', explanation: 'Sprays de defesa pessoal são classificados como armas não letais.' },
  { item: 'Alarme pessoal sonoro', category: 'SEGURANÇA', answer: 'PERMITIDO', explanation: 'Alarmes pessoais sonoros são dispositivos de segurança permitidos.' },
  { item: 'Faca de cozinha 25cm', category: 'UTENSÍLIOS', answer: 'PERMITIDO', explanation: 'Facas de cozinha com lâmina até 30cm são permitidas.' },
  { item: 'Espada decorativa', category: 'ARMAS', answer: 'PROIBIDO', explanation: 'Espadas, mesmo decorativas, são consideradas armas brancas.' },
  { item: 'Cerveja artesanal', category: 'BEBIDAS', answer: 'RESTRITO', explanation: 'Bebidas alcoólicas requerem apresentação de documentação complementar.' },
  { item: 'Refrigerante comum', category: 'BEBIDAS', answer: 'PERMITIDO', explanation: 'Refrigerantes e bebidas não alcoólicas são permitidos.' },
  { item: 'Medicamento controlado', category: 'MEDICAMENTOS', answer: 'PROIBIDO', explanation: 'Medicamentos de uso controlado são proibidos na plataforma.' },
  { item: 'Vitamina C', category: 'SUPLEMENTOS', answer: 'PERMITIDO', explanation: 'Vitaminas e suplementos alimentares são permitidos.' },
  { item: 'Aerossol 600g', category: 'QUÍMICOS', answer: 'PROIBIDO', explanation: 'Aerossóis acima de 500g são considerados perigosos.' },
  { item: 'Perfume 100ml', category: 'COSMÉTICOS', answer: 'PERMITIDO', explanation: 'Perfumes e cosméticos são permitidos na plataforma.' },
  { item: 'Isqueiro comum', category: 'UTENSÍLIOS', answer: 'PERMITIDO', explanation: 'Isqueiros comuns são permitidos como utensílios domésticos.' },
  { item: 'Fogos de artifício', category: 'EXPLOSIVOS', answer: 'PROIBIDO', explanation: 'Fogos de artifício são materiais explosivos proibidos.' },
  { item: 'Cigarro eletrônico', category: 'TABACO', answer: 'PROIBIDO', explanation: 'Cigarros eletrônicos e produtos de tabaco são proibidos.' }
];

// Função para gerar uma pergunta aleatória baseada nos produtos das políticas
const generateAIQuestion = (usedProducts: Set<string>): AIQuizQuestion => {
  // Filtrar produtos não utilizados
  const availableProducts = productExamplesFromPolicies.filter(p => !usedProducts.has(p.item));
  
  // Se todos foram usados, resetar
  if (availableProducts.length === 0) {
    usedProducts.clear();
  }
  
  const products = availableProducts.length > 0 ? availableProducts : productExamplesFromPolicies;
  const product = products[Math.floor(Math.random() * products.length)];
  
  // Marcar como usado
  usedProducts.add(product.item);
  
  // Usar SEMPRE as mesmas 4 opções padrão das questões pré-definidas
  const standardOptions = ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'];
  const correctAnswerText = product.answer;
  const correctIndex = standardOptions.indexOf(correctAnswerText);
  
  // Embaralhar as opções mantendo o padrão
  const shuffledOptions = [...standardOptions].sort(() => Math.random() - 0.5);
  const newCorrectIndex = shuffledOptions.indexOf(correctAnswerText);
  
  return {
    id: `ai_${Date.now()}_${Math.random()}`,
    question: `${product.item} deve ser classificado como:`,
    options: shuffledOptions,
    correctAnswer: newCorrectIndex,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard', // Sempre médio para manter consistência
    explanation: product.explanation,
    category: product.category
  };
};

// Função para gerar questões baseadas na dificuldade com sistema rigoroso e sem repetição
const generateAIQuizQuestions = async (count: number, difficulty: string, usedIds: Set<string>): Promise<AIQuizQuestion[]> => {
  // Tempo de carregamento para gerar questões
  const loadingTime = 2000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, loadingTime));

  // Filtrar questões por dificuldade RIGOROSAMENTE
  let availableQuestions: AIQuizQuestion[] = [];
  
  if (difficulty === 'easy') {
    // APENAS questões fáceis
    availableQuestions = shopeeQuestions.filter(q => q.difficulty === 'easy');
  } else if (difficulty === 'medium') {
    // Questões fáceis E médias
    availableQuestions = shopeeQuestions.filter(q => q.difficulty === 'easy' || q.difficulty === 'medium');
  } else if (difficulty === 'hard') {
    // Todas as questões (fácil, médio, difícil)
    availableQuestions = shopeeQuestions;
  }

  // Filtrar questões que não foram usadas nesta sessão
  const unusedQuestions = availableQuestions.filter(q => !usedIds.has(q.id));
  
  // Garantir pelo menos 5 questões geradas por IA
  const minAIQuestions = 5;
  const maxPreBuiltQuestions = count - minAIQuestions;
  
  // Selecionar questões pré-prontas (máximo de 5 para garantir 5 da IA)
  const questionsToUse = unusedQuestions.length >= maxPreBuiltQuestions ? unusedQuestions : availableQuestions;
  const selectedPreBuilt = questionsToUse
    .sort(() => Math.random() - 0.5)
    .slice(0, maxPreBuiltQuestions);

  // Gerar exatamente 5 questões por IA
  const usedProducts = new Set<string>();
  const aiQuestions: AIQuizQuestion[] = [];
  
  for (let i = 0; i < minAIQuestions; i++) {
    const generatedQuestion = generateAIQuestion(usedProducts);
    generatedQuestion.difficulty = difficulty as 'easy' | 'medium' | 'hard';
    generatedQuestion.isAIGenerated = true;
    console.log('🤖 Questão gerada por IA:', {
      id: generatedQuestion.id,
      question: generatedQuestion.question,
      category: generatedQuestion.category,
      difficulty: generatedQuestion.difficulty
    });
    aiQuestions.push(generatedQuestion);
  }

  // Alternar questões: pré-pronta, IA, pré-pronta, IA...
  const finalQuestions: AIQuizQuestion[] = [];
  let preBuiltIndex = 0;
  let aiIndex = 0;
  
  for (let i = 0; i < count; i++) {
    if (i % 2 === 0 && preBuiltIndex < selectedPreBuilt.length) {
      // Posições pares: questões pré-prontas
      finalQuestions.push(selectedPreBuilt[preBuiltIndex]);
      preBuiltIndex++;
    } else if (aiIndex < aiQuestions.length) {
      // Posições ímpares ou quando acabaram as pré-prontas: questões IA
      finalQuestions.push(aiQuestions[aiIndex]);
      aiIndex++;
    } else if (preBuiltIndex < selectedPreBuilt.length) {
      // Se acabaram as questões IA, usar pré-prontas restantes
      finalQuestions.push(selectedPreBuilt[preBuiltIndex]);
      preBuiltIndex++;
    }
  }

  // Garantir IDs únicos preservando a propriedade isAIGenerated
  const uniqueQuestions = finalQuestions.map(q => ({ 
    ...q, 
    id: q.isAIGenerated ? q.id : `${q.id}_${Date.now()}_${Math.random()}`,
    isAIGenerated: q.isAIGenerated || false
  }));

  return uniqueQuestions;
};


interface QuizResult {
  score: number;
  totalQuestions: number;
  timeUsed: number;
  date: Date;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

const QuizMode: React.FC = () => {
  const [gameState, setGameState] = useState<'menu' | 'loading' | 'playing' | 'finished'>('menu');
  const [questions, setQuestions] = useState<AIQuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
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
  const [selectedRankingDifficulty, setSelectedRankingDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [globalRanking, setGlobalRanking] = useState<any[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [availableTasks, setAvailableTasks] = useState<{id: string; name: string}[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());

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
    loadTasks();
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

  // Carregar tarefas do Supabase
  const loadTasks = async () => {
    try {
      const tasks = await supabaseService.getTasks();
      setAvailableTasks(tasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  // Adicionar nova tarefa
  const handleAddTask = async () => {
    if (!newTaskName.trim()) return;
    
    try {
      await supabaseService.createTask(newTaskName.trim());
      setNewTaskName('');
      setShowAddTaskModal(false);
      loadTasks(); // Recarregar lista
      toast.success('Tarefa adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      toast.error('Erro ao adicionar tarefa');
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
    // Limpar questões antigas primeiro
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setTimeElapsed(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setShowAnswerFeedback(false);
    
    // Mostrar popup de carregamento e manter estado em 'playing'
    setIsGeneratingQuestions(true);
    setLoadingMessage('Aguarde enquanto organizamos as questões do quiz');
    setGameState('playing');
    
    try {
      // Gerar novas questões
      const generatedQuestions = await generateAIQuizQuestions(10, selectedDifficulty, usedQuestionIds);
      setQuestions(generatedQuestions);
      
      // Atualizar IDs usados para evitar repetição
      const newUsedIds = new Set(usedQuestionIds);
      generatedQuestions.forEach(q => newUsedIds.add(q.id));
      setUsedQuestionIds(newUsedIds);
      
      // Só esconde o popup DEPOIS de ter as questões
      setIsGeneratingQuestions(false);
    } catch (error) {
      console.error('Erro ao gerar perguntas:', error);
      toast.error('Erro ao gerar perguntas do quiz');
      setIsGeneratingQuestions(false);
      setGameState('menu');
    }
  };

  const handleStartQuiz = () => {
    // Resetar questões antigas para forçar novas
    setQuestions([]);
    
    if (!firstName || !lastName || !teamName) {
      setShowUserModal(true);
    } else {
      startQuiz();
    }
  };

  const selectAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const nextQuestion = () => {
    if (selectedAnswer !== null) {
      const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
      
      // Mostrar feedback visual
      setShowAnswerFeedback(true);
      
      // Salvar resposta do usuário ANTES do setTimeout
      const newUserAnswers = [...userAnswers, selectedAnswer];
      setUserAnswers(newUserAnswers);
      
      // Atualizar score ANTES do setTimeout
      let newScore = score;
      if (isCorrect) {
        newScore = score + 1;
        setScore(newScore);
      }
      
      console.log(`Questão ${currentQuestion + 1}: Resposta ${selectedAnswer}, Correto: ${isCorrect}, Score atual: ${newScore}`);

      // Aguardar 1.5 segundos antes de prosseguir
      setTimeout(() => {
        setShowAnswerFeedback(false);
        
        // Sempre prosseguir para próxima questão até completar 10
        if (currentQuestion + 1 < 10) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
        } else {
          console.log('Finalizando quiz - Score final:', newScore, 'Respostas:', newUserAnswers.length);
          // Passar o score calculado diretamente para finishQuiz
          finishQuizWithScore(newScore, newUserAnswers.length);
        }
      }, 1500);
    }
  };

  const finishQuizWithScore = async (correctScore: number, answersCount: number) => {
    const difficultyPoints = { easy: 1, medium: 2, hard: 3 };
    const finalScore = correctScore * difficultyPoints[selectedDifficulty];
    const totalQuestions = 10; // Sempre 10 questões
    
    console.log('=== FINALIZANDO QUIZ ===');
    console.log('Score correto passado:', correctScore);
    console.log('Final Score:', finalScore);
    console.log('Respostas contadas:', answersCount);
    console.log('Dificuldade:', selectedDifficulty);
    console.log('========================');
    
    // Salvar resultado no Supabase
    try {
      await supabaseService.saveQuizResult(
        firstName,
        lastName,
        teamName,
        correctScore,
        timeElapsed,
        finalScore,
        selectedDifficulty,
        totalQuestions
      );
      toast.success('Resultado salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
      toast.error('Erro ao salvar resultado do quiz');
    }

    const result: QuizResult = {
      score: finalScore,
      totalQuestions: 10,
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

  const finishQuiz = async () => {
    // Função de fallback - não deveria ser chamada
    console.warn('finishQuiz() chamada - usando finishQuizWithScore');
    finishQuizWithScore(score, userAnswers.length);
  };


  const exitQuiz = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setGameState('menu');
    setCurrentQuestion(0);
    setScore(0);
    setTimeElapsed(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setUserAnswers([]);
    setShowAnswerFeedback(false);
    setShowExitModal(false);
    setQuestions([]); // Limpar questões ao sair
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
      <div className="min-h-screen flex items-start justify-center py-4 sm:py-8 px-2 sm:px-4 pb-16">
        <div className="max-w-7xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            
            {/* Formulário de Registro */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Informações do Participante
                </h2>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Seu sobrenome"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tarefa Principal
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Selecione uma tarefa</option>
                        {availableTasks.map(task => (
                          <option key={task.id} value={task.name}>{task.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowAddTaskModal(true)}
                        className="px-2 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center justify-center min-w-[32px]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dificuldade
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      onClick={() => setSelectedDifficulty('easy')}
                      className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                        selectedDifficulty === 'easy'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-xs">🟢</div>
                      <div className="text-sm sm:text-base">Fácil</div>
                      <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">1 pt/acerto</div>
                    </button>
                    <button
                      onClick={() => setSelectedDifficulty('medium')}
                      className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                        selectedDifficulty === 'medium'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-xs">🟡</div>
                      <div className="text-sm sm:text-base">Médio</div>
                      <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">2 pts/acerto</div>
                    </button>
                    <button
                      onClick={() => setSelectedDifficulty('hard')}
                      className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                        selectedDifficulty === 'hard'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-xs">🔴</div>
                      <div className="text-sm sm:text-base">Difícil</div>
                      <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">3 pts/acerto</div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-end">
                    <div className="space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      <p>• 10 perguntas</p>
                      <p>• Sem limite de tempo</p>
                      <p>• Múltipla escolha</p>
                    </div>
                    <button
                      onClick={handleStartQuiz}
                      disabled={isGeneratingQuestions}
                      className="w-full bg-orange-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold text-sm"
                    >
                      {isGeneratingQuestions ? 'Preparando Quiz...' : 'Começar Quiz'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ranking Global */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6 max-h-[600px] flex flex-col">
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
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Abas de Dificuldade */}
              <div className="grid grid-cols-3 gap-0 mb-4 border-b flex-shrink-0">
                <button
                  onClick={() => setSelectedRankingDifficulty('easy')}
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                    selectedRankingDifficulty === 'easy'
                      ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  Fácil
                </button>
                <button
                  onClick={() => setSelectedRankingDifficulty('medium')}
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                    selectedRankingDifficulty === 'medium'
                      ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  Médio
                </button>
                <button
                  onClick={() => setSelectedRankingDifficulty('hard')}
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                    selectedRankingDifficulty === 'hard'
                      ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  Difícil
                </button>
              </div>

              {/* Lista do Ranking */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {globalRanking
                  .filter(entry => entry.difficulty === selectedRankingDifficulty)
                  .slice(0, 10)
                  .map((entry, index) => {
                    const position = index + 1;
                    const getPositionIcon = () => {
                      if (position === 1) return <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />;
                      if (position === 2) return <Medal className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />;
                      if (position === 3) return <Medal className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />;
                      return <span className="text-xs sm:text-sm font-medium text-gray-500">{position}°</span>;
                    };

                    return (
                      <div key={`${entry.id}-${entry.difficulty}`} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                            {getPositionIcon()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                              {entry.firstName} {entry.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {entry.teamName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs">
                            <span className="font-medium">
                              {entry.correctAnswers || 0}/{entry.totalQuestions || 10} ({entry.score} pts)
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor((entry.timeUsed || 0) / 60)}:{((entry.timeUsed || 0) % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {globalRanking.filter(entry => entry.difficulty === selectedRankingDifficulty).length === 0 && (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm">Nenhum resultado encontrado para esta dificuldade.</p>
                    <p className="text-xs">Seja o primeiro a completar o quiz neste nível!</p>
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>
        
        {/* Modal para adicionar nova tarefa */}
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Adicionar Nova Tarefa
              </h3>
              <textarea
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Digite o nome da tarefa..."
                rows={3}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
              <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
                <button
                  onClick={() => {
                    setShowAddTaskModal(false);
                    setNewTaskName('');
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskName.trim()}
                  className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 order-1 sm:order-2"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mostrar popup de carregamento enquanto gera questões
  if (gameState === 'playing' && isGeneratingQuestions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
            
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Preparando Quiz
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Aguarde enquanto organizamos as questões do quiz
            </p>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                <span className="font-semibold">Preparando questões...</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing' && questions.length > 0 && questions[currentQuestion]) {
    const question = questions[currentQuestion];
    
    return (
      <div className="max-w-3xl mx-auto p-2 sm:p-4 md:p-6 min-h-screen flex flex-col">
        {/* Header com progresso, timer e botão sair */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
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
              <span className="font-mono text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatTime(timeElapsed)}
              </span>
            </div>
            
            <button
              onClick={exitQuiz}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 flex-shrink-0 text-sm sm:text-base"
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
                <button
                  onClick={confirmExit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Sair do Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pergunta */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 flex-1 flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-orange-600 font-medium">
              {questions[currentQuestion]?.category || 'Categoria'}
            </span>
            {questions[currentQuestion]?.isAIGenerated && (
              <span className="text-blue-600 dark:text-blue-400" title="Questão gerada por IA">
                🤖
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
            {questions[currentQuestion]?.question || 'Carregando pergunta...'}
          </h2>

          <div className="space-y-3 flex-1">
            {questions[currentQuestion]?.options?.map((option, index) => {
              let buttonClass = 'w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-sm sm:text-base ';
              let circleClass = 'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold ';
              
              if (showAnswerFeedback) {
                if (index === questions[currentQuestion]?.correctAnswer) {
                  buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20';
                  circleClass += 'border-green-500 bg-green-500 text-white';
                } else if (selectedAnswer === index && index !== questions[currentQuestion]?.correctAnswer) {
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
                    {showAnswerFeedback && index === questions[currentQuestion].correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                    {showAnswerFeedback && selectedAnswer === index && index !== questions[currentQuestion].correctAnswer && (
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
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold min-h-[44px] sm:min-h-[48px] text-sm sm:text-base"
            >
              {showAnswerFeedback ? 'Aguarde...' : (currentQuestion + 1 === (questions?.length || 0) ? 'Finalizar' : 'Próxima')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const correctAnswers = score;
    const totalQuestions = questions?.length || 10;
    const percentage = (correctAnswers / totalQuestions) * 100;
    
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
            
            <div className={`text-4xl font-bold mb-4 ${getScoreColor(correctAnswers, totalQuestions)}`}>
              {correctAnswers}/{totalQuestions}
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
                  Pontuação base: {Math.round(correctAnswers / (selectedDifficulty === 'medium' ? 1.5 : 2.0))} → Final: {correctAnswers}
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

  // Retornar null se não houver estado válido
  return null;
};

export default QuizMode;
