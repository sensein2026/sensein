import mongoose from 'mongoose'

const orderItemSnapshotSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  productName: { type: String, default: '' },
  name: { type: String, default: '' }, // compat
  variantId: { type: String, default: null },
  variantName: { type: String, default: '' },
  sku: { type: String, default: '' },
  image: { type: String, default: '' },
  qty: { type: Number, default: 1, min: 1 },
  quantity: { type: Number, default: 1, min: 1 }, // compat
  unitPrice: { type: Number, default: 0 },
  price: { type: Number, default: 0 }, // compat
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },
  weight: { type: Number, default: 250 }, // in grams
  length: { type: Number, default: 15 }, // in cm
  breadth: { type: Number, default: 10 },
  height: { type: Number, default: 8 },
})

const orderAddressSnapshotSchema = new mongoose.Schema({
  fullName: { type: String, default: 'Customer' },
  phone: { type: String, default: '' },
  addressLine1: { type: String, default: '' },
  addressLine2: { type: String, default: '' },
  addressLine: { type: String, default: '' }, // compat
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  postalCode: { type: String, default: '' }, // compat
  country: { type: String, default: 'India' },
})

const timelineEventSchema = new mongoose.Schema({
  status: { type: String, default: 'UPDATED' },
  newStatus: { type: String }, // compat
  previousStatus: { type: String }, // compat
  note: { type: String, default: '' },
  location: { type: String, default: '' },
  source: {
    type: String,
    default: 'SYSTEM',
  },
  actor: { type: String, default: 'SYSTEM' },
  actorType: {
    type: String,
    default: 'SYSTEM',
  },
  reason: { type: String, default: '' },
  externalEventId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  at: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now }, // compat
})

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customerName: { type: String, default: 'Customer' },
    customerEmail: { type: String, default: 'customer@sensein.com', index: true },
    customerPhone: { type: String, default: '9265259954', index: true },

    // Immutable address snapshot
    shippingAddress: {
      type: orderAddressSnapshotSchema,
      default: () => ({}),
    },
    billingAddress: {
      type: orderAddressSnapshotSchema,
      default: () => ({}),
    },

    // Immutable item price snapshots
    items: [orderItemSnapshotSchema],

    // Primary Order Status State Machine
    orderStatus: {
      type: String,
      default: 'PLACED',
      index: true,
    },

    // Physical fulfillment status (mirrors logistics)
    fulfillmentStatus: {
      type: String,
      default: 'NEW',
      index: true,
    },

    paymentMethod: {
      type: String,
      default: 'RAZORPAY',
    },

    paymentStatus: {
      type: String,
      default: 'PENDING',
      index: true,
    },

    collectionStatus: {
      type: String,
      default: 'NOT_APPLICABLE',
      index: true,
    },
    codCollectionStatus: { type: String, default: 'NOT_APPLICABLE' }, // compat
    codAmount: { type: Number, default: 0 },
    codCollectedAt: { type: Date },
    codRemittedAt: { type: Date },
    codCollectionReference: { type: String },

    // Financial Breakdown Snapshot
    amountBreakdown: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      shippingCharge: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      refundableAmount: { type: Number, default: 0 },
      refundedAmount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },

    // Compat financial fields
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    // Logistics & Courier Tracking
    waybill: { type: String, index: true },
    trackingNumber: { type: String, index: true },
    courierPartner: { type: String, default: 'Delhivery Express' },
    estimatedDeliveryDate: { type: Date },
    deliveredAt: { type: Date },

    delhivery: {
      waybill: { type: String },
      shipmentId: { type: String },
      sortCode: { type: String },
      courierName: { type: String, default: 'Delhivery Surface & Express B2C' },
      trackingUrl: { type: String },
      labelUrl: { type: String },
      status: { type: String },
      assignmentStatus: { type: String },
      statusMessage: { type: String },
      isTestMode: { type: Boolean, default: true },
      rawResponse: { type: mongoose.Schema.Types.Mixed },
    },

    // Razorpay Online Details
    paymentDetails: {
      gateway: { type: String, default: 'Razorpay' },
      razorpayOrderId: { type: String, sparse: true, index: true },
      razorpayPaymentId: { type: String, sparse: true, index: true },
      razorpaySignature: { type: String },
      transactionId: { type: String },
      paidAt: { type: Date },
    },

    // Cancellation tracking
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    cancellationReason: { type: String },

    // Refund tracking
    refundStatus: {
      type: String,
      default: 'NONE',
      index: true,
    },
    refundInitiatedAt: { type: Date },
    refundCompletedAt: { type: Date },
    refundDetails: {
      razorpayRefundId: { type: String },
      refundAmount: { type: Number },
      refundedAt: { type: Date },
      refundReason: { type: String },
      status: { type: String, default: 'NONE' },
      failureReason: { type: String },
    },

    // Restock tracking
    restockedAt: { type: Date },
    restockedBy: { type: String },
    restockStatus: {
      type: String,
      default: 'NONE',
    },

    timeline: [timelineEventSchema],
    trackingHistory: [
      {
        status: { type: String },
        title: { type: String },
        location: { type: String },
        timestamp: { type: Date, default: Date.now },
        description: { type: String },
      },
    ],

    // Legacy return & replacement links
    returnStatus: { type: String, default: 'NONE' },
    replacementStatus: { type: String, default: 'NONE' },
    rtoStatus: { type: String, default: 'NONE' },
    activeShipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    shipments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
    returnRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ReturnRequest' }],
    replacements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Replacement' }],
  },
  {
    timestamps: true,
  }
)

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ orderStatus: 1, createdAt: -1 })
orderSchema.index({ paymentStatus: 1, createdAt: -1 })

