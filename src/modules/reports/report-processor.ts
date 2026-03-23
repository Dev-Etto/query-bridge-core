import { logger } from '../../config/logger';
import type { JobConfig, SyncResult } from '../../core/contracts/config.contract';
import { executeRawQuery } from '../../database';
import { type SheetValue, bridge } from '../../providers/google-bridge';

export class ReportProcessor {
  /**
   * Processa uma única configuração de relatório (Job)
   */
  public async process(job: JobConfig): Promise<SyncResult> {
    const jobName = job.targetTab;
    logger.info(`🚀 [${jobName}] Processando relatório...`);

    try {
      const rows = await executeRawQuery<Record<string, SheetValue>>(job.query);

      if (rows.length === 0) {
        logger.warn(`⚠️ [${jobName}] Query retornou zero resultados. Ignorando atualização.`);
        return { success: true, jobName, rowsProcessed: 0 };
      }

      const headers = Object.keys(rows[0] as object);
      const valuesToPush: SheetValue[][] = [
        headers,
        ...rows.map((r: Record<string, SheetValue>) => headers.map((h) => r[h] ?? null)),
      ];

      await bridge.updateValues(job.targetTab, job.targetRange || 'A1', valuesToPush);

      return {
        success: true,
        jobName,
        rowsProcessed: rows.length,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [${jobName}] Falha no processamento:`, message);
      return {
        success: false,
        jobName,
        rowsProcessed: 0,
        error: message,
      };
    }
  }
}
