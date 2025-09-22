import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Bot, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddLinkModal from './AddLinkModal';
import FeedbackButtons from './FeedbackButtons';
import { feedbackService } from '@/services/feedbackService';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  messageId?: string;
  hasAudio?: boolean;
  onPlayAudio?: (text: string, messageId: string) => void;
}

const getMessageStyle = (message: string) => {
  const lowerMessage = message.toLowerCase();
  
  // Verificar padrões para análise múltipla (Produto X: nome)
  if (lowerMessage.includes('produto ') && lowerMessage.includes(':')) {
    // Extrair o conteúdo após o nome do produto
    const productAnalysis = message.split('\n\n')[1] || message;
    const analysisLower = productAnalysis.toLowerCase();
    
    if (analysisLower.startsWith('permitido.')) {
      return {
        bgColor: 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500',
        textColor: 'text-green-800 dark:text-green-200',
        label: 'PERMITIDO',
        labelColor: 'bg-green-500 text-white'
      };
    }
    
    if (analysisLower.startsWith('proibido.')) {
      return {
        bgColor: 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500',
        textColor: 'text-red-800 dark:text-red-200',
        label: 'PROIBIDO',
        labelColor: 'bg-red-500 text-white'
      };
    }
    
    if (analysisLower.startsWith('depende.')) {
      return {
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500',
        textColor: 'text-yellow-800 dark:text-yellow-200',
        label: 'DEPENDE',
        labelColor: 'bg-yellow-500 text-white'
      };
    }
    
    if (analysisLower.startsWith('restrito.')) {
      return {
        bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500',
        textColor: 'text-orange-800 dark:text-orange-200',
        label: 'RESTRITO',
        labelColor: 'bg-orange-500 text-white'
      };
    }
  }
  
  // Verificar padrões normais
  if (lowerMessage.startsWith('permitido.')) {
    return {
      bgColor: 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500',
      textColor: 'text-green-800 dark:text-green-200',
      label: 'PERMITIDO',
      labelColor: 'bg-green-500 text-white'
    };
  }
  
  if (lowerMessage.startsWith('proibido.')) {
    return {
      bgColor: 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500',
      textColor: 'text-red-800 dark:text-red-200',
      label: 'PROIBIDO',
      labelColor: 'bg-red-500 text-white'
    };
  }
  
  if (lowerMessage.startsWith('depende.')) {
    return {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      label: 'DEPENDE',
      labelColor: 'bg-yellow-500 text-white'
    };
  }
  
  if (lowerMessage.startsWith('restrito.')) {
    return {
      bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500',
      textColor: 'text-orange-800 dark:text-orange-200',
      label: 'RESTRITO',
      labelColor: 'bg-orange-500 text-white'
    };
  }
  
  return {
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-800 dark:text-gray-200',
    label: null,
    labelColor: ''
  };
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp, messageId, hasAudio, onPlayAudio }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const messageStyle = !isUser ? getMessageStyle(message) : null;

  const handleFeedback = (msgId: string, type: 'positive' | 'negative', comment?: string) => {
    // Verificar se já existe feedback para evitar duplicação
    if (feedbackService.hasFeedback(msgId)) {
      return;
    }
    
    // Capturar pergunta e resposta para feedbacks negativos
    let userQuestion = '';
    let aiResponse = message;
    
    if (type === 'negative') {
      // Buscar mensagens do localStorage para encontrar a pergunta correspondente
      try {
        const stored = localStorage.getItem('shopee-chat-messages');
        if (stored) {
          const messages = JSON.parse(stored);
          const currentIndex = messages.findIndex((msg: any) => msg.id === msgId);
          
          // Encontrar a pergunta do usuário anterior a esta resposta
          if (currentIndex > 0) {
            const previousMessage = messages[currentIndex - 1];
            if (previousMessage && previousMessage.isUser) {
              userQuestion = previousMessage.text;
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar pergunta do usuário:', error);
      }
    }
    
    feedbackService.addFeedback(msgId, message, type, comment, userQuestion, aiResponse);
  };

  const handleAddLinkClick = (text: string) => {
    // Extrair categoria completa com número e nome (ex: "17.3. SUPLEMENTOS ALIMENTARES")
    const categoryMatch = text.match(/política\s+(\d+(?:\.\d+)*\.?\s*[A-ZÁÊÇÕ\s]+)/i) || 
                         text.match(/(\d+(?:\.\d+)*\.?\s*[A-ZÁÊÇÕ\s]+)/);
    
    let extractedCategory = 'Categoria não identificada';
    
    if (categoryMatch) {
      extractedCategory = categoryMatch[1].trim();
      // Remover ponto final se existir
      if (extractedCategory.endsWith('.')) {
        extractedCategory = extractedCategory.slice(0, -1);
      }
      // Se só tem número, tentar extrair nome da categoria da resposta
      if (/^\d+$/.test(extractedCategory)) {
        const fullCategoryMatch = text.match(/política\s+[A-ZÁÊÇÕ\s]+/i);
        if (fullCategoryMatch) {
          extractedCategory = fullCategoryMatch[0].replace(/política\s+/i, '').trim();
        }
      }
    }
    
    setCategoryName(extractedCategory);
    setIsModalOpen(true);
  };

  const renderMessageWithLinks = (message: string, isUser: boolean, textColor: string) => {
    const parts = message.split(/(https?:\/\/[^\s]+|link da categoria não encontrado)/g);
    
    return parts.map((part, index) => {
      if (part.match(/^https?:\/\//)) {
        return (
          <button
            key={index}
            onClick={() => window.open(part, '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center px-3 py-1 mt-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
          >
            🔗 Clique aqui para verificar a política
          </button>
        );
      }
      
      if (part === 'link da categoria não encontrado') {
        // Não mostrar botão se a mensagem contém "Item não citado nas políticas"
        if (message.includes('Item não citado nas políticas')) {
          return null;
        }
        
        return (
          <button
            key={index}
            onClick={() => handleAddLinkClick(message)}
            className="inline-flex items-center px-3 py-1 mt-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
          >
            📎 Clique aqui para adicionar o link da política
          </button>
        );
      }
      
      return part;
    });
  };
  
  return (
    <>
      <AddLinkModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        categoryName={categoryName} 
      />
      <div className={`flex gap-3 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isUser ? 'max-w-[85%]' : 'max-w-[85%]'}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isUser ? 'bg-blue-500 dark:bg-blue-600' : 'bg-orange-500 dark:bg-orange-600'
          }`}>
            {isUser ? '👤' : '🤖'}
          </div>
          <div className={`rounded-lg p-3 inline-block max-w-fit ${
            isUser 
              ? 'bg-blue-500 dark:bg-blue-600 text-white' 
              : messageStyle?.bgColor || 'bg-gray-100 dark:bg-gray-800'
          }`}>
            {messageStyle?.label && (
              <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${messageStyle.labelColor}`}>
                {messageStyle.label}
              </div>
            )}
            <div className={`text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere ${
              isUser ? 'text-white' : messageStyle?.textColor || 'text-gray-800 dark:text-gray-200'
            }`}>
              {renderMessageWithLinks(
                message, 
                isUser, 
                isUser ? 'text-white' : messageStyle?.textColor || 'text-muted-foreground'
              )}
            </div>
            <p className={`text-xs mt-1 opacity-70 ${
              isUser ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {format(timestamp, 'HH:mm', { locale: ptBR })}
            </p>
            {!isUser && messageId && messageId !== '1' && (
              <div className="flex items-center justify-between mt-2">
                <FeedbackButtons
                  messageId={messageId}
                  messageText={message}
                  onFeedback={handleFeedback}
                />
                {hasAudio && onPlayAudio && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPlayAudio(message, messageId)}
                    className="ml-2 h-8 px-2 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                  >
                    <Volume2 className="w-3 h-3 text-orange-600 mr-1" />
                    <span className="text-xs text-orange-600">Ouvir</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatMessage;
