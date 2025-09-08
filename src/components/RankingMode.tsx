import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Users, TrendingUp, Clock, Target } from 'lucide-react';
import { supabaseService, RankingEntry } from '@/services/supabaseService';

const RankingMode: React.FC = () => {
  const [globalRanking, setGlobalRanking] = useState<RankingEntry[]>([]);
  const [teamRanking, setTeamRanking] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    setIsLoading(true);
    try {
      const [global, teams] = await Promise.all([
        supabaseService.getGlobalRanking(100),
        supabaseService.getTeamRanking()
      ]);
      
      setGlobalRanking(global);
      setTeamRanking(teams);
    } catch (error) {
      console.error('Erro ao carregar rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Ranking Individual</TabsTrigger>
          <TabsTrigger value="teams">Ranking por Times</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          {/* Top 3 Destacado */}
          {globalRanking.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {globalRanking.slice(0, 3).map((entry, index) => (
                <Card key={entry.user_id} className={`${
                  index === 0 ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' :
                  index === 1 ? 'ring-2 ring-gray-400 bg-gradient-to-br from-gray-50 to-slate-50' :
                  'ring-2 ring-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50'
                }`}>
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(index + 1)}
                    </div>
                    <CardTitle className="text-lg">
                      {entry.first_name} {entry.last_name}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mt-1">
                        {entry.team_name}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {entry.best_score} pts
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="w-4 h-4" />
                        Média: {entry.average_score} pts
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {entry.total_quizzes} quiz{entry.total_quizzes !== 1 ? 'zes' : ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Lista Completa */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking Completo</CardTitle>
              <CardDescription>Todos os participantes ordenados por melhor pontuação</CardDescription>
            </CardHeader>
            <CardContent>
              {globalRanking.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum resultado encontrado ainda.</p>
                  <p className="text-sm text-gray-400">Seja o primeiro a fazer o quiz!</p>
                </div>
              ) : (
                <div className="h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {globalRanking.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        index < 3 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                      } hover:bg-orange-100`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getRankIcon(index + 1)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {entry.first_name} {entry.last_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            <Badge variant="outline" className="mr-2">
                              {entry.team_name}
                            </Badge>
                            {entry.total_quizzes} quiz{entry.total_quizzes !== 1 ? 'zes' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          {entry.best_score} pts
                        </div>
                        <div className="text-sm text-gray-500">
                          Média: {entry.average_score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ranking por Times
              </CardTitle>
              <CardDescription>Média de pontuação por equipe</CardDescription>
            </CardHeader>
            <CardContent>
              {teamRanking.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum time encontrado ainda.</p>
                </div>
              ) : (
                <div className="h-64 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {teamRanking.map((team, index) => (
                    <div
                      key={team.team_name}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        index < 3 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                      } hover:bg-blue-100`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getRankIcon(index + 1)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {team.team_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {team.total_quizzes} quiz{team.total_quizzes !== 1 ? 'zes' : ''} realizados
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {team.average_score} pts
                        </div>
                        <div className="text-sm text-gray-500">
                          Média do time
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RankingMode;
