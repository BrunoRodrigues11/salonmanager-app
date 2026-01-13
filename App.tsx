import React, { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout';
import { CollaboratorView, ProcedureView, PriceView } from './views/AdminViews';
import { ServiceEntryView, HistoryView } from './views/ServiceViews';
import { DashboardView } from './views/DashboardView';
import { ReportView } from './views/ReportViews';
import { AnalysisView } from './views/AnalysisView';
import { LoginView } from './views/LoginView';
import { storageService } from './services/storage'; 
import { themeService } from './services/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {  
    // Load theme (Dark Mode)
    const savedTheme = storageService.getTheme();
    setIsDarkMode(savedTheme === 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Load Color Theme
    const savedColor = themeService.getSavedTheme();
    themeService.applyTheme(savedColor);

    // Check Auth
    setIsAuthenticated(storageService.isAuthenticated());

    setIsLoaded(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    storageService.saveTheme(newTheme ? 'dark' : 'light');
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogin = () => {
    // O componente LoginView já fez a autenticação na API.
    // Confirma que o estado mudou.
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    storageService.logout();
    setIsAuthenticated(false);
    setActiveTab('dashboard'); // Reset tab on logout
  };

  if (!isLoaded) return <div className="p-10 text-center dark:bg-slate-900 dark:text-white">Carregando sistema...</div>;

  if (!isAuthenticated) {
    return (
      <>
        {/* Force Theme on Login Screen */}
        <LoginView onLogin={handleLogin} />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'analysis':
        return <AnalysisView />;
      case 'entry':
        return <ServiceEntryView />;
      case 'history':
        return <HistoryView />;
      case 'reports':
        return <ReportView />;
      case 'collaborators':
        return <CollaboratorView />;
      case 'procedures':
        return <ProcedureView />;
      case 'prices':
        return <PriceView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onChangeTab={setActiveTab} 
      isDarkMode={isDarkMode} 
      toggleTheme={toggleTheme}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}