import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Trophy, Medal, Award, Clock, Users } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RankingEntry {
  position: number;
  name: string;
  team: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeUsed: number;
  difficulty: string;
  date: Date;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose
}) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  useEffect(() => {
    if (isOpen) {
      loadRankings();
    }
  }, [isOpen, selectedDifficulty]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getGlobalRanking(20);
      setRankings(data);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRankings = rankings
    .filter(entry => entry.difficulty === selectedDifficulty)
    .map((entry, index) => ({ ...entry, position: index + 1 }));

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ranking Global do Quiz
          </DialogTitle>
        </DialogHeader>
        
        {/* Abas de Dificuldade */}
        <div className="flex gap-2 mb-4 border-b">
          <button
            onClick={() => setSelectedDifficulty('easy')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedDifficulty === 'easy'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🟢 Fácil
          </button>
          <button
            onClick={() => setSelectedDifficulty('medium')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedDifficulty === 'medium'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🟡 Médio
          </button>
          <button
            onClick={() => setSelectedDifficulty('hard')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedDifficulty === 'hard'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🔴 Difícil
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRankings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum resultado encontrado para esta dificuldade.</p>
              <p className="text-sm">Seja o primeiro a completar o quiz neste nível!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRankings.map((entry, index) => (
                <div
                  key={`${entry.name}-${entry.date.getTime()}`}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    index < 3 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {entry.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {entry.team}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">
                        {entry.correctAnswers || 0}/{entry.totalQuestions || 10} ({entry.score} pts)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(entry.timeUsed)}
                      </span>
                      <span className="text-xs">
                        {entry.date.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={loadRankings} disabled={loading}>
            Atualizar
          </Button>
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
