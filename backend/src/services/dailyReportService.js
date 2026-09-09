import MediaAsset from '../models/MediaAsset.js'
import Order from '../models/Order.js'
import BulkInquiry from '../models/BulkInquiry.js'
import { sendEmail } from '../utils/sendEmail.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Generate and send daily Media Master Sheet & Store Telemetry Report
 */
export async function sendDailyMediaReportEmail(customRecipient = null) {
  try {
    const recipient = customRecipient || env.ADMIN_EMAIL || 'sales@sensein.in'
    const todayStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    // 1. Fetch all media assets
    const assets = await MediaAsset.find({ isDeleted: false }).sort({ createdAt: -1 }).lean()

    // 2. Fetch today's store activity
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const todayOrders = await Order.find({ createdAt: { $gte: startOfToday } }).lean()
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    const todayInquiries = await BulkInquiry.find({ createdAt: { $gte: startOfToday } }).lean()

    const baseUrl = env.CLIENT_URL || 'http://localhost:5000'

    // 3. Build CSV string for email attachment
    const headers = [
      'Asset ID',
      'File Name',
      'Live Download / Direct URL Link',
      'File Type',
      'Size (KB)',
      'Upload Date & Time',
      'Current Status',
      'Usage Category',
    ]

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const csvRows = assets.map((a) => {
      const fullUrl = a.fileUrl?.startsWith('http')
        ? a.fileUrl
        : `http://localhost:5000${a.fileUrl || ''}`
      const sizeKb = (Number(a.fileSize || 0) / 1024).toFixed(1)
      const addedDate = a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN') : 'N/A'
      const mime = a.mimeType || (a.fileUrl?.endsWith('.mp4') ? 'VIDEO/MP4' : 'IMAGE')

      return [
        escapeCsv(a._id),
        escapeCsv(a.originalName || a.fileName || 'Asset'),
        escapeCsv(fullUrl),
        escapeCsv(mime),
        escapeCsv(`${sizeKb} KB`),
        escapeCsv(addedDate),
        escapeCsv(a.isDeleted ? 'TRASH' : 'ACTIVE'),
        escapeCsv(a.category || a.usageLocation || 'General Vault'),
      ]
    })

    const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n')

    // 4. Generate Top 10 Media Assets Table for HTML Email Body
    const topAssetsHtml = assets.slice(0, 15).map((a) => {
      const fullUrl = a.fileUrl?.startsWith('http')
        ? a.fileUrl
        : `http://localhost:5000${a.fileUrl || ''}`
      const sizeKb = (Number(a.fileSize || 0) / 1024).toFixed(1)
      const date = a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : 'N/A'

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 10px; font-weight: bold; color: #ffffff;">${a.originalName || a.fileName}</td>
          <td style="padding: 10px; color: #94a3b8; font-family: monospace; font-size: 11px;">${sizeKb} KB</td>
          <td style="padding: 10px; color: #cbd5e1; font-size: 11px;">${date}</td>
          <td style="padding: 10px;">
            <a href="${fullUrl}" target="_blank" style="display: inline-block; padding: 4px 10px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: bold;">
              Open / Download Link
            </a>
          </td>
        </tr>
      `
    }).join('')

    // 5. Build HTML Email
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%); padding: 32px 28px; border-bottom: 2px solid #6366f1;">
          <div style="display: inline-block; padding: 4px 12px; background-color: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 20px; color: #a5b4fc; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
            Daily Automated Backup System
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
            Media Master Sheet &amp; Store Report
          </h1>
          <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px;">
            Automated Daily Archive for <strong>${todayStr}</strong> • Sensein Executive Telemetry
          </p>
        </div>

        <!-- Telemetry Cards -->
        <div style="padding: 24px 28px;">
          <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            Today's Store Snapshot
          </h3>
          <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 24px;">
            <tr>
              <td style="background-color: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; width: 33%;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Active Media Assets</div>
                <div style="font-size: 22px; font-weight: 800; color: #38bdf8; margin-top: 4px;">${assets.length} Files</div>
              </td>
              <td style="background-color: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; width: 33%;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Today's Orders</div>
                <div style="font-size: 22px; font-weight: 800; color: #4ade80; margin-top: 4px;">${todayOrders.length} Orders</div>
              </td>
              <td style="background-color: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; width: 33%;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Today's Revenue</div>
                <div style="font-size: 20px; font-weight: 800; color: #facc15; margin-top: 4px;">₹${todayRevenue.toLocaleString('en-IN')}</div>
              </td>
            </tr>
          </table>

          <!-- Latest Uploaded Media Assets -->
          <h3 style="margin: 24px 0 12px 0; font-size: 14px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            Latest Uploaded Media Assets (Direct Links)
          </h3>
          <table style="width: 100%; border-collapse: collapse; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; font-size: 12px;">
            <thead>
              <tr style="background-color: #0f172a; text-align: left; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 10px;">File Name</th>
                <th style="padding: 10px;">Size</th>
                <th style="padding: 10px;">Date</th>
                <th style="padding: 10px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${topAssetsHtml || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #64748b;">No media assets uploaded yet.</td></tr>'}
            </tbody>
          </table>

          <!-- CSV Attachment Info -->
          <div style="margin-top: 24px; padding: 16px; background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 12px; font-size: 12px; color: #86efac; display: flex; align-items: center; gap: 8px;">
            📎 <strong>Attached:</strong> The complete <code>Sensein_Media_Master_Sheet.csv</code> spreadsheet containing all ${assets.length} uploaded files and full links is attached to this email.
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 28px; background-color: #0b0f19; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center;">
          Sensein Professional Haircare • Automated Daily Master Sheet Service<br/>
          This is an automated system email sent to ${recipient}.
        </div>
      </div>
    `

    // 6. Send Email with Attachment
    const info = await sendEmail({
      to: recipient,
      subject: `📊 [Daily Backup] Sensein Media Master Sheet & Store Report - ${todayStr}`,
      text: `Sensein Daily Backup Report for ${todayStr}. Total Media Assets: ${assets.length}. Today's Orders: ${todayOrders.length}. Today's Revenue: ₹${todayRevenue}. Find the attached CSV for full links.`,
      html: htmlBody,
      attachments: [
        {
          filename: `Sensein_Media_Master_Sheet_${new Date().toISOString().split('T')[0]}.csv`,
          content: csvContent,
          contentType: 'text/csv',
        },
      ],
    })

    logger.info(`✅ Daily Media Report Email sent successfully to ${recipient}`)
    return {
      success: true,
      recipient,
      totalAssets: assets.length,
      todayOrders: todayOrders.length,
      todayRevenue,
      messageId: info.messageId,
    }
  } catch (error) {
    logger.error({ error }, '❌ Failed to generate and send daily media report email')
    throw error
  }
}

/**
 * Initialize daily recurring scheduler
 */
export function initDailyScheduler() {
  logger.info('⏰ Daily Media Report & Store Backup Scheduler initialized.')

  // Run every 24 hours (86400000 ms)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

  // Optional: Run initial check after 1 minute if server just started, or schedule daily interval
  setInterval(async () => {
    try {
      logger.info('⏰ Triggering scheduled daily media & store report email...')
      await sendDailyMediaReportEmail()
    } catch (err) {
      logger.error({ err }, 'Error in recurring daily email scheduler')
    }
  }, TWENTY_FOUR_HOURS)
}
