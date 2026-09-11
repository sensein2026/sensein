import nodemailer from 'nodemailer'
import NotificationLog from '../models/NotificationLog.js'
import User from '../models/User.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT || 587,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    })
  }
  return transporter
}

/**
 * Send and Log System Notification
 */
export async function sendNotification({
  userId = null,
  orderId = null,
  replacementId = null,
  recipientEmail = null,
  type = 'ORDER_NOTIFICATION',
  data = {},
  channel = 'EMAIL',
}) {
  let email = recipientEmail
  if (!email && userId) {
    const user = await User.findById(userId)
    email = user?.email
  }

  const logEntry = await NotificationLog.create({
    userId,
    orderId,
    replacementId,
    recipientEmail: email || 'system',
    type,
    channel,
    status: 'QUEUED',
    metadata: data,
    sentAt: new Date(),
  })

  // Async dispatch without blocking caller
  setImmediate(async () => {
    try {
      const mailClient = getTransporter()
      if (mailClient && email) {
        await mailClient.sendMail({
          from: env.EMAIL_FROM || 'no-reply@sensein.com',
          to: email,
          subject: `Sensein Luxury Care: Update on ${type.replace(/_/g, ' ')}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1c1917; max-width: 600px;">
              <h2 style="color: #78350f;">Sensein Luxury Haircare</h2>
              <p>Hello,</p>
              <p>We have an update regarding your order/request:</p>
              <div style="background: #f5f5f4; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Notification:</strong> ${type.replace(/_/g, ' ')}</p>
                <p><strong>Details:</strong> ${JSON.stringify(data, null, 2)}</p>
              </div>
              <p>You can track your order live anytime on our website.</p>
              <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 20px 0;" />
              <p style="font-size: 12px; color: #78716c;">Sensein Botanical Luxury Pvt Ltd</p>
            </div>
          `,
        })
      }

      logEntry.status = 'SENT'
      await logEntry.save()
    } catch (err) {
      logger.warn({ err: err.message, type, email }, 'Failed to dispatch email notification')
      logEntry.status = 'FAILED'
      logEntry.error = err.message
      await logEntry.save()
    }
  })

  return logEntry
}
