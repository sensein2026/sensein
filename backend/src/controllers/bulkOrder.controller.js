import mongoose from 'mongoose'
import BulkInquiry from '../models/BulkInquiry.js'
import BulkOrderConfig, { DEFAULT_QUANTITIES } from '../models/BulkOrderConfig.js'
import AuditLog from '../models/AuditLog.js'
import { sendEmail } from '../utils/sendEmail.js'
import { env } from '../config/env.js'

export const getBulkOrderConfig = async (req, res, next) => {
  try {
    let config = await BulkOrderConfig.findOne({ key: 'bulk_order_settings' })
    if (!config) {
      config = await BulkOrderConfig.create({
        key: 'bulk_order_settings',
        quantities: DEFAULT_QUANTITIES,
      })
    }
    res.json({ success: true, data: config })
  } catch (error) {
    next(error)
  }
}

export const updateBulkOrderConfig = async (req, res, next) => {
  try {
    const { quantities } = req.body
    if (!Array.isArray(quantities) || quantities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantities must be a non-empty array of quantity range strings',
      })
    }
    const cleanedQuantities = quantities.map((q) => String(q).trim()).filter(Boolean)
    if (cleanedQuantities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid quantity range is required',
      })
    }

    // Fetch previous config for audit logging diff
    const prevConfig = await BulkOrderConfig.findOne({ key: 'bulk_order_settings' })
    const prevQuantities = prevConfig?.quantities || DEFAULT_QUANTITIES

    const config = await BulkOrderConfig.findOneAndUpdate(
      { key: 'bulk_order_settings' },
      { quantities: cleanedQuantities },
      { new: true, upsert: true }
    )

    // Build changes diff for Activity & Recovery Vault
    const changes = []
    const addedItems = cleanedQuantities.filter((q) => !prevQuantities.includes(q))
    const removedItems = prevQuantities.filter((q) => !cleanedQuantities.includes(q))

    addedItems.forEach((item) => {
      changes.push({
        section: 'Bulk Orders & Wholesale',
        categoryOrItem: 'Quantity Range Option',
        property: 'Added Option',
        beforeValue: '🔴 (Not Present)',
        afterValue: `🟢 Added "${item}"`,
        status: 'NEWLY_ADDED',
      })
    })

    removedItems.forEach((item) => {
      changes.push({
        section: 'Bulk Orders & Wholesale',
        categoryOrItem: 'Quantity Range Option',
        property: 'Removed Option',
        beforeValue: `🔴 Removed "${item}"`,
        afterValue: '🟢 (Deleted from list)',
        status: 'REMOVED',
      })
    })

    if (addedItems.length === 0 && removedItems.length === 0) {
      changes.push({
        section: 'Bulk Orders & Wholesale',
        categoryOrItem: 'Quantity Tiers',
        property: 'Order & Values',
        beforeValue: prevQuantities.join(', '),
        afterValue: cleanedQuantities.join(', '),
        status: 'MODIFIED',
      })
    }

    // Log to AuditLog
    try {
      await AuditLog.create({
        action: 'UPDATE',
        entityType: 'BulkOrderConfig',
        entityId: 'bulk_order_settings',
        title: `Updated Bulk Order Quantity Tiers (${cleanedQuantities.length} options)`,
        details: {
          section: 'Bulk Orders & Wholesale',
          changes,
          totalQuantities: cleanedQuantities.length,
        },
        performedBy: req.user?._id,
        performerEmail: req.user?.email || 'admin@sensein.in',
        isRecoverable: true,
        snapshotData: {
          quantities: prevQuantities,
        },
      })
    } catch (auditErr) {
      console.warn('AuditLog error in updateBulkOrderConfig:', auditErr.message)
    }

    res.json({
      success: true,
      message: 'Bulk order quantity options updated successfully',
      data: config,
    })
  } catch (error) {
    next(error)
  }
}

