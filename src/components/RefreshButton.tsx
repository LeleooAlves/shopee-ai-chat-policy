import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh?: () => void;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh }) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleRefresh}
      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors duration-200"
      title="Atualizar página para buscar novas atualizações"
    >
      <RefreshCw className="w-4 h-4" />
      <span className="text-sm font-medium">Atualizar</span>
    </button>
  );
};

export default RefreshButton;
