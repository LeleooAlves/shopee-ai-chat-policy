import React, { useState } from 'react';
import { Download, X, Smartphone, Bell } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, installApp, requestNotificationPermission, showNotification } = usePWA();
  const [isVisible, setIsVisible] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  const hidePermanently = () => {
    localStorage.setItem('shopee-pwa-prompt-hidden', 'true');
    setIsVisible(false);
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      showNotification('App Instalado!', {
        body: 'O Shopee IA foi instalado com sucesso no seu dispositivo.',
        icon: '/favicon-96x96.png'
      });
    }
    hidePermanently();
  };

  const handleNotificationRequest = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      showNotification('Notificações Ativadas!', {
        body: 'Você receberá atualizações importantes do sistema.',
        icon: '/favicon-96x96.png'
      });
    }
    hidePermanently();
  };

  const handleDismiss = () => {
    hidePermanently();
  };

  // Check if permanently hidden in localStorage
  const isPermanentlyHidden = localStorage.getItem('shopee-pwa-prompt-hidden') === 'true';

  // Don't show if already installed, not installable, or hidden
  if (isInstalled || !isInstallable || !isVisible || isPermanentlyHidden) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Instalar App
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Instale o Shopee IA no seu dispositivo para acesso rápido e experiência offline.
      </p>

      <div className="space-y-2">
        <button
          onClick={handleInstall}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200"
        >
          <Download className="w-4 h-4" />
          Instalar App
        </button>

        {notificationPermission !== 'granted' && (
          <button
            onClick={handleNotificationRequest}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Bell className="w-4 h-4" />
            Ativar Notificações
          </button>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        ✨ Funciona offline • 📱 Acesso rápido • 🔔 Notificações
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
