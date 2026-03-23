export enum JobStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export interface JobConfig {
  query: string;
  targetTab: string;
  targetRange: string;
  status: JobStatus;
  frequency: string;
}

export interface SyncResult {
  success: boolean;
  jobName: string;
  error?: string;
  rowsProcessed: number;
}
