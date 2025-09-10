import React, { useEffect, useState } from 'react';
import { Shield, MessageCircle, Trophy, BarChart3, Menu, X } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import ClearChatButton from '@/components/ClearChatButton';
import RefreshButton from '@/components/RefreshButton';
import ThemeToggle from '@/components/ThemeToggle';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import QuizMode from '@/components/QuizMode';
import AnalyticsMode from '@/components/AnalyticsMode';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'analytics'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Limpar sessionStorage quando a aba for fechada para detecção de nova sessão
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('shopee-session-active');
    };

    // Marcar sessão como ativa
    sessionStorage.setItem('shopee-session-active', 'true');

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex overflow-hidden relative">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-56 sm:w-64 md:w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-2 sm:p-3 md:p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
              
                <span className="font-semibold text-gray-900 dark:text-gray-100">Shopee Proibido</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 sm:p-3 md:p-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg text-sm sm:text-base text-left transition-colors duration-200 ${
                  activeTab === 'analytics'
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-r-2 border-orange-500'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5" />
                Analytics
              </button>
              <button
                onClick={() => {
                  setActiveTab('chat');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors duration-200 ${
                  activeTab === 'chat'
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">Chat IA</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('quiz');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors duration-200 ${
                  activeTab === 'quiz'
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Trophy className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">Quiz</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 flex-shrink-0 sticky top-0 z-40">
          <div className="px-2 py-1.5 sm:px-4 md:px-6 sm:py-2 md:py-3">
            <div className="flex items-center justify-between w-full">
              {/* Menu Hamburguer */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              
              {/* Botão Centralizado */}
              <button 
                onClick={() => window.open('https://help.shopee.com.br/portal/4/article/76226-%5BPol%C3%ADticas%5D-Pol%C3%ADtica-de-Produtos-Proibidos-e-Restritos', '_blank')}
                className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-sm text-sm sm:text-base"
              >
                <Shield className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="font-medium">Política de Proibidos</span>
              </button>
              
              {/* Ações da Direita */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {activeTab === 'chat' && (
                  <ClearChatButton onClearChat={() => (window as any).clearShopeeChat?.()} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden pb-safe">
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'quiz' && <QuizMode />}
          {activeTab === 'analytics' && <AnalyticsMode />}
        </main>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default Index;
