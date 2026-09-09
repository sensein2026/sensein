import { ApiError } from '../utils/ApiError.js'

/**
 * @param {import('zod').ZodSchema} schema - expects shape { body?, params?, query? }
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    })

    if (!result.success) {
      const details = result.error.flatten().fieldErrors
      return next(new ApiError(422, 'Validation failed', details))
    }

    if (result.data.body) req.body = result.data.body
    if (result.data.query) req.query = result.data.query
    next()
  }
}