export const createBulkInquiry = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      organizationName,
      quantity,
      state,
      city,
      product,
      remarks,
      purpose,
      expectedDeliveryDate,
    } = req.body

    if (!name || !email || !phone || !quantity || !state || !city || !product || !expectedDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all mandatory fields marked with (*)',
      })
    }

    // Email validation
    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g. name@domain.com)',
      })
    }

    // Phone validation (10 digits Indian mobile)
    const cleanPhone = phone.trim().replace(/\D/g, '')
    const normalizedPhone = cleanPhone.length > 10 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number (e.g. 9876543210)',
      })
    }

    // Validate that expected delivery date is today or in the future
    const inputDate = new Date(expectedDeliveryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (isNaN(inputDate.getTime()) || inputDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Expected delivery date must be today or a future date. Past dates are not allowed.',
      })
    }

    const inquiry = await BulkInquiry.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      organizationName: organizationName ? organizationName.trim() : '',
      quantity,
      state: state ? state.trim() : '',
      city: city.trim(),
      product,
      remarks: remarks ? remarks.trim() : '',
      purpose: purpose || 'Corporate Gifting',
      expectedDeliveryDate,
    })

    // Email notification to Admin & Customer confirmation
    try {
      const adminEmail = env.ADMIN_EMAIL || 'sales@sensein.in'
      await sendEmail({
        to: adminEmail,
        subject: `📦 New Bulk Order Inquiry from ${name} (${organizationName || 'Individual'})`,
        text: `New Bulk Inquiry:\nName: ${name}\nEmail: ${cleanEmail}\nPhone: ${phone}\nOrg: ${organizationName || 'N/A'}\nProduct: ${product}\nQty: ${quantity}\nState: ${state || 'N/A'}\nCity: ${city}\nPurpose: ${purpose}\nDelivery Date: ${expectedDeliveryDate}\nRemarks: ${remarks || 'None'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #2A1526; border-radius: 16px; color: #ffffff;">
            <h2 style="color: #E1F830; margin-top: 0;">📦 New Bulk Order Submission</h2>
            <table style="width: 100%; border-collapse: collapse; color: #ffffff; font-size: 14px;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>Client Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${name}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${cleanEmail}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${phone}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>Organization:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${organizationName || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>Product:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${product}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>Quantity:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${quantity}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>State:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${state || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>City:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${city}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>Purpose:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${purpose}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;"><strong>Expected Delivery:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${expectedDeliveryDate}</td></tr>
              <tr><td style="padding: 8px 0; color: #cbd5e1;"><strong>Remarks:</strong></td><td style="padding: 8px 0;">${remarks || 'None'}</td></tr>
            </table>
          </div>
        `,
      })
    } catch (e) {
      console.warn('Bulk email notify notice:', e.message)
    }

    res.status(201).json({
      success: true,
      message: 'Bulk order inquiry submitted successfully. Our team will contact you shortly.',
      data: inquiry,
    })
  } catch (error) {
    next(error)
  }
}

export const getAllBulkInquiries = async (req, res, next) => {
  try {
    const inquiries = await BulkInquiry.find().sort({ createdAt: -1 })
    res.json({ success: true, data: inquiries })
  } catch (error) {
    next(error)
  }
}

export const updateBulkInquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid bulk inquiry ID' })
    }
    const { status, remarks } = req.body

    const validStatuses = ['pending', 'contacted', 'quoted', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' })
    }

    const prevInquiry = await BulkInquiry.findById(id)
    if (!prevInquiry) {
      return res.status(404).json({ success: false, message: 'Bulk order inquiry not found' })
    }

    const updateData = {}
    if (status) updateData.status = status
    if (remarks !== undefined) updateData.remarks = remarks

    const inquiry = await BulkInquiry.findByIdAndUpdate(id, updateData, { new: true })

    // Audit log
    try {
      await AuditLog.create({
        action: 'UPDATE',
        entityType: 'BulkOrder',
        entityId: String(id),
        title: `Updated Status for Bulk Inquiry from "${inquiry.name}" to ${status?.toUpperCase()}`,
        details: {
          section: 'Bulk Orders (B2B)',
          changes: [
            {
              section: 'Bulk Orders',
              categoryOrItem: inquiry.name,
              property: 'Status',
              beforeValue: `🔴 ${prevInquiry.status?.toUpperCase()}`,
              afterValue: `🟢 ${status?.toUpperCase()}`,
              status: 'MODIFIED',
            },
          ],
        },
        performedBy: req.user?._id,
        performerEmail: req.user?.email || 'admin@sensein.in',
        isRecoverable: true,
        snapshotData: prevInquiry.toObject(),
      })
    } catch (e) {
      console.warn('AuditLog status notice:', e.message)
    }

    res.json({ success: true, message: 'Status updated successfully', data: inquiry })
  } catch (error) {
    next(error)
  }
}

