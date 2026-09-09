export function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, meta } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  })
}
