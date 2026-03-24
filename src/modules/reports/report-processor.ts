import { logger } from '../../config/logger';
import type { JobConfig, SyncResult } from '../../core/contracts/config.contract';
import { executeRawQuery } from '../../database';
import { type SheetValue, bridge } from '../../providers/google-bridge';

const BATCH_SIZE = 2000;

export class ReportProcessor {
  /**
   * Processa uma única configuração de relatório (Job)
   */
  public async process(job: JobConfig): Promise<SyncResult> {
    const jobName = job.targetTab;
    logger.info(`🚀 [${jobName}] Processando relatório...`);

    let totalRowsProcessed = 0;
    let headers: string[] = [];
    let isFirstBatch = true;

    try {
      const queryStart = Date.now();
      const rows = await executeRawQuery<Record<string, SheetValue>>(job.query);
      const queryDuration = ((Date.now() - queryStart) / 1000).toFixed(1);

      const rowsCount = rows.length;
      if (rowsCount === 0) {
        logger.warn(`⚠️ [${jobName}] Query retornou zero resultados. (${queryDuration}s)`);
        return { success: true, jobName, rowsProcessed: 0 };
      }

      headers = Object.keys(rows[0] as object);
      const totalCols = headers.length;

      logger.info(
        `📊 [${jobName}] Query finalizada: ${rowsCount} linhas e ${totalCols} colunas (${queryDuration}s).`
      );

      // Process in batches
      const totalBatches = Math.ceil(rowsCount / BATCH_SIZE);
      for (let i = 0; i < rowsCount; i += BATCH_SIZE) {
        const batchStart = Date.now();
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const batchRows = rows.slice(i, i + BATCH_SIZE);
        const batchValues: SheetValue[][] = batchRows.map((r: Record<string, SheetValue>) =>
          headers.map((h) => r[h] ?? null)
        );

        const currentBatchRowsCount = batchRows.length;

        logger.debug(
          `[${jobName}] Lote ${batchNumber}/${totalBatches}: Enviando ${currentBatchRowsCount} linhas...`
        );

        if (isFirstBatch) {
          // For the first batch, we send headers and clear/update the sheet
          const valuesToPush: SheetValue[][] = [headers, ...batchValues];
          await bridge.updateValues(job.targetTab, job.targetRange || 'A1', valuesToPush, false); // false for UPDATE_VALUES
          isFirstBatch = false;
        } else {
          // For subsequent batches, we append values
          await bridge.updateValues(job.targetTab, 'A1', batchValues, true); // true for APPEND_VALUES
        }

        totalRowsProcessed += currentBatchRowsCount;
        const batchDuration = ((Date.now() - batchStart) / 1000).toFixed(1);

        logger.info(
          `📦 [${jobName}] Lote ${batchNumber}/${totalBatches} concluído | Progresso: ${totalRowsProcessed}/${rowsCount} (${batchDuration}s)`
        );
      }

      logger.info(
        `✅ [${jobName}] Relatório processado com sucesso. ${totalRowsProcessed} linhas atualizadas.`
      );

      return {
        success: true,
        jobName,
        rowsProcessed: totalRowsProcessed,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [${jobName}] Falha no processamento:`, message);
      return {
        success: false,
        jobName,
        rowsProcessed: totalRowsProcessed,
        error: message,
      };
    }
  }
}
