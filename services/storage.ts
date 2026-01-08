
import { Collaborator, Procedure, PriceConfig, ServiceRecord, CollaboratorInput, ProcedureInput, PriceConfigInput, ServiceRecordInput } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

// Helpers
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'API Error');
  }
  return res.json();
};

// API Service
export const storageService = {
  // --- Collaborators ---
  getCollaborators: async (): Promise<Collaborator[]> => {
    const res = await fetch(`${API_URL}/collaborators`);
    return handleResponse(res);
  },

  createCollaborator: async (collab: CollaboratorInput): Promise<Collaborator> => {
    const res = await fetch(`${API_URL}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collab)
    });
    return handleResponse(res);
  },

  deleteCollaborator: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/collaborators/${id}`, { method: 'DELETE' });
  },

  updateCollaborator: async (id: string, collab: CollaboratorInput): Promise<Collaborator> => {
    const res = await fetch(`${API_URL}/collaborators/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collab)
    });
    return handleResponse(res);
  },

  // --- Procedures ---
  getProcedures: async (): Promise<Procedure[]> => {
    const res = await fetch(`${API_URL}/procedures`);
    return handleResponse(res);
  },

  createProcedure: async (proc: ProcedureInput): Promise<Procedure> => {
    const res = await fetch(`${API_URL}/procedures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proc)
    });
    return handleResponse(res);
  },

  deleteProcedure: async (id: string): Promise<void> => {
     // Implementar rota no backend se necessário
     console.warn("Delete procedure not implemented in backend snippet");
  },

  updateProcedure: async (id: string, proc: ProcedureInput): Promise<Procedure> => {
    const res = await fetch(`${API_URL}/procedures/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proc)
    });

    return handleResponse(res);
  },


  // --- Prices ---
  getPrices: async (): Promise<PriceConfig[]> => {
    const res = await fetch(`${API_URL}/prices`);
    return handleResponse(res);
  },

  createPrice: async (price: PriceConfigInput): Promise<PriceConfig> => {
    const res = await fetch(`${API_URL}/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(price)
    });
    return handleResponse(res);
  },

  updatePrice: async (id: string,price: PriceConfigInput): Promise<PriceConfig> => {
    const res = await fetch(`${API_URL}/prices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(price)
    });
    return handleResponse(res);
  },

  // --- Records ---
  getRecords: async (): Promise<ServiceRecord[]> => {
    const res = await fetch(`${API_URL}/records`);
    return handleResponse(res);
  },

  createRecord: async (record: ServiceRecordInput): Promise<ServiceRecord> => {
    const res = await fetch(`${API_URL}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return handleResponse(res);
  },

  deleteRecord: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/records/${id}`, { method: 'DELETE' });
  },
  
  // --- Local Settings (Theme/Auth still local) ---
  getTheme: () => localStorage.getItem('salon_theme') as 'light' | 'dark' || 'light',
  saveTheme: (theme: 'light' | 'dark') => localStorage.setItem('salon_theme', theme),

  isAuthenticated: () => !!localStorage.getItem('salon_auth_session'),
  login: () => localStorage.setItem('salon_auth_session', 'true'),
  logout: () => localStorage.removeItem('salon_auth_session'),
};

export const seedDatabase = () => {
  // No-op in API mode usually, or call an API endpoint to seed
};
