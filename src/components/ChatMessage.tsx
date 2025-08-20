
import React, { useMemo } from 'react';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp }) => {
  const formatted = useMemo(() => {
    if (isUser) return { content: message };

    const lower = message.toLowerCase();
    const isPolicyResponse = lower.includes('segundo a política');
    const startsWithPermitido = lower.startsWith('permitido.');
    const lastProib = lower.lastIndexOf('proibid');
    const lastPermit = lower.lastIndexOf('permitid');

    let conclusion: 'proibido' | 'permitido' | null = null;
    if (startsWithPermitido) {
      conclusion = 'permitido';
    } else if (isPolicyResponse) {
      if (lastPermit > lastProib && lastPermit !== -1) conclusion = 'permitido';
      else if (lastProib > lastPermit && lastProib !== -1) conclusion = 'proibido';
    }

    const altIndex = message.indexOf('Alternativa:');
    const mainText = altIndex >= 0 ? message.slice(0, altIndex).trim() : message.trim();
    const altText = altIndex >= 0 ? message.slice(altIndex).trim() : '';

    return {
      content: mainText,
      alternative: altText,
      isProibido: conclusion === 'proibido',
      isPermitido: conclusion === 'permitido',
      isPolicyResponse,
      showBadge: conclusion !== null,
    };
  }, [message, isUser]);

  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-orange-500 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div className={`rounded-lg p-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {formatted?.showBadge && formatted?.isProibido && (
                <span className="font-bold uppercase inline-block rounded px-1.5 py-0.5 bg-red-100 text-red-700 mr-1">proibido</span>
              )}
              {formatted?.showBadge && formatted?.isPermitido && !formatted?.isProibido && (
                <span className="font-bold uppercase inline-block rounded px-1.5 py-0.5 bg-green-100 text-green-700 mr-1">permitido</span>
              )}
              {formatted?.showBadge && (formatted?.isProibido || formatted?.isPermitido) && ''}
              <span>{formatted?.content}</span>
              {formatted?.alternative && (
                <>
                  {'\n'}
                  <span className="font-semibold inline-block rounded px-1 bg-yellow-100 text-yellow-800">Alternativa</span>
                  {': '}
                  <span>{formatted?.alternative.replace(/^Alternativa:\s*/,'')}</span>
                </>
              )}
            </div>
          )}
          <span className="text-xs opacity-70 mt-2 block">
            {timestamp.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
