import React, { useEffect, useState } from 'react';
import { Shield, MessageCircle, Menu, X } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import ClearChatButton from '@/components/ClearChatButton';
import ThemeToggle from '@/components/ThemeToggle';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const Index = () => {
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


      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 flex-shrink-0 sticky top-0 z-40">
          <div className="px-2 py-1.5 sm:px-4 md:px-6 sm:py-2 md:py-3">
            <div className="flex items-center justify-between w-full">
              {/* Logo/Título */}
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-orange-600" />
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Shopee Chat IA</span>
              </div>
              
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
                <ClearChatButton onClearChat={() => (window as any).clearShopeeChat?.()} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden pb-safe">
          <ChatInterface />
        </main>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default Index;
