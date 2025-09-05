import React, { useEffect } from 'react';
import { Shield } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import ClearChatButton from '@/components/ClearChatButton';
import RefreshButton from '@/components/RefreshButton';

const Index = () => {
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
    <div className="h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img 
                  src="/shopeelogo.jpg" 
                  alt="Shopee Logo" 
                  className="w-8 h-8 rounded-lg object-contain"
                />
                <span className="text-orange-600 font-semibold text-lg"></span>
              </div>
              <button 
                onClick={() => window.open('https://help.shopee.com.br/portal/4/article/76226-%5BPol%C3%ADticas%5D-Pol%C3%ADtica-de-Produtos-Proibidos-e-Restritos', '_blank')}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors duration-200 hover:bg-orange-50 px-2 py-1 rounded-md"
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Política de Proibidos</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton />
              <ClearChatButton onClearChat={() => (window as any).clearShopeeChat?.()} />
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface />
      </main>

    </div>
  );
};

export default Index;
