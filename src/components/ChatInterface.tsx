import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import LoadingTipModal from './LoadingTipModal';
import { sendMessageToGemini } from '@/services/geminiService';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  classification?: 'PERMITIDO' | 'PROIBIDO' | 'DEPENDE' | 'RESTRITO';
  category?: string;
  hasAudio?: boolean;
}

// Sinônimos e palavras relacionadas para busca semântica
const PRODUCT_SYNONYMS: Record<string, string[]> = {
  'perfume': ['fragrância', 'colônia', 'eau de toilette', 'eau de parfum', 'essência'],
  'faca': ['lâmina', 'cutelo', 'facão', 'canivete', 'estilete'],
  'álcool': ['etanol', 'álcool etílico', 'álcool isopropílico', 'isopropanol'],
  'bebida': ['refrigerante', 'refri', 'soda', 'cerveja', 'vinho', 'destilado'],
  'replica': ['réplica', 'falsificado', 'imitação', 'cópia', 'fake', 'pirata', 'clone'],
  'suplemento': ['vitamina', 'proteína', 'whey', 'creatina', 'aminoácido'],
  'eletrônico': ['celular', 'smartphone', 'tablet', 'notebook', 'fone', 'carregador']
};

// Dicas contextuais baseadas em palavras-chave
const CONTEXTUAL_TIPS: Record<string, string> = {
  'faca': '💡 Dica: Especifique o tamanho (ex: 25cm) para uma análise mais precisa',
  'álcool': '💡 Dica: Informe a concentração (ex: 70%) para classificação exata',
  'suplemento': '💡 Dica: Produtos alimentares geralmente requerem documentação especial',
  'perfume': '💡 Dica: Perfumes importados podem precisar de registro na ANVISA',
  'bebida': '💡 Dica: Bebidas alcoólicas sempre requerem documentação complementar',
  'replica': '⚠️ Alerta: Produtos réplica/falsificados são sempre PROIBIDOS',
  'eletrônico': '💡 Dica: Especifique voltagem e certificações para análise completa'
};

// Função para carregar mensagens do localStorage
const loadMessagesFromStorage = (): Message[] => {
  try {
    const stored = localStorage.getItem('shopee-chat-messages');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
  }
  return [
    {
      id: '1',
      text: 'Olá! Sou seu assistente para dúvidas sobre a política de produtos proibidos da Shopee. Como posso ajudá-lo hoje?',
      isUser: false,
      timestamp: new Date(),
    },
  ];
};

