import { DateTime } from 'luxon';
import { logger } from './config/logger';
import type { JobConfig } from './core/contracts/config.contract';
import { ConfigLoader } from './modules/config-tabs/config-loader';
import { ReportProcessor } from './modules/reports/report-processor';
import { FrequencyHandler } from './modules/scheduler/frequency-handler';

/**
 * Ponto de entrada para a orquestração do QueryBridge
 */
export async function runQueryBridge(force = false) {
  logger.info(`🔍 Iniciando ciclo de sincronização em ${DateTime.now().toISO()} (Force: ${force})`);

  let jobs: JobConfig[] = [];
  try {
    jobs = await ConfigLoader.loadJobs();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('❌ Falha ao carregar configurações da planilha:', message);
    return;
  }

  const processor = new ReportProcessor();

  const jobsToRun = force ? jobs : jobs.filter((job) => FrequencyHandler.shouldRun(job.frequency));

  logger.info(
    `📁 Jobs carregados: ${jobs.length} | ⚙️ Jobs agendados para este minuto: ${jobsToRun.length}`
  );

  if (jobsToRun.length === 0) {
    logger.info('ℹ️ Nenhum job agendado para rodar agora.');
    return;
  }

  for (const job of jobsToRun) {
    const result = await processor.process(job);

    if (result.success) {
      logger.info(`✅ [${result.jobName}] Sync OK: ${result.rowsProcessed} linhas.`);
    } else {
      logger.error(`❌ [${result.jobName}] Falha: ${result.error}`);
    }
  }

  logger.info('✨ Ciclo finalizado.');
}
