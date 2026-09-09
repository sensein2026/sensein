import SiteSettings from '../models/SiteSettings.js'
import AuditLog from '../models/AuditLog.js'

// Helper to get or initialize default settings
const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne()
  if (!settings) {
    settings = await SiteSettings.create({
      isMaintenanceMode: false,
      maintenanceTitle: 'Under Scheduled Maintenance',
      maintenanceMessage:
        'Sensein Luxury Haircare is currently undergoing scheduled platform updates to enhance your shopping experience. We will be back online shortly.',
      estimatedBackAt: '',
      allowAdminBypass: true,
      updatedBy: 'System',
    })
  }
  return settings
}

// @desc    Get public maintenance mode status
// @route   GET /api/v1/site-settings/maintenance-status
// @access  Public
export const getPublicMaintenanceStatus = async (req, res) => {
  try {
    const settings = await getOrCreateSettings()
    res.status(200).json({
      success: true,
      isMaintenanceMode: settings.isMaintenanceMode,
      maintenanceTitle: settings.maintenanceTitle,
      maintenanceMessage: settings.maintenanceMessage,
      estimatedBackAt: settings.estimatedBackAt,
      allowAdminBypass: settings.allowAdminBypass,
      updatedAt: settings.updatedAt,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get complete site settings for Admin
// @route   GET /api/v1/admin/maintenance
// @access  Private/Admin
export const getAdminSiteSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings()
    res.status(200).json({
      success: true,
      settings,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update Maintenance Mode and Site Settings
// @route   PUT /api/v1/admin/maintenance
// @access  Private/Admin
export const updateAdminSiteSettings = async (req, res) => {
  try {
    const { isMaintenanceMode, maintenanceTitle, maintenanceMessage, estimatedBackAt, allowAdminBypass } = req.body
    const settings = await getOrCreateSettings()
    const previousSnapshot = settings.toObject()

    if (isMaintenanceMode !== undefined) settings.isMaintenanceMode = Boolean(isMaintenanceMode)
    if (maintenanceTitle !== undefined) settings.maintenanceTitle = maintenanceTitle.trim()
    if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage.trim()
    if (estimatedBackAt !== undefined) settings.estimatedBackAt = estimatedBackAt.trim()
    if (allowAdminBypass !== undefined) settings.allowAdminBypass = Boolean(allowAdminBypass)
    settings.updatedBy = req.user?.name || req.user?.email || 'Super Admin'

    await settings.save()

    // Record in AuditLog / Activity Vault
    try {
      const modeText = settings.isMaintenanceMode ? 'ACTIVATED (Website Offline)' : 'DEACTIVATED (Website Live)'
      await AuditLog.create({
        action: 'UPDATE',
        targetType: 'SYSTEM_MAINTENANCE',
        targetId: settings._id.toString(),
        targetName: `Maintenance Mode ${modeText}`,
        performedBy: {
          id: req.user?._id?.toString() || 'admin-id',
          name: req.user?.name || 'Admin',
          email: req.user?.email || 'admin@sensein.in',
          role: req.user?.role || 'admin',
        },
        changes: {
          previousState: previousSnapshot,
          newState: settings.toObject(),
        },
        metadata: {
          isMaintenanceMode: settings.isMaintenanceMode,
          reason: 'Admin toggled site maintenance switch',
        },
      })
    } catch (auditErr) {
      console.error('AuditLog creation error for maintenance update:', auditErr)
    }

    res.status(200).json({
      success: true,
      message: settings.isMaintenanceMode
        ? '⚠️ Maintenance Mode is now ON (Live website is in maintenance mode)'
        : '✅ Maintenance Mode is now OFF (Live website is open & running)',
      settings,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get public Tax Invoice / Seller Config for Client Invoice
// @route   GET /api/v1/site-settings/invoice-config
// @access  Public
export const getPublicInvoiceConfig = async (req, res) => {
  try {
    const settings = await getOrCreateSettings()
    res.status(200).json({
      success: true,
      sellerDetails: settings.sellerDetails || {},
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get complete Tax Invoice / Seller Config for Admin
// @route   GET /api/v1/admin/invoice-config
// @access  Private/Admin
export const getAdminInvoiceConfig = async (req, res) => {
  try {
    const settings = await getOrCreateSettings()
    res.status(200).json({
      success: true,
      sellerDetails: settings.sellerDetails || {},
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update Tax Invoice / Seller Details
// @route   PUT /api/v1/admin/invoice-config
// @access  Private/Admin
export const updateAdminInvoiceConfig = async (req, res) => {
  try {
    const settings = await getOrCreateSettings()
    const previousSnapshot = settings.toObject()

    if (req.body.sellerDetails) {
      settings.sellerDetails = {
        ...(settings.sellerDetails ? settings.sellerDetails.toObject?.() || settings.sellerDetails : {}),
        ...req.body.sellerDetails,
      }
    } else {
      settings.sellerDetails = {
        ...(settings.sellerDetails ? settings.sellerDetails.toObject?.() || settings.sellerDetails : {}),
        ...req.body,
      }
    }

    settings.updatedBy = req.user?.name || req.user?.email || 'Super Admin'
    await settings.save()

    // Record in AuditLog
    try {
      await AuditLog.create({
        action: 'UPDATE',
        targetType: 'TAX_INVOICE_CONFIG',
        targetId: settings._id.toString(),
        targetName: `Updated Tax Invoice Seller Details (${settings.sellerDetails?.companyName})`,
        performedBy: {
          id: req.user?._id?.toString() || 'admin-id',
          name: req.user?.name || 'Admin',
          email: req.user?.email || 'admin@sensein.in',
          role: req.user?.role || 'admin',
        },
        changes: {
          previousState: previousSnapshot.sellerDetails,
          newState: settings.sellerDetails,
        },
        metadata: {
          sellerDetails: settings.sellerDetails,
          reason: 'Admin updated tax invoice seller details',
        },
      })
    } catch (auditErr) {
      console.error('AuditLog creation error for invoice config update:', auditErr)
    }

    res.status(200).json({
      success: true,
      message: '✅ Tax Invoice and Seller details updated successfully!',
      sellerDetails: settings.sellerDetails,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
