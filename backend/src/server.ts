import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { initCronJobs } from './jobs/cron.js';

async function main() {
  try {
    await prisma.$connect();
    console.log('[DB] Conexión a PostgreSQL establecida');

    // Iniciar tareas programadas una vez confirmada la conexión a la BD
    initCronJobs();
  } catch (err) {
    console.error('[DB] Error al conectar con PostgreSQL:', err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`[Server] CASPETE API corriendo en http://localhost:${env.PORT}`);
    console.log(`[Server] Entorno: ${env.NODE_ENV}`);
  });

  process.on('SIGINT', async () => {
    console.log('\n[Server] Cerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

main();
