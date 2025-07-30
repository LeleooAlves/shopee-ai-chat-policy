
import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  cooldown?: number; // novo: segundos restantes
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, cooldown = 0 }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && cooldown === 0) {
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

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
      <div className="flex gap-2 max-w-4xl mx-auto items-center">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua pergunta sobre a política de proibidos da Shopee..."
          className="min-h-[50px] max-h-[120px] resize-none"
          disabled={isLoading || cooldown > 0}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!message.trim() || isLoading || cooldown > 0}
          className="h-[50px] w-[50px] flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
        {cooldown > 0 && (
          <span className="ml-2 text-sm text-orange-600 font-semibold min-w-[60px] text-center">
            Aguarde {cooldown}s
          </span>
        )}
      </div>
    </form>
  );
};

export default ChatInput;
