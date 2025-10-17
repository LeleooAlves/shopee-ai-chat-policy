import { GoogleGenerativeAI } from '@google/generative-ai';
import politicasData from '../data/PoliticasShopee.json';

// Markersuit API configuration
const MARKERSUIT_API_KEY = 'AIzaSyD0v8xFVRfUoLwORYOxgIkHKmuDIWP1fOo';
const markersuitAI = new GoogleGenerativeAI(MARKERSUIT_API_KEY);

// Cache das políticas para melhor performance
let politicasCache: string | null = null;

// Lista de modelos Markersuit em ordem de preferência
const MARKERSUIT_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash', 
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

// Configurações de retry para Markersuit
const MARKERSUIT_MAX_RETRIES = 2;
const MARKERSUIT_RETRY_DELAY = 2000; // 2 segundos
const MARKERSUIT_BACKOFF_MULTIPLIER = 1.5;

// Contador para alternância de modelos Markersuit
let markersuitModelIndex = 0;

// Função para obter o próximo modelo Markersuit
function getNextMarkersuitModel(): string {
  const model = MARKERSUIT_MODELS[markersuitModelIndex % MARKERSUIT_MODELS.length];
  markersuitModelIndex++;
  console.log(`[MARKERSUIT] Usando modelo: ${model} (index: ${markersuitModelIndex - 1})`);
  return model;
}

// System instruction para Markersuit (mesmo que o Gemini principal)
const MARKERSUIT_SYSTEM_INSTRUCTION = `Você é um assistente especializado nas políticas de produtos proibidos da Shopee.

CLASSIFICAÇÕES OBRIGATÓRIAS:
- PERMITIDO: Item não está nas políticas OU está explicitamente permitido
- PROIBIDO: Item está explicitamente proibido nas políticas
- DEPENDE: Item tem limites numéricos nas políticas (tamanho, peso, quantidade, etc.) mas a mensagem não especifica essas medidas
- RESTRITO: Item requer documentação/autorização especial para venda

REGRA CRÍTICA - PRODUTOS FALSIFICADOS/RÉPLICAS:
Qualquer produto que seja explicitamente falsificado, réplica, imitação ou cópia é SEMPRE PROIBIDO, independentemente da categoria. Palavras-chave que indicam produtos falsificados: "replica", "réplica", "falsificado", "tailandesa", "cópia", "imitação", "fake", "pirata", "clone", "similar", "inspirado em", "tipo", "estilo", entre outras.

TAREFA PRINCIPAL:
1) ANALISAR o item usando seu conhecimento interno sobre o produto
2) IDENTIFICAR a categoria MAIS ESPECÍFICA que se aplica ao item
3) PRIORIZAR categorias específicas sobre categorias gerais
4) CLASSIFICAR corretamente conforme as regras acima
5) RESPONDER apenas nos formatos definidos

REGRAS DE CATEGORIZAÇÃO:
- Para "câmera escondida" → buscar "7. CÂMERAS E DRONES" antes de "4.1.1. GRAVADORES DE VOZ"
- Para "faca de cozinha" → buscar "8.2. UTENSÍLIOS DOMÉSTICOS" antes de "3. ARMAS"
- Para "pistola de pintura" → buscar "8.3. FERRAMENTAS" antes de "3. ARMAS"
- SEMPRE priorize a função PRINCIPAL do produto
- Use contexto do produto para determinar categoria correta

FORMATOS DE SAÍDA (escolha UM):
- PERMITIDO: "PERMITIDO. Item não citado nas políticas da Shopee." OU "PERMITIDO. Segundo a política <X.Y>. <TÍTULO>. São permitidos <ITEM/CATEGORIA>."
- PROIBIDO: "PROIBIDO. Segundo a política <X.Y>. <TÍTULO>. São proibidos <ITEM/CATEGORIA>."
- DEPENDE: "DEPENDE. Segundo a política <X.Y>. <TÍTULO>. São proibidos acima de <LIMITE>; permitidos até <LIMITE>."
- RESTRITO: "RESTRITO. Segundo a política <X.Y>. <TÍTULO>. São permitidos <ITEM> mediante apresentação de documentação complementar/somente para vendedores com autorização."

REGRAS ESPECÍFICAS:
- DEPENDE: Use quando a política tem limites numéricos/percentuais mas o usuário NÃO informou essas medidas
- PROIBIDO: Use quando o item EXCEDE os limites estabelecidos na política OU é explicitamente falsificado/réplica
- PERMITIDO: Use quando o item está DENTRO dos limites estabelecidos na política E não é falsificado/réplica
- RESTRITO: Use quando a política menciona "autorização", "documentação complementar", "licença"

PRIORIDADE ABSOLUTA PARA FALSIFICADOS:
Antes de qualquer análise de categoria ou limite, verifique se o produto contém termos que indiquem falsificação/réplica. Se SIM, classifique imediatamente como PROIBIDO.

RECONHECIMENTO DE MEDIDAS (todas as variações):
- Comprimento: cm, centímetro, centímetros, mm, milímetro, milímetros, m, metro, metros, pol, polegada, polegadas
- Peso: g, grama, gramas, kg, quilo, quilos, quilograma, quilogramas, mg, miligrama, miligramas
- Volume: ml, mililitro, mililitros, l, litro, litros, cl, centilitro, centilitros
- Percentual: %, por cento, porcento, percentual, concentração
- Quantidade: unidades, peças, itens, quantidade
- Outros: w, watt, watts, v, volt, volts, mah, mAh, calibre, cal`;

