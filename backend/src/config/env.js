import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config() // also fallback to cwd .env if present
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('365d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('365d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  EMAIL_HOST: z.string().optional().default(''),
  EMAIL_PORT: z.coerce.number().optional().default(587),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('no-reply@sensein.example'),
  ADMIN_EMAIL: z.string().optional().default('admin@sensein.example'),

  COD_MAX_AMOUNT: z.coerce.number().default(5000),
  FREE_SHIPPING_THRESHOLD: z.coerce.number().default(0),
  DEFAULT_SHIPPING_FEE: z.coerce.number().default(0),

  // Razorpay Gateway
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),

  // Delhivery Logistics
  DELHIVERY_API_TOKEN: z.string().optional().default(''),
  DELHIVERY_CLIENT_ID: z.string().optional().default(''),
  DELHIVERY_WAREHOUSE: z.string().optional().default(''),
  DELHIVERY_ORIGIN_PINCODE: z.string().optional().default('395010'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'
