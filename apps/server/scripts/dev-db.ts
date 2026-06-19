/**
 * Zero-install local MongoDB for development.
 *
 * Spins up a real MongoDB (via mongodb-memory-server) bound to a fixed port with
 * a PERSISTENT data directory, so data survives restarts and the app can connect
 * at mongodb://127.0.0.1:27017/watchlink — no system install or Docker required.
 *
 * For production use MongoDB Atlas or a managed instance and set MONGODB_URI.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const PORT = 27017;
const DB_NAME = 'watchlink';
const dbPath = resolve(__dirname, '../.mongo-data');

async function main() {
  mkdirSync(dbPath, { recursive: true });

  const server = await MongoMemoryServer.create({
    instance: {
      port: PORT,
      dbName: DB_NAME,
      dbPath,
      // wiredTiger + a real dbPath makes the data persist across restarts.
      storageEngine: 'wiredTiger',
    },
  });

  // eslint-disable-next-line no-console
  console.log(`\n🍃 Local MongoDB ready at ${server.getUri()}`);
  // eslint-disable-next-line no-console
  console.log(`   data dir: ${dbPath}\n   (Ctrl+C to stop)\n`);

  const stop = async () => {
    await server.stop();
    process.exit(0);
  };
  process.on('SIGINT', () => void stop());
  process.on('SIGTERM', () => void stop());
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start local MongoDB:', err);
  process.exit(1);
});
