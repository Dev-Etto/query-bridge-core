import { logger } from '../../config/logger';
import type { JobConfig, SyncResult } from '../../core/contracts/config.contract';
import { executeRawQuery } from '../../database';
import { type SheetValue, bridge } from '../../providers/google-bridge';

const BATCH_SIZE = 5000;

export class ReportProcessor {
  /**
   * Processa uma única configuração de relatório (Job)
   */
  public async process(job: JobConfig): Promise<SyncResult> {
    const jobName = job.targetTab;
    logger.info(`🚀 [${jobName}] Processando relatório...`);

    let totalRowsProcessed = 0;
    let totalCellsProcessed = 0;
    let headers: string[] = [];
    let isFirstBatch = true;

    try {
      const rows = await executeRawQuery<Record<string, SheetValue>>(job.query);

      const rowsCount = rows.length;
      if (rowsCount === 0) {
        logger.warn(`⚠️ [${jobName}] Query retornou zero resultados. Ignorando atualização.`);
        return { success: true, jobName, rowsProcessed: 0 };
      }

      headers = Object.keys(rows[0] as object);
      const totalCols = headers.length;

      logger.debug(
        `[${jobName}] Volumetria total: ${rowsCount} linhas x ${totalCols} colunas (${rowsCount * totalCols} células).`
      );

      if (rowsCount * totalCols > 100000) {
        logger.warn(
          `⚠️ [${jobName}] ATENÇÃO: Relatório muito grande (${rowsCount * totalCols} células). Pode ser lento.`
        );
      }

      // Process in batches
      for (let i = 0; i < rowsCount; i += BATCH_SIZE) {
        const batchRows = rows.slice(i, i + BATCH_SIZE);
        const batchValues: SheetValue[][] = batchRows.map((r: Record<string, SheetValue>) =>
          headers.map((h) => r[h] ?? null)
        );

        const currentBatchRowsCount = batchRows.length;
        const currentBatchCellsCount = currentBatchRowsCount * totalCols;

        logger.debug(
          `[${jobName}] Processando lote ${Math.floor(i / BATCH_SIZE) + 1}: ${currentBatchRowsCount} linhas (${currentBatchCellsCount} células).`
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
        totalCellsProcessed += currentBatchCellsCount;
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
