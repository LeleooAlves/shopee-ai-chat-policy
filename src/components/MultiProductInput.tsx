import React, { useState } from 'react';
import { Plus, X, Package, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
}

interface MultiProductInputProps {
  onAnalyzeProducts: (products: string[]) => void;
  isAnalyzing?: boolean;
}

const MultiProductInput: React.FC<MultiProductInputProps> = ({ onAnalyzeProducts, isAnalyzing = false }) => {
  const [products, setProducts] = useState<Product[]>([{ id: '1', name: '' }]);
  const [currentInput, setCurrentInput] = useState('');

  const addProduct = () => {
    if (currentInput.trim()) {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: currentInput.trim()
      };
      setProducts(prev => [...prev, newProduct]);
      setCurrentInput('');
    }
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const updateProduct = (id: string, name: string) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, name } : product
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProduct();
    }
  };

  const handleAnalyze = () => {
    const productNames = products
      .map(p => p.name.trim())
      .filter(name => name.length > 0);
    
    if (productNames.length === 0) {
      alert('Adicione pelo menos um produto para análise.');
      return;
    }

    onAnalyzeProducts(productNames);
  };

  const addEmptyProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: ''
    };
    setProducts(prev => [...prev, newProduct]);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Análise de Múltiplos Produtos
        </h3>
      </div>

      <div className="space-y-3">
        {products.map((product, index) => (
          <div key={product.id} className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
              {index + 1}.
            </span>
            <input
              type="text"
              value={product.name}
              onChange={(e) => updateProduct(product.id, e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Nome do produto ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100"
            />
            {products.length > 1 && (
              <button
                onClick={() => removeProduct(product.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                title="Remover produto"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={addEmptyProduct}
          className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Adicionar produto</span>
        </button>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analisando produtos...</span>
            </>
          ) : (
            <>
              <Package className="w-4 h-4" />
              <span>Analisar Todos os Produtos</span>
            </>
          )}
        </button>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>💡 Dica: Pressione Enter para adicionar rapidamente um produto à lista</p>
      </div>
    </div>
  );
};

export default MultiProductInput;
