import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Bot } from 'lucide-react';
import AddLinkModal from './AddLinkModal';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

const getMessageStyle = (message: string) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.startsWith('permitido.')) {
    return {
      bgColor: 'bg-green-100 border-l-4 border-green-500',
      textColor: 'text-green-800',
      label: 'PERMITIDO',
      labelColor: 'bg-green-500 text-white'
    };
  }
  
  if (lowerMessage.startsWith('proibido.')) {
    return {
      bgColor: 'bg-red-100 border-l-4 border-red-500',
      textColor: 'text-red-800',
      label: 'PROIBIDO',
      labelColor: 'bg-red-500 text-white'
    };
  }
  
  if (lowerMessage.startsWith('depende.')) {
    return {
      bgColor: 'bg-yellow-100 border-l-4 border-yellow-500',
      textColor: 'text-yellow-800',
      label: 'DEPENDE',
      labelColor: 'bg-yellow-500 text-white'
    };
  }
  
  if (lowerMessage.startsWith('restrito.')) {
    return {
      bgColor: 'bg-orange-100 border-l-4 border-orange-500',
      textColor: 'text-orange-800',
      label: 'RESTRITO',
      labelColor: 'bg-orange-500 text-white'
    };
  }
  
  return {
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    label: null,
    labelColor: ''
  };
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const messageStyle = !isUser ? getMessageStyle(message) : null;

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
            isUser ? 'bg-blue-500' : 'bg-orange-500'
          }`}>
            {isUser ? '👤' : '🤖'}
          </div>
          <div className={`rounded-lg p-3 inline-block max-w-fit ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : messageStyle?.bgColor || 'bg-muted text-muted-foreground'
          }`}>
            {messageStyle?.label && (
              <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${messageStyle.labelColor}`}>
                {messageStyle.label}
              </div>
            )}
            <div className={`text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere ${
              isUser ? 'text-white' : messageStyle?.textColor || 'text-muted-foreground'
            }`}>
              {renderMessageWithLinks(
                message, 
                isUser, 
                isUser ? 'text-white' : messageStyle?.textColor || 'text-muted-foreground'
              )}
            </div>
            <p className={`text-xs mt-1 opacity-70 ${
              isUser ? 'text-blue-100' : 'text-muted-foreground'
            }`}>
              {format(timestamp, 'HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatMessage;