function createMarkersuitModel(name: string) {
  return markersuitAI.getGenerativeModel({
    model: name,
    systemInstruction: MARKERSUIT_SYSTEM_INSTRUCTION,
  });
}

// Função auxiliar para delay
function markersuitDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateWithMarkersuitModel(modelName: string, prompt: string, retryCount: number = 0): Promise<string> {
  try {
    console.log(`[MARKERSUIT] Tentando gerar conteúdo com modelo: ${modelName}`);
    const model = createMarkersuitModel(modelName);
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

    console.log(`[MARKERSUIT] Sucesso com modelo: ${modelName}`);
    return text?.trim() ?? '';
  } catch (error: any) {
    console.error(`[MARKERSUIT] Erro com modelo ${modelName} (tentativa ${retryCount + 1}):`, error);
    
    // Verificar se é erro 503 (modelo sobrecarregado) ou erro de rede
    const isRetryableError = 
      error?.message?.includes('503') || 
      error?.message?.includes('overloaded') ||
      error?.message?.includes('Service Unavailable') ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('429'); // Rate limit
    
    if (isRetryableError && retryCount < MARKERSUIT_MAX_RETRIES) {
      // Tentar com o próximo modelo na rotação
      const nextModel = getNextMarkersuitModel();
      const delayTime = MARKERSUIT_RETRY_DELAY * Math.pow(MARKERSUIT_BACKOFF_MULTIPLIER, retryCount);
      
      console.log(`[MARKERSUIT] Modelo ${modelName} sobrecarregado. Tentando com ${nextModel} após ${delayTime}ms...`);
      await markersuitDelay(delayTime);
      
      return generateWithMarkersuitModel(nextModel, prompt, retryCount + 1);
    }
    
    // Se todos os retries falharam, lançar erro
    throw error;
  }
}

// Função para gerar conteúdo com modelo rotativo Markersuit
async function generateWithRotatingMarkersuitModel(prompt: string): Promise<string> {
  const selectedModel = getNextMarkersuitModel();
  return generateWithMarkersuitModel(selectedModel, prompt);
}

