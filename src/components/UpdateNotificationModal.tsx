import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Atualização Disponível</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed">
            Para garantia de atualização, clique no botão de atualizar a página, ao lado do botão de excluir conversa.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotificationModal;
