import mongoose from 'mongoose'

const refundSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayRefundId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    reason: {
      type: String,
      default: 'Customer Cancellation / Order Exception',
    },
    status: {
      type: String,
      enum: ['PENDING', 'INITIATED', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    initiatedBy: {
      type: String,
      default: 'system',
    },
    failureReason: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

refundSchema.index({ orderId: 1, createdAt: -1 })

const Refund = mongoose.model('Refund', refundSchema)
export default Refund
