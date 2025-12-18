import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Bot, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import AddLinkModal from './AddLinkModal';
// import FeedbackButtons from './FeedbackButtons';
// import { feedbackService } from '@/services/feedbackService';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  messageId?: string;
  hasAudio?: boolean;
  onPlayAudio?: (text: string, messageId: string) => void;
}

const getMessageStyle = (message: string) => {
  const cleanMessage = message.trim().replace(/^\*\*|\*\*$/g, '');
  const firstLine = cleanMessage.split('\n')[0].toLowerCase();

  // Helper detect functions
  const isProhibited = firstLine.includes('proibido');
  const isRestricted = firstLine.includes('restrito');
  const isPermitted = firstLine.includes('permitido');
  const isInsufficient = firstLine.includes('informação insuficiente');
  const isDepends = firstLine.includes('depende');

  if (isProhibited) {
    return {
      bgColor: 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500',
      textColor: 'text-red-800 dark:text-red-200',
      label: 'PROIBIDO',
      labelColor: 'bg-red-500 text-white'
    };
  }

  if (isRestricted) {
    return {
      bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500',
      textColor: 'text-orange-800 dark:text-orange-200',
      label: 'RESTRITO',
      labelColor: 'bg-orange-500 text-white'
    };
  }

  if (isPermitted) {
    return {
      bgColor: 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500',
      textColor: 'text-green-800 dark:text-green-200',
      label: 'PERMITIDO',
      labelColor: 'bg-green-500 text-white'
    };
  }

  if (isDepends) {
    return {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      label: 'DEPENDE',
      labelColor: 'bg-yellow-500 text-white'
    };
  }

  if (isInsufficient) {
    return {
      bgColor: 'bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-400',
      textColor: 'text-gray-800 dark:text-gray-200',
      label: 'SEM INFOS',
      labelColor: 'bg-gray-400 text-white'
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
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [categoryName, setCategoryName] = useState('');
  const messageStyle = !isUser ? getMessageStyle(message) : null;

  /* 
  const handleFeedback = (msgId: string, type: 'positive' | 'negative', comment?: string) => {
    ...
  };
  */

  const renderMessageWithLinks = (message: string, isUser: boolean, textColor: string) => {
    return message;
  };

  return (
    <>
      {/* 
      <AddLinkModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        categoryName={categoryName} 
      /> 
      */}
      <div className={`flex gap-3 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isUser ? 'max-w-[85%]' : 'max-w-[85%]'}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${isUser ? 'bg-blue-500 dark:bg-blue-600' : 'bg-orange-500 dark:bg-orange-600'
            }`}>
            {isUser ? '👤' : '🤖'}
          </div>
          <div className={`rounded-lg p-3 inline-block max-w-fit ${isUser
            ? 'bg-blue-500 dark:bg-blue-600 text-white'
            : messageStyle?.bgColor || 'bg-gray-100 dark:bg-gray-800'
            }`}>
            {messageStyle?.label && (
              <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${messageStyle.labelColor}`}>
                {messageStyle.label}
              </div>
            )}
            <div className={`text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere ${isUser ? 'text-white' : messageStyle?.textColor || 'text-gray-800 dark:text-gray-200'
              }`}>
              {renderMessageWithLinks(
                message,
                isUser,
                isUser ? 'text-white' : messageStyle?.textColor || 'text-muted-foreground'
              )}
            </div>
            <p className={`text-xs mt-1 opacity-70 ${isUser ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'
              }`}>
              {format(timestamp, 'HH:mm', { locale: ptBR })}
            </p>
            {!isUser && messageId && messageId !== '1' && (
              <div className="flex items-center justify-between mt-2">
                {/* 
                <FeedbackButtons
                  messageId={messageId}
                  messageText={message}
                  onFeedback={handleFeedback}
                /> 
                */}
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
