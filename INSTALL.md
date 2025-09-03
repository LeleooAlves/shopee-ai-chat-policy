# Instalação e Configuração

## Dependências Necessárias

Para que a funcionalidade de adicionar links funcione corretamente, instale as dependências:

```bash
npm install @vercel/node
```

## Estrutura de Arquivos

A API route está configurada em:
- `src/pages/api/update-policy-link.ts` - Endpoint para atualizar links
- `vercel.json` - Configuração do Vercel para API routes

## Como Usar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar em desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Deploy no Vercel:**
   - O projeto está configurado para funcionar automaticamente
   - As API routes serão disponibilizadas em `/api/update-policy-link`

## Funcionalidade de Adicionar Links

- Clique em "link da categoria não encontrado" nas respostas da IA
- Modal abrirá para inserir o link da política
- Validação automática do formato Shopee
- Salva no arquivo JSON para todos os usuários

## Troubleshooting

Se houver erros de tipos TypeScript:
1. Certifique-se que `@vercel/node` está instalado
2. Execute `npm install` novamente
3. Reinicie o servidor de desenvolvimento
