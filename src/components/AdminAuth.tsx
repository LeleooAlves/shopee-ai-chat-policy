import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface AdminAuthProps {
  onAuthenticated: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated, isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === 'admin123') {
      onAuthenticated();
      setPassword('');
      setError('');
      onClose();
    } else {
      setError('Senha incorreta');
      setPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
          Acesso Administrativo
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Digite a senha para acessar o painel de analytics
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAuth;
