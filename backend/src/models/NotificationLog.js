import mongoose from 'mongoose'

const notificationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    replacementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Replacement',
      index: true,
    },
    recipientEmail: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS', 'IN_APP', 'WHATSAPP'],
      default: 'EMAIL',
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'QUEUED'],
      default: 'SENT',
      index: true,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    error: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

notificationLogSchema.index({ userId: 1, createdAt: -1 })
notificationLogSchema.index({ orderId: 1, createdAt: -1 })

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema)
export default NotificationLog
