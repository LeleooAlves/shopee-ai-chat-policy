import fs from 'fs';
import path from 'path';
import { VercelRequest, VercelResponse } from '@vercel/node';

interface PolicyCategory {
  nome: string;
  link: string;
  conteudo: string;
}

interface PolicyData {
  categorias: PolicyCategory[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS para permitir requests do frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { categoryName, link } = req.body;

    if (!categoryName || !link) {
      return res.status(400).json({ error: 'Category name and link are required' });
    }

    // Validar formato do link
    const shopeeUrlPattern = /^https:\/\/help\.shopee\.com\.br\/portal\/4\/article\/\d+\?previousPage=other%20articles$/;
    if (!shopeeUrlPattern.test(link)) {
      return res.status(400).json({ 
        error: 'Invalid URL format. Must match: https://help.shopee.com.br/portal/4/article/[number]?previousPage=other%20articles' 
      });
    }

    // Ler arquivo JSON atual
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'PoliticasShopee.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const policyData: PolicyData = JSON.parse(jsonData);

    // Verificar se o link já existe e em qual categoria
    const existingCategory = policyData.categorias.find(categoria => categoria.link === link);
    if (existingCategory) {
      return res.status(400).json({ 
        error: `Esse link já existe para a categoria ${existingCategory.nome}, apresente o link da categoria correta: ${categoryName}`,
        existingCategory: existingCategory.nome,
        requestedCategory: categoryName
      });
    }

    // Encontrar categoria e atualizar link
    const categoryIndex = policyData.categorias.findIndex(categoria => 
      categoria.nome.toLowerCase().includes(categoryName.toLowerCase())
    );

    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Atualizar o link da categoria
    policyData.categorias[categoryIndex].link = link;

    // Salvar arquivo atualizado
    fs.writeFileSync(jsonPath, JSON.stringify(policyData, null, 2));

    return res.status(200).json({ 
      success: true, 
      message: 'Link updated successfully',
      category: policyData.categorias[categoryIndex].nome
    });

  } catch (error) {
    console.error('Error updating policy link:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
