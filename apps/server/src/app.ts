import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/error';
import routes from './routes';

/** Build and configure the Express application (no listening side-effects). */
export function createApp(): Express {
  const app = express();

  // Trust proxy so rate-limit / secure cookies work behind Render/Vercel/NGINX.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: true, limit: '64kb' }));
  app.use(pinoHttp({ logger, autoLogging: !env.isTest }));

  app.use('/api', apiLimiter, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
