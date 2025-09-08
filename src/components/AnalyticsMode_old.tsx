import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, Trophy, Clock, Target, TrendingUp, Award, Calendar, MessageCircle, BarChart3 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import FeedbackManager from './FeedbackManager';
import AdminAuth from './AdminAuth';
import { toast } from 'sonner';

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  difficultyDistribution: { difficulty: string; count: number }[];
  categoryPerformance: { category: string; accuracy: number }[];
}

interface ChatStats {
  totalMessages: number;
  categoriesConsulted: { category: string; count: number; percentage: number }[];
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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      loadAnalytics();
    }
  }, [isAuthenticated]);

  const loadAnalytics = () => {
    loadQuizStats();
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
        { category: 'Eletrônicos', count: Math.floor(totalMessages * 0.3), percentage: 30 },
        { category: 'Medicamentos', count: Math.floor(totalMessages * 0.25), percentage: 25 },
        { category: 'Cosméticos', count: Math.floor(totalMessages * 0.2), percentage: 20 },
        { category: 'Esportes', count: Math.floor(totalMessages * 0.15), percentage: 15 },
        { category: 'Outros', count: Math.floor(totalMessages * 0.1), percentage: 10 }
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
      <AdminAuth 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Visualize o desempenho e estatísticas do sistema
            </p>
          </div>
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
