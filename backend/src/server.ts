import { buildApp } from './app.js';
import { qaPreviewCatalog } from './modules/catalog/qa-preview.js';
import { loadEnv } from './config/env.js';
import { connectDatabase } from './modules/auth/db.js';
import { pruneExpiredSessions } from './modules/auth/auth-service.js';
import { refundExpiredJobCredits, refundJobsAfterRestart } from './modules/auth/job-credit.js';

const env = loadEnv();
const pool = env.DATABASE_URL ? await connectDatabase(env.DATABASE_URL) : undefined;
// Only opaque tokens are persisted; purge expired sessions on every restart.
if (pool) await pruneExpiredSessions(pool);
// The MVP is intentionally single-instance. Ephemeral jobs disappear on restart.
// Refund unfinished package charges before accepting requests.
const recovered = pool ? await refundJobsAfterRestart(pool) : 0;
const app = await buildApp({
  env, pool,
  ...(env.DEV_QA_PREVIEW ? { catalogOverride: qaPreviewCatalog(), qaPreview: true } : {}),
});
if (recovered > 0) app.log.warn({ recovered }, 'unavailable_job_credits_refunded');
const creditSweep = pool ? setInterval(() => {
  void refundExpiredJobCredits(pool).catch((error: unknown) => {
    app.log.error({ err: error }, 'credit_refund_sweep_failed');
  });
}, 60_000) : undefined;
creditSweep?.unref();
const sessionSweep = pool ? setInterval(() => {
  void pruneExpiredSessions(pool).catch((error: unknown) => {
    app.log.error({ err: error }, 'expired_session_cleanup_failed');
  });
}, 60 * 60_000) : undefined;
sessionSweep?.unref();
app.addHook('onClose', async () => {
  if (creditSweep) clearInterval(creditSweep);
  if (sessionSweep) clearInterval(sessionSweep);
  await pool?.end();
});
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
