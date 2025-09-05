import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { sendMessageToGemini } from '@/services/geminiService';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

    try {
      const response = await sendMessageToGemini(messageText);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
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

  // Expor funções globalmente para o botão no header e outros componentes
  React.useEffect(() => {
    (window as any).clearShopeeChat = clearChat;
    (window as any).addBotMessage = addBotMessage;
    return () => {
      delete (window as any).clearShopeeChat;
      delete (window as any).addBotMessage;
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="px-4 pb-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3 p-4">
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
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="flex-shrink-0">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatInterface;
