import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Users, Building } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseService, User as UserType } from '@/services/supabaseService';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserRegistered: (user: UserType) => void;
}

const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  onUserRegistered
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !teamName.trim()) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se usuário já existe
      const existingUser = await supabaseService.findUserByName(firstName.trim(), lastName.trim());
      
      if (existingUser) {
        // Usuário já existe, usar o existente
        onUserRegistered(existingUser);
        toast.success(`Bem-vindo de volta, ${existingUser.first_name}!`);
        onClose();
        resetForm();
        return;
      }

      // Criar novo usuário
      const newUser = await supabaseService.createUser(
        firstName.trim(),
        lastName.trim(),
        teamName.trim()
      );

      if (newUser) {
        onUserRegistered(newUser);
        toast.success(`Usuário ${newUser.first_name} registrado com sucesso!`);
        onClose();
        resetForm();
      } else {
        toast.error('Erro ao registrar usuário. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error('Erro ao registrar usuário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setTeamName('');
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) {
    return null;
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
      >
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Registro para o Quiz
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Para participar do ranking global, precisamos de algumas informações suas.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Seu primeiro nome"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Sobrenome
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Seu sobrenome"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamName" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Nome do Time
                </Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Marketplace, CS, Tech, etc."
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isLoading ? 'Registrando...' : 'Começar Quiz'}
                </Button>
              </div>
            </form>

        <div className="text-xs text-gray-500 text-center pt-2">
          💡 Se você já se registrou antes, apenas confirme seus dados para continuar
        </div>
      </div>
    </div>
  );
};

export default UserRegistrationModal;
