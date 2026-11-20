import { execSync } from 'node:child_process';

/** Applies the migrations to the test database once per run. */
export default function setup() {
  const url = process.env.DATABASE_URL_TEST!;
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      stdio: 'pipe',
    });
  } catch (err) {
    // vitest nu reuseste sa afiseze erorile din globalSetup ("code.charCodeAt is not a function"),
    // asa ca scriem noi output-ul de la prisma inainte sa oprim rularea
    const { stdout, stderr } = err as { stdout?: Buffer; stderr?: Buffer };
    console.error(
      `\nprisma migrate deploy a esuat pe DATABASE_URL_TEST:\n${stdout ?? ''}${stderr ?? ''}`,
    );
    throw err;
  }
}
