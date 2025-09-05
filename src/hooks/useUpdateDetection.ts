import { useState, useEffect } from 'react';

interface UpdateDetectionHook {
  hasUpdate: boolean;
  checkForUpdates: () => void;
  clearUpdateFlag: () => void;
}

export const useUpdateDetection = (): UpdateDetectionHook => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [lastVersion, setLastVersion] = useState<string | null>(null);

  const checkForUpdates = async () => {
    try {
      // Verificar se há uma nova versão fazendo request para um endpoint de versão
      const response = await fetch('/version.json?' + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const currentVersion = data.version || data.timestamp;
        
        if (lastVersion && lastVersion !== currentVersion) {
          setHasUpdate(true);
        }
        
        if (!lastVersion) {
          setLastVersion(currentVersion);
        }
      }
    } catch (error) {
      // Fallback: verificar se o service worker detectou mudanças
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          setHasUpdate(true);
        }
      }
    }
  };

  const clearUpdateFlag = () => {
    setHasUpdate(false);
  };

  useEffect(() => {
    // Verificar atualizações a cada 30 segundos
    const interval = setInterval(checkForUpdates, 30000);
    
    // Verificação inicial
    checkForUpdates();

    // Listener para service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setHasUpdate(true);
      });
    }

    // Listener para quando a aba volta a ficar ativa
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastVersion]);

  return {
    hasUpdate,
    checkForUpdates,
    clearUpdateFlag
  };
};
