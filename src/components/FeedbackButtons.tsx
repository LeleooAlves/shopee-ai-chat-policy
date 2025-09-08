import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { feedbackService } from '@/services/feedbackService';

interface FeedbackButtonsProps {
  messageId: string;
  messageText: string;
  onFeedback: (messageId: string, type: 'positive' | 'negative', comment?: string) => void;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ 
  messageId, 
  messageText, 
  onFeedback 
}) => {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

  // Verificar se já existe feedback para esta mensagem ao carregar o componente
  useEffect(() => {
    const existingFeedback = feedbackService.getFeedbackByMessageId(messageId);
    if (existingFeedback) {
      setFeedbackGiven(existingFeedback.type);
    }
  }, [messageId]);

  const handleFeedback = (type: 'positive' | 'negative') => {
    if (type === 'negative') {
      setShowCommentBox(true);
    } else {
      onFeedback(messageId, type);
      setFeedbackGiven(type);
      toast.success('Obrigado pelo seu feedback!');
    }
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      onFeedback(messageId, 'negative', comment.trim());
      setFeedbackGiven('negative');
      setShowCommentBox(false);
      setComment('');
      toast.success('Feedback enviado! Obrigado por nos ajudar a melhorar.');
    }
  };

  if (feedbackGiven) {
    return (
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
        {feedbackGiven === 'positive' ? (
          <>
            <ThumbsUp className="w-4 h-4 text-green-500" />
            <span>Feedback positivo enviado</span>
          </>
        ) : (
          <>
            <ThumbsDown className="w-4 h-4 text-red-500" />
            <span>Feedback enviado para análise</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Esta resposta foi útil?</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback('positive')}
          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <ThumbsUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback('negative')}
          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <ThumbsDown className="w-4 h-4" />
        </Button>
      </div>

      {showCommentBox && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Como podemos melhorar esta resposta?</span>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Descreva o que estava incorreto ou como a resposta poderia ser melhor..."
            className="min-h-[80px] mb-2"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitComment}
              disabled={!comment.trim()}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Send className="w-4 h-4 mr-1" />
              Enviar Feedback
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCommentBox(false);
                setComment('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackButtons;
