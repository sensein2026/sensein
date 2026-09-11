import AuditLog from '../models/AuditLog.js'
import { logger } from '../config/logger.js'

/**
 * Record an audit log entry
 */
export async function logAudit({
  action,
  actor = 'system',
  actorId = null,
  targetType,
  targetId = '',
  reason = '',
  metadata = {},
}) {
  try {
    const entry = await AuditLog.create({
      action,
      actor: typeof actor === 'string' ? actor : actor?.email || 'admin',
      actorId: actorId || (typeof actor === 'object' ? actor?._id : null),
      targetType,
      targetId: String(targetId),
      reason,
      metadata,
    })
    return entry
  } catch (err) {
    logger.error({ err: err.message, action, targetType, targetId }, 'Failed to record audit log')
    return null
  }
}
