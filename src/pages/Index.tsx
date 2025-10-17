import React, { useEffect, useState } from 'react';
import { MessageCircle, Menu, X } from 'lucide-react';
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
