import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Loader2, Link } from 'lucide-react';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, categoryName }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  // Validação do formato da URL
  const shopeeUrlPattern = /^https:\/\/help\.shopee\.com\.br\//;
  const isValidUrl = shopeeUrlPattern.test(url);

  const handleSubmit = async () => {
    if (!isValidUrl) {
      setFeedback({
        type: 'error',
        message: 'URL deve começar com: https://help.shopee.com.br/'
      });
      return;
    }

    setIsLoading(true);
    setFeedback({ 
      type: null, 
      message: '🔍 Analisando link e verificando duplicatas...' 
    });

    // Simular tempo de análise
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch('/api/update-policy-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryName,
          link: url,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback({
          type: 'success',
          message: `Link adicionado com sucesso para a categoria: ${data.category}`
        });
        setTimeout(() => {
          handleClose();
          // Recarregar a página para atualizar os dados
          window.location.reload();
        }, 2000);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Erro ao adicionar link'
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Erro de conexão. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setFeedback({ type: null, message: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-blue-600" />
            Adicionar Link da Política
          </DialogTitle>
          <DialogDescription>
            Adicione o link oficial da Shopee para a categoria: <strong>{categoryName}</strong>
            <br />
            <button
              onClick={() => window.open('https://help.shopee.com.br/portal/4/article/76226-%5BPol%C3%ADticas%5D-Pol%C3%ADtica-de-Produtos-Proibidos-e-Restritos', '_blank')}
              className="inline-flex items-center px-2 py-1 mt-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors duration-200"
            >
              📋 Políticas
            </button>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL da Política</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://help.shopee.com.br/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`${
                url && (isValidUrl ? 'border-green-500' : 'border-red-500')
              }`}
            />
            {url && (
              <div className="flex items-center gap-2 text-sm">
                {isValidUrl ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Formato válido</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Formato inválido</span>
                  </>
                )}
              </div>
            )}
          </div>

          {feedback.message && (
            <div className={`p-3 rounded-md flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{feedback.message}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValidUrl || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Link'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddLinkModal;
