import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Tipos para PolicyCategory (comentários para JavaScript)
// PolicyCategory: { nome: string, link: string, conteudo: string }
// PolicyData: { categorias: PolicyCategory[] }

// API Route para atualizar links
app.post('/api/update-policy-link', async (req, res) => {
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

    // Validar formato da URL
    const urlPattern = /^https:\/\/help\.shopee\.com\.br\//;
    if (!urlPattern.test(link)) {
      return res.status(400).json({ 
        error: 'Invalid URL format. Must start with: https://help.shopee.com.br/' 
      });
    }

    // Ler arquivo JSON atual
    const jsonPath = path.join(__dirname, 'src', 'data', 'PoliticasShopee.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const policyData = JSON.parse(jsonData);

    // Verificar se o link já existe em OUTRA categoria (não na mesma categoria)
    const existingCategory = policyData.categorias.find(categoria => 
      categoria.link && 
      categoria.link.trim() !== '' && 
      categoria.link === link &&
      !categoria.nome.toLowerCase().includes(categoryName.toLowerCase()) &&
      categoria.nome !== categoryName
    );
    if (existingCategory) {
      return res.status(400).json({ 
        error: `Esse link já existe para a categoria ${existingCategory.nome}, apresente o link da categoria correta: ${categoryName}`,
        existingCategory: existingCategory.nome,
        requestedCategory: categoryName
      });
    }

    // Encontrar categoria e atualizar link
    const categoryIndex = policyData.categorias.findIndex(categoria => 
      categoria.nome.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoria.nome === categoryName
    );

    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Atualizar o link da categoria
    policyData.categorias[categoryIndex].link = link;

    // Salvar arquivo JSON atualizado
    fs.writeFileSync(jsonPath, JSON.stringify(policyData, null, 2));

    res.status(200).json({ 
      success: true, 
      message: 'Link updated successfully',
      category: policyData.categorias[categoryIndex].nome
    });

  } catch (error) {
    console.error('Error updating policy link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rota de health check para Railway
app.get('/', (req, res) => {
  res.json({ status: 'API Server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
});
