import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DownloadButtonProps {
  onDownload: () => void;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ onDownload }) => {
  const handleDownload = () => {
    // Detectar se é PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true ||
                  document.referrer.includes('android-app://');
    
    if (isPWA) {
      // Para PWA, forçar download real
      const element = document.createElement('a');
      const file = new Blob([generatePolicyText()], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = 'politicas-shopee.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
    } else {
      // Para desktop/mobile normal
      onDownload();
    }
  };

  const generatePolicyText = () => {
    return `POLÍTICAS DE PRODUTOS PROIBIDOS - SHOPEE
    
Gerado em: ${new Date().toLocaleDateString('pt-BR')}

Este arquivo contém as principais políticas de produtos proibidos da Shopee.
Para informações mais detalhadas, acesse: https://help.shopee.com.br/

CLASSIFICAÇÕES:
- PERMITIDO: Item não está nas políticas ou explicitamente permitido
- PROIBIDO: Item explicitamente proibido nas políticas  
- DEPENDE: Item tem limites numéricos mas usuário não informou medidas
- RESTRITO: Item requer documentação/autorização especial

Para consultas específicas, utilize o chat da aplicação.
`;
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Download</span>
    </Button>
  );
};

export default DownloadButton;
