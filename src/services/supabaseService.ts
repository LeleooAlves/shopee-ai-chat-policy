import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://krqlntqemmywgdmmvaie.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycWxudHFlbW15d2dkbW12YWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzQ5NTMsImV4cCI6MjA3MjkxMDk1M30.Gma6YsZe1GW5lwdaLvdzzz09yEEsu3zel4R0tF1iMmY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  created_at: string;
  updated_at: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  time_used: number;
  final_score: number;
  created_at: string;
  users?: User;
}

export interface RankingEntry {
  user_id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  best_score: number;
  total_quizzes: number;
  average_score: number;
  last_quiz: string;
}

class SupabaseService {
  async createUser(firstName: string, lastName: string, teamName: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            team_name: teamName
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return null;
    }
  }

  async findUserByName(firstName: string, lastName: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao buscar usuário:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  async saveQuizResult(
    firstName: string,
    lastName: string,
    teamName: string,
    score: number,
    timeUsed: number,
    finalScore: number,
    difficulty: string,
    totalQuestions: number = 10
  ): Promise<void> {
    try {
      // Validação dos dados antes do envio
      const validatedData = {
        first_name: String(firstName).trim() || 'Anônimo',
        last_name: String(lastName).trim() || 'Usuário',
        team_name: String(teamName).trim() || 'Sem Time',
        score: Math.max(0, Math.floor(Number(score) || 0)),
        time_used: Math.max(0, Math.floor(Number(timeUsed) || 0)),
        final_score: Math.max(0, Math.floor(Number(finalScore) || 0)),
        difficulty: String(difficulty).trim() || 'medium',
        total_questions: Math.max(1, Math.floor(Number(totalQuestions) || 10))
      };

      const { error } = await supabase
        .from('quiz_leaderboard')
        .insert(validatedData);

      if (error) {
        console.error('Error saving quiz result:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveQuizResult:', error);
      throw error;
    }
  }

  async getGlobalRanking(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_leaderboard')
        .select('*')
        .order('final_score', { ascending: false })
        .order('time_used', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching global ranking:', error);
        throw error;
      }

      return data?.map((item: any, index: number) => ({
        position: index + 1,
        name: `${item.first_name} ${item.last_name}`,
        team: item.team_name,
        score: item.final_score,
        correctAnswers: item.score || 0,
        totalQuestions: item.total_questions || 10,
        timeUsed: item.time_used,
        difficulty: item.difficulty || 'medium',
        date: new Date(item.created_at)
      })) || [];
    } catch (error) {
      console.error('Error fetching global ranking:', error);
      return [];
    }
  }

  async getTeamRanking(): Promise<{ team_name: string; average_score: number; total_members: number; total_quizzes: number }[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select(`
          final_score,
          users (
            team_name
          )
        `);

      if (error) {
        console.error('Erro ao buscar ranking de times:', error);
        return [];
      }

      // Agrupar por time
      const teamStats = new Map<string, { scores: number[]; members: Set<string> }>();

      data.forEach((result: any) => {
        const teamName = result.users?.team_name;
        if (!teamName) return;

        if (!teamStats.has(teamName)) {
          teamStats.set(teamName, { scores: [], members: new Set() });
        }

        const teamStat = teamStats.get(teamName)!;
        teamStat.scores.push(result.final_score);
      });

      // Converter para ranking de times
      const teamRanking = Array.from(teamStats.entries()).map(([teamName, stats]) => ({
        team_name: teamName,
        average_score: Math.round(stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length),
        total_members: stats.members.size,
        total_quizzes: stats.scores.length
      }));

      return teamRanking.sort((a, b) => b.average_score - a.average_score);
    } catch (error) {
      console.error('Erro ao buscar ranking de times:', error);
      return [];
    }
  }

  async getUserStats(userId: string): Promise<{
    total_quizzes: number;
    best_score: number;
    average_score: number;
    recent_results: QuizResult[];
  } | null> {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar estatísticas do usuário:', error);
        return null;
      }

      if (data.length === 0) {
        return {
          total_quizzes: 0,
          best_score: 0,
          average_score: 0,
          recent_results: []
        };
      }

      const scores = data.map(result => result.final_score);
      
      return {
        total_quizzes: data.length,
        best_score: Math.max(...scores),
        average_score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
        recent_results: data.slice(0, 10)
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      return null;
    }
  }

  // Método para salvar feedback
  async saveFeedback(messageId: string, type: 'positive' | 'negative', comment?: string, userAgent?: string, messageText?: string, userQuestion?: string, aiResponse?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          message_id: messageId,
          feedback_type: type,
          comment: comment || null,
          user_agent: userAgent || 'unknown'
        });

      if (error) {
        console.error('Erro ao salvar feedback:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao salvar feedback no Supabase:', error);
      throw error;
    }
  }

  async getFeedbackStats(): Promise<{
    total: number;
    positive: number;
    negative: number;
    comments: Array<{ comment: string; created_at: string }>;
  }> {
    const { data, error } = await supabase
      .from('feedback')
      .select('feedback_type, comment, created_at');

    if (error) {
      console.error('Error fetching feedback stats:', error);
      throw error;
    }

    const total = data?.length || 0;
    const positive = data?.filter(f => f.feedback_type === 'positive').length || 0;
    const negative = data?.filter(f => f.feedback_type === 'negative').length || 0;
    const comments = data?.filter(f => f.comment && f.feedback_type === 'negative')
      .map(f => ({ comment: f.comment!, created_at: f.created_at })) || [];

    return { total, positive, negative, comments };
  }

  // Analytics methods
  async saveAnalyticsEvent(
    eventType: string,
    eventData: any,
    userAgent?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_data')
        .insert({
          event_type: eventType,
          event_data: eventData,
          user_agent: userAgent || 'unknown'
        });

      if (error) {
        console.error('Erro ao salvar evento de analytics:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao salvar analytics no Supabase:', error);
      throw error;
    }
  }

  // Método para migrar dados de quiz do localStorage para Supabase
  async clearAllQuizResults(): Promise<void> {
    try {
      const { error } = await supabase
        .from('quiz_leaderboard')
        .delete()
        .neq('id', 0); // Delete all records

      if (error) {
        console.error('Error clearing quiz results:', error);
        throw error;
      }

      console.log('Todos os resultados de quiz foram removidos com sucesso');
    } catch (error) {
      console.error('Error in clearAllQuizResults:', error);
      throw error;
    }
  }

  async migrateQuizResults(): Promise<{ success: number; errors: number }> {
    const localResults = JSON.parse(localStorage.getItem('quiz-results') || '[]');
    let successCount = 0;
    let errorCount = 0;

    console.log(`Iniciando migração de ${localResults.length} resultados de quiz para o Supabase...`);

    for (const result of localResults) {
      try {
        // Simular dados de usuário para resultados antigos
        const mockUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.saveQuizResult(
          'Usuário',
          'Migrado',
          'Sistema',
          result.score,
          result.timeUsed || 0,
          result.score,
          'medium',
          10
        );
        successCount++;
      } catch (error) {
        console.error(`Erro ao migrar resultado de quiz:`, error);
        errorCount++;
      }
    }

    console.log(`Migração de quiz concluída: ${successCount} sucessos, ${errorCount} erros`);
    return { success: successCount, errors: errorCount };
  }

  // Método para deletar feedback por ID
  async deleteFeedback(id: string): Promise<void> {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar feedback: ${error.message}`);
    }
  }

  // Deletar feedback por messageId
  async deleteFeedbackByMessageId(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('message_id', messageId);

    if (error) {
      throw new Error(`Erro ao deletar feedback: ${error.message}`);
    }
  }

  async getAnalyticsData(): Promise<any[]> {
    const { data, error } = await supabase
      .from('analytics_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }

    return data || [];
  }

  // Método para zerar todos os dados de analytics
  async clearAllAnalytics(): Promise<void> {
    try {
      // Deletar todos os dados de feedback
      const { error: feedbackError } = await supabase
        .from('feedback')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos os registros

      if (feedbackError) {
        console.error('Erro ao deletar feedbacks:', feedbackError);
        throw feedbackError;
      }

      // Deletar todos os dados de analytics
      const { error: analyticsError } = await supabase
        .from('analytics_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos os registros

      if (analyticsError) {
        console.error('Erro ao deletar analytics:', analyticsError);
        throw analyticsError;
      }

      console.log('Todos os dados de analytics foram removidos do Supabase');
    } catch (error) {
      console.error('Erro ao limpar analytics do Supabase:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();
