import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import pinoHttp from 'pino-http'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import routes from './routes/index.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimiters.js'

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const app = express()

app.set('trust proxy', 1)

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(null, true) // allow for local dev flexibility
      }
    },
    credentials: true,
  })
)

// Serve uploaded assets statically
const uploadStaticDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads')
if (!fs.existsSync(uploadStaticDir)) {
  fs.mkdirSync(uploadStaticDir, { recursive: true })
}
app.use('/uploads', express.static(uploadStaticDir))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/api/health',
    },
  })
)

app.use('/api', apiLimiter, routes)

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Lumière Cosmetics API is running',
    clientUrl: env.CLIENT_URL,
    health: '/api/health'
  })
})

app.use(notFound)
app.use(errorHandler)

export default app
