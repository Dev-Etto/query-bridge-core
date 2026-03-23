import { logger } from '../../config/logger';
import { type JobConfig, JobStatus } from '../../core/contracts/config.contract';
import { type SheetValue, bridge } from '../../providers/google-bridge';

export const ConfigLoader = {
  /**
   * Carrega as configurações da aba _config.
   */
  async loadJobs(): Promise<JobConfig[]> {
    const rows = await bridge.getValues('_config', 'A1:Z100');

    logger.debug(
      `[ConfigLoader] Debug: Total de linhas brutas recebidas do Google: ${rows.length}`
    );

    if (rows.length < 2) {
      logger.warn(
        `[ConfigLoader] A aba _config parece estar vazia ou não tem dados suficientes (Linhas: ${rows.length}).`
      );
      return [];
    }

    const headers = rows[0]?.map((h) => String(h).trim()) || [];
    const findIdx = (name: string) =>
      headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());

    logger.debug(`[ConfigLoader] Debug: Cabeçalhos encontrados: [${headers.join(', ')}]`);

    const idx = {
      query: findIdx('Query SQL'),
      targetTab: findIdx('Aba Destino'),
      targetRange: findIdx('Range'),
      status: findIdx('Status'),
      frequency: findIdx('Frequência'),
    };

    logger.debug(`[ConfigLoader] Debug: Índices mapeados: ${JSON.stringify(idx)}`);

    return rows
      .slice(1)
      .map((row: SheetValue[]) => {
        const getVal = (i: number, defaultVal = '') => {
          const val = i !== -1 ? String(row[i] || '').trim() : '';
          return val || defaultVal;
        };

        const rawStatus = getVal(idx.status, JobStatus.INATIVO).toUpperCase();
        const status = Object.values(JobStatus).includes(rawStatus as JobStatus)
          ? (rawStatus as JobStatus)
          : JobStatus.INATIVO;

        const rawFreq = getVal(idx.frequency, 'M1').toUpperCase();
        const isValidFreq = /^([MHD]|MM)(\d+)$/.test(rawFreq);
        const frequency = isValidFreq ? rawFreq : 'M1';

        const job: JobConfig = {
          query: getVal(idx.query),
          targetTab: getVal(idx.targetTab),
          targetRange: getVal(idx.targetRange, 'A1'),
          status,
          frequency,
        };

        return job;
      })
      .filter((job) => job.status === JobStatus.ATIVO && job.targetTab && job.query);
  },
};
