const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function clearAllQuizResults() {
  try {
    console.log('Removendo todos os resultados de quiz...');
    
    const { error } = await supabase
      .from('quiz_leaderboard')
      .delete()
      .neq('id', 0); // Delete all records

    if (error) {
      console.error('Erro ao remover resultados:', error);
      return;
    }

    console.log('✅ Todos os resultados de quiz foram removidos com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
  }
}

clearAllQuizResults();
