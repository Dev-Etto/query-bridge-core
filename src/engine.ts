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
    throw error;
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

  // Processamento Sequencial (para evitar OOM em relatórios grandes como Candidatos e Hunter)
  const total = jobsToRun.length;
  let finished = 0;
  let failed = 0;

  logger.info(`🚀 [INÍCIO] Iniciando processamento sequencial de ${total} relatórios...`);

  for (const [i, job] of jobsToRun.entries()) {
    const start = Date.now();
    try {
      logger.info(`⏳ [${i + 1}/${total}] [PROCESSANDO] ${job.targetTab}...`);
      const result = await processor.process(job);

      const duration = ((Date.now() - start) / 1000).toFixed(1);

      if (result.success) {
        finished++;
        logger.info(
          `✅ [${i + 1}/${total}] [CONCLUÍDO] ${job.targetTab} | ${result.rowsProcessed} linhas | ${duration}s`
        );
      } else {
        failed++;
        logger.error(
          `❌ [${i + 1}/${total}] [FALHA] ${job.targetTab} | Erro: ${result.error} | ${duration}s`
        );
      }
    } catch (err) {
      failed++;
      logger.error(`💥 [${i + 1}/${total}] [ERRO FATAL] ${job.targetTab}:`, err);
    }
  }

  logger.info(
    `📊 [RESUMO] Ciclo finalizado: ✅ ${finished} Sucessos | ❌ ${failed} Falhas | 📁 ${total} Total`
  );
}
