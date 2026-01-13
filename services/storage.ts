import { 
  Collaborator, Procedure, PriceConfig, ServiceRecord, 
  CollaboratorInput, ProcedureInput, PriceConfigInput, ServiceRecordInput 
} from '../types';

// Garante que não venha undefined, ou usa localhost como último recurso
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/* Wrapper genérico para chamadas API para evitar repetição de código. */
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // 1. Pega o token salvo (se existir)
  const token = localStorage.getItem('salon_token');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    // 2. Se tiver token, adiciona o header Authorization automaticamente
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers, // Permite sobrescrever se necessário
    },
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, config);
    
    // Tratamento de Erro de Sessão Expirada (401 ou 403)
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('salon_token'); // Limpa token velho
        // Opcional: window.location.reload(); // Força reload para login
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})); 
      throw new Error(errorData.error || `Erro na API: ${res.status}`);
    }

    // Retorna null se for 204 No Content
    if (res.status === 204) return null as T;
    
    return res.json();
  } catch (error) {
    console.error(`Falha na requisição para ${endpoint}:`, error);
    throw error;
  }
}

export const storageService = {
  // --- Auth ---
  login: async (password: string) => {
    try {
      const data = await apiRequest<{ token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      
      if (data?.token) {
        localStorage.setItem('salon_token', data.token);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('salon_token');
    window.location.reload();
  },

  isAuthenticated: () => !!localStorage.getItem('salon_token'),

  // --- Collaborators ---
  getCollaborators: () => apiRequest<Collaborator[]>('/collaborators'),
  createCollaborator: (data: CollaboratorInput) => apiRequest<Collaborator>('/collaborators', { method: 'POST', body: JSON.stringify(data) }),
  updateCollaborator: (id: string, data: CollaboratorInput) => apiRequest<Collaborator>(`/collaborators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCollaborator: (id: string) => apiRequest<void>(`/collaborators/${id}`, { method: 'DELETE' }),

  // --- Procedures ---
  getProcedures: () => apiRequest<Procedure[]>('/procedures'),
  createProcedure: (data: ProcedureInput) => apiRequest<Procedure>('/procedures', { method: 'POST', body: JSON.stringify(data) }),
  updateProcedure: (id: string, data: ProcedureInput) => apiRequest<Procedure>(`/procedures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProcedure: (id: string) => apiRequest<void>(`/procedures/${id}`, { method: 'DELETE' }),

  // --- Prices ---
  getPrices: () => apiRequest<PriceConfig[]>('/prices'),
  createPrice: (data: PriceConfigInput) => apiRequest<PriceConfig>('/prices', { method: 'POST', body: JSON.stringify(data) }),
  updatePrice: (id: string, data: PriceConfigInput) => apiRequest<PriceConfig>(`/prices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePrice: (id: string) => apiRequest<void>(`/prices/${id}`, { method: 'DELETE' }),

  // --- Records ---
  getRecords: () => apiRequest<ServiceRecord[]>('/records'),
  createRecord: (data: ServiceRecordInput) => apiRequest<ServiceRecord>('/records', { method: 'POST', body: JSON.stringify(data) }),
  deleteRecord: (id: string) => apiRequest<void>(`/records/${id}`, { method: 'DELETE' }),
  
  // --- Local Settings (Mantido localmente) ---
  getTheme: (): 'light' | 'dark' => (localStorage.getItem('salon_theme') as 'light' | 'dark') || 'light',
  saveTheme: (theme: 'light' | 'dark') => localStorage.setItem('salon_theme', theme),
};