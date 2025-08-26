import React from 'react';
import { ShoppingBag, Shield } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import ClearChatButton from '@/components/ClearChatButton';

const Index = () => {
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
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Política de Proibidos</span>
              </div>
            </div>
            <ClearChatButton onClearChat={() => (window as any).clearShopeeChat?.()} />
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
