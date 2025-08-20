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
3) Se a política depender de limites numéricos e a pergunta NÃO trouxer medida suficiente para concluir, responda como DEPENDE e explique o limite da política.
4) Produzir a saída SEM explicações adicionais, apenas no(s) formato(s) abaixo.

Formatos de saída (escolha UM):
- Caso exista política aplicável e seja conclusivo: "Segundo a política <NÚMERO>.<SEÇÃO>. <TÍTULO COMPLETO>. <É/SÃO> proibido(s)/permitido(s) <CATEGORIA NORMALIZADA/ITEM>." [Opcional] "Alternativa: <ALTERNATIVA PERMITIDA>."
- Caso dependa de tamanho/medida e a pergunta não informe: "Depende. Segundo a política <NÚMERO>.<SEÇÃO>. <TÍTULO COMPLETO>. É/São proibido(s) acima/depois de <LIMITE COM UNIDADE>; até/igual a <LIMITE COM UNIDADE> é permitido."
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

    // Detecta se o usuário informou alguma medida (número + unidade)
    const hasMeasure = /(\d+[\.,]?\d*)\s*(cm|centimetro|centímetros|centímetro|mm|m|km|pol|polegada|polegadas|ml|l|litro|litros|g|gramas?|kg|quilogramas?|mg|w|kw|v|a|mah|mAh|calibre|cal|oz|onças?)/i.test(itemOriginal);
    // Detecta itens que costumam depender de tamanho (ex.: facas/facões)
    const knifeLike = /(faca|facas|facão|facoes|facao|canivete|cutelo)/i.test(itemOriginal);

    const prompt = `POLÍTICAS (base única de verdade):\n${politicas}\n\nInstruções de tarefa:\n- NORMALIZE o item do usuário para a categoria mais específica presente nas políticas.\n- Considere limites numéricos (tamanho/volume/peso/potência etc.) e compare com o item.\n- Se o item estiver acima do limite → PROIBIDO/RESTRITO; se igual/abaixo → PERMITIDO.\n- Caso não haja medida na pergunta para concluir, responda no formato DEPENDE.\n- Responda APENAS no(s) formato(s) definidos nas regras, sem explicações extra.\n\nITEM ORIGINAL: "${itemOriginal}"\nPergunta do usuário: ${processedMessage}`;
    const decisionGuard = `\n\nSINALIZADORES:\n- HAS_MEASURE: ${hasMeasure ? 'true' : 'false'}\n- KNIFE_LIKE: ${knifeLike ? 'true' : 'false'}\nREGRAS ADICIONAIS:\n- Se HAS_MEASURE = false e a política aplicável possuir LIMITES NUMÉRICOS (ex.: cm, ml, g, W, etc.), responda OBRIGATORIAMENTE no formato "Depende." com o limite exato (acima/do limite é proibido; até/igual é permitido).\n- Se KNIFE_LIKE = true e HAS_MEASURE = false, responda "Depende." usando o limite da política de facas domésticas: é proibido quando a área de corte tenha mais que 30 centímetros (12 polegadas); até/igual a 30 centímetros é permitido (cite a política correspondente).\n- Não conclua como proibido/permitido sem medida quando a política depende de tamanho/medida.`;

    let responseText = '';
    try {
      responseText = await generateWithModel(DEFAULT_MODEL, prompt + decisionGuard);
    } catch (e) {
      console.warn('Falha no modelo padrão, tentando fallback...', e);
    }

    if (!responseText) {
      responseText = await generateWithModel(FALLBACK_MODEL, prompt + decisionGuard);
    }

    // Sanitização
    if (responseText) {
      const trimmed = responseText.trim();
      const lower = trimmed.toLowerCase();
      const startsWithPermitido = lower.startsWith('permitido.');
      const startsWithDepende = lower.startsWith('depende.');
      const idx = lower.indexOf('segundo a política');
      // Se a resposta não começar com "Permitido." ou "Depende." e contiver o trecho da política, manter apenas a partir dele
      if (!startsWithPermitido && !startsWithDepende && idx >= 0) {
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
