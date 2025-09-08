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

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      loadAnalytics();
    }
  }, [isAuthenticated]);

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

  const [showClearModal, setShowClearModal] = useState(false);

  const handleClearAllAnalytics = async () => {
    setShowClearModal(false);
    
    try {
      await feedbackService.clearAllAnalytics();
      
      // Recarregar todas as estatísticas
      loadAnalytics();
      loadQuizStats();
      loadChatStats();
      
      toast.success('Todos os dados de analytics foram removidos!');
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
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Análise completa de uso e performance</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Realizados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizStats?.totalQuizzes || 0}</div>
            <p className="text-xs text-muted-foreground">Score médio: {quizStats?.averageScore?.toFixed(1) || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Positivo</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {feedbackStats?.positive || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total de feedbacks positivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Negativo</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {feedbackStats?.negative || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total de feedbacks negativos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="quiz" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quiz">Análise do Quiz</TabsTrigger>
          <TabsTrigger value="feedback">Feedback dos Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="quiz" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Dificuldade</CardTitle>
                <CardDescription>Quizzes realizados por nível</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quizStats?.difficultyDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="difficulty" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Categoria</CardTitle>
                <CardDescription>Taxa de acerto por área</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quizStats?.categoryPerformance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Taxa de Acerto']} />
                    <Bar dataKey="accuracy" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowClearModal(true)}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Zerar Dashboard
            </Button>
          </div>
          
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

        <TabsContent value="admin" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Migração de Dados para Supabase
                </CardTitle>
                <CardDescription>
                  Migre dados existentes do localStorage para o banco de dados Supabase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      O que será migrado:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Todos os feedbacks (positivos e negativos) com comentários</li>
                      <li>• Resultados de quiz e pontuações</li>
                      <li>• Dados de analytics e estatísticas</li>
                    </ul>
                  </div>

                  {migrationStatus.results && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Resultado da Migração:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Feedback:</strong>
                          <div className="text-green-600">✓ {migrationStatus.results.feedback.success} sucessos</div>
                          {migrationStatus.results.feedback.errors > 0 && (
                            <div className="text-red-600">✗ {migrationStatus.results.feedback.errors} erros</div>
                          )}
                        </div>
                        <div>
                          <strong>Quiz:</strong>
                          <div className="text-green-600">✓ {migrationStatus.results.quiz.success} sucessos</div>
                          {migrationStatus.results.quiz.errors > 0 && (
                            <div className="text-red-600">✗ {migrationStatus.results.quiz.errors} erros</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleMigrateData}
                    disabled={migrationStatus.isRunning}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium mb-3"
                  >
                    {migrationStatus.isRunning ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Migrando dados...
                      </div>
                    ) : (
                      'Iniciar Migração'
                    )}
                  </button>

                  <button
                    onClick={handleClearAllAnalytics}
                    disabled={migrationStatus.isRunning}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Zerar Todos os Analytics
                    </div>
                  </button>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Nota:</strong> Os dados permanecerão no localStorage como backup. 
                    A migração pode ser executada múltiplas vezes sem problemas.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação para Zerar Dashboard */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Zerar Dashboard
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Tem certeza que deseja <strong>zerar TODOS os dados</strong> do dashboard?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Dados que serão removidos:</strong>
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
                  <li>• Todos os feedbacks (positivos e negativos)</li>
                  <li>• Histórico de mensagens do chat</li>
                  <li>• Dados de analytics armazenados</li>
                  <li>• Informações do banco de dados Supabase</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAllAnalytics}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Confirmar e Zerar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsMode;
