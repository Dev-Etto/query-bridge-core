import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { JobConfig, SyncResult } from '../../core/contracts/config.contract';
import { streamRawQuery } from '../../database';
import { type SheetValue, bridge } from '../../providers/google-bridge';

export class ReportProcessor {
  /**
   * Processa uma única configuração de relatório (Job)
   */
  public async process(job: JobConfig): Promise<SyncResult> {
    const jobName = job.targetTab;
    logger.info(`🚀 [${jobName}] Iniciando processamento em modo STREAMING...`);

    let totalRowsProcessed = 0;
    let headers: string[] = [];
    let isFirstBatch = true;

    try {
      const processStart = Date.now();

      totalRowsProcessed = await streamRawQuery<Record<string, SheetValue>>(
        job.query,
        env.BATCH_SIZE,
        async (batchRows: Record<string, SheetValue>[]) => {
          const batchStart = Date.now();

          if (isFirstBatch) {
            headers = Object.keys(batchRows[0] as object);
            const valuesToPush: SheetValue[][] = [
              headers,
              ...batchRows.map((r: Record<string, SheetValue>) => headers.map((h) => r[h] ?? null)),
            ];

            await bridge.updateValues(job.targetTab, job.targetRange || 'A1', valuesToPush, false);
            isFirstBatch = false;
          } else {
            const valuesToPush: SheetValue[][] = batchRows.map((r: Record<string, SheetValue>) =>
              headers.map((h) => r[h] ?? null)
            );
            await bridge.updateValues(job.targetTab, 'A1', valuesToPush, true);
          }

          totalRowsProcessed += batchRows.length;
          const batchDuration = ((Date.now() - batchStart) / 1000).toFixed(1);
          logger.info(
            `📦 [${jobName}] Lote processado | Progresso: ${totalRowsProcessed} linhas (${batchDuration}s)`
          );
        }
      );

      const totalDuration = ((Date.now() - processStart) / 1000).toFixed(1);
      logger.info(
        `✅ [${jobName}] Relatório processado com sucesso. ${totalRowsProcessed} linhas atualizadas em ${totalDuration}s.`
      );

      return {
        success: true,
        jobName,
        rowsProcessed: totalRowsProcessed,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [${jobName}] Falha crítica no processamento via Stream: ${message}`);
      return {
        success: false,
        jobName,
        rowsProcessed: totalRowsProcessed,
        error: message,
      };
    }
  }
}