// Função principal para análise de mensagem com Markersuit
export const sendMessageToMarkersuit = async (message: string): Promise<string> => {
  try {
    console.log('[MARKERSUIT] Iniciando análise com API Markersuit...');
    
    const trimmed = message.trim();
    const itemOriginal = trimmed.replace(/\?+$/,'');

    // Usar cache das políticas para melhor performance
    if (!politicasCache) {
      politicasCache = politicasData.categorias
        .map(categoria => `${categoria.nome}\n${categoria.conteudo}`)
        .join('\n\n');
    }
    const politicasTexto = politicasCache;

    const prompt = `POLÍTICAS DA SHOPEE:\n${politicasTexto}\n\nITEM PARA ANÁLISE: "${itemOriginal}"\n\nPRIMEIRO: VERIFICAÇÃO DE FALSIFICAÇÃO/RÉPLICA:\nVerifique se o produto contém termos que indiquem falsificação: "replica", "réplica", "falsificado", "tailandesa", "cópia", "imitação", "fake", "pirata", "clone", "similar", "inspirado em", "tipo", "estilo".\nSe SIM, classifique imediatamente como PROIBIDO.\n\nSEGUNDO: CONSULTE SEU CONHECIMENTO INTERNO sobre o item "${itemOriginal}":\n- O que é este produto?\n- Qual sua função principal?\n- Em que categoria se encaixa?\n- Quais são suas características técnicas?\n- Como é usado normalmente?\n\nANÁLISE OBRIGATÓRIA - PRIORIZAÇÃO DE CATEGORIAS:
1. Com base no seu conhecimento interno, determine a NATUREZA REAL do produto
2. IDENTIFIQUE TODAS as categorias possíveis que poderiam se aplicar
3. PRIORIZE a categoria MAIS ESPECÍFICA baseada na função PRINCIPAL:
   - "câmera escondida na caneta" = CÂMERA (categoria 7), não gravador (categoria 4.1.1)
   - "faca de cozinha" = UTENSÍLIO DOMÉSTICO (categoria 8.2), não arma (categoria 3)
   - "pistola de pintura" = FERRAMENTA (categoria 8.3), não arma (categoria 3)
4. Verifique se o item requer documentação/autorização = RESTRITO
   - Palavras-chave: "autorização", "documentação", "apresentação de documentação", "documentação complementar", "mediante apresentação"
5. Use contexto específico para determinar categoria correta:
   - Considere o uso PRINCIPAL e finalidade baseado no seu conhecimento
   - Evite categorias genéricas quando existe categoria específica
6. Extraia TODAS as medidas numéricas do item (números + unidades: %, cm, g, ml, etc.)
7. Encontre a política MAIS ESPECÍFICA que se aplica ao item
8. Compare as medidas extraídas com os limites da política:
   - Se USUÁRIO INFORMOU medida E está DENTRO do limite = PERMITIDO
   - Se USUÁRIO INFORMOU medida E EXCEDE o limite = PROIBIDO
   - Se usuário NÃO informou medida mas política tem limites = DEPENDE
9. Se não está nas políticas = PERMITIDO

REGRA CRÍTICA DE CONTEXTO: 
- USE SEU CONHECIMENTO INTERNO para entender o produto antes de aplicar políticas
- "Pistola de pintura" = FERRAMENTA para pintura, NÃO é arma
- "Maçarico" = ferramenta inflamável (proibida na categoria 8.3.1)
- "Estilingue de brinquedo" vs "Estilingue real" = contextos diferentes
- "Faca de cozinha" vs "Faca de combate" = finalidades diferentes
- Analise a FUNÇÃO REAL do produto, não apenas palavras similares

PRIORIDADE ABSOLUTA: RESTRITO > PROIBIDO > PERMITIDO > DEPENDE

REGRA CRÍTICA: SEMPRE verifique se há números no item antes de classificar como DEPENDE!

EXEMPLOS OBRIGATÓRIOS:
- "faca" (sem tamanho) = DEPENDE (política tem limite de 30cm)
- "álcool" (sem %) = DEPENDE (política tem limite de 70%)
- "faca 28cm" = PERMITIDO (28cm < 30cm) ← TEM MEDIDA!
- "álcool 50%" = PERMITIDO (50% < 70%) ← TEM MEDIDA!
- "faca 32cm" = PROIBIDO (32cm > 30cm) ← TEM MEDIDA!
- "álcool 80%" = PROIBIDO (80% > 70%) ← TEM MEDIDA!
- "cerveja" = RESTRITO (requer documentação)
- "suplemento alimentar" = RESTRITO (requer apresentação de documentação)
- "pistola de pintura" = PERMITIDO (ferramenta de trabalho, não é arma)
- "maçarico" = PROIBIDO (ferramenta inflamável proibida)
- "câmera escondida na caneta" = PROIBIDO (categoria 7. CÂMERAS E DRONES, não 4.1.1. GRAVADORES)

ATENÇÃO ESPECIAL: Se o item contém números (50%, 28cm, etc.), NÃO é DEPENDE!

EXEMPLOS DE PRIORIZAÇÃO CORRETA:
- "câmera escondida" → categoria 7. CÂMERAS E DRONES (função principal: câmera)
- "caneta com câmera" → categoria 7. CÂMERAS E DRONES (função principal: câmera)
- "gravador de voz" → categoria 4.1.1. GRAVADORES DE VOZ (função principal: gravação)

Responda OBRIGATORIAMENTE no formato:
[CLASSIFICAÇÃO]: [Explicação da análise]

Onde CLASSIFICAÇÃO deve ser exatamente uma das opções: PERMITIDO, PROIBIDO, DEPENDE, RESTRITO`;

    const responseText = await generateWithRotatingMarkersuitModel(prompt);

    // Sanitização e validação da resposta
    if (responseText) {
      const sanitizedResponse = responseText.trim().replace(/[\[\]]/g, '');
      
      // Extrair categoria específica da resposta da IA
      const categoriaMatch = sanitizedResponse.match(/política\s+(\d+(?:\.\d+)*\.?\s*[A-ZÁÊÇÕ\s]+)/i);
      let categoriaRelevante = null;
      
      if (categoriaMatch) {
        const categoriaNome = categoriaMatch[1].trim().replace(/\.$/, '');
        console.log('[MARKERSUIT] Categoria extraída da resposta:', categoriaNome);
        
        // Buscar categoria exata pelo nome
        categoriaRelevante = politicasData.categorias.find(categoria => {
          const nomeCategoria = categoria.nome.trim();
          return nomeCategoria === categoriaNome || nomeCategoria.includes(categoriaNome);
        });
        
        console.log('[MARKERSUIT] Categoria encontrada:', categoriaRelevante?.nome);
      }

      console.log('[MARKERSUIT] Categoria encontrada:', categoriaRelevante?.nome, 'Link:', categoriaRelevante?.link);

      if (categoriaRelevante && categoriaRelevante.link) {
        return sanitizedResponse + `\n\n${categoriaRelevante.link}`;
      } else {
        return sanitizedResponse;
      }
    }

    if (!responseText) {
      throw new Error('[MARKERSUIT] Resposta vazia da IA');
    }

    return responseText;
  } catch (error) {
    console.error('[MARKERSUIT] Erro ao comunicar com Markersuit:', error);
    throw error; // Re-throw para que o serviço principal possa tratar
  }
};

