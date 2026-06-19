import pino from 'pino';
import { env } from './env';

/**
 * Central structured logger. Pretty-prints in development, JSON in production.
 */
export const logger = pino({
  level: env.isProd ? 'info' : 'debug',
  transport: env.isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      },
});
