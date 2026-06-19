import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from the server app directory (and process env wins over file).
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Comma-separated list of allowed origins for CORS.
  CLIENT_URL: z.string().default('http://localhost:3000'),

  ROOM_EXPIRATION_HOURS: z.coerce.number().positive().default(12),
  MAX_ROOM_PARTICIPANTS: z.coerce.number().int().positive().default(20),

  STUN_URL: z.string().optional(),
  TURN_URL: z.string().optional(),
  TURN_USERNAME: z.string().optional(),
  TURN_CREDENTIAL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast with a readable message instead of crashing deep inside the app.
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n❌ Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  /** Parsed list of allowed CORS origins. */
  corsOrigins: raw.CLIENT_URL.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

export type Env = typeof env;
