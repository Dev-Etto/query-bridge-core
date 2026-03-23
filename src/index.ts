import { env } from './config/env';
import { logger } from './config/logger';
import { runQueryBridge } from './engine';
import { setupSpreadsheet } from './setup';

const server = Bun.serve({
  port: env.PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/') {
      return new Response('QueryBridge Core is Online. Use /run or /setup', { status: 200 });
    }

    if (url.pathname === '/run') {
      const force = url.searchParams.get('force') === 'true';

      try {
        await runQueryBridge(force);
        return new Response(`Sync Complete (Force: ${force})`, { status: 200 });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('❌ Erro crítico no /run:', message);
        return new Response(`Error: ${message}`, { status: 500 });
      }
    }

    if (url.pathname === '/setup') {
      try {
        await setupSpreadsheet();
        return new Response('Setup Complete - Planilha inicializada!', { status: 200 });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('❌ Erro crítico no /setup:', message);
        return new Response(`Setup Error: ${message}`, { status: 500 });
      }
    }

    return new Response('404 Not Found', { status: 404 });
  },
});

logger.info(`🚀 QueryBridge Core rodando em: ${server.url}`);
