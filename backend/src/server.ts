import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { connectDatabase } from './modules/auth/db.js';

const env = loadEnv();
const pool = env.DATABASE_URL ? await connectDatabase(env.DATABASE_URL) : undefined;
const app = await buildApp({ env, pool });
app.addHook('onClose', async () => { await pool?.end(); });
let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  app.log.info({ signal }, 'shutting_down');

  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error({ err: error }, 'shutdown_failed');
    process.exit(1);
  }
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  app.log.error({ err: reason }, 'unhandled_rejection');
  void shutdown('SIGTERM');
});

process.on('uncaughtException', (error) => {
  app.log.error({ err: error }, 'uncaught_exception');
  void shutdown('SIGTERM');
});

try {
  await app.listen({
    host: env.API_HOST,
    port: env.API_PORT,
  });
} catch (error) {
  app.log.error({ err: error }, 'listen_failed');
  process.exit(1);
}
