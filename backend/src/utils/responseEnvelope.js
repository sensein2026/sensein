/**
 * Standard API Response Envelope
 * Success: { success: true, message: string, data: any, meta?: object }
 * Error:   { success: false, message: string, code: string, data: null, error?: any }
 */

export const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    message,
    data,
  }
  if (meta) {
    payload.meta = meta
  }
  return res.status(statusCode).json(payload)
}

export const sendError = (res, message = 'An error occurred', statusCode = 400, code = 'ERROR', error = null) => {
  const payload = {
    success: false,
    message,
    code,
    data: null,
  }
  if (process.env.NODE_ENV !== 'production' && error) {
    payload.error = typeof error === 'object' ? error.message || error : error
  }
  return res.status(statusCode).json(payload)
}

export const sendPaginated = (res, message = 'Data retrieved successfully', data = [], page = 1, limit = 20, total = 0) => {
  const totalPages = Math.ceil(total / limit) || 1
  return res.status(200).json({
    success: true,
    message,
    data,
    page: Number(page),
    limit: Number(limit),
    total: Number(total),
    totalPages,
  })
}
