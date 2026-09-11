import mongoose from 'mongoose'
import { logger } from '../config/logger.js'

let isReplicaSetChecked = false
let isReplicaSetSupported = false

export async function checkReplicaSetSupport() {
  if (isReplicaSetChecked) return isReplicaSetSupported
  try {
    const adminDb = mongoose.connection.db.admin()
    const serverStatus = await adminDb.serverStatus()
    // Check if repl set info is present
    if (serverStatus?.repl) {
      isReplicaSetSupported = true
    } else {
      isReplicaSetSupported = false
      logger.warn('MongoDB is running in standalone mode (no replica set). ACID transactions are disabled. Operations will run sequentially.')
    }
  } catch (err) {
    // Fallback: check connection string or try starting a dummy session
    isReplicaSetSupported = false
  }
  isReplicaSetChecked = true
  return isReplicaSetSupported
}

/**
 * Executes a callback within a MongoDB transaction if replica set is available,
 * otherwise executes it directly with a null session.
 *
 * @param {Function} callback (session) => Promise<any>
 * @returns {Promise<any>}
 */
export async function withTransactionRunner(callback) {
  const supportsReplica = await checkReplicaSetSupport()

  if (!supportsReplica) {
    // Run without transaction session
    return await callback(null)
  }

  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await callback(session)
    })
    return result
  } catch (err) {
    // If error says transactions not supported, cache and fallback
    if (err.message && err.message.includes('replica set')) {
      isReplicaSetSupported = false
      logger.warn('Replica set transaction failed, falling back to non-transactional execution: ' + err.message)
      return await callback(null)
    }
    throw err
  } finally {
    await session.endSession()
  }
}
