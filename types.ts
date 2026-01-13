
export enum Role {
  MANICURE = 'Manicure',
  HAIRDRESSER = 'Cabeleireira',
  BOTH = 'Ambas'
}

export enum ProcedureCategory {
  MANICURE = 'Manicure',
  HAIRDRESSER_FEMALE = 'Cabeleireira – Feminino',
  HAIRDRESSER_MALE = 'Cabeleireira – Masculino',
  EXTRAS = 'Extras'
}

export enum ServiceStatus {
  DONE = 'Fez',
  NOT_DONE = 'Não Fez'
}

export interface Collaborator {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  notes?: string;
  allowedProcedureIds: string[];
}

// Tipo auxiliar para criação (sem ID)
export type CollaboratorInput = Omit<Collaborator, 'id'>;

export interface Procedure {
  id: string;
  name: string;
  category: ProcedureCategory;
  active: boolean;
}

export type ProcedureInput = Omit<Procedure, 'id'>;

export interface PriceConfig {
  id: string;
  procedureId: string;
  valueDone: number;
  valueNotDone: number;
  valueAdditional: number;
  active: boolean;
}

export type PriceConfigInput = Omit<PriceConfig, 'id'>;

export interface ServiceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  collaboratorId: string;
  procedureId: string;
  status: ServiceStatus;
  notes?: string;
  extras: string[]; 
  calculatedValue: number;
  createdAt: string; // Mudado de number para string (ISO date do SQL)
}

export type ServiceRecordInput = Omit<ServiceRecord, 'id' | 'createdAt' | 'calculatedValue'>;

export const EXTRA_OPTIONS = ['Limpeza', 'São Miguel', 'Toalhas', 'Limpeza Alicates'];
