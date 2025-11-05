import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../App';

interface OnlineStatusIndicatorProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  onForceSync: () => void;
}

const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({ 
  lastSyncTime, 
  isSyncing,
  onForceSync 
}) => {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTimeSinceLastSync = () => {
    if (!lastSyncTime) return 'Jamais';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
        <div className="bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-xl px-4 py-2 shadow-lg flex items-center gap-2">
          <Icon icon="solar:wifi-off-bold-duotone" className="size-5" />
          <span className="text-sm font-semibold">Mode hors ligne</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 transition-all ${
          isSyncing
            ? 'bg-blue-100 border border-blue-200 text-blue-800'
            : 'bg-green-100 border border-green-200 text-green-800 hover:bg-green-200'
        }`}
      >
        {isSyncing ? (
          <>
            <Icon icon="solar:refresh-linear" className="size-5 animate-spin" />
            <span className="text-sm font-semibold">Sync...</span>
          </>
        ) : (
          <>
            <Icon icon="solar:cloud-check-bold-duotone" className="size-5" />
            <span className="text-sm font-semibold hidden sm:inline">En ligne</span>
          </>
        )}
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-border p-4 animate-slide-in-down">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-foreground">État de synchronisation</h4>
            <button
              onClick={() => setShowDetails(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon icon="solar:close-circle-bold-duotone" className="size-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
              <div className="size-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Icon icon="solar:wifi-router-bold-duotone" className="size-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Connexion</p>
                <p className="text-sm font-semibold text-green-600">En ligne</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
              <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Icon icon="solar:clock-circle-bold-duotone" className="size-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Dernière sync</p>
                <p className="text-sm font-semibold text-foreground">{getTimeSinceLastSync()}</p>
              </div>
            </div>

            <button
              onClick={() => {
                onForceSync();
                setShowDetails(false);
              }}
              disabled={isSyncing}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="solar:refresh-bold-duotone" className={isSyncing ? "size-4 animate-spin" : "size-4"} />
              {isSyncing ? 'Synchronisation...' : 'Forcer la synchronisation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineStatusIndicator;

