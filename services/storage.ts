import { 
  Collaborator, Procedure, PriceConfig, ServiceRecord, 
  CollaboratorInput, ProcedureInput, PriceConfigInput, ServiceRecordInput 
} from '../types';

const API_URL = import.meta.env.VITE_API_URL;

/* Wrapper genérico para chamadas API para evitar repetição de código. */
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const defaultHeaders = { 'Content-Type': 'application/json' };
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})); // Previne erro se o body estiver vazio
      throw new Error(errorData.error || `Erro na API: ${res.status} ${res.statusText}`);
    }

    // Retorna void se for 204 No Content, caso contrário faz o parse
    if (res.status === 204) return null as T;
    return res.json();
  } catch (error) {
    console.error(`Falha na requisição para ${endpoint}:`, error);
    throw error;
  }
}

export const storageService = {
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
  updateRecord: (id: string, data: ServiceRecordInput) => apiRequest<ServiceRecord>(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecord: (id: string) => apiRequest<void>(`/records/${id}`, { method: 'DELETE' }),
  
  // --- Local Settings (Mantido localmente) ---
  getTheme: (): 'light' | 'dark' => (localStorage.getItem('salon_theme') as 'light' | 'dark') || 'light',
  saveTheme: (theme: 'light' | 'dark') => localStorage.setItem('salon_theme', theme),

  isAuthenticated: () => !!localStorage.getItem('salon_auth_session'),
  login: () => localStorage.setItem('salon_auth_session', 'true'),
  logout: () => localStorage.removeItem('salon_auth_session'),
};

export const seedDatabase = () => {};