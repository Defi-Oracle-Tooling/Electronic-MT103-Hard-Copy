import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DB_USER: z.string(),
    DB_HOST: z.string(),
    DB_NAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_PORT: z.string().transform(Number).default('5432'),
    MONITORING_ENDPOINT: z.string().url().optional(),
    ALERT_WEBHOOK: z.string().url().optional(),
});

const env = envSchema.parse(process.env);

export const config = {
    database: {
        user: env.DB_USER,
        host: env.DB_HOST,
        database: env.DB_NAME,
        password: env.DB_PASSWORD,
        port: env.DB_PORT,
    },
    monitoring: {
        endpoint: env.MONITORING_ENDPOINT,
        alertWebhook: env.ALERT_WEBHOOK,
    },
};
