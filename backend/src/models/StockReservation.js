import mongoose from 'mongoose'

const stockReservationItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: String,
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
})

const stockReservationSchema = new mongoose.Schema(
  {
    reservationKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    purpose: {
      type: String,
      enum: ['ORDER_CHECKOUT', 'REPLACEMENT'],
      default: 'ORDER_CHECKOUT',
      index: true,
    },
    replacementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Replacement',
      default: null,
      index: true,
    },
    items: [stockReservationItemSchema],
    status: {
      type: String,
      enum: ['ACTIVE', 'CONVERTED', 'RELEASED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

stockReservationSchema.index({ status: 1, expiresAt: 1 })
stockReservationSchema.index({ orderId: 1, status: 1 })

const StockReservation = mongoose.model('StockReservation', stockReservationSchema)
export default StockReservation
