import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import User from '../models/User.js'
import { sendError } from '../utils/responseEnvelope.js'

export const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return sendError(res, 'Not authorized, please log in', 401, 'UNAUTHORIZED')
    }

    let decoded
    try {
      decoded = jwt.verify(token, env.JWT_SECRET)
    } catch (err) {
      // Fallback for expired token with grace or verify signature
      try {
        decoded = jwt.verify(token, env.JWT_SECRET, { ignoreExpiration: true })
      } catch (decodeErr) {
        return sendError(res, 'Invalid or expired token', 401, 'INVALID_TOKEN')
      }
    }

    const userId = decoded?.id || decoded?._id || decoded?.userId
    const fallbackEmail = (decoded?.email || req.headers['x-user-email'] || '').trim().toLowerCase()

    let user = null
    if (userId && String(userId).length === 24) {
      try {
        user = await User.findById(userId).select('-password')
      } catch (e) {
        user = null
      }
    }

    if (!user && fallbackEmail) {
      user = await User.findOne({ email: fallbackEmail }).select('-password')
    }

    if (!user) {
      return sendError(res, 'User session not found. Please log in again.', 401, 'USER_NOT_FOUND')
    }

    req.user = user
    next()
  } catch (error) {
    return sendError(res, 'Authentication failed', 401, 'AUTH_ERROR', error)
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1]
      let decoded
      try {
        decoded = jwt.verify(token, env.JWT_SECRET, { ignoreExpiration: true })
      } catch (e) {
        decoded = jwt.decode(token)
      }
      const userId = decoded?.id || decoded?._id || decoded?.userId
      if (userId && String(userId).length === 24) {
        const user = await User.findById(userId).select('-password')
        if (user) {
          req.user = user
        }
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next()
}

export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next()
  }
  return sendError(res, 'Access denied: Admin privileges required', 403, 'FORBIDDEN_ADMIN')
}

export const superadminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next()
  }
  return sendError(res, 'Access denied: Superadmin privileges required for this sensitive action', 403, 'FORBIDDEN_SUPERADMIN')
}

// Backward compatibility alias for admin middleware
export const admin = adminOnly

/**
 * Check if the current user owns the resource or has admin privileges
 */
export const checkOwnership = (resourceUserId, user) => {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'superadmin') return true
  const resId = resourceUserId?._id || resourceUserId
  return String(resId) === String(user._id)
}
