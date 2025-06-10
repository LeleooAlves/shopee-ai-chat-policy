
import React from 'react';
import { ShoppingBag, Shield } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-orange-600 font-semibold text-lg">Shopee</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Política de Proibidos</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Assistente IA para dúvidas sobre produtos permitidos e proibidos
          </p>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 bg-white m-4 rounded-lg shadow-lg overflow-hidden flex flex-col">
          <ChatInterface />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t px-4 py-3">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-500">
            Powered by Gemini 1.5 Flash • Para informações oficiais, consulte a central de ajuda da Shopee
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
