import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/db';
import { setupSocket } from './realtime';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = createServer(app);

  // Attach the realtime layer (rooms, chat, and later voice signaling).
  setupSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`🚀 WatchLink API listening on http://localhost:${env.PORT}`);
  });

  // --- Graceful shutdown ----------------------------------------------------
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down gracefully...');
    server.close(() => logger.info('HTTP server closed'));
    try {
      await disconnectDatabase();
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