// Função para salvar mensagens no localStorage
const saveMessagesToStorage = (messages: Message[]) => {
  try {
    localStorage.setItem('shopee-chat-messages', JSON.stringify(messages));
  } catch (error) {
    console.error('Erro ao salvar mensagens:', error);
  }
};

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(loadMessagesFromStorage);
  const [isLoading, setIsLoading] = useState(false);
  const [isMultiAnalysisLoading, setIsMultiAnalysisLoading] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState<SpeechSynthesisUtterance | null>(null);
  const [showLoadingTip, setShowLoadingTip] = useState(false);
  const [loadingTip, setLoadingTip] = useState('');
  const [loadingQuery, setLoadingQuery] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Função para busca semântica
  const enhanceQuery = (query: string): string => {
    let enhancedQuery = query.toLowerCase();
    
    // Expandir sinônimos
    Object.entries(PRODUCT_SYNONYMS).forEach(([key, synonyms]) => {
      synonyms.forEach(synonym => {
        if (enhancedQuery.includes(synonym)) {
          enhancedQuery = enhancedQuery.replace(synonym, `${synonym} (${key})`);
        }
      });
    });
    
    return enhancedQuery;
  };
  
  // Função para obter dicas contextuais (apenas para consultas vagas)
  const getContextualTip = (query: string): string | null => {
    const lowerQuery = query.toLowerCase();
    
    // Verificar se a consulta já tem informações suficientes
    const hasNumbers = /\d/.test(query); // Tem números (tamanho, concentração, etc.)
    const hasSpecificTerms = /\b(cm|ml|g|kg|%|volt|v|mah|cal|calibre|watts?|w)\b/i.test(query);
    const hasDetailedDescription = query.trim().split(' ').length > 2; // Mais de 2 palavras
    
    // Se já tem detalhes suficientes, não mostrar dica
    if (hasNumbers || hasSpecificTerms || hasDetailedDescription) {
      return null;
    }
    
    // Verificar palavras-chave apenas para consultas simples
    for (const [keyword, tip] of Object.entries(CONTEXTUAL_TIPS)) {
      if (lowerQuery === keyword || lowerQuery === keyword + 's') { // Exato ou plural
        return tip;
      }
    }
    
    // Verificar sinônimos apenas para consultas simples
    for (const [mainWord, synonyms] of Object.entries(PRODUCT_SYNONYMS)) {
      if (synonyms.some(synonym => lowerQuery === synonym || lowerQuery === synonym + 's')) {
        return CONTEXTUAL_TIPS[mainWord] || null;
      }
    }
    
    return null;
  };
  
  // Função para Text-to-Speech
  const speakText = (text: string, messageId: string) => {
    // Parar fala atual se existir
    if (currentSpeech) {
      speechSynthesis.cancel();
    }
    
    // Limpar texto para fala (remover markdown e formatação)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remover negrito
      .replace(/\*(.*?)\*/g, '$1') // Remover itálico
      .replace(/\[.*?\]/g, '') // Remover classificações
      .replace(/https?:\/\/[^\s]+/g, 'link') // Substituir URLs
      .replace(/\n/g, '. '); // Quebras de linha como pausas
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onend = () => {
      setCurrentSpeech(null);
    };
    
    utterance.onerror = () => {
      setCurrentSpeech(null);
      toast.error('Erro ao reproduzir áudio');
    };
    
    setCurrentSpeech(utterance);
    speechSynthesis.speak(utterance);
  };
  
  // Função para parar fala
  const stopSpeech = () => {
    if (currentSpeech) {
      speechSynthesis.cancel();
      setCurrentSpeech(null);
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText: string, skipAI: boolean = false) => {
    if (isLoading && !skipAI) return; // bloqueia enquanto aguarda a IA responder
    
    // Aplicar busca semântica
    const enhancedQuery = enhanceQuery(messageText);
    
    // Obter dica contextual
    const tip = getContextualTip(messageText);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessagesToStorage(updatedMessages);

    // Se skipAI for true, não chama a IA (usado para análise múltipla)
    if (skipAI) return;

    setIsLoading(true);
    
    // Mostrar modal com dica durante carregamento
    if (tip) {
      setLoadingTip(tip);
      setLoadingQuery(messageText);
      setShowLoadingTip(true);
    }

    try {
      const response = await sendMessageToGemini(enhancedQuery);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        hasAudio: true
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      saveMessagesToStorage(finalMessages);
      
    } catch (error) {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      console.error('Erro:', error);
      // Em caso de erro, remove apenas a mensagem do usuário que acabou de ser adicionada
      setMessages(messages);
      saveMessagesToStorage(messages);
    } finally {
      setIsLoading(false);
      setShowLoadingTip(false);
      setLoadingTip('');
      setLoadingQuery('');
    }
  };

  // Função para adicionar mensagem do bot diretamente
  const addBotMessage = (messageText: string) => {
    const aiMessage: Message = {
      id: Date.now().toString() + Math.random().toString(),
      text: messageText,
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, aiMessage];
      saveMessagesToStorage(newMessages);
      return newMessages;
    });
  };

  const clearChat = () => {
    const initialMessage = {
      id: '1',
      text: 'Olá! Sou seu assistente para dúvidas sobre a política de produtos proibidos da Shopee. Como posso ajudá-lo hoje?',
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
    saveMessagesToStorage([initialMessage]);
  };

  // Cleanup de áudio
  useEffect(() => {
    return () => {
      if (currentSpeech) {
        speechSynthesis.cancel();
      }
    };
  }, [currentSpeech]);
  
  // Expor funções globalmente para o botão no header e outros componentes
  React.useEffect(() => {
    (window as any).clearShopeeChat = clearChat;
    (window as any).addBotMessage = addBotMessage;
    (window as any).setMultiAnalysisLoading = setIsMultiAnalysisLoading;
    return () => {
      delete (window as any).clearShopeeChat;
      delete (window as any).addBotMessage;
      delete (window as any).setMultiAnalysisLoading;
    };
  }, []);

  return (
    <>
      <LoadingTipModal
        isOpen={showLoadingTip}
        tip={loadingTip}
        query={loadingQuery}
      />
      
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 relative">
        <div className="flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="px-3 sm:px-4 pb-40">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                  messageId={message.id}
                  hasAudio={message.hasAudio}
                  onPlayAudio={speakText}
                />
              ))}
              {(isLoading || isMultiAnalysisLoading) && !showLoadingTip && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                  <div className="rounded-lg p-3 bg-muted text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 z-50 border-t border-gray-200 dark:border-gray-700">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
};

export default ChatInterface;
