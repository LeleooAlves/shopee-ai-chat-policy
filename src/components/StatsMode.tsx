import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Package, AlertTriangle, Calendar } from 'lucide-react';

interface ChatStats {
  totalQueries: number;
  queriesByStatus: {
    PERMITIDO: number;
    PROIBIDO: number;
    DEPENDE: number;
    RESTRITO: number;
  };
  queriesByCategory: { [key: string]: number };
  dailyQueries: { date: string; count: number }[];
  mostSearchedProducts: { product: string; count: number; lastSearched: Date }[];
  averageResponseTime: number;
  userSessions: number;
}

const StatsMode: React.FC = () => {
  const [stats, setStats] = useState<ChatStats>({
    totalQueries: 0,
    queriesByStatus: { PERMITIDO: 0, PROIBIDO: 0, DEPENDE: 0, RESTRITO: 0 },
    queriesByCategory: {},
    dailyQueries: [],
    mostSearchedProducts: [],
    averageResponseTime: 0,
    userSessions: 0
  });

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = () => {
    // Limpar dados do localStorage para zerar estatísticas
    localStorage.removeItem('shopee-chat-messages');
    localStorage.removeItem('shopee-quiz-ranking');
    
    // Carregar dados do localStorage (agora vazios)
    const chatMessages = JSON.parse(localStorage.getItem('shopee-chat-messages') || '[]');
    const quizResults = JSON.parse(localStorage.getItem('shopee-quiz-ranking') || '[]');
    
    // Processar estatísticas das mensagens
    const userMessages = chatMessages.filter((msg: any) => msg.isUser);
    const botMessages = chatMessages.filter((msg: any) => !msg.isUser);
    
    // Filtrar por período
    const now = new Date();
    const cutoffDate = new Date();
    if (timeRange === '7d') cutoffDate.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoffDate.setDate(now.getDate() - 30);
    else cutoffDate.setFullYear(2000); // Para 'all'

    const filteredUserMessages = userMessages.filter((msg: any) => 
      new Date(msg.timestamp) >= cutoffDate
    );

    // Contar queries por status
    const statusCounts = { PERMITIDO: 0, PROIBIDO: 0, DEPENDE: 0, RESTRITO: 0 };
    const categoryCount: { [key: string]: number } = {};
    const productCount: { [key: string]: { count: number; lastSearched: Date } } = {};

    botMessages.forEach((msg: any) => {
      if (new Date(msg.timestamp) >= cutoffDate) {
        const text = msg.text.toUpperCase();
        
        // Contar por status
        if (text.includes('PERMITIDO')) statusCounts.PERMITIDO++;
        else if (text.includes('PROIBIDO')) statusCounts.PROIBIDO++;
        else if (text.includes('DEPENDE')) statusCounts.DEPENDE++;
        else if (text.includes('RESTRITO')) statusCounts.RESTRITO++;

        // Extrair categoria da resposta
        const categoryMatch = msg.text.match(/política\s+(\d+(?:\.\d+)*\.?\s*[A-ZÁÊÇÕ\s]+)/i);
        if (categoryMatch) {
          const category = categoryMatch[1].trim();
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      }
    });

    // Contar produtos mais pesquisados
    filteredUserMessages.forEach((msg: any) => {
      const product = msg.text.toLowerCase().trim();
      if (product && !product.startsWith('análise em lote')) {
        if (!productCount[product]) {
          productCount[product] = { count: 0, lastSearched: new Date(msg.timestamp) };
        }
        productCount[product].count++;
        if (new Date(msg.timestamp) > productCount[product].lastSearched) {
          productCount[product].lastSearched = new Date(msg.timestamp);
        }
      }
    });

    // Queries diárias
    const dailyCount: { [key: string]: number } = {};
    filteredUserMessages.forEach((msg: any) => {
      const date = new Date(msg.timestamp).toISOString().split('T')[0];
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    });

    const dailyQueries = Object.entries(dailyCount)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Últimos 14 dias

    // Produtos mais pesquisados (top 10)
    const mostSearchedProducts = Object.entries(productCount)
      .map(([product, data]) => ({
        product,
        count: data.count,
        lastSearched: data.lastSearched
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calcular tempo médio de resposta (simulado)
    const averageResponseTime = Math.random() * 2000 + 1000; // 1-3 segundos

    // Sessões de usuário (baseado em gaps de tempo)
    let sessions = 1;
    const sortedMessages = [...filteredUserMessages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    for (let i = 1; i < sortedMessages.length; i++) {
      const timeDiff = new Date(sortedMessages[i].timestamp).getTime() - 
                      new Date(sortedMessages[i-1].timestamp).getTime();
      if (timeDiff > 30 * 60 * 1000) { // 30 minutos de gap = nova sessão
        sessions++;
      }
    }

    setStats({
      totalQueries: filteredUserMessages.length,
      queriesByStatus: statusCounts,
      queriesByCategory: categoryCount,
      dailyQueries,
      mostSearchedProducts,
      averageResponseTime,
      userSessions: sessions
    });
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PERMITIDO': return 'bg-green-500';
      case 'PROIBIDO': return 'bg-red-500';
      case 'DEPENDE': return 'bg-yellow-500';
      case 'RESTRITO': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'PERMITIDO': return 'text-green-600';
      case 'PROIBIDO': return 'text-red-600';
      case 'DEPENDE': return 'text-yellow-600';
      case 'RESTRITO': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-3 sm:p-6 bg-white dark:bg-gray-800 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard de Estatísticas
            </h1>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | 'all')}
            className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="all">Todo o período</option>
          </select>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs lg:text-sm">Total de Consultas</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalQueries}</p>
              </div>
              <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600 hidden sm:block" />
          </div>
        </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs lg:text-sm">Sessões</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.userSessions}</p>
              </div>
              <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600 hidden sm:block" />
          </div>
        </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs lg:text-sm">Tempo Médio</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.averageResponseTime}ms</p>
              </div>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600 hidden sm:block" />
          </div>
        </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs lg:text-sm">Produtos</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.mostSearchedProducts.length}</p>
              </div>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-600 hidden sm:block" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Distribuição por Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Distribuição por Status
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.queriesByStatus).map(([status, count]) => {
              const total = Object.values(stats.queriesByStatus).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${getStatusColor(status)}`} />
                    <span className={`font-medium ${getStatusTextColor(status)}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 w-8 sm:w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consultas Diárias */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Consultas Diárias
          </h3>
          <div className="space-y-2">
            {stats.dailyQueries.slice(-7).map((day, index) => {
              const maxCount = Math.max(...stats.dailyQueries.map(d => d.count));
              const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(day.date).toLocaleDateString('pt-BR', { 
                      weekday: 'short', 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 w-6 sm:w-8 text-right">
                      {day.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Produtos Mais Consultados */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Produtos Mais Consultados
            </h3>
            <div className="space-y-3">
              {stats.mostSearchedProducts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                  Nenhum produto consultado ainda
                </p>
              ) : (
                stats.mostSearchedProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                        {item.product}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Última consulta: {item.lastSearched.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-medium">
                        {item.count}x
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Categorias Problemáticas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Categorias Mais Consultadas
              </h3>
            </div>
            <div className="space-y-3">
              {Object.keys(stats.queriesByCategory).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                  Nenhuma categoria identificada ainda
                </p>
              ) : (
                Object.entries(stats.queriesByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate flex-1 min-w-0">
                        {category}
                      </span>
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                        {count}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsMode;
