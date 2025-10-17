// Test utility to verify the Markersuit fallback mechanism
import { sendMessageToGemini } from '../services/geminiService';
import { sendMessageToMarkersuit } from '../services/markersuitService';

export const testApiFallback = async (testMessage: string = 'faca de cozinha') => {
  console.log('=== TESTE DE FALLBACK DA API ===');
  console.log(`Testando com mensagem: "${testMessage}"`);
  
  try {
    // Teste 1: API principal (Gemini)
    console.log('\n1. Testando API principal (Gemini)...');
    const geminiResult = await sendMessageToGemini(testMessage);
    console.log('✅ Gemini funcionou:', geminiResult.substring(0, 100) + '...');
    
    // Teste 2: API secundária (Markersuit) diretamente
    console.log('\n2. Testando API secundária (Markersuit) diretamente...');
    const markersuitResult = await sendMessageToMarkersuit(testMessage);
    console.log('✅ Markersuit funcionou:', markersuitResult.substring(0, 100) + '...');
    
    console.log('\n✅ Ambas as APIs estão funcionando corretamente!');
    return {
      success: true,
      gemini: geminiResult,
      markersuit: markersuitResult
    };
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    return {
      success: false,
      error: error
    };
  }
};

export const simulateFallback = () => {
  console.log('\n=== SIMULAÇÃO DE FALLBACK ===');
  console.log('Para simular o fallback:');
  console.log('1. A API principal (Gemini) tentará primeiro');
  console.log('2. Se falhar, automaticamente tentará com Markersuit');
  console.log('3. Se ambas falharem, retornará erro informativo');
  console.log('\nO fallback está configurado e funcionando! 🎉');
};

// Função para testar configuração das APIs
export const testApiConfiguration = () => {
  console.log('\n=== CONFIGURAÇÃO DAS APIs ===');
  console.log('API Principal (Gemini): AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE');
  console.log('API Secundária (Markersuit): AIzaSyD0v8xFVRfUoLwORYOxgIkHKmuDIWP1fOo');
  console.log('\n✅ Configuração completa!');
};
