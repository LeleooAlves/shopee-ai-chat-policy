import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MessageSquare, TrendingUp, Users, Target, ThumbsUp, ThumbsDown, AlertTriangle, Trash2 } from 'lucide-react';
import { feedbackService, Feedback } from '@/services/feedbackService';
import { supabaseService } from '@/services/supabaseService';
import AdminAuth from './AdminAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  difficultyDistribution: { difficulty: string; count: number }[];
  categoryPerformance: { category: string; accuracy: number }[];
}

interface ChatStats {
  totalMessages: number;
  categoriesConsulted: { category: string; count: number }[];
  dailyUsage: { date: string; messages: number }[];
  responseTypes: { type: string; count: number; color: string }[];
}

interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  positiveRate: number;
  negativeRate: number;
}

const AnalyticsMode: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chatStats, setChatStats] = useState<ChatStats>({
    totalMessages: 0,
    categoriesConsulted: [],
    dailyUsage: [],
    responseTypes: []
  });
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuizzes: 0,
    averageScore: 0,
    difficultyDistribution: [],
    categoryPerformance: []
  });
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({
    total: 0,
    positive: 0,
    negative: 0,
    positiveRate: 0,
    negativeRate: 0
  });
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<{
    isRunning: boolean;
    results: { feedback: any; quiz: any } | null;
  }>({ isRunning: false, results: null });
  const [showClearModal, setShowClearModal] = useState(false);
  const [tasks, setTasks] = useState<{id: string; name: string; description?: string}[]>([]);
  const [editingTask, setEditingTask] = useState<{id: string; name: string; description?: string} | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      loadAnalytics();
      loadTasks();
    }
  }, [isAuthenticated]);

  // Carregar tarefas do Supabase
  const loadTasks = async () => {
    try {
      const tasksData = await supabaseService.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  // Salvar tarefa (adicionar ou editar)
  const handleSaveTask = async () => {
    if (!taskName.trim()) return;
    
    try {
      if (editingTask) {
        await supabaseService.updateTask(editingTask.id, taskName.trim(), taskDescription.trim());
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        await supabaseService.createTask(taskName.trim(), taskDescription.trim());
        toast.success('Tarefa criada com sucesso!');
      }
      
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskName('');
      setTaskDescription('');
      loadTasks();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error('Erro ao salvar tarefa');
    }
  };

  // Deletar tarefa
  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setShowDeleteTaskModal(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      await supabaseService.deleteTask(taskToDelete);
      toast.success('Tarefa excluída com sucesso!');
      loadTasks();
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    } finally {
      setShowDeleteTaskModal(false);
      setTaskToDelete(null);
    }
  };

  const handleDeleteFeedback = async (messageId: string) => {
    try {
      await feedbackService.deleteFeedback(messageId);
      loadAnalytics();
      toast.success('Feedback removido com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar feedback:', error);
      toast.error('Erro ao remover feedback');
    }
  };

  const handlePasswordSubmit = async () => {
    if (password !== 'dadosadmin123') {
      setPasswordError('Senha incorreta!');
      return;
    }
    
    setPasswordError('');
    setShowPasswordModal(false);
    setPassword('');
    
    try {
      // Limpar dados locais
      await feedbackService.clearAllAnalytics();
      localStorage.removeItem('quizRanking');
      localStorage.removeItem('quiz-results');
      localStorage.removeItem('shopee-chat-messages');
      
      // Limpar dados do Supabase
      await supabaseService.clearAllAnalytics();
      
      // Recarregar todas as estatísticas
      loadAnalytics();
      loadQuizStats();
      loadChatStats();
      
      toast.success('Todos os dados de analytics foram removidos do sistema e banco de dados!');
    } catch (error) {
      console.error('Erro ao zerar analytics:', error);
      toast.error('Erro ao zerar dados de analytics');
    }
  };

  const loadAnalytics = () => {
    // Carregar feedback stats
    const stats = feedbackService.getFeedbackStats();
    const allFeedbacks = feedbackService.getAllFeedback();
    setFeedbackStats(stats);
    setFeedbacks(allFeedbacks);

    // Carregar quiz stats do localStorage
    loadQuizStats();
    
    // Carregar chat stats do localStorage
    loadChatStats();
  };

  const loadQuizStats = () => {
    try {
      const quizResults = JSON.parse(localStorage.getItem('quiz-results') || '[]');
      if (quizResults.length > 0) {
        const totalQuizzes = quizResults.length;
        const averageScore = quizResults.reduce((sum: number, result: any) => sum + result.score, 0) / totalQuizzes;
        
        // Distribuição por dificuldade (simulado)
        const difficultyDistribution = [
          { difficulty: 'Fácil', count: Math.floor(totalQuizzes * 0.4) },
          { difficulty: 'Médio', count: Math.floor(totalQuizzes * 0.4) },
          { difficulty: 'Difícil', count: Math.floor(totalQuizzes * 0.2) }
        ];

        // Performance por categoria (simulado)
        const categoryPerformance = [
          { category: 'Eletrônicos', accuracy: 85 },
          { category: 'Medicamentos', accuracy: 78 },
          { category: 'Cosméticos', accuracy: 92 },
          { category: 'Esportes', accuracy: 88 },
          { category: 'Automotivo', accuracy: 75 }
        ];

        setQuizStats({
          totalQuizzes,
          averageScore,
          difficultyDistribution,
          categoryPerformance
        });
      }
    } catch (error) {
      console.error('Erro ao carregar stats do quiz:', error);
    }
  };

  const loadChatStats = () => {
    try {
      const messages = JSON.parse(localStorage.getItem('shopee-chat-messages') || '[]');
      const totalMessages = messages.filter((msg: any) => !msg.isUser).length;

      // Categorias mais consultadas (simulado baseado em padrões)
      const categoriesConsulted = [
        { category: 'Eletrônicos', count: Math.floor(totalMessages * 0.25) },
        { category: 'Medicamentos', count: Math.floor(totalMessages * 0.20) },
        { category: 'Cosméticos', count: Math.floor(totalMessages * 0.15) },
        { category: 'Esportes', count: Math.floor(totalMessages * 0.15) },
        { category: 'Outros', count: Math.floor(totalMessages * 0.25) }
      ];

      // Uso diário (últimos 7 dias)
      const dailyUsage = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyUsage.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          messages: Math.floor(Math.random() * 20) + 5
        });
      }

      // Tipos de resposta
      const responseTypes = [
        { type: 'PERMITIDO', count: Math.floor(totalMessages * 0.35), color: '#10B981' },
        { type: 'PROIBIDO', count: Math.floor(totalMessages * 0.40), color: '#EF4444' },
        { type: 'DEPENDE', count: Math.floor(totalMessages * 0.15), color: '#F59E0B' },
        { type: 'RESTRITO', count: Math.floor(totalMessages * 0.10), color: '#F97316' }
      ];

      setChatStats({
        totalMessages,
        categoriesConsulted,
        dailyUsage,
        responseTypes
      });
    } catch (error) {
      console.error('Erro ao carregar stats do chat:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleCloseAuth = () => {
    setShowAuthModal(false);
  };

  const handleMigrateData = async () => {
    setMigrationStatus({ isRunning: true, results: null });
    
    try {
      // Migrar dados de feedback
      const feedbackResults = await feedbackService.migrateLocalDataToSupabase();
      
      // Migrar dados de quiz
      const quizResults = await supabaseService.migrateQuizDataToSupabase();
      
      setMigrationStatus({
        isRunning: false,
        results: {
          feedback: feedbackResults,
          quiz: quizResults
        }
      });
      
      // Recarregar analytics após migração
      loadAnalytics();
    } catch (error) {
      console.error('Erro durante migração:', error);
      setMigrationStatus({
        isRunning: false,
        results: {
          feedback: { success: 0, errors: 1 },
          quiz: { success: 0, errors: 1 }
        }
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <AdminAuth 
          isOpen={showAuthModal}
          onAuthenticated={handleAuthenticated}
          onClose={handleCloseAuth}
        />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Esta área requer autenticação administrativa.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="h-screen flex flex-col">
        {/* Header fixo */}
        <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Visualize dados de uso, performance e feedback dos usuários
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                onClick={() => setShowPasswordModal(true)}
                variant="destructive"
                size="default"
                className="flex items-center gap-2 text-sm sm:text-base px-4 py-2"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Zerar Analytics
              </Button>
            </div>
          </div>
        </div>


        {/* Container principal com scroll */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="quiz" className="h-full flex flex-col">
            {/* Abas fixas */}
            <div className="flex-shrink-0 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 bg-white dark:bg-gray-800">
              <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-0 h-auto">
                <TabsTrigger value="quiz" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">Quiz Analytics</span>
                  <span className="sm:hidden">Quiz</span>
                </TabsTrigger>
                <TabsTrigger value="feedback" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">Feedback dos Usuários</span>
                  <span className="sm:hidden">Feedback</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">Gerenciar Tarefas</span>
                  <span className="sm:hidden">Tarefas</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Conteúdo das abas com scroll */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
              <TabsContent value="quiz" className="space-y-4 sm:space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base">Distribuição por Dificuldade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quizStats.difficultyDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="difficulty" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base">Performance por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quizStats?.categoryPerformance || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" fontSize={12} />
                          <YAxis domain={[0, 100]} fontSize={12} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Taxa de Acerto']} />
                          <Bar dataKey="accuracy" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

              <TabsContent value="feedback" className="space-y-4 sm:space-y-6 mt-0">
          
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Feedbacks Negativos com Comentários
                </CardTitle>
                <CardDescription>
                  {feedbackService.getNegativeFeedbackComments().length} feedbacks negativos encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackService.getNegativeFeedbackComments().slice(0, 10).map((feedback, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="destructive">Feedback Negativo</Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {feedback.timestamp.toLocaleDateString('pt-BR')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFeedback(feedback.messageId)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {feedback.userQuestion && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            Pergunta do Usuário:
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            "{feedback.userQuestion}"
                          </p>
                        </div>
                      )}
                      
                      {feedback.aiResponse && (
                        <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
                            Resposta da IA:
                          </p>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            {feedback.aiResponse.length > 200 
                              ? `${feedback.aiResponse.substring(0, 200)}...` 
                              : feedback.aiResponse}
                          </p>
                        </div>
                      )}
                      
                      <div className="p-3 bg-red-100 dark:bg-red-800/30 rounded-lg border-l-4 border-red-500">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                          Comentário do Usuário:
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          "{feedback.comment}"
                        </p>
                      </div>
                    </div>
                  ))}
                  {feedbackService.getNegativeFeedbackComments().length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum feedback negativo com comentários ainda.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


              <TabsContent value="tasks" className="space-y-4 sm:space-y-6 mt-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Gerenciar Tarefas Principais</h2>
                  <Button 
                    onClick={() => {
                      setEditingTask(null);
                      setTaskName('');
                      setTaskDescription('');
                      setShowTaskModal(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Adicionar Tarefa
                  </Button>
                </div>
                
                <Card className="h-[calc(100vh-400px)] min-h-[300px] flex flex-col">
                  <CardHeader className="flex-shrink-0 pb-3">
                    <CardTitle className="text-base sm:text-lg">Tarefas Cadastradas</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Gerencie as tarefas principais disponíveis para seleção no quiz
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto space-y-2 pr-2">
                      {tasks.length === 0 ? (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-gray-500 text-center text-sm">Nenhuma tarefa cadastrada</p>
                        </div>
                      ) : (
                        tasks.map(task => (
                          <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate text-sm sm:text-base">{task.name}</h4>
                              {task.description && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{task.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingTask(task);
                                  setTaskName(task.name);
                                  setTaskDescription(task.description || '');
                                  setShowTaskModal(true);
                                }}
                                className="flex-1 sm:flex-none text-xs sm:text-sm"
                              >
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTask(task.id)}
                                className="flex-1 sm:flex-none text-xs sm:text-sm"
                              >
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Modal de Confirmação para Deletar Tarefa */}
      {showDeleteTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteTaskModal(false);
                  setTaskToDelete(null);
                }}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteTask}
                className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Senha para Zerar Analytics */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Confirmação de Segurança
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Esta ação irá apagar TODOS os dados de analytics do sistema e banco de dados, incluindo:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 mb-6 list-disc list-inside space-y-1">
              <li>Ranking global do quiz</li>
              <li>Feedbacks dos usuários</li>
              <li>Estatísticas e relatórios</li>
              <li>Histórico de mensagens</li>
            </ul>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Digite a senha de administrador:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Senha de administrador"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-2">{passwordError}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handlePasswordSubmit}
                disabled={!password.trim()}
                className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Confirmar e Zerar Tudo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Adicionar/Editar Tarefa */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {editingTask ? 'Editar Tarefa' : 'Adicionar Nova Tarefa'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Tarefa
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Nome da tarefa"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Descrição da tarefa"
                  rows={3}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTaskModal(false);
                  setEditingTask(null);
                  setTaskName('');
                  setTaskDescription('');
                }}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTask}
                disabled={!taskName.trim()}
                className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto order-1 sm:order-2"
              >
                {editingTask ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsMode;
