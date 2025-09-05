import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useUpdateDetection } from '@/hooks/useUpdateDetection';

interface RefreshButtonProps {
  onRefresh?: () => void;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh }) => {
  const { hasUpdate, clearUpdateFlag } = useUpdateDetection();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (hasUpdate) {
      setShowNotification(true);
      
      // Esconder notificação após 4 segundos
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [hasUpdate]);

  const handleRefresh = () => {
    clearUpdateFlag();
    setShowNotification(false);
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleRefresh}
        className="relative flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors duration-200"
        title={hasUpdate ? "Nova atualização disponível! Clique para atualizar" : "Atualizar página para buscar novas atualizações"}
      >
        <RefreshCw className="w-4 h-4" />
        <span className="text-sm font-medium">Atualizar</span>
        
        {hasUpdate && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse">
            <div className="absolute inset-0 w-3 h-3 bg-yellow-500 rounded-full animate-ping opacity-75"></div>
          </div>
        )}
      </button>

      {/* Notificação Balão */}
      {showNotification && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-orange-600 text-white text-sm rounded-lg shadow-lg p-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="font-medium">Atualização disponível, clique aqui e atualize agora!</span>
          </div>
          
          {/* Seta do balão */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-600"></div>
        </div>
      )}
    </div>
  );
};

export default RefreshButton;
