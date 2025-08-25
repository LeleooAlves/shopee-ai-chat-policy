
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const renderMessageWithLinks = (message: string, isUser: boolean, textColor: string) => {
  // Detectar links no formato "link: URL"
  const linkRegex = /link:\s*(https?:\/\/[^\s]+)/gi;
  const parts = message.split(linkRegex);
  
  return parts.map((part, index) => {
    // Se é um URL (índices ímpares após split)
    if (index % 2 === 1) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline hover:opacity-80 transition-opacity ${
            isUser ? 'text-blue-100' : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          {part}
        </a>
      );
    }
    
    // Texto normal
    return part;
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp }) => {
  const messageStyle = !isUser ? getMessageStyle(message) : null;
  
  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
          isUser ? 'bg-blue-500' : 'bg-orange-500'
        }`}>
          {isUser ? '👤' : '🤖'}
        </div>
        <div className={`rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : messageStyle?.bgColor || 'bg-muted text-muted-foreground'
        }`}>
          {messageStyle?.label && (
            <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${messageStyle.labelColor}`}>
              {messageStyle.label}
            </div>
          )}
          <div className={`text-sm whitespace-pre-wrap ${
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
  );
};

export default ChatMessage;
