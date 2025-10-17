import { GoogleGenerativeAI } from '@google/generative-ai';
import politicasData from '../data/PoliticasShopee.json';
import { sendMessageToMarkersuit, analyzeMultipleProductsWithMarkersuit } from './markersuitService';

// Cache das políticas para melhor performance
let politicasCache: string | null = null;

const API_KEY = 'AIzaSyDNm9chlq0QHcFGcCM_2TTxTczqrCC7GFE';
const genAI = new GoogleGenerativeAI(API_KEY);

// Lista de modelos em ordem de preferência para alternância
const GEMINI_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash', 
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

// Configurações de retry e alternância
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500; // 1.5 segundos
const BACKOFF_MULTIPLIER = 1.3;

// Contador para alternância de modelos
let modelIndex = 0;

// Função para obter o próximo modelo na sequência
function getNextModel(): string {
  const model = GEMINI_MODELS[modelIndex % GEMINI_MODELS.length];
  modelIndex++;
  console.log(`Usando modelo: ${model} (index: ${modelIndex - 1})`);
  return model;
}

// Função para resetar o contador se necessário
function resetModelRotation(): void {
  modelIndex = 0;
}
const SYSTEM_INSTRUCTION = `Você é um assistente especializado nas políticas de produtos proibidos da Shopee.

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

function createModel(name: string) {
  return genAI.getGenerativeModel({
    model: name,
    systemInstruction: SYSTEM_INSTRUCTION,
  });
}

async function generateWithModel(modelName: string, prompt: string, retryCount: number = 0, originalModel?: string): Promise<string> {
  try {
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
  } catch (error: any) {
    console.error(`Erro com modelo ${modelName} (tentativa ${retryCount + 1}):`, error);
    
    // Verificar se é erro 503 (modelo sobrecarregado) ou erro de rede
    const isRetryableError = 
      error?.message?.includes('503') || 
      error?.message?.includes('overloaded') ||
      error?.message?.includes('Service Unavailable') ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('429'); // Rate limit
    
    if (isRetryableError && retryCount < MAX_RETRIES) {
      // Tentar com o próximo modelo na rotação
      const nextModel = getNextModel();
      const delayTime = RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount);
      
      console.log(`Modelo ${modelName} sobrecarregado. Tentando com ${nextModel} após ${delayTime}ms...`);
      await delay(delayTime);
      
      return generateWithModel(nextModel, prompt, retryCount + 1, originalModel || modelName);
    }
    
    // Se todos os retries falharam, lançar erro
    throw error;
  }
}

// Função auxiliar para delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para gerar conteúdo com modelo rotativo
async function generateWithRotatingModel(prompt: string): Promise<string> {
  const selectedModel = getNextModel();
  return generateWithModel(selectedModel, prompt);
}

export const analyzeMultipleProducts = async (products: string[]): Promise<Array<{productNumber: number, productName: string, analysis: string}>> => {
  try {
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

      const responseText = await generateWithRotatingModel(prompt);

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

    return results;
  } catch (error) {
    console.error('Erro ao analisar múltiplos produtos:', error);
    
    // Tentar com API Markersuit como fallback
    try {
      console.log('Tentando análise de múltiplos produtos com API Markersuit como fallback...');
      const markersuitResults = await analyzeMultipleProductsWithMarkersuit(products);
      console.log('Sucesso com API Markersuit para múltiplos produtos!');
      return markersuitResults;
    } catch (markersuitError) {
      console.error('Erro também com API Markersuit para múltiplos produtos:', markersuitError);
      throw new Error('Desculpe, ocorreu um erro ao processar os produtos. Ambas as APIs estão indisponíveis. Tente novamente.');
    }
  }
};

export const generateQuizQuestions = async (difficulty: 'easy' | 'medium' | 'hard'): Promise<any[]> => {
  try {
    // Carregar políticas do arquivo JSON
    const politicasTexto = politicasData.categorias
      .filter(cat => cat.conteudo && cat.conteudo.trim() !== '--------------------------------------------------------------------------------')
      .map(cat => `${cat.nome}: ${cat.conteudo}`)
      .join('\n\n');

    const prompt = `Você é um especialista nas políticas de produtos proibidos da Shopee.
    
    POLÍTICAS DA SHOPEE:
    ${politicasTexto}
    
    Crie 10 perguntas de quiz EXCLUSIVAMENTE sobre as políticas de produtos proibidos da Shopee listadas acima.
    
    REGRAS OBRIGATÓRIAS:
    1. Use APENAS informações das políticas fornecidas
    2. NÃO crie perguntas sobre temas gerais (privacidade, práticas comerciais, etc.)
    3. Foque em produtos PROIBIDOS, PERMITIDOS, RESTRITOS ou que DEPENDEM de condições
    4. Cada pergunta deve ser sobre um produto específico mencionado nas políticas
    
    Nível de dificuldade: ${difficulty === 'easy' ? 'FÁCIL' : difficulty === 'medium' ? 'MÉDIO' : 'DIFÍCIL'}
    
    ${difficulty === 'easy' ? 
      'Para nível FÁCIL: Perguntas diretas sobre itens claramente proibidos ou permitidos' :
      difficulty === 'medium' ?
      'Para nível MÉDIO: Perguntas sobre casos que dependem de condições ou requerem documentação' :
      'Para nível DIFÍCIL: Perguntas sobre casos específicos, exceções e situações complexas'
    }
    
    FORMATO OBRIGATÓRIO:
    - Pergunta: "[Nome do produto] deve ser classificado como:"
    - Opções: ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"]
    - Apenas uma resposta correta baseada nas políticas
    
    Retorne EXATAMENTE neste formato JSON (array de objetos):
    [
      {
        "question": "Fogos de artifício devem ser classificados como:",
        "options": ["PERMITIDO", "PROIBIDO", "RESTRITO", "DEPENDE"],
        "correctAnswer": 1,
        "category": "EXPLOSIVOS",
        "explanation": "Fogos de artifício são proibidos segundo a política."
      }
    ]
    
    Gere exatamente 10 perguntas variadas sobre PRODUTOS das políticas.`;


    // Usar modelo rotativo para geração de quiz
    const selectedModel = getNextModel();
    const model = genAI.getGenerativeModel({ 
      model: selectedModel,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    console.log(`Gerando quiz com modelo: ${selectedModel}`);
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extrair JSON da resposta
    const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      
      // Validar e garantir que são 10 questões
      const validQuestions = questions
        .filter((q: any) => q.question && q.options && q.options.length === 4)
        .slice(0, 10);
      
      // Se não tiver 10 questões válidas, completar com questões do arquivo
      if (validQuestions.length < 10) {
        const { quizQuestions } = await import('../data/quizQuestions');
        const additionalQuestions = quizQuestions
          .slice(0, 10 - validQuestions.length)
          .map((q, index) => ({
            id: `fallback_${index}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            category: q.category,
            explanation: q.explanation
          }));
        validQuestions.push(...additionalQuestions);
      }
      
      // Formatar as questões
      return validQuestions.map((q: any, index: number) => ({
        id: `${Date.now()}_${index}`,
        question: q.question || 'Pergunta não disponível',
        options: q.options || ['PERMITIDO', 'PROIBIDO', 'RESTRITO', 'DEPENDE'],
        correctAnswer: q.correctAnswer || 0,
        category: q.category || 'Produtos Proibidos',
        explanation: q.explanation || 'Conforme as políticas da Shopee'
      }));
    }
  } catch (error) {
    console.error('Erro ao gerar perguntas do quiz:', error);
    throw new Error('Desculpe, ocorreu um erro ao processar as perguntas do quiz. Tente novamente.');
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
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

PRIORIDADE ABSOLUTA: RESTRITO > PROIBIDO > PERMITIDO > DEPENDE\n\nREGRA CRÍTICA: SEMPRE verifique se há números no item antes de classificar como DEPENDE!\n\nEXEMPLOS OBRIGATÓRIOS:\n- "faca" (sem tamanho) = DEPENDE (política tem limite de 30cm)\n- "álcool" (sem %) = DEPENDE (política tem limite de 70%)\n- "faca 28cm" = PERMITIDO (28cm < 30cm) ← TEM MEDIDA!\n- "álcool 50%" = PERMITIDO (50% < 70%) ← TEM MEDIDA!\n- "faca 32cm" = PROIBIDO (32cm > 30cm) ← TEM MEDIDA!\n- "álcool 80%" = PROIBIDO (80% > 70%) ← TEM MEDIDA!\n- "cerveja" = RESTRITO (requer documentação)
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

    const responseText = await generateWithRotatingModel(prompt);

    // Sanitização e validação da resposta
    if (responseText) {
      const sanitizedResponse = responseText.trim().replace(/[\[\]]/g, '');
      
      // Extrair categoria específica da resposta da IA
      const categoriaMatch = sanitizedResponse.match(/política\s+(\d+(?:\.\d+)*\.?\s*[A-ZÁÊÇÕ\s]+)/i);
      let categoriaRelevante = null;
      
      if (categoriaMatch) {
        const categoriaNome = categoriaMatch[1].trim().replace(/\.$/, '');
        console.log('Categoria extraída da resposta:', categoriaNome);
        
        // Buscar categoria exata pelo nome
        categoriaRelevante = politicasData.categorias.find(categoria => {
          const nomeCategoria = categoria.nome.trim();
          return nomeCategoria === categoriaNome || nomeCategoria.includes(categoriaNome);
        });
        
        console.log('Categoria encontrada:', categoriaRelevante?.nome);
      }

      console.log('Categoria encontrada:', categoriaRelevante?.nome, 'Link:', categoriaRelevante?.link);

      if (categoriaRelevante && categoriaRelevante.link) {
        return sanitizedResponse + `\n\n${categoriaRelevante.link}`;
      } else {
        return sanitizedResponse;
      }
    }

    if (!responseText) {
      throw new Error('Resposta vazia da IA');
    }

    return responseText;
  } catch (error) {
    console.error('Erro ao comunicar com Gemini:', error);
    
    // Tentar com API Markersuit como fallback
    try {
      console.log('Tentando com API Markersuit como fallback...');
      const markersuitResponse = await sendMessageToMarkersuit(message);
      console.log('Sucesso com API Markersuit!');
      return markersuitResponse;
    } catch (markersuitError) {
      console.error('Erro também com API Markersuit:', markersuitError);
      throw new Error('Desculpe, ocorreu um erro ao processar sua mensagem. Ambas as APIs estão indisponíveis. Tente novamente.');
    }
  }
};
