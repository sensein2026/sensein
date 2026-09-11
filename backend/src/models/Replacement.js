import mongoose from 'mongoose'

const replacementItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    default: '',
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  variantId: {
    type: String,
    default: null,
  },
  variantName: {
    type: String,
    default: '',
  },
  sku: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  orderedQty: {
    type: Number,
    required: true,
    min: 1,
  },
  replacementQty: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: [
      'REQUESTED',
      'APPROVED',
      'PICKUP_COMPLETED',
      'QC_PENDING',
      'QC_PASSED',
      'QC_FAILED',
      'REPLACEMENT_SHIPPED',
      'REPLACEMENT_DELIVERED',
      'REJECTED',
      'CANCELLED',
    ],
    default: 'REQUESTED',
  },
})

const replacementTimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  location: { type: String, default: '' },
  source: {
    type: String,
    enum: ['SYSTEM', 'DELHIVERY', 'ADMIN', 'CUSTOMER'],
    default: 'SYSTEM',
  },
  actor: { type: String, default: 'SYSTEM' },
  actorType: {
    type: String,
    enum: ['CUSTOMER', 'ADMIN', 'SYSTEM', 'COURIER', 'WEBHOOK'],
    default: 'SYSTEM',
  },
  at: { type: Date, default: Date.now },
})

const replacementSchema = new mongoose.Schema(
  {
    replacementNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    items: [replacementItemSchema],
    reason: {
      type: String,
      required: true,
    },
    customerComment: {
      type: String,
      default: '',
    },
    proofUrls: [
      {
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
        'REQUESTED',
        'APPROVED',
        'REJECTED',
        'REVERSE_PICKUP_SCHEDULED',
        'REVERSE_PICKUP_PICKED',
        'REVERSE_IN_TRANSIT',
        'REVERSE_RECEIVED_AT_WAREHOUSE',
        'QC_PENDING',
        'QC_PASSED',
        'QC_FAILED',
        'REPLACEMENT_SHIPPED',
        'REPLACEMENT_OUT_FOR_DELIVERY',
        'REPLACEMENT_DELIVERED',
        'CONVERTED_TO_REFUND',
        'CANCELLED',
      ],
      default: 'REQUESTED',
      index: true,
    },
    reverseWaybill: {
      type: String,
      default: null,
      index: true,
    },
    replacementWaybill: {
      type: String,
      default: null,
      index: true,
    },
    dispatchModeOverride: {
      type: String,
      enum: ['after_pickup', 'parallel', null],
      default: null,
    },
    adminNote: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    qcResult: {
      type: String,
      enum: ['GOOD', 'DAMAGED', 'DEFECTIVE', null],
      default: null,
    },
    qcNote: {
      type: String,
      default: '',
    },
    qcInspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    qcInspectedAt: {
      type: Date,
      default: null,
    },
    timeline: [replacementTimelineSchema],
  },
  {
    timestamps: true,
  }
)

replacementSchema.index({ orderId: 1, createdAt: -1 })
replacementSchema.index({ userId: 1, createdAt: -1 })
replacementSchema.index({ status: 1, createdAt: -1 })

const Replacement = mongoose.model('Replacement', replacementSchema)
export default Replacement
