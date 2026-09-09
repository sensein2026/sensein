import mongoose from 'mongoose'
import dns from 'dns'
import { env } from './env.js'
import { logger } from './logger.js'

try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch {}

mongoose.set('strictQuery', true)

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI)
    logger.info('MongoDB connected')
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed')
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected')
  })
}
