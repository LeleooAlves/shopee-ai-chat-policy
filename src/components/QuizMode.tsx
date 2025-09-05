import React, { useState, useEffect } from 'react';
import { Trophy, Clock, RotateCcw, Play, Home, Star, Medal, Award, List, CheckCircle, XCircle, X } from 'lucide-react';
import { getRandomQuestions, type QuizQuestion } from '@/data/quizQuestions';

interface QuizResult {
  score: number;
  totalQuestions: number;
  timeUsed: number;
  date: Date;
}

const QuizMode: React.FC = () => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0); // Tempo decorrido em segundos
  const [showResult, setShowResult] = useState(false);
  const [ranking, setRanking] = useState<QuizResult[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

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

  // Carregar ranking do localStorage
  useEffect(() => {
    const savedRanking = localStorage.getItem('shopee-quiz-ranking');
    if (savedRanking) {
      const parsed = JSON.parse(savedRanking).map((result: any) => ({
        ...result,
        date: new Date(result.date)
      }));
      setRanking(parsed);
    }
  }, []);

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

  const startQuiz = async () => {
    setIsGeneratingQuestions(true);
    setLoadingMessage(getRandomLoadingMessage());
    
    try {
      // Delay de 10 segundos para mostrar a tela de carregamento
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const preBuiltQuestions = getRandomQuestions(10);
      setQuestions(preBuiltQuestions);
      setCurrentQuestion(0);
      setScore(0);
      setTimeElapsed(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setUserAnswers([]);
      setShowAnswerFeedback(false);
      setShowReviewModal(false);
      setGameState('playing');
    } catch (error) {
      console.error('Erro ao gerar perguntas:', error);
      // Fallback: usar perguntas padrão se houver erro
      setQuestions([]);
    } finally {
      setIsGeneratingQuestions(false);
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

  const finishQuiz = () => {
    const result: QuizResult = {
      score,
      totalQuestions: questions.length,
      timeUsed: timeElapsed,
      date: new Date()
    };

    // Salvar no ranking
    const newRanking = [...ranking, result]
      .sort((a, b) => {
        // Ordenar por pontuação (maior primeiro), depois por tempo (menor primeiro)
        if (a.score !== b.score) return b.score - a.score;
        return a.timeUsed - b.timeUsed;
      })
      .slice(0, 10); // Manter apenas top 10

    setRanking(newRanking);
    localStorage.setItem('shopee-quiz-ranking', JSON.stringify(newRanking));

    setGameState('finished');
  };

  const resetQuiz = () => {
    setGameState('menu');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const exitQuiz = () => {
    if (window.confirm('Tem certeza que deseja sair do quiz? Todo o progresso será perdido.')) {
      setGameState('menu');
      setCurrentQuestion(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setUserAnswers([]);
      setShowAnswerFeedback(false);
      setTimeElapsed(0);
    }
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Modo Aprendizado
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Teste seus conhecimentos sobre as políticas da Shopee!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Iniciar Quiz */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <Play className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Iniciar Quiz
              </h2>
              <div className="space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                <p>• 10 perguntas pré-selecionadas</p>
                <p>• Sem limite de tempo</p>
                <p>• Múltipla escolha</p>
                <p>• Ranking global</p>
              </div>
              <button
                onClick={startQuiz}
                disabled={isGeneratingQuestions}
                className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
              >
                {isGeneratingQuestions ? 'Preparando Quiz...' : 'Começar Quiz'}
              </button>
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Ranking Top 10
              </h2>
            </div>
            
            {ranking.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhum resultado ainda. Seja o primeiro!
              </p>
            ) : (
              <div className="space-y-2">
                {ranking.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${
                        index === 0 ? 'text-yellow-600' : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        #{index + 1}
                      </span>
                      <div>
                        <div className={`font-semibold ${getScoreColor(result.score, result.totalQuestions)}`}>
                          {result.score}/{result.totalQuestions}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(result.timeUsed)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {result.date.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Popup de Carregamento */}
        {isGeneratingQuestions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
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

  if (gameState === 'playing') {
    const question = questions[currentQuestion];
    
    return (
      <div className="max-w-3xl mx-auto p-6">
        {/* Header com progresso, timer e botão sair */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Pergunta {currentQuestion + 1}/10
            </span>
            <div className="w-48 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / 10) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatTime(timeElapsed)}
              </span>
            </div>
            
            <button
              onClick={exitQuiz}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
              title="Sair do Quiz"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Pergunta */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-2">
            <span className="text-sm text-orange-600 font-medium">
              {question.category}
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, index) => {
              let buttonClass = 'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ';
              let circleClass = 'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold ';
              
              if (showAnswerFeedback) {
                if (index === question.correctAnswer) {
                  buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20';
                  circleClass += 'border-green-500 bg-green-500 text-white';
                } else if (selectedAnswer === index && index !== question.correctAnswer) {
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

          <div className="mt-6 flex justify-end">
            <button
              onClick={nextQuestion}
              disabled={selectedAnswer === null || showAnswerFeedback}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
            >
              {showAnswerFeedback ? 'Aguarde...' : (currentQuestion + 1 === questions.length ? 'Finalizar' : 'Próxima')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const percentage = (score / questions.length) * 100;
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            {percentage >= 80 ? (
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            )}
            
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Quiz Finalizado!
            </h2>
            
            <div className={`text-4xl font-bold mb-4 ${getScoreColor(score, questions.length)}`}>
              {score}/{questions.length}
            </div>
            
            <div className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              {percentage.toFixed(0)}% de acertos
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
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
                        <div key={qIndex} className="border dark:border-gray-600 rounded-lg p-4">
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
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
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
                                    <div key={oIndex} className={optionClass}>
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
                              
                              return (
                                <div key={oIndex} className={optionClass}>
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
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
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
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
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

  return null;
};

export default QuizMode;