// Pre-validate hook to seamlessly auto-populate missing fields on legacy documents
orderSchema.pre('validate', function (next) {
  // 1. Sync amountBreakdown
  if (!this.amountBreakdown) {
    this.amountBreakdown = {}
  }
  const total = Number(this.totalAmount || this.amountBreakdown?.totalAmount || this.subtotal || 0)
  const sub = Number(this.subtotal || this.amountBreakdown?.subtotal || total)
  const ship = Number(this.shippingFee || this.amountBreakdown?.shippingCharge || 0)

  if (this.amountBreakdown.totalAmount === undefined || this.amountBreakdown.totalAmount === 0) {
    this.amountBreakdown.totalAmount = total
  }
  if (this.amountBreakdown.subtotal === undefined || this.amountBreakdown.subtotal === 0) {
    this.amountBreakdown.subtotal = sub
  }
  if (this.amountBreakdown.shippingCharge === undefined) {
    this.amountBreakdown.shippingCharge = ship
  }
  if (this.totalAmount === undefined || this.totalAmount === 0) {
    this.totalAmount = total
  }
  if (this.subtotal === undefined || this.subtotal === 0) {
    this.subtotal = sub
  }

  // 2. Sync items
  if (Array.isArray(this.items)) {
    for (const item of this.items) {
      if (!item.productName && item.name) item.productName = item.name
      if (!item.name && item.productName) item.name = item.productName
      if (!item.qty && item.quantity) item.qty = item.quantity
      if (!item.quantity && item.qty) item.quantity = item.qty
      if (item.unitPrice === undefined && item.price !== undefined) item.unitPrice = item.price
      if (item.price === undefined && item.unitPrice !== undefined) item.price = item.unitPrice
      if (item.finalPrice === undefined || item.finalPrice === 0) {
        item.finalPrice = (item.unitPrice || item.price || 0) * (item.qty || item.quantity || 1)
      }
    }
  }

  // 3. Sync timeline
  if (Array.isArray(this.timeline)) {
    for (const event of this.timeline) {
      if (!event.status) {
        event.status = event.newStatus || event.previousStatus || 'UPDATED'
      }
      if (!event.source) {
        event.source = 'SYSTEM'
      }
    }
  }

  // 4. Sync addresses
  if (this.shippingAddress) {
    if (!this.shippingAddress.fullName && this.customerName) {
      this.shippingAddress.fullName = this.customerName
    }
    if (!this.shippingAddress.phone && this.customerPhone) {
      this.shippingAddress.phone = this.customerPhone
    }
  }

  if (this.billingAddress) {
    if (!this.billingAddress.fullName) {
      this.billingAddress.fullName = this.shippingAddress?.fullName || this.customerName || 'Customer'
    }
    if (!this.billingAddress.phone) {
      this.billingAddress.phone = this.shippingAddress?.phone || this.customerPhone || '9265259954'
    }
  }

  if (this.collectionStatus && this.codCollectionStatus !== this.collectionStatus) {
    this.codCollectionStatus = this.collectionStatus
  }

  next()
})

const Order = mongoose.model('Order', orderSchema)
export default Order
