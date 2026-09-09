import { isProd } from '../config/env.js'
import { logger } from '../config/logger.js'

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500
  let message = err.message || 'Something went wrong. Please try again.'
  let details = err.details || null

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400
    const errorMessages = Object.values(err.errors).map((e) => e.message)
    message = errorMessages.join(', ') || 'Validation failed'
    details = err.errors
  }

  // Handle Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid value for ${err.path}: ${err.value}`
  }

  // Handle Mongo Duplicate Key Error (E11000)
  if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
    statusCode = 409
    message = 'This item already exists. Duplicate entries cannot be added.'
  }

  if (statusCode >= 500) {
    logger.error({ err, path: req.originalUrl }, 'Unhandled error')
    if (!err.isOperational && isProd) {
      message = 'Something went wrong. Please try again.'
    }
  } else {
    logger.warn({ msg: message, path: req.originalUrl }, 'Handled error')
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(!isProd && err.stack ? { stack: err.stack } : {}),
  })
}
