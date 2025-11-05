import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { NutriMindLogo } from './ui/NutriMindLogo';
import { useLanguage } from '../App';

const Sidebar: React.FC<{
  currentView: string;
  setView: (view: any) => void;
}> = ({ currentView, setView }) => {
  const { t } = useLanguage();
  const navItems = useMemo(() => [
    { id: 'dashboard', label: t('layout.nav.dashboard'), icon: 'solar:home-2-bold-duotone' },
    { id: 'nutrition', label: t('layout.nav.nutrition'), icon: 'solar:notebook-bold-duotone' },
    { id: 'activities', label: t('layout.nav.activities'), icon: 'solar:chart-bold-duotone' },
    { id: 'profile', label: t('layout.nav.profile'), icon: 'solar:user-bold-duotone' },
    { id: 'settings', label: t('layout.nav.settings'), icon: 'solar:settings-bold-duotone' },
  ], [t]);

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-card border-r border-border flex-col justify-between hidden lg:flex z-40">
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <NutriMindLogo className="size-8"/>
          <h1 className="text-xl font-bold font-heading text-primary">NutriMIND</h1>
        </div>
        <nav className="p-4">
          {navItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'}`}>
                <Icon icon={item.icon} className="size-6" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  );
};

const BottomNavBar: React.FC<{
  currentView: string;
  setView: (view: any) => void;
}> = ({ currentView, setView }) => {
  const { t } = useLanguage();
  const navItems = useMemo(() => [
    { id: 'dashboard', label: t('layout.nav.dashboard'), icon: 'solar:home-2-bold-duotone' },
    { id: 'nutrition', label: t('layout.nav.nutrition'), icon: 'solar:notebook-bold-duotone' },
    { id: 'activities', label: t('layout.nav.activities'), icon: 'solar:chart-bold-duotone' },
    { id: 'profile', label: t('layout.nav.profile'), icon: 'solar:user-bold-duotone' },
    { id: 'settings', label: t('layout.nav.settings'), icon: 'solar:settings-bold-duotone' },
  ], [t]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50 lg:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)} className="flex flex-col items-center gap-1 px-4 py-2 flex-1">
              <Icon icon={item.icon} className={`size-7 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
};


const Layout: React.FC<{
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
}> = ({ children, currentView, setView }) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentView={currentView} setView={setView} />
      <main className="lg:ml-64">
        <div className="pb-24 lg:pb-0">
          {children}
        </div>
      </main>
      <BottomNavBar currentView={currentView} setView={setView} />
    </div>
  );
};

export default Layout;
