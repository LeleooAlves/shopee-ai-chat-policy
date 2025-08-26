import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ClearChatButtonProps {
  onClearChat: () => void;
}

const ClearChatButton: React.FC<ClearChatButtonProps> = ({ onClearChat }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Limpar</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Limpar Histórico
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja excluir todo o histórico de conversa? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onClearChat}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Excluir Histórico
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ClearChatButton;
