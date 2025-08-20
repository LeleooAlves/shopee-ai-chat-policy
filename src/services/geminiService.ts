import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE';
const genAI = new GoogleGenerativeAI(API_KEY);

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODEL = 'gemini-2.5-flash';
const SYSTEM_INSTRUCTION = `Você é um assistente especializado nas políticas de produtos proibidos da Shopee.

Tarefa (em silêncio):
1) Interpretar e NORMALIZAR o item enviado pelo usuário para a categoria normativa mais específica existente nas políticas (ex.: "muda de samambaia" → "planta viva").
2) Ler números e unidades (tamanho, volume, peso, capacidade, potência etc.) no item e na política. Quando a política estabelecer limites, compare:
   - Se o item está ACIMA do limite permitido → classifique como PROIBIDO/RESTRITO conforme a política.
   - Se o item está IGUAL ou ABAIXO do limite permitido → classifique como PERMITIDO.
3) Produzir a saída SEM explicações adicionais, apenas no(s) formato(s) abaixo.

Formatos de saída (escolha UM):
- Caso exista política aplicável: "Segundo a política <NÚMERO>.<SEÇÃO>. <TÍTULO COMPLETO>. <É/SÃO> proibido(s)/permitido(s) <CATEGORIA NORMALIZADA/ITEM>." [Opcional] "Alternativa: <ALTERNATIVA PERMITIDA>."
- Caso NÃO exista política aplicável: "Permitido. item não citado nas politicas da Shopee"

Regras:
- Seja DIRETO, CURTO e OBJETIVO; não inclua justificativas extras, exemplos, notas ou a palavra "Pergunta".
- Use somente as políticas fornecidas como base. Não invente nada.
- Não inclua colchetes.
- Quando houver alternativa clara nas políticas, inclua-a após "Alternativa:".`;

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

    const prompt = `POLÍTICAS (base única de verdade):\n${politicas}\n\nInstruções de tarefa:\n- NORMALIZE o item do usuário para a categoria mais específica presente nas políticas.\n- Considere limites numéricos (tamanho/volume/peso/potência etc.) e compare com o item.\n- Se o item estiver acima do limite → PROIBIDO/RESTRITO; se igual/abaixo → PERMITIDO.\n- Responda APENAS no(s) formato(s) definidos nas regras, sem explicações extra.\n\nITEM ORIGINAL: "${itemOriginal}"\nPergunta do usuário: ${processedMessage}`;

    let responseText = '';
    try {
      responseText = await generateWithModel(DEFAULT_MODEL, prompt);
    } catch (e) {
      console.warn('Falha no modelo padrão, tentando fallback...', e);
    }

    if (!responseText) {
      responseText = await generateWithModel(FALLBACK_MODEL, prompt);
    }

    // Sanitização
    if (responseText) {
      const trimmed = responseText.trim();
      const lower = trimmed.toLowerCase();
      const startsWithPermitido = lower.startsWith('permitido.');
      const idx = lower.indexOf('segundo a política');
      // Se a resposta não começar com "Permitido." e contiver o trecho da política, manter apenas a partir dele
      if (!startsWithPermitido && idx >= 0) {
        responseText = trimmed.slice(idx);
      } else {
        responseText = trimmed;
      }
      // Remover colchetes
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
