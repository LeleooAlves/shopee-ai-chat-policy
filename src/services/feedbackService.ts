// Generate UUID without external dependency
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
import { supabaseService } from './supabaseService';

interface FeedbackData {
  messageId: string;
  messageText: string;
  userQuestion?: string;
  aiResponse?: string;
  feedbackType: 'positive' | 'negative';
  comment?: string;
  timestamp: Date;
  userAgent: string;
}

export interface Feedback {
  id: string;
  messageId: string;
  messageText: string;
  userQuestion?: string;
  aiResponse?: string;
  type: 'positive' | 'negative';
  comment?: string;
  timestamp: Date;
  userAgent: string;
}

class FeedbackService {
  private readonly STORAGE_KEY = 'shopee-chat-feedback';
  private feedbacks: FeedbackData[] = [];

  constructor() {
    this.loadFeedbacks();
  }

  private loadFeedbacks() {
    try {
      const stored = localStorage.getItem('shopee-chat-feedbacks');
      if (stored) {
        this.feedbacks = JSON.parse(stored).map((f: any) => ({
          ...f,
          timestamp: new Date(f.timestamp)
        }));
      }
    } catch {
      this.feedbacks = [];
    }
  }

  async saveFeedback(data: { messageId: string, messageText: string, userQuestion?: string, aiResponse?: string, feedbackType: 'positive' | 'negative', comment?: string, timestamp: Date, userAgent: string }): Promise<void> {
    const feedback: Feedback = {
      id: generateUUID(),
      messageId: data.messageId,
      messageText: data.messageText,
      userQuestion: data.userQuestion,
      aiResponse: data.aiResponse,
      type: data.feedbackType,
      comment: data.comment || '',
      timestamp: data.timestamp,
      userAgent: data.userAgent
    };

    // Save to Supabase
    try {
      await supabaseService.saveFeedback(data.messageId, data.feedbackType, data.comment, data.userAgent, data.messageText, data.userQuestion, data.aiResponse);
    } catch (error) {
      console.error('Error saving feedback to Supabase:', error);
      // Fallback to localStorage if Supabase fails
      const existingFeedback = this.getAllFeedback();
      existingFeedback.push(feedback);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingFeedback));
    }

    // Also save locally for immediate access
    const existingFeedback = this.getAllFeedback();
    existingFeedback.push(feedback);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingFeedback));
  }

  getAllFeedback(): Feedback[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((f: any) => ({
        ...f,
        messageText: f.messageText || 'Mensagem não disponível',
        timestamp: new Date(f.timestamp)
      }));
    } catch {
      return [];
    }
  }

  getFeedbackStats(): {
    total: number;
    positive: number;
    negative: number;
    positiveRate: number;
    negativeRate: number;
  } {
    // Usar apenas localStorage por enquanto para evitar problemas de async
    const localFeedbacks = this.getAllFeedback();
    const total = localFeedbacks.length;
    const positive = localFeedbacks.filter(f => f.type === 'positive').length;
    const negative = localFeedbacks.filter(f => f.type === 'negative').length;
    
    return {
      total,
      positive,
      negative,
      positiveRate: total > 0 ? (positive / total) * 100 : 0,
      negativeRate: total > 0 ? (negative / total) * 100 : 0
    };
  }

  getNegativeFeedbackComments(): Array<{
    comment: string;
    timestamp: Date;
    messageId: string;
    messageText: string;
    userQuestion?: string;
    aiResponse?: string;
  }> {
    // Usar apenas localStorage por enquanto para evitar problemas de async
    const localFeedbacks = this.getAllFeedback();
    return localFeedbacks
      .filter(f => f.type === 'negative' && f.comment && f.comment.trim() !== '')
      .map(f => ({
        comment: f.comment!,
        timestamp: f.timestamp,
        messageId: f.messageId,
        messageText: f.messageText || 'Mensagem não disponível',
        userQuestion: f.userQuestion,
        aiResponse: f.aiResponse
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  clearAllFeedback(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getFeedbackByMessageId(messageId: string): { type: 'positive' | 'negative', comment?: string } | null {
    const allFeedback = this.getAllFeedback();
    const feedback = allFeedback.find(f => f.messageId === messageId);
    
    if (feedback) {
      return {
        type: feedback.type,
        comment: feedback.comment
      };
    }
    
    return null;
  }

  hasFeedback(messageId: string): boolean {
    return this.getFeedbackByMessageId(messageId) !== null;
  }

  // Método para migrar dados existentes do localStorage para Supabase
  async migrateLocalDataToSupabase(): Promise<{ success: number; errors: number }> {
    const localFeedbacks = this.getAllFeedback();
    let successCount = 0;
    let errorCount = 0;

    console.log(`Iniciando migração de ${localFeedbacks.length} feedbacks para o Supabase...`);

    for (const feedback of localFeedbacks) {
      try {
        await supabaseService.saveFeedback(
          feedback.messageId,
          feedback.type,
          feedback.comment,
          feedback.userAgent,
          feedback.messageText
        );
        successCount++;
      } catch (error) {
        console.error(`Erro ao migrar feedback ${feedback.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Migração concluída: ${successCount} sucessos, ${errorCount} erros`);
    return { success: successCount, errors: errorCount };
  }

  // Método público para adicionar feedback (usado pelos componentes)
  addFeedback(messageId: string, messageText: string, type: 'positive' | 'negative', comment?: string, userQuestion?: string, aiResponse?: string): void {
    const data = {
      messageId,
      messageText,
      userQuestion,
      aiResponse,
      feedbackType: type,
      comment,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    };
    
    this.saveFeedback(data);
  }

  // Método para deletar feedback por messageId
  async deleteFeedback(messageId: string): Promise<void> {
    try {
      // Remover do localStorage
      const feedbacks = this.getAllFeedback();
      const updatedFeedbacks = feedbacks.filter(f => f.messageId !== messageId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFeedbacks));

      // Remover do Supabase
      await supabaseService.deleteFeedbackByMessageId(messageId);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }

  // Método para zerar todos os dados de analytics
  async clearAllAnalytics(): Promise<void> {
    try {
      // Limpar localStorage
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('shopee-chat-messages');
      localStorage.removeItem('shopee-analytics-data');
      
      // Limpar dados do Supabase
      await supabaseService.clearAllAnalytics();
      
      console.log('Todos os dados de analytics foram removidos');
    } catch (error) {
      console.error('Error clearing all analytics:', error);
      throw error;
    }
  }

}

export const feedbackService = new FeedbackService();
