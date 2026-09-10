import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    let transporter

    if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD) {
      // Production Genuine SMTP Configuration
      transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT || 587,
        secure: env.EMAIL_PORT === 465,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      })
    } else {
      // Fallback Ethereal / Local Test Transport for seamless local development
      try {
        const testAccount = await Promise.race([
          nodemailer.createTestAccount(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Ethereal timeout')), 4000)),
        ])
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          connectionTimeout: 4000,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        })
      } catch (e) {
        logger.warn('⚠️ SMTP not configured and Ethereal unavailable. Email delivery skipped.')
        return { messageId: 'skipped' }
      }
    }

    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || '"Sensein Professional" <mindnextarticle@gmail.com>',
      to,
      subject,
      text,
      html,
      attachments: attachments || [],
    })

    logger.info(`📧 Email sent to ${to}: Message ID ${info.messageId}`)
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      logger.info(`🔗 Email Preview URL: ${previewUrl}`)
    }

    return info
  } catch (error) {
    logger.error({ error }, '❌ Failed to send email')
    throw error
  }
}
