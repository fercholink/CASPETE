/**
 * Job: Respaldo diario de la base de datos a S3
 * ─────────────────────────────────────────────
 * Ejecuta pg_dump en formato custom (comprimido) y lo transmite directo
 * a S3 sin escribir un archivo temporal en disco. La retención (borrar
 * respaldos viejos) se maneja con una regla de ciclo de vida en el
 * propio bucket de S3, no aquí.
 *
 * Se omite silenciosamente si no hay credenciales de AWS configuradas.
 */
import { spawn } from 'node:child_process';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { env } from '../config/env.js';
import { captureError } from '../lib/monitoring.js';

export async function runDatabaseBackupJob(): Promise<void> {
  const label = '[CRON:db-backup]';

  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.S3_BACKUP_BUCKET) {
    console.log(`${label} No configurado (falta AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/S3_BACKUP_BUCKET) — se omite.`);
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `db-backups/caspete-${timestamp}.dump`;

  console.log(`${label} Iniciando respaldo → s3://${env.S3_BACKUP_BUCKET}/${key}`);

  try {
    const pgDump = spawn('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', env.DATABASE_URL], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderrOutput = '';
    pgDump.stderr.on('data', (chunk: Buffer) => { stderrOutput += chunk.toString(); });

    const s3 = new S3Client({ region: env.AWS_REGION });
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: env.S3_BACKUP_BUCKET,
        Key: key,
        Body: pgDump.stdout,
      },
    });

    const pgDumpExit = new Promise<void>((resolve, reject) => {
      pgDump.on('error', reject);
      pgDump.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`pg_dump salió con código ${code}: ${stderrOutput}`));
      });
    });

    await Promise.all([upload.done(), pgDumpExit]);

    console.log(`${label} Completado — s3://${env.S3_BACKUP_BUCKET}/${key}`);
  } catch (err) {
    captureError(err, 'cron', { job: 'db-backup' });
  }
}
