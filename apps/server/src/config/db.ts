import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

mongoose.set('strictQuery', true);

/** Connect to MongoDB. Resolves once connected; throws on failure. */
export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
}

/** Gracefully close the MongoDB connection (used on shutdown). */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
}
