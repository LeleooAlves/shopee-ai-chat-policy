import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Lightbulb, AlertTriangle, Info, Loader2 } from 'lucide-react';

interface LoadingTipModalProps {
  isOpen: boolean;
  tip: string;
  query: string;
}

const LoadingTipModal: React.FC<LoadingTipModalProps> = ({ isOpen, tip, query }) => {
  const getTipIcon = () => {
    if (tip.includes('⚠️')) return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    if (tip.includes('💡')) return <Lightbulb className="w-5 h-5 text-blue-500" />;
    return <Info className="w-5 h-5 text-gray-500" />;
  };

  const getTipType = () => {
    if (tip.includes('⚠️')) return 'Alerta';
    if (tip.includes('💡')) return 'Dica';
    return 'Informação';
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <div className="flex flex-col items-center text-center py-6">
          {/* Ícone de carregamento */}
          <div className="mb-4">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
          
          {/* Título */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Analisando "{query}"
          </h3>
          
          {/* Dica */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4 w-full">
            <div className="flex items-start gap-3">
              {getTipIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {getTipType()}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {tip.replace(/💡|⚠️|ℹ️/g, '').trim()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Status */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Processando sua consulta...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingTipModal;
