import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface UserInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (firstName: string, lastName: string, teamName: string) => void;
}

export const UserInputModal: React.FC<UserInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [teamName, setTeamName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim() && teamName.trim()) {
      onSubmit(firstName.trim(), lastName.trim(), teamName.trim());
      setFirstName('');
      setLastName('');
      setTeamName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Informações do Participante</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Digite seu nome"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Digite seu sobrenome"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamName">Nome do Time</Label>
            <Input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Digite o nome do seu time"
              required
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Iniciar Quiz
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
