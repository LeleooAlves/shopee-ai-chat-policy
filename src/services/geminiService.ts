import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE';
const genAI = new GoogleGenerativeAI(API_KEY);

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODEL = 'gemini-2.5-flash';
const SYSTEM_INSTRUCTION = `Você é um assistente especializado nas políticas de produtos proibidos da Shopee.

CLASSIFICAÇÕES OBRIGATÓRIAS:
- PERMITIDO: Item não está nas políticas OU está explicitamente permitido
- PROIBIDO: Item está explicitamente proibido nas políticas
- DEPENDE: Item tem limites numéricos nas políticas (tamanho, peso, quantidade, etc.) mas a mensagem não especifica essas medidas
- RESTRITO: Item requer documentação/autorização especial para venda

TAREFA:
1) NORMALIZAR o item para a categoria mais específica das políticas
2) IDENTIFICAR a política aplicável exata
3) CLASSIFICAR corretamente conforme as regras acima
4) RESPONDER apenas nos formatos definidos

FORMATOS DE SAÍDA (escolha UM):
- PERMITIDO: "PERMITIDO. Item não citado nas políticas da Shopee." OU "PERMITIDO. Segundo a política <X.Y>. <TÍTULO>. São permitidos <ITEM/CATEGORIA>."
- PROIBIDO: "PROIBIDO. Segundo a política <X.Y>. <TÍTULO>. São proibidos <ITEM/CATEGORIA>."
- DEPENDE: "DEPENDE. Segundo a política <X.Y>. <TÍTULO>. São proibidos acima de <LIMITE>; permitidos até <LIMITE>."
- RESTRITO: "RESTRITO. Segundo a política <X.Y>. <TÍTULO>. São permitidos <ITEM> mediante apresentação de documentação complementar/somente para vendedores com autorização."

REGRAS ESPECÍFICAS:
- DEPENDE: Use APENAS quando a política tem limites numéricos (cm, ml, g, etc.) e o usuário não informou medidas
  * Exemplo: "faca" (sem tamanho) → DEPENDE (política proíbe acima de 30cm)
  * Exemplo: "tinta spray" (sem peso) → DEPENDE (política proíbe acima de 500g)
- RESTRITO: Use quando a política menciona "autorização", "documentação complementar", "licença", "vendedores autorizados"
  * Exemplo: "cerveja", "bebida alcoólica" → RESTRITO (requer documentação)
  * Exemplo: "airsoft", "luneta" → RESTRITO (requer autorização)
- PROIBIDO: Use APENAS quando o item é explicitamente proibido SEM condições
- Seja PRECISO na normalização
- NUNCA classifique como PROIBIDO se há condições (limites ou autorizações)`;

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

    const prompt = `POLÍTICAS DA SHOPEE:\n${politicas}\n\nITEM PARA ANÁLISE: "${itemOriginal}"\n\nANÁLISE OBRIGATÓRIA:\n1. Encontre a política específica que se aplica ao item\n2. Verifique se há limites numéricos (cm, g, ml, etc.) - se sim e usuário não informou = DEPENDE\n3. Verifique se menciona "autorização", "documentação" - se sim = RESTRITO\n4. Se explicitamente proibido SEM condições = PROIBIDO\n5. Se não está nas políticas = PERMITIDO\n\nEXEMPLOS CRÍTICOS:\n- "faca" (sem tamanho) = DEPENDE (política 8.1.1 proíbe acima 30cm)\n- "cerveja" ou "bebida alcoólica" = RESTRITO (política 2.1 requer documentação)\n- "luneta" = RESTRITO (política 12.1.2 requer autorização)\n\nResponda APENAS no formato especificado.`;

    let responseText = '';
    try {
      responseText = await generateWithModel(DEFAULT_MODEL, prompt);
    } catch (e) {
      console.warn('Falha no modelo padrão, tentando fallback...', e);
    }

    if (!responseText) {
      responseText = await generateWithModel(FALLBACK_MODEL, prompt);
    }

    // Sanitização e validação da resposta
    if (responseText) {
      responseText = responseText.trim().replace(/[\[\]]/g, '');
      
      // Garantir que a resposta comece com uma das classificações válidas
      const lower = responseText.toLowerCase();
      const validStarts = ['permitido.', 'proibido.', 'depende.', 'restrito.'];
      const hasValidStart = validStarts.some(start => lower.startsWith(start));
      
      if (!hasValidStart) {
        // Se não começar com classificação válida, tentar extrair a partir de "segundo a política"
        const policyIndex = lower.indexOf('segundo a política');
        if (policyIndex >= 0) {
          responseText = responseText.slice(policyIndex);
        }
      }
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
