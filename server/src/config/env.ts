import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().default('ev_market_analytics_secure_jwt_secret_college_capstone_2026_key_9948'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  POWERBI_CLIENT_ID: z.string().optional().default('00000000-0000-0000-0000-000000000000'),
  POWERBI_CLIENT_SECRET: z.string().optional().default('mock_secret'),
  POWERBI_TENANT_ID: z.string().optional().default('00000000-0000-0000-0000-000000000000'),
  POWERBI_WORKSPACE_ID: z.string().optional().default('00000000-0000-0000-0000-000000000000'),
  POWERBI_REPORT_ID: z.string().optional().default('00000000-0000-0000-0000-000000000000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
