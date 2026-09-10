import mongoose from 'mongoose'

const returnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  sku: { type: String, default: '' },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  reason: {
    type: String,
    enum: ['Wrong Product', 'Damaged Product', 'Defective Product', 'Missing Item', 'Other'],
    required: true,
  },
  customerComment: { type: String, default: '' },
})

const returnRequestSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    requestType: {
      type: String,
      enum: ['RETURN_REFUND', 'RETURN_REPLACEMENT'],
      default: 'RETURN_REFUND',
    },
    items: [returnItemSchema],
    evidenceMedia: [
      {
        provider: { type: String, default: 'CLOUDINARY' },
        storageKey: { type: String },
        url: { type: String, required: true },
        fileName: { type: String },
        mimeType: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: [
        'RETURN_REQUESTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'PICKUP_SCHEDULED',
        'PICKED_UP',
        'IN_TRANSIT',
        'RECEIVED',
        'QC_PENDING',
        'QC_APPROVED',
        'QC_REJECTED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'RETURN_REQUESTED',
      index: true,
    },
    rejectionReason: {
      type: String,
    },
    qcDetails: {
      status: {
        type: String,
        enum: ['PENDING', 'PASSED', 'FAILED'],
        default: 'PENDING',
      },
      disposition: {
        type: String,
        enum: ['SELLABLE', 'DAMAGED', 'DISPOSED', 'REFURBISH', 'NONE'],
        default: 'NONE',
      },
      inspectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      inspectedAt: { type: Date },
      notes: { type: String },
    },
    reverseShipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
    },
    reverseWaybill: {
      type: String,
    },
    replacementOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    replacementOrderNumber: {
      type: String,
    },
    refundDetails: {
      refundId: { type: String },
      amount: { type: Number },
      processedAt: { type: Date },
      status: { type: String, enum: ['NONE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'NONE' },
    },
    timeline: [
      {
        status: { type: String },
        title: { type: String },
        description: { type: String },
        actor: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

returnRequestSchema.index({ order: 1, createdAt: -1 })

export default mongoose.model('ReturnRequest', returnRequestSchema)
