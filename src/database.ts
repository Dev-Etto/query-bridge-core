import { Database } from '@adonisjs/lucid/database';
import { env } from './config/env';
import { logger } from './config/logger';

interface LucidLogger {
  log: (level: string, messageOrObj: unknown, msg?: string) => void;
  debug: (messageOrObj: unknown, msg?: string) => void;
  info: (messageOrObj: unknown, msg?: string) => void;
  warn: (messageOrObj: unknown, msg?: string) => void;
  error: (messageOrObj: unknown, msg?: string) => void;
  trace: (messageOrObj: unknown, msg?: string) => void;
  fatal: (messageOrObj: unknown, msg?: string) => void;
}

interface LucidEmitter {
  on: (event: string, callback: (data: unknown) => void) => void;
  emit: (event: string, data: unknown) => void;
  hasListeners: (event: string) => boolean;
  once: (event: string, callback: (data: unknown) => void) => void;
  off: (event: string, callback: (data: unknown) => void) => void;
  removeAllListeners: (event?: string) => void;
}

const emitter: LucidEmitter = {
  on: () => {},
  emit: () => {},
  hasListeners: () => false,
  once: () => {},
  off: () => {},
  removeAllListeners: () => {},
};

/**
 * Adaptador para que nosso logger personalizado seja compatível com a interface do Lucid.
 * Lida com o padrão Pino onde o primeiro argumento pode ser um objeto de contexto.
 */
const loggerAdapter: LucidLogger = {
  log: (level: string, messageOrObj: unknown, msg?: string) => {
    const finalMsg =
      typeof messageOrObj === 'string' ? messageOrObj : msg || JSON.stringify(messageOrObj);
    const data = typeof messageOrObj === 'object' ? messageOrObj : undefined;

    if (level === 'debug' || level === 'trace') logger.debug(finalMsg, data);
    else if (level === 'info') logger.info(finalMsg, data);
    else if (level === 'warn') logger.warn(finalMsg, data);
    else if (level === 'error' || level === 'fatal') logger.error(finalMsg, data);
  },
  debug: (messageOrObj: unknown, msg?: string) => loggerAdapter.log('debug', messageOrObj, msg),
  info: (messageOrObj: unknown, msg?: string) => loggerAdapter.log('info', messageOrObj, msg),
  warn: (messageOrObj: unknown, msg?: string) => loggerAdapter.log('warn', messageOrObj, msg),
  error: (messageOrObj: unknown, msg?: string) => loggerAdapter.log('error', messageOrObj, msg),
  trace: (messageOrObj: unknown, msg?: string) => loggerAdapter.log('trace', messageOrObj, msg),
  fatal: (messageOrObj: unknown, msg?: string) => loggerAdapter.log('fatal', messageOrObj, msg),
};

export const db = new Database(
  {
    connection: 'primary',
    connections: {
      primary: {
        client: 'pg',
        connection: env.DATABASE_URL,
        pool: { min: 1, max: 10, acquireTimeoutMillis: 10000 },
      },
    },
  },
  loggerAdapter as unknown as ConstructorParameters<typeof Database>[1],
  emitter as unknown as ConstructorParameters<typeof Database>[2]
);

/**
 * Helper para executar SQL Puro com Limite de Tempo (Timeout)
 */
export async function executeRawQuery<T = Record<string, unknown>>(query: string): Promise<T[]> {
  try {
    const result = await db.rawQuery(query).timeout(120000, { cancel: true });
    return result.rows || result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: string })?.code;

    if (code === 'ETIMEDOUT') {
      logger.error(
        `⌛ [Database Timeout] A query excedeu 120s e foi cancelada: ${query.substring(0, 100)}...`
      );
      throw new Error('A consulta ao banco de dados demorou demais e foi interrompida.');
    }
    logger.error(`[Database Error] Falha SQL: ${message}`);
    throw error;
  }
}

/**
 * Helper para executar SQL Puro via Cursor (Streaming Manual)
 * Útil para relatórios gigantes que não cabem na memória.
 */
export async function streamRawQuery<T = Record<string, unknown>>(
  query: string,
  batchSize: number,
  onBatch: (rows: T[]) => Promise<void>
): Promise<number> {
  const trx = await db.transaction();
  const cursorName = `cursor_${Date.now()}`;
  let totalRows = 0;

  try {
    await trx.rawQuery(`DECLARE ${cursorName} CURSOR FOR ${query}`);

    while (true) {
      const result = await trx.rawQuery(`FETCH ${batchSize} FROM ${cursorName}`);
      const rows = (result.rows || result) as T[];

      if (rows.length === 0) break;

      await onBatch(rows);
      totalRows += rows.length;
    }

    await trx.commit();
    return totalRows;
  } catch (error) {
    await trx.rollback();
    logger.error(`[Stream Error] Falha no processamento via Cursor: ${String(error)}`);
    throw error;
  }
}
