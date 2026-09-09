import MediaAsset from '../models/MediaAsset.js'
import AuditLog from '../models/AuditLog.js'
import { uploadWithCloudinaryFallback } from '../utils/cloudinary.js'

/**
 * @desc Upload image/video file and create asset record
 * @route POST /api/admin/media/upload
 * @access Private (Admin)
 */
export async function uploadMedia(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const { category, usageLocation } = req.body

    // Smart Auto-Fallback: Try Cloudinary first, fallback to local server storage
    const uploadResult = await uploadWithCloudinaryFallback(req.file, { folder: 'sensein_media' })
    const fileUrl = uploadResult.url

    const asset = await MediaAsset.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileUrl,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      category: category || 'general',
      usageLocation: usageLocation || '',
      uploadedBy: req.user?._id,
      uploaderName: req.user?.name || req.user?.email || 'Administrator',
      status: 'active',
      isDeleted: false,
    })

    // Log this action to AuditLog
    await AuditLog.create({
      action: 'UPLOAD',
      entityType: 'MediaAsset',
      entityId: asset._id.toString(),
      title: `Uploaded new asset: ${req.file.originalname}`,
      details: {
        fileName: req.file.filename,
        fileUrl,
        provider: uploadResult.provider,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
      performedBy: req.user?._id,
      performerEmail: req.user?.email || 'admin@sensein.com',
      isRecoverable: true,
      snapshotData: asset.toObject(),
    })

    res.status(201).json({
      success: true,
      message: `File uploaded successfully via ${uploadResult.provider === 'cloudinary' ? 'Cloudinary CDN' : 'Server Storage Vault'}`,
      data: asset,
      url: fileUrl,
      provider: uploadResult.provider,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc Get all media assets in master sheet with filters
 * @route GET /api/admin/media
 * @access Private (Admin)
 */
export async function getAllMedia(req, res, next) {
  try {
    const { status, category, search, showDeleted } = req.query

    const filter = {}

    if (showDeleted === 'true' || status === 'trash') {
      filter.isDeleted = true
    } else if (status && status !== 'all') {
      filter.status = status
      filter.isDeleted = false
    } else {
      filter.isDeleted = false
    }

    if (category && category !== 'all') {
      filter.category = category
    }

    if (search) {
      filter.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
        { usageLocation: { $regex: search, $options: 'i' } },
      ]
    }

    const assets = await MediaAsset.find(filter).sort({ createdAt: -1 })

    // Summary stats for sheet overview
    const totalCount = await MediaAsset.countDocuments()
    const activeCount = await MediaAsset.countDocuments({ isDeleted: false })
    const trashCount = await MediaAsset.countDocuments({ isDeleted: true })

    res.json({
      success: true,
      data: assets,
      stats: {
        total: totalCount,
        active: activeCount,
        trash: trashCount,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc Soft delete media asset (Move to Trash)
 * @route DELETE /api/admin/media/:id
 * @access Private (Admin)
 */
export async function softDeleteMedia(req, res, next) {
  try {
    const asset = await MediaAsset.findById(req.params.id)
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Media asset not found' })
    }

    const previousData = asset.toObject()

    asset.isDeleted = true
    asset.status = 'trash'
    asset.deletedAt = new Date()
    await asset.save()

    // Log soft-delete action
    await AuditLog.create({
      action: 'DELETE',
      entityType: 'MediaAsset',
      entityId: asset._id.toString(),
      title: `Moved asset to Trash: ${asset.originalName}`,
      details: {
        fileName: asset.fileName,
        fileUrl: asset.fileUrl,
        deletedAt: asset.deletedAt,
      },
      performedBy: req.user?._id,
      performerEmail: req.user?.email || 'admin@sensein.com',
      isRecoverable: true,
      snapshotData: previousData,
    })

    res.json({
      success: true,
      message: 'Asset moved to Trash (Preserved in Media Vault & Recoverable)',
      data: asset,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc Restore soft-deleted media asset from Trash
 * @route POST /api/admin/media/:id/restore
 * @access Private (Admin)
 */
export async function restoreMedia(req, res, next) {
  try {
    const asset = await MediaAsset.findById(req.params.id)
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Media asset not found' })
    }

    asset.isDeleted = false
    asset.status = 'active'
    asset.deletedAt = null
    await asset.save()

    // Log restore action
    await AuditLog.create({
      action: 'RESTORE',
      entityType: 'MediaAsset',
      entityId: asset._id.toString(),
      title: `Restored asset from Trash: ${asset.originalName}`,
      details: {
        fileName: asset.fileName,
        fileUrl: asset.fileUrl,
      },
      performedBy: req.user?._id,
      performerEmail: req.user?.email || 'admin@sensein.com',
      isRecoverable: false,
    })

    res.json({
      success: true,
      message: 'Asset successfully restored back to active state!',
      data: asset,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc Export Media Asset Master Sheet as CSV
 * @route GET /api/admin/media/export
 * @access Private (Admin)
 */
export async function exportMediaCsv(req, res, next) {
  try {
    const assets = await MediaAsset.find().sort({ createdAt: -1 })

    // Build clean CSV string
    const headers = [
      'Asset ID',
      'Original File Name',
      'Saved File Name',
      'Direct URL',
      'MIME Type',
      'Size (KB)',
      'Category',
      'Status',
      'Usage Location',
      'Is Deleted (In Trash)',
      'Created At (Added)',
      'Updated At',
      'Uploader',
    ]

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const host = req.get('host') || 'localhost:5000'
    const protocol = req.protocol || 'http'
    const baseUrl = `${protocol}://${host}`

    const rows = assets.map((a) => {
      const fullUrl = a.fileUrl?.startsWith('http') ? a.fileUrl : `${baseUrl}${a.fileUrl}`
      return [
        escapeCsv(a._id),
        escapeCsv(a.originalName),
        escapeCsv(a.fileName),
        escapeCsv(fullUrl),
        escapeCsv(a.mimeType),
        escapeCsv((a.fileSize / 1024).toFixed(2)),
        escapeCsv(a.category),
        escapeCsv(a.status),
        escapeCsv(a.usageLocation || 'General Vault'),
        escapeCsv(a.isDeleted ? 'YES (Trash)' : 'NO (Active)'),
        escapeCsv(new Date(a.createdAt).toLocaleString('en-IN')),
        escapeCsv(new Date(a.updatedAt).toLocaleString('en-IN')),
        escapeCsv(a.uploaderName || 'Administrator'),
      ]
    })

    const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join(
      '\n'
    )

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="media-vault-sheet-${Date.now()}.csv"`
    )
    return res.status(200).send(csvContent)
  } catch (error) {
    next(error)
  }
}

/**
 * @desc Manually trigger daily media & store report email to admin
 * @route POST /api/admin/media/send-daily-report
 * @access Private (Admin)
 */
export async function triggerDailyReportEmail(req, res, next) {
  try {
    const { sendDailyMediaReportEmail } = await import('../services/dailyReportService.js')
    const result = await sendDailyMediaReportEmail(req.user?.email || null)
    res.status(200).json({
      success: true,
      message: `Daily Media Sheet & Store Report email sent successfully to ${result.recipient}`,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
