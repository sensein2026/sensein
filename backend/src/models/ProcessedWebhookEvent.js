import mongoose from 'mongoose'

const processedWebhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['razorpay', 'delhivery'],
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    payloadSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// DB-level unique compound index is the true idempotency guarantee
processedWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true })

const ProcessedWebhookEvent = mongoose.model('ProcessedWebhookEvent', processedWebhookEventSchema)
export default ProcessedWebhookEvent
