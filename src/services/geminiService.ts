
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE';
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  systemInstruction: `Você é um assistente especializado na política de produtos proibidos da Shopee. 
  Sua função é ajudar vendedores e compradores a entender quais produtos são permitidos ou proibidos na plataforma.
  
  Seja sempre preciso, educativo e helpful. Forneça informações detalhadas sobre:
  - Produtos proibidos e restritos
  - Diretrizes da Shopee
  - Alternativas permitidas quando aplicável
  - Processos de apelação quando relevante
  
  Mantenha um tom profissional mas amigável, e sempre incentive o cumprimento das políticas da plataforma.`
});

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao comunicar com Gemini:', error);
    throw new Error('Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
  }
};
