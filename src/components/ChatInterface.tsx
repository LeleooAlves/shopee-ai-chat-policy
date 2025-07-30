import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { sendMessageToGemini } from '@/services/geminiService';
import { ScrollArea } from '@/components/ui/scroll-area';
import politicasShopee from '@/data/Politicas Proibidos - Shopee.txt?raw';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou seu assistente para dúvidas sobre a política de produtos proibidos da Shopee. Como posso ajudá-lo hoje?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // segundos restantes
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
    }
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [cooldown]);

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

  const handleSendMessage = async (messageText: string) => {
    if (cooldown > 0) return; // bloqueia envio se ainda estiver no cooldown
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    const initialMessage = messages[0];
    setMessages([initialMessage, userMessage]);
    setIsLoading(true);
    setCooldown(60); // inicia cooldown de 60 segundos

    try {
      const response = await sendMessageToGemini(messageText, politicasShopee);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([initialMessage, userMessage, aiMessage]);
    } catch (error) {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      console.error('Erro:', error);
      setMessages([initialMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col max-h-[500px] min-h-[300px]">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-2 h-full">
          <div className="max-w-4xl mx-auto pb-4">
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
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} cooldown={cooldown} />
    </div>
  );
};

export default ChatInterface;
