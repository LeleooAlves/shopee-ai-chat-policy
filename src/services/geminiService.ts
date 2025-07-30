import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE';
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash-lite',
  systemInstruction: `Você é um assistente especializado na política de produtos proibidos da Shopee. 

  INSTRUÇÕES PARA RESPOSTAS:
  - Seja DIRETO e OBJETIVO
  - Responda de forma concisa
  - Forneça apenas o essencial sobre o produto/questão
  - Inclua uma breve menção da fonte (ex: "Segundo a política da Shopee..." ou "Conforme diretrizes da plataforma...")
  - Evite explicações longas desnecessárias
  - Foque no que é permitido ou proibido especificamente
  
  Tópicos que você deve cobrir de forma direta:
  - Status do produto (permitido/proibido/restrito)
  - Razão principal da restrição
  - Alternativa permitida (se houver)
  
  Mantenha um tom profissional mas seja conciso.`
});

export const sendMessageToGemini = async (message: string, politicas: string): Promise<string> => {
  try {
    const prompt = `Considere as seguintes políticas da Shopee ao responder a pergunta abaixo. Responda SOMENTE com base nessas políticas, sem inventar informações.\n\nPOLÍTICAS:\n${politicas}\n\nPERGUNTA:\n${message}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao comunicar com Gemini:', error);
    throw new Error('Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
  }
};
