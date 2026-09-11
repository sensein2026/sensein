import mongoose from 'mongoose'

const shipmentOperationSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    replacementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Replacement',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['FORWARD', 'REVERSE', 'REPLACEMENT_FORWARD'],
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    requestHash: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'CONFIRMED', 'FAILED', 'UNKNOWN'],
      default: 'PENDING',
      index: true,
    },
    waybill: {
      type: String,
      default: null,
      index: true,
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

shipmentOperationSchema.index({ orderId: 1, type: 1, status: 1 })

const ShipmentOperation = mongoose.model('ShipmentOperation', shipmentOperationSchema)
export default ShipmentOperation
