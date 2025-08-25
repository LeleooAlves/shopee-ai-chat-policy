
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
    const startsWithDepende = lower.startsWith('depende.');
    const hasRestrictionHint = /restrit|autorização|autorizacao|licen[cç]a|vendedor(?:es)? autorizad|somente para vendedores com autoriza|apenas para vendedores com autoriza|somente para vendedores autorizad|apenas vendedores autorizad|documenta[cç][aã]o\s+complementar|mediante\s+apresenta[cç][aã]o\s+de\s+documenta[cç][aã]o|apresenta[cç][aã]o\s+de\s+documentos|mediante\s+documenta[cç][aã]o|com\s+documenta[cç][aã]o\s+complementar/i.test(lower);
    const lastProib = lower.lastIndexOf('proibid');
    const lastPermit = lower.lastIndexOf('permitid');

    let conclusion: 'proibido' | 'permitido' | 'depende' | 'restrito' | null = null;
    if (startsWithDepende) {
      conclusion = 'depende';
    } else if (startsWithPermitido) {
      conclusion = 'permitido';
    } else if (isPolicyResponse) {
      if (lastPermit > lastProib && lastPermit !== -1) conclusion = 'permitido';
      else if (lastProib > lastPermit && lastProib !== -1) conclusion = 'proibido';
    }

    // Se o texto indicar necessidade de autorização/licença, priorize RESTRITO
    if (hasRestrictionHint) {
      conclusion = 'restrito';
    }

    const altIndex = message.indexOf('Alternativa:');
    const mainText = altIndex >= 0 ? message.slice(0, altIndex).trim() : message.trim();
    const altText = altIndex >= 0 ? message.slice(altIndex).trim() : '';

    return {
      content: mainText,
      alternative: altText,
      isProibido: conclusion === 'proibido',
      isPermitido: conclusion === 'permitido',
      isDepende: conclusion === 'depende',
      isRestrito: conclusion === 'restrito',
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
              {formatted?.showBadge && formatted?.isDepende && (
                <span className="font-bold uppercase inline-block rounded px-1.5 py-0.5 bg-amber-100 text-amber-700 mr-1">depende</span>
              )}
              {formatted?.showBadge && formatted?.isRestrito && (
                <span className="font-bold uppercase inline-block rounded px-1.5 py-0.5 bg-blue-100 text-blue-700 mr-1">restrito</span>
              )}
              {formatted?.showBadge && (formatted?.isProibido || formatted?.isPermitido || formatted?.isDepende || formatted?.isRestrito) && ''}
              <span>
                {(() => {
                  const regex = /(proibid[oa]s?|permitid[oa]s?|restrit[oa]s?)/gi;
                  const parts = (formatted?.content ?? '').split(regex);
                  return parts.map((part, idx) => {
                    if (/^proibid/i.test(part)) {
                      return <span key={idx} className="text-red-700 font-semibold">{part}</span>;
                    }
                    if (/^permitid/i.test(part)) {
                      return <span key={idx} className="text-green-700 font-semibold">{part}</span>;
                    }
                    if (/^restrit/i.test(part)) {
                      return <span key={idx} className="text-blue-700 font-semibold">{part}</span>;
                    }
                    return <React.Fragment key={idx}>{part}</React.Fragment>;
                  });
                })()}
              </span>
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
