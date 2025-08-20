import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE';
const genAI = new GoogleGenerativeAI(API_KEY);

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODEL = 'gemini-2.5-flash';
const SYSTEM_INSTRUCTION = `Você é um assistente especializado nas políticas de produtos proibidos da Shopee.

Tarefa (em silêncio):
1) Interpretar e NORMALIZAR o item enviado pelo usuário para a categoria normativa mais específica que exista nas políticas (ex.: "muda de samambaia" → "planta viva").
2) Identificar a política mais adequada (número, seção e título exatos) que proíbe/restringe/permite a categoria normalizada.
3) Responder SOMENTE com o trecho a partir de "Segundo a política ..." no formato a seguir.

Formato OBRIGATÓRIO DE SAÍDA (não escreva nada além disso):
Segundo a política <NÚMERO>.<SEÇÃO>. <TÍTULO COMPLETO>. <É/SÃO> proibido(s) <CATEGORIA NORMALIZADA>. [Opcional] Alternativa: <ALTERNATIVA PERMITIDA>.

Regras:
- Seja DIRETO, CURTO e OBJETIVO.
- Use somente as políticas fornecidas como base. Não invente nada.
- Não inclua colchetes.
- Se não houver política aplicável, responda exatamente: "Sem base nas políticas fornecidas."`;

function createModel(name: string) {
  return genAI.getGenerativeModel({
    model: name,
    systemInstruction: SYSTEM_INSTRUCTION,
  });
}

async function generateWithModel(modelName: string, prompt: string): Promise<string> {
  const model = createModel(modelName);
  const result = await model.generateContent(prompt);
  const response = await result.response as any;

  let text: string = typeof response.text === 'function' ? response.text() : '';

  if (!text || text.trim() === '') {
    const candidates = response?.candidates ?? [];
    if (Array.isArray(candidates) && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts ?? [];
      text = parts.map((p: any) => (p?.text ?? '')).join('').trim();
    }
  }

  return text?.trim() ?? '';
}

export const sendMessageToGemini = async (message: string, politicas: string): Promise<string> => {
  try {
    const trimmed = message.trim();
    const itemOriginal = trimmed.replace(/\?+$/,'');
    const processedMessage = trimmed.endsWith('?') ? trimmed : `${itemOriginal} é proibido?`;

    const prompt = `POLÍTICAS (base única de verdade):\n${politicas}\n\nInstruções de tarefa:\n- Primeiro, NORMALIZE o item do usuário para a categoria normativa mais específica contida nas políticas.\n- Exemplos: "muda de samambaia" → "planta viva" (JARDINAGEM 8.4).\n- Depois, selecione a política mais adequada e responda SOMENTE no formato exigido.\n\nITEM ORIGINAL: "${itemOriginal}"\nPergunta do usuário: ${processedMessage}`;

    let responseText = '';
    try {
      responseText = await generateWithModel(DEFAULT_MODEL, prompt);
    } catch (e) {
      console.warn('Falha no modelo padrão, tentando fallback...', e);
    }

    if (!responseText) {
      responseText = await generateWithModel(FALLBACK_MODEL, prompt);
    }

    // Sanitização: manter apenas o trecho a partir de "Segundo a política" e remover colchetes
    if (responseText) {
      const lower = responseText.toLowerCase();
      const idx = lower.indexOf('segundo a política');
      if (idx >= 0) {
        responseText = responseText.slice(idx);
      }
      responseText = responseText.replace(/[\[\]]/g, '').trim();
    }

    if (!responseText) {
      throw new Error('Resposta vazia da IA');
    }

    return responseText;
  } catch (error) {
    console.error('Erro ao comunicar com Gemini:', error);
    throw new Error('Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
  }
};
