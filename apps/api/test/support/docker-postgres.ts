import { execFile as execFileCallback } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

export type DockerPostgres = {
  adminUrl: string;
  runtimeUrl: string;
  stop(): Promise<void>;
};

async function waitUntilReady(containerName: string): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const logs = await execFile('docker', ['logs', containerName]);
      const initializationComplete = `${logs.stdout}\n${logs.stderr}`.includes(
        'PostgreSQL init process complete; ready for start up.',
      );
      if (!initializationComplete) {
        throw new Error('PostgreSQL initialization is still running.');
      }
      await execFile('docker', [
        'exec',
        containerName,
        'pg_isready',
        '-U',
        'postgres',
      ]);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error('PostgreSQL test container did not become ready.');
}

export async function startDockerPostgres(): Promise<DockerPostgres> {
  const containerName = `ready-on-test-${randomUUID()}`;
  await execFile('docker', [
    'run',
    '--detach',
    '--rm',
    '--name',
    containerName,
    '--env',
    'POSTGRES_PASSWORD=postgres',
    '--publish',
    '127.0.0.1::5432',
    'postgres:17-alpine',
  ]);

  try {
    await waitUntilReady(containerName);
    const { stdout } = await execFile('docker', [
      'port',
      containerName,
      '5432/tcp',
    ]);
    const port = stdout.trim().split(':').at(-1);
    if (!port) throw new Error('Docker did not return a PostgreSQL port.');

    return {
      adminUrl: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`,
      runtimeUrl: `postgresql://ready_on_runtime:runtime@127.0.0.1:${port}/postgres`,
      async stop() {
        await execFile('docker', ['stop', containerName]);
      },
    };
  } catch (error) {
    await execFile('docker', ['stop', containerName]).catch(() => undefined);
    throw error;
  }
}
