import AuditLog from '../models/AuditLog.js'
import MediaAsset from '../models/MediaAsset.js'
import HomepageConfig from '../models/HomepageConfig.js'
import Product from '../models/Product.js'
import BulkOrderConfig from '../models/BulkOrderConfig.js'
import BulkInquiry from '../models/BulkInquiry.js'

/**
 * @desc Get all audit activity logs with filters
 * @route GET /api/admin/audit/logs
 * @access Private (Admin)
 */
export async function getAuditLogs(req, res, next) {
  try {
    const { action, entityType, isRecoverable, search } = req.query

    const filter = {}

    if (action && action !== 'all') {
      filter.action = action
    }

    if (entityType && entityType !== 'all') {
      filter.entityType = entityType
    }

    if (isRecoverable === 'true') {
      filter.isRecoverable = true
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { performerEmail: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
      ]
    }

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(300)
    const totalLogs = await AuditLog.countDocuments()
    const recoverableCount = await AuditLog.countDocuments({ isRecoverable: true })

    res.json({
      success: true,
      data: logs,
      stats: {
        total: totalLogs,
        recoverable: recoverableCount,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc 1-Click Recover / Restore an item from snapshot backup in AuditLog
 * @route POST /api/admin/audit/logs/:id/recover
 * @access Private (Admin)
 */
export async function recoverFromAuditLog(req, res, next) {
  try {
    const log = await AuditLog.findById(req.params.id)
    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit record not found' })
    }

    if (!log.snapshotData) {
      return res.status(400).json({
        success: false,
        message: 'No snapshot data available for recovery on this record.',
      })
    }

    const snapshot = log.snapshotData

    if (log.entityType === 'MediaAsset') {
      // Restore media asset in MongoDB
      await MediaAsset.findByIdAndUpdate(
        snapshot._id,
        {
          ...snapshot,
          isDeleted: false,
          status: 'active',
          deletedAt: null,
        },
        { upsert: true, new: true }
      )
    } else if (log.entityType === 'HomepageConfig') {
      // Restore homepage config snapshot
      await HomepageConfig.findOneAndUpdate(
        { configKey: 'default_homepage' },
        { $set: snapshot },
        { upsert: true, new: true }
      )
    } else if (log.entityType === 'Product') {
      // Restore product snapshot
      await Product.findByIdAndUpdate(snapshot._id, snapshot, { upsert: true, new: true })
    } else if (log.entityType === 'BulkOrderConfig') {
      // Restore bulk order quantities configuration
      await BulkOrderConfig.findOneAndUpdate(
        { key: 'bulk_order_settings' },
        { $set: { quantities: snapshot.quantities || snapshot } },
        { upsert: true, new: true }
      )
    } else if (log.entityType === 'BulkOrder') {
      // Restore deleted or modified bulk inquiry
      await BulkInquiry.findByIdAndUpdate(snapshot._id || log.entityId, snapshot, {
        upsert: true,
        new: true,
      })
    }

    log.isRecoverable = false
    log.recoveredAt = new Date()
    await log.save()

    // Create a new log for the recovery operation
    await AuditLog.create({
      action: 'RESTORE',
      entityType: log.entityType,
      entityId: log.entityId,
      title: `Recovered & restored snapshot for: ${log.title}`,
      details: {
        recoveredFromLogId: log._id,
        location: `${log.entityType} Vault`,
        restoredItem: log.title,
      },
      performedBy: req.user?._id,
      performerEmail: req.user?.email || 'admin@sensein.in',
      isRecoverable: false,
    })

    res.json({
      success: true,
      message: `Successfully recovered snapshot for ${log.title}!`,
      data: log,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc Export Full Activity & Recovery Audit Sheet as comprehensive CSV
 * @route GET /api/admin/audit/export
 * @access Private (Admin)
 */
export async function exportAuditCsv(req, res, next) {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(1000).lean()

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const headers = [
      'Action Type (ઓપરેશન: ADD / UPDATE / REMOVE / RESTORE / UPLOAD)',
      'Location / Section / Module (કઈ જગ્યાએ / સેક્શન પર ફેરફાર કર્યો)',
      'Item / Category / File Name (કઈ આઇટમ / ફાઈલ / કેટેગરી)',
      'Property / Field Name (અંદરની વિગત / પ્રોપર્ટી)',
      'Value Before Change (🔴 પહેલાં શું હતું - Previous Data)',
      'Value After Change (🟢 હાલમાં શું છે - New / Live Data)',
      'Action Description (વિગતવાર વર્ણન)',
      'Date & Time (ચોક્કસ તારીખ અને સમય)',
      'Admin Performer (કોણે કર્યું - Email)',
      '1-Click Recovery Available (બેકઅપ ઉપલબ્ધ)',
      'Audit Reference ID',
    ]

    const rows = []

    for (const l of logs) {
      const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN') : 'N/A'
      const adminEmail = l.performerEmail || 'admin@sensein.in'
      const hasSnapshot = l.snapshotData ? (l.recoveredAt ? 'RESTORED' : 'YES (1-Click Restore Available)') : 'NO'
      const changesList = l.details?.changes || []

      if (changesList.length > 0) {
        // Detailed property-by-property breakdown of changes
        for (const c of changesList) {
          const location = c.section ? `Front Page CMS -> ${c.section}` : (l.entityType || 'Homepage CMS')
          const itemName = c.categoryOrItem || c.field || l.title
          const propertyName = c.property || 'Content Value'
          const beforeVal = c.beforeValue || '(None / Not Set)'
          const afterVal = c.afterValue || '(None / Not Set)'
          let opType = l.action
          if (c.status === 'NEWLY_ADDED') opType = 'ADD (NEW ITEM)'
          else if (c.status === 'MODIFIED') opType = 'UPDATE / CHANGE'

          rows.push([
            escapeCsv(opType),
            escapeCsv(location),
            escapeCsv(itemName),
            escapeCsv(propertyName),
            escapeCsv(beforeVal),
            escapeCsv(afterVal),
            escapeCsv(l.title),
            escapeCsv(dateStr),
            escapeCsv(adminEmail),
            escapeCsv(hasSnapshot),
            escapeCsv(l._id),
          ])
        }
      } else {
        // Single operation (e.g. Media Upload, Move to Trash, Restore, Product Update)
        let location = l.entityType || 'General System'
        let itemName = l.title || 'Item'
        let propName = 'Asset / Record Status'
        let beforeVal = '(Previous Active State)'
        let afterVal = '(Updated State)'

        if (l.entityType === 'MediaAsset') {
          location = 'Media Library & Vault'
          itemName = l.title.replace('Uploaded new asset: ', '').replace('Moved asset to Trash: ', '')
          if (l.action === 'UPLOAD') {
            beforeVal = '✨ [NEW ASSET — Previously Did Not Exist / અગાઉ નહોતું]'
            afterVal = `Live Media Asset: ${itemName}`
          } else if (l.action === 'DELETE') {
            beforeVal = 'Active in Media Library'
            afterVal = '🗑️ Moved to Trash / Archived'
          } else if (l.action === 'RESTORE') {
            beforeVal = 'In Trash / Deleted'
            afterVal = '🟢 Restored to Active Library'
          }
        } else if (l.entityType === 'HomepageConfig') {
          location = 'Front Page CMS'
          if (l.action === 'RESET') {
            beforeVal = 'Custom Homepage Layout'
            afterVal = '🔄 Reset to Original Default Template'
          }
        }

        rows.push([
          escapeCsv(l.action),
          escapeCsv(location),
          escapeCsv(itemName),
          escapeCsv(propName),
          escapeCsv(beforeVal),
          escapeCsv(afterVal),
          escapeCsv(l.title),
          escapeCsv(dateStr),
          escapeCsv(adminEmail),
          escapeCsv(hasSnapshot),
          escapeCsv(l._id),
        ])
      }
    }

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Activity_Recovery_Audit_Master_Sheet_${Date.now()}.csv"`
    )
    return res.status(200).send(csvContent)
  } catch (error) {
    next(error)
  }
}
