import React, { useState } from 'react';
import { LayoutDashboard, Users, Scissors, DollarSign, FileText, Menu, X, History, PlusCircle, Sun, Moon, LogOut, BarChart3, Palette, Check } from 'lucide-react';
import clsx from 'clsx';
import { themeService, ThemeColor } from '../../services/theme';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onChangeTab, isDarkMode, toggleTheme, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState<ThemeColor>(themeService.getSavedTheme());

  // Define groups instead of a flat list
  const navGroups = [
    {
      title: 'Visão Geral',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analysis', label: 'Análise', icon: BarChart3 },
      ]
    },
    {
      title: 'Operacional',
      items: [
        { id: 'entry', label: 'Novo Lançamento', icon: PlusCircle },
        { id: 'history', label: 'Histórico', icon: History },
        { id: 'reports', label: 'Relatórios', icon: FileText },
      ]
    },
    {
      title: 'Gestão',
      items: [
        { id: 'collaborators', label: 'Colaboradoras', icon: Users },
        { id: 'procedures', label: 'Procedimentos', icon: Scissors },
        { id: 'prices', label: 'Valores', icon: DollarSign },
      ]
    }
  ];

  const handleNavClick = (id: string) => {
    onChangeTab(id);
    setMobileMenuOpen(false);
  };

  const changeColor = (color: ThemeColor) => {
    themeService.setTheme(color);
    setCurrentColor(color);
    setShowColorPicker(false);
  };

  const colors: { id: ThemeColor, bg: string }[] = [
    { id: 'indigo', bg: 'bg-indigo-600' },
    { id: 'blue', bg: 'bg-blue-600' },
    { id: 'rose', bg: 'bg-rose-600' },
    { id: 'emerald', bg: 'bg-emerald-600' },
    { id: 'violet', bg: 'bg-violet-600' },
    { id: 'orange', bg: 'bg-orange-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden bg-primary-700 dark:bg-primary-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="font-bold text-lg">SalonManager Pro</h1>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-1 rounded-full hover:bg-white/10">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={onLogout} className="p-1 rounded-full hover:bg-white/10" title="Sair">
            <LogOut size={20} />
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 transform bg-white dark:bg-slate-900 md:bg-primary-900 md:dark:bg-primary-950 md:text-primary-100 w-64 transition-transform duration-200 ease-in-out z-40 border-r dark:border-slate-800 md:border-r-0 shadow-xl md:shadow-none md:translate-x-0 flex flex-col",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <div className="font-bold text-2xl hidden md:block text-white">SalonManager</div>
          {/* Desktop Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="hidden md:flex p-2 rounded-lg bg-primary-800 dark:bg-primary-900 text-primary-200 hover:text-white transition-colors"
            title="Alternar Tema"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 flex flex-col px-4 space-y-6 mt-6 md:mt-0 overflow-y-auto">
          {navGroups.map((group, groupIndex) => (
            <div key={group.title}>
              <h3 className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 md:text-primary-300 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={clsx(
                      "flex items-center space-x-3 p-3 rounded-lg transition-colors text-left w-full",
                      activeTab === item.id 
                        ? "bg-primary-100 text-primary-900 md:bg-primary-800 md:text-white font-medium shadow-sm" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 md:hover:bg-primary-800 text-slate-600 dark:text-slate-300 md:text-primary-200"
                    )}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Color Picker Button */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 md:text-primary-300 uppercase tracking-wider mb-2">
              Personalização
            </h3>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hover:bg-primary-800 text-slate-600 dark:text-slate-300 md:text-primary-200 w-full transition-colors"
              >
                <Palette size={20} />
                <span>Cor do Sistema</span>
              </button>
              
              {showColorPicker && (
                <div className="absolute bottom-full left-0 w-full bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 mb-2 grid grid-cols-3 gap-2 animate-fade-in z-50">
                  {colors.map(c => (
                    <button
                      key={c.id}
                      onClick={() => changeColor(c.id)}
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                        c.bg
                      )}
                      title={c.id}
                    >
                      {currentColor === c.id && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 md:border-primary-800 mt-auto">
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 md:hover:bg-red-900/50 text-red-600 dark:text-red-400 md:text-red-200 md:hover:text-white w-full transition-colors"
          >
            <LogOut size={20} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-4 md:ml-64 dark:text-slate-200">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};