export const updateBulkInquiry = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid bulk inquiry ID' })
    }
    const {
      name,
      email,
      phone,
      organizationName,
      quantity,
      state,
      city,
      product,
      remarks,
      purpose,
      expectedDeliveryDate,
      status,
    } = req.body

    const prevInquiry = await BulkInquiry.findById(id)
    if (!prevInquiry) {
      return res.status(404).json({ success: false, message: 'Bulk order inquiry not found' })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (organizationName !== undefined) updateData.organizationName = organizationName
    if (quantity !== undefined) updateData.quantity = quantity
    if (state !== undefined) updateData.state = state
    if (city !== undefined) updateData.city = city
    if (product !== undefined) updateData.product = product
    if (remarks !== undefined) updateData.remarks = remarks
    if (purpose !== undefined) updateData.purpose = purpose
    if (expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = expectedDeliveryDate
    if (status !== undefined) updateData.status = status

    const inquiry = await BulkInquiry.findByIdAndUpdate(id, updateData, { new: true })

    // Build changes diff
    const changes = []
    if (quantity !== undefined && quantity !== prevInquiry.quantity) {
      changes.push({
        section: 'Bulk Orders',
        categoryOrItem: inquiry.name,
        property: 'Quantity Requested',
        beforeValue: `🔴 ${prevInquiry.quantity}`,
        afterValue: `🟢 ${quantity}`,
        status: 'MODIFIED',
      })
    }
    if (product !== undefined && product !== prevInquiry.product) {
      changes.push({
        section: 'Bulk Orders',
        categoryOrItem: inquiry.name,
        property: 'Product Requested',
        beforeValue: `🔴 ${prevInquiry.product}`,
        afterValue: `🟢 ${product}`,
        status: 'MODIFIED',
      })
    }
    if (state !== undefined && state !== prevInquiry.state) {
      changes.push({
        section: 'Bulk Orders',
        categoryOrItem: inquiry.name,
        property: 'Delivery State',
        beforeValue: `🔴 ${prevInquiry.state || '(Not Set)'}`,
        afterValue: `🟢 ${state}`,
        status: 'MODIFIED',
      })
    }
    if (city !== undefined && city !== prevInquiry.city) {
      changes.push({
        section: 'Bulk Orders',
        categoryOrItem: inquiry.name,
        property: 'Target City',
        beforeValue: `🔴 ${prevInquiry.city}`,
        afterValue: `🟢 ${city}`,
        status: 'MODIFIED',
      })
    }
    if (status !== undefined && status !== prevInquiry.status) {
      changes.push({
        section: 'Bulk Orders',
        categoryOrItem: inquiry.name,
        property: 'Status',
        beforeValue: `🔴 ${prevInquiry.status}`,
        afterValue: `🟢 ${status}`,
        status: 'MODIFIED',
      })
    }

    // Log to AuditLog
    try {
      await AuditLog.create({
        action: 'UPDATE',
        entityType: 'BulkOrder',
        entityId: String(id),
        title: `Updated details for Bulk Inquiry from "${inquiry.name}"`,
        details: {
          section: 'Bulk Orders (B2B)',
          changes,
        },
        performedBy: req.user?._id,
        performerEmail: req.user?.email || 'admin@sensein.in',
        isRecoverable: true,
        snapshotData: prevInquiry.toObject(),
      })
    } catch (e) {
      console.warn('AuditLog update notice:', e.message)
    }

    res.json({ success: true, message: 'Inquiry updated successfully', data: inquiry })
  } catch (error) {
    next(error)
  }
}

export const deleteBulkInquiry = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid bulk inquiry ID' })
    }
    const inquiry = await BulkInquiry.findByIdAndDelete(id)
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Bulk order inquiry not found' })
    }

    // Log to AuditLog
    try {
      await AuditLog.create({
        action: 'DELETE',
        entityType: 'BulkOrder',
        entityId: String(id),
        title: `Deleted Bulk Inquiry from "${inquiry.name}" (${inquiry.product}, Qty: ${inquiry.quantity})`,
        details: {
          section: 'Bulk Orders (B2B)',
          changes: [
            {
              section: 'Bulk Orders',
              categoryOrItem: inquiry.name,
              property: 'Deleted Inquiry Record',
              beforeValue: `🔴 Name: ${inquiry.name}, Phone: ${inquiry.phone}, Product: ${inquiry.product}`,
              afterValue: '🟢 (Deleted from Database)',
              status: 'REMOVED',
            },
          ],
        },
        performedBy: req.user?._id,
        performerEmail: req.user?.email || 'admin@sensein.in',
        isRecoverable: true,
        snapshotData: inquiry.toObject(),
      })
    } catch (e) {
      console.warn('AuditLog delete notice:', e.message)
    }

    res.json({ success: true, message: 'Inquiry deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export const exportBulkInquiriesCsv = async (req, res, next) => {
  try {
    const inquiries = await BulkInquiry.find().sort({ createdAt: -1 })

    const headers = [
      'Inquiry ID',
      'Date',
      'Client Name',
      'Email',
      'Phone',
      'Organization',
      'Product',
      'Quantity',
      'Purpose',
      'Delivery State',
      'Delivery City',
      'Expected Delivery Date',
      'Status',
      'Remarks',
    ]

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = inquiries.map((inq) => [
      escapeCsv(inq._id),
      escapeCsv(new Date(inq.createdAt).toLocaleString('en-IN')),
      escapeCsv(inq.name),
      escapeCsv(inq.email),
      escapeCsv(inq.phone),
      escapeCsv(inq.organizationName || 'N/A'),
      escapeCsv(inq.product),
      escapeCsv(inq.quantity),
      escapeCsv(inq.purpose),
      escapeCsv(inq.state || 'N/A'),
      escapeCsv(inq.city),
      escapeCsv(inq.expectedDeliveryDate),
      escapeCsv(inq.status),
      escapeCsv(inq.remarks || 'None'),
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Sensein_Bulk_Orders_${Date.now()}.csv"`
    )
    return res.status(200).send('\uFEFF' + csvContent) // UTF-8 BOM for Microsoft Excel compatibility
  } catch (error) {
    next(error)
  }
}
