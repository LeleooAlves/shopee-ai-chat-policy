// Usando proxy do Vite para evitar erro de CORS em desenvolvimento
const API_BASE_URL = "/insea-api";
const EXPERT_ID = "5864";
const API_KEY = "sGb0kdOdAKpNmH0cJRyvRvF7sSnRP2ek";
const CHAT_ENDPOINT = `${API_BASE_URL}/experts/${EXPERT_ID}/v2/chat/completions`;

import { SHOPEE_EDU_POLICY } from "../data/ShopeeEduPolicy";

export const sendMessageToAI = async (message: string): Promise<string> => {
  try {
    const requestBody = {
      model: "gpt-3.5-turbo",
      user: "shopee-ai-user",
      stream: false,
      messages: [
        {
          role: "system",
          content: `Você é o assistente oficial de políticas de produtos proibidos da Shopee Brasil.
          
          --- DOCUMENTAÇÃO OFICIAL SHOPEE EDU ---
          ${SHOPEE_EDU_POLICY}
          --- FIM DA DOCUMENTAÇÃO ---
          
          SUA MISSÃO: Dar um veredito FINAL e LITERAL sobre a legalidade de um produto.
          
          PROCESSO DE ANÁLISE OBRIGATÓRIO:
          1. **Identificação**: Use seu conhecimento global para saber exatamente o que é o produto e seus atributos (tamanho, conteúdo, etc).
          2. **Varredura Exaustiva**: Você deve ler TODAS as categorias da Documentação Shopee Edu acima à procura de qualquer proibição que se aplique ao produto.
          3. **Literalidade**: Aplique as regras de forma literal. 
             - Exemplo: Se a regra proíbe facas > 30cm, uma faca de 27cm é PERMITIDA (a menos que outra regra específica a proíba, como ser retrátil).
             - Se após varrer TODAS as categorias você não encontrar nenhuma proibição ou restrição, o produto DEVE ser classificado como PERMITIDO.
          4. **Decisão Final**: Não dê avisos genéricos pedindo ao usuário para "verificar outras categorias". VOCÊ é quem faz essa verificação completa e entrega o veredito final.
          
          REGRAS DE RESPOSTA (ESTRITAS):
          - Comece SEMPRE com: PROIBIDO., RESTRITO., PERMITIDO. ou INFORMAÇÃO INSUFICIENTE.
          - O selo (prefixo) deve refletir sua conclusão após a varredura completa.
          - Explique o motivo baseando-se no texto literal da política.
          - Seja direto, profissional e amigável.`
        },
        {
          role: "user",
          content: message
        }
      ]
    };

    console.log("Enviando requisição para API Insea:", {
      endpoint: CHAT_ENDPOINT,
      body: requestBody
    });

    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na resposta da API Insea:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Resposta da API Insea recebida com sucesso:", data);
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Erro completo ao comunicar com AI API:", error);
    throw new Error("Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.");
  }
};

export const analyzeMultipleProducts = async (products: string[]): Promise<Array<{ productNumber: number, productName: string, analysis: string }>> => {
  const results = [];

  for (let i = 0; i < products.length; i++) {
    const productName = products[i].trim();
    const productNumber = i + 1;

    try {
      const analysis = await sendMessageToAI(productName);
      results.push({
        productNumber,
        productName,
        analysis
      });
    } catch (error) {
      console.error(`Error analyzing product ${productName}:`, error);
      results.push({
        productNumber,
        productName,
        analysis: "Erro ao analisar produto"
      });
    }

    // Pequeno delay entre requisições para evitar rate limiting se houver
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return results;
};
