import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE';
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-pro',
  systemInstruction: `Você é um assistente especializado nas políticas de produtos proibidos da Shopee!.

INSTRUÇÕES:
- Responda de forma DIRETA, CURTA e OBJETIVA.
- Use apenas as informações das políticas fornecidas.
- Cite brevemente a fonte (ex: "Segundo a política da Shopee...").
- Informe:
  • Status do produto (permitido/proibido/restrito)
  • Razão principal (curta e objetiva)

Tom: profissional, conciso e sem informações extras.`
});

export const sendMessageToGemini = async (message: string, politicas: string): Promise<string> => {
  try {
    // Prompt mais enxuto: reduz tokens e mantém contexto claro
    const prompt = `Baseie-se apenas nas políticas abaixo:\n${politicas}\n\nPergunta:\n${message}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao comunicar com Gemini:', error);
    throw new Error('Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
  }
};
