import { env } from './config/env';
import { logger } from './config/logger';
import { bridge } from './providers/google-bridge';

export async function setupSpreadsheet() {
  logger.info('🛠️ Iniciando Setup da Planilha QueryBridge...');

  try {
    const response = await bridge.request({
      action: 'SETUP',
      spreadsheetId: env.SPREADSHEET_ID,
      headers: {
        _config: ['Query SQL', 'Aba Destino', 'Range', 'Status', 'Frequência'],
      },
    });

    if (response.isSuccess) {
      logger.info('✅ Aba _config preparada!');

      const configHeaders = ['Query SQL', 'Aba Destino', 'Range', 'Status', 'Frequência'];
      const exampleRow = [
        "SELECT NOW() as hora_atual, 'Conectado' as status",
        'query bridge status',
        'A1',
        'ATIVO',
        'M1',
      ];

      logger.info('📝 Inserindo linha de exemplo com cabeçalhos completos...');

      await bridge.updateValues('_config', 'A1', [configHeaders, exampleRow]);

      logger.info(
        'Dica: Todos os relatórios agora são convertidos para Tabela Nativa automaticamente.'
      );
      logger.info('Defaults aplicados: Range: A1 | Status: ACTIVE | Frequência: M1');
    } else {
      logger.error('❌ Erro no Setup:', response.error);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('❌ Erro de conexão com o Bridge durante o Setup:', message);
    throw err;
  }
}

if (import.meta.main) {
  setupSpreadsheet();
}
