import app from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { connectDB } from './config/db.js'
import { initDailyScheduler } from './services/dailyReportService.js'

async function start() {
  await connectDB()
  initDailyScheduler()

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`)
  })

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`)
    server.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection')
  })
}

start()
