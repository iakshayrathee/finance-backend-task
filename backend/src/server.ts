import app from './app';
import { env } from './config/env';
import { prisma } from './config/db';
import logger from './config/logger';

const PORT = parseInt(env.PORT, 10);

async function main() {
  // Verify database connectivity on startup
  await prisma.$connect();
  logger.info('Database connected');

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    logger.info(`API Docs available at http://localhost:${PORT}/api/docs`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Database disconnected');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Fatal startup error', { message: err.message, stack: err.stack });
  process.exit(1);
});
