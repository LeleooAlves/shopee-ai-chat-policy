import { GoogleGenerativeAI } from '@google/generative-ai';
import politicasData from '../data/PoliticasShopee.json';

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
- DEPENDE: Use quando a política tem limites numéricos/percentuais mas o usuário NÃO informou essas medidas
- PROIBIDO: Use quando o item EXCEDE os limites estabelecidos na política
- PERMITIDO: Use quando o item está DENTRO dos limites estabelecidos na política
- RESTRITO: Use quando a política menciona "autorização", "documentação complementar", "licença"

RECONHECIMENTO DE MEDIDAS (todas as variações):
- Comprimento: cm, centímetro, centímetros, mm, milímetro, milímetros, m, metro, metros, pol, polegada, polegadas
- Peso: g, grama, gramas, kg, quilo, quilos, quilograma, quilogramas, mg, miligrama, miligramas
- Volume: ml, mililitro, mililitros, l, litro, litros, cl, centilitro, centilitros
- Percentual: %, por cento, porcento, percentual, concentração
- Quantidade: unidades, peças, itens, quantidade
- Outros: w, watt, watts, v, volt, volts, mah, mAh, calibre, cal`;

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

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const trimmed = message.trim();
    const itemOriginal = trimmed.replace(/\?+$/,'');

    // Converter JSON para texto formatado
    const politicasTexto = politicasData.categorias
      .map(categoria => `${categoria.nome}\n${categoria.conteudo}`)
      .join('\n\n');

    const prompt = `POLÍTICAS DA SHOPEE:\n${politicasTexto}\n\nITEM PARA ANÁLISE: "${itemOriginal}"\n\nANÁLISE OBRIGATÓRIA:
1. PRIMEIRO: Verifique se o item requer documentação/autorização = RESTRITO
   - Palavras-chave: "autorização", "documentação", "apresentação de documentação", "documentação complementar", "mediante apresentação"
2. SEGUNDO: Extraia TODAS as medidas numéricas do item (números + unidades: %, cm, g, ml, etc.)
3. Encontre a política específica que se aplica ao item
4. Compare as medidas extraídas com os limites da política:
   - Se USUÁRIO INFORMOU medida E está DENTRO do limite = PERMITIDO
   - Se USUÁRIO INFORMOU medida E EXCEDE o limite = PROIBIDO
   - Se usuário NÃO informou medida mas política tem limites = DEPENDE
5. Se não está nas políticas = PERMITIDO

PRIORIDADE ABSOLUTA: RESTRITO > PROIBIDO > PERMITIDO > DEPENDE\n\nREGRA CRÍTICA: SEMPRE verifique se há números no item antes de classificar como DEPENDE!\n\nEXEMPLOS OBRIGATÓRIOS:\n- "faca" (sem tamanho) = DEPENDE (política tem limite de 30cm)\n- "álcool" (sem %) = DEPENDE (política tem limite de 70%)\n- "faca 28cm" = PERMITIDO (28cm < 30cm) ← TEM MEDIDA!\n- "álcool 50%" = PERMITIDO (50% < 70%) ← TEM MEDIDA!\n- "faca 32cm" = PROIBIDO (32cm > 30cm) ← TEM MEDIDA!\n- "álcool 80%" = PROIBIDO (80% > 70%) ← TEM MEDIDA!\n- "cerveja" = RESTRITO (requer documentação)
- "suplemento alimentar" = RESTRITO (requer apresentação de documentação)\n\nATENÇÃO ESPECIAL: Se o item contém números (50%, 28cm, etc.), NÃO é DEPENDE!\n\nResponda APENAS no formato especificado.`;

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
      
      // Encontrar categoria relevante e adicionar link se existir
      const itemLower = itemOriginal.toLowerCase();
      console.log('Procurando categoria para:', itemLower);
      
      const categoriaRelevante = politicasData.categorias.find(categoria => {
        const nomeCategoria = categoria.nome.toLowerCase();
        const conteudoCategoria = categoria.conteudo.toLowerCase();
        
        // Verificações mais específicas
        const nomeMatch = nomeCategoria.includes(itemLower);
        const conteudoMatch = conteudoCategoria.includes(itemLower);
        const palavraChave = nomeCategoria.split('.')[1]?.trim().toLowerCase();
        const palavraMatch = palavraChave && itemLower.includes(palavraChave);
        
        console.log(`Categoria: ${categoria.nome}, Nome Match: ${nomeMatch}, Conteúdo Match: ${conteudoMatch}, Palavra Match: ${palavraMatch}`);
        
        return nomeMatch || conteudoMatch || palavraMatch;
      });

      console.log('Categoria encontrada:', categoriaRelevante?.nome, 'Link:', categoriaRelevante?.link);

      if (categoriaRelevante && categoriaRelevante.link) {
        responseText += `\n\nlink: ${categoriaRelevante.link}`;
        console.log('Link adicionado à resposta');
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
