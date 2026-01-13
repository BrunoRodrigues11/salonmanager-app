import React, { useState } from 'react';
import { Lock, ArrowRight, Scissors, Loader2 } from 'lucide-react'; 
import { storageService } from '../services/storage'; 

interface LoginViewProps {
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // --- CORREÇÃO: Faltava declarar este estado ---
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Evita submissão vazia
    if (!password.trim()) return;

    setLoading(true);
    setError(''); // Limpa erros anteriores

    try {
        const success = await storageService.login(password);
        
        if (success) {
            onLogin(); 
        } else {
            setError('Código de acesso incorreto.');
            setPassword('');
        }
    } catch (err) {
        setError('Erro de conexão com o servidor. Tente novamente.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="bg-primary-600 dark:bg-primary-900 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Scissors className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">SalonManager Pro</h1>
          <p className="text-primary-100 mt-2 text-sm">Sistema de Gestão de Procedimentos</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Código de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  disabled={loading} // Bloqueia input enquanto carrega
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Digite o código de acesso"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoFocus
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-pulse bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading} // Bloqueia botão enquanto carrega
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verificando...
                </>
              ) : (
                <>
                  Entrar no Sistema <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
             Versão: <strong>1.0.1</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};