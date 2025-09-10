import React, { useState, useRef, useEffect } from 'react';
import { Send, Package, Loader2 } from 'lucide-react';
import MultiProductInput from './MultiProductInput';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string, skipAI?: boolean) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'multi'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };


  const handleMultiProductAnalysis = async (products: string[]) => {
    setIsAnalyzing(true);
    
    // Importar a função de análise múltipla
    const { analyzeMultipleProducts } = await import('@/services/geminiService');
    
    try {
      // Enviar mensagem inicial do usuário (sem chamar IA)
      const productList = products.map((product, index) => `${index + 1}. ${product}`).join('\n');
      const userMessage = `Análise em lote de ${products.length} produtos:\n\n${productList}`;
      onSendMessage(userMessage, true); // skipAI = true
      
      // Ativar estado de loading no ChatInterface para mostrar efeito "digitando"
      if ((window as any).setMultiAnalysisLoading) {
        (window as any).setMultiAnalysisLoading(true);
      }
      
      // Analisar produtos individualmente
      const results = await analyzeMultipleProducts(products);
      
      // Desativar estado de loading
      if ((window as any).setMultiAnalysisLoading) {
        (window as any).setMultiAnalysisLoading(false);
      }
      
      // Enviar cada resultado como mensagem separada do bot
      for (const result of results) {
        const individualMessage = `Produto ${result.productNumber}: ${result.productName}\n\n${result.analysis}`;
        
        // Usar função global para adicionar mensagem do bot
        if ((window as any).addBotMessage) {
          (window as any).addBotMessage(individualMessage);
        }
        
        // Pequeno delay entre mensagens para melhor UX
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error('Erro na análise múltipla:', error);
      // Desativar estado de loading em caso de erro
      if ((window as any).setMultiAnalysisLoading) {
        (window as any).setMultiAnalysisLoading(false);
      }
      if ((window as any).addBotMessage) {
        (window as any).addBotMessage('Erro ao analisar os produtos. Tente novamente.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Mode Selector */}
      <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setInputMode('text')}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm transition-colors duration-200 ${
            inputMode === 'text'
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
              : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50 dark:text-gray-300 dark:hover:text-orange-400 dark:hover:bg-gray-700'
          }`}
        >
          <Send className="w-3 sm:w-4 h-3 sm:h-4" />
          <span className="hidden sm:inline">Texto</span>
          <span className="sm:hidden">Chat</span>
        </button>
        
        <button
          onClick={() => setInputMode('multi')}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm transition-colors duration-200 ${
            inputMode === 'multi'
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
              : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50 dark:text-gray-300 dark:hover:text-orange-400 dark:hover:bg-gray-700'
          }`}
        >
          <Package className="w-3 sm:w-4 h-3 sm:h-4" />
          <span className="hidden sm:inline">Múltiplos</span>
          <span className="sm:hidden">Lote</span>
        </button>
      </div>

      {/* Input Area */}
      <div className="p-2 sm:p-4">
        {inputMode === 'text' && (
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 sm:gap-3 items-end">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                className="min-h-[40px] sm:min-h-[50px] max-h-[100px] sm:max-h-[120px] resize-none flex-1 text-sm sm:text-base"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!message.trim() || isLoading}
                className="h-[40px] sm:h-[50px] w-[40px] sm:w-[50px] flex-shrink-0 bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        )}

        {inputMode === 'multi' && (
          <MultiProductInput 
            onAnalyzeProducts={handleMultiProductAnalysis}
            isAnalyzing={isAnalyzing || isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ChatInput;