// Função para análise de múltiplos produtos com Markersuit
export const analyzeMultipleProductsWithMarkersuit = async (products: string[]): Promise<Array<{productNumber: number, productName: string, analysis: string}>> => {
  try {
    console.log('[MARKERSUIT] Iniciando análise de múltiplos produtos...');
    const results = [];
    
    // Usar cache das políticas para melhor performance
    if (!politicasCache) {
      politicasCache = politicasData.categorias
        .map(categoria => `${categoria.nome}\n${categoria.conteudo}`)
        .join('\n\n');
    }
    const politicasTexto = politicasCache;

    // Analisar cada produto individualmente
    for (let i = 0; i < products.length; i++) {
      const productName = products[i].trim();
      const productNumber = i + 1;

      const prompt = `POLÍTICAS DA SHOPEE:\n${politicasTexto}\n\nITEM PARA ANÁLISE: "${productName}"\n\nPRIMEIRO: VERIFICAÇÃO DE FALSIFICAÇÃO/RÉPLICA:\nVerifique se o produto contém termos que indiquem falsificação: "replica", "réplica", "falsificado", "tailandesa", "cópia", "imitação", "fake", "pirata", "clone", "similar", "inspirado em", "tipo", "estilo".\nSe SIM, classifique imediatamente como PROIBIDO.\n\nSEGUNDO: CONSULTE SEU CONHECIMENTO INTERNO sobre o item "${productName}":\n- O que é este produto?\n- Qual sua função principal?\n- Em que categoria se encaixa?\n- Quais são suas características técnicas?\n- Como é usado normalmente?\n\nANÁLISE OBRIGATÓRIA - PRIORIZAÇÃO DE CATEGORIAS:
1. Com base no seu conhecimento interno, determine a NATUREZA REAL do produto
2. IDENTIFIQUE TODAS as categorias possíveis que poderiam se aplicar
3. PRIORIZE a categoria MAIS ESPECÍFICA baseada na função PRINCIPAL:
   - "câmera escondida na caneta" = CÂMERA (categoria 7), não gravador (categoria 4.1.1)
   - "faca de cozinha" = UTENSÍLIO DOMÉSTICO (categoria 8.2), não arma (categoria 3)
   - "pistola de pintura" = FERRAMENTA (categoria 8.3), não arma (categoria 3)
4. Verifique se o item requer documentação/autorização = RESTRITO
   - Palavras-chave: "autorização", "documentação", "apresentação de documentação", "documentação complementar", "mediante apresentação"
5. Use contexto específico para determinar categoria correta:
   - Considere o uso PRINCIPAL e finalidade baseado no seu conhecimento
   - Evite categorias genéricas quando existe categoria específica
6. Extraia TODAS as medidas numéricas do item (números + unidades: %, cm, g, ml, etc.)
7. Encontre a política MAIS ESPECÍFICA que se aplica ao item
8. Compare as medidas extraídas com os limites da política:
   - Se USUÁRIO INFORMOU medida E está DENTRO do limite = PERMITIDO
   - Se USUÁRIO INFORMOU medida E EXCEDE o limite = PROIBIDO
   - Se usuário NÃO informou medida mas política tem limites = DEPENDE
9. Se não está nas políticas = PERMITIDO

REGRA CRÍTICA DE CONTEXTO: 
- USE SEU CONHECIMENTO INTERNO para entender o produto antes de aplicar políticas
- "Pistola de pintura" = FERRAMENTA para pintura, NÃO é arma
- "Maçarico" = ferramenta inflamável (proibida na categoria 8.3.1)
- "Estilingue de brinquedo" vs "Estilingue real" = contextos diferentes
- "Faca de cozinha" vs "Faca de combate" = finalidades diferentes
- Analise a FUNÇÃO REAL do produto, não apenas palavras similares

PRIORIDADE ABSOLUTA: RESTRITO > PROIBIDO > PERMITIDO > DEPENDE

REGRA CRÍTICA: SEMPRE verifique se há números no item antes de classificar como DEPENDE!

EXEMPLOS OBRIGATÓRIOS:
- "faca" (sem tamanho) = DEPENDE (política tem limite de 30cm)
- "álcool" (sem %) = DEPENDE (política tem limite de 70%)
- "faca 28cm" = PERMITIDO (28cm < 30cm) ← TEM MEDIDA!
- "álcool 50%" = PERMITIDO (50% < 70%) ← TEM MEDIDA!
- "faca 32cm" = PROIBIDO (32cm > 30cm) ← TEM MEDIDA!
- "álcool 80%" = PROIBIDO (80% > 70%) ← TEM MEDIDA!
- "cerveja" = RESTRITO (requer documentação)
- "suplemento alimentar" = RESTRITO (requer apresentação de documentação)
- "pistola de pintura" = PERMITIDO (ferramenta de trabalho, não é arma)
- "maçarico" = PROIBIDO (ferramenta inflamável proibida)
- "câmera escondida na caneta" = PROIBIDO (categoria 7. CÂMERAS E DRONES, não 4.1.1. GRAVADORES)
- "bolsa replica" = PROIBIDO (produto falsificado/réplica)
- "perfume tailandês" = PROIBIDO (produto falsificado/réplica)
- "tênis fake" = PROIBIDO (produto falsificado/réplica)
- "relógio imitação" = PROIBIDO (produto falsificado/réplica)

ATENÇÃO ESPECIAL: Se o item contém números (50%, 28cm, etc.), NÃO é DEPENDE!

EXEMPLOS DE PRIORIZAÇÃO CORRETA:
- "câmera escondida" → categoria 7. CÂMERAS E DRONES (função principal: câmera)
- "caneta com câmera" → categoria 7. CÂMERAS E DRONES (função principal: câmera)
- "gravador de voz" → categoria 4.1.1. GRAVADORES DE VOZ (função principal: gravação)

Responda OBRIGATORIAMENTE no formato:
[CLASSIFICAÇÃO]: [Explicação da análise]

Onde CLASSIFICAÇÃO deve ser exatamente uma das opções: PERMITIDO, PROIBIDO, DEPENDE, RESTRITO`;

      const responseText = await generateWithRotatingMarkersuitModel(prompt);

      // Sanitização e validação da resposta
      let finalResponse = responseText;
      if (responseText) {
        const sanitizedResponse = responseText.trim().replace(/[\[\]]/g, '');
        
        // Extrair categoria específica da resposta da IA
        const categoriaMatch = sanitizedResponse.match(/política\s+(\d+(?:\.\d+)*\.?\s*[A-ZÁÊÇÕ\s]+)/i);
        let categoriaRelevante = null;
        
        if (categoriaMatch) {
          const categoriaNome = categoriaMatch[1].trim().replace(/\.$/, '');
          
          // Buscar categoria exata pelo nome
          categoriaRelevante = politicasData.categorias.find(categoria => {
            const nomeCategoria = categoria.nome.trim();
            return nomeCategoria === categoriaNome || nomeCategoria.includes(categoriaNome);
          });
        }

        if (categoriaRelevante && categoriaRelevante.link) {
          finalResponse = sanitizedResponse + `\n\n${categoriaRelevante.link}`;
        } else {
          finalResponse = sanitizedResponse;
        }
      }

      results.push({
        productNumber,
        productName,
        analysis: finalResponse || 'Erro ao analisar produto'
      });
    }

    console.log('[MARKERSUIT] Análise de múltiplos produtos concluída com sucesso');
    return results;
  } catch (error) {
    console.error('[MARKERSUIT] Erro ao analisar múltiplos produtos:', error);
    throw error; // Re-throw para que o serviço principal possa tratar
  }
};

export default {
  sendMessageToMarkersuit,
  analyzeMultipleProductsWithMarkersuit
};
