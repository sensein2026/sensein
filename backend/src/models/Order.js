import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  sku: { type: String, default: '' },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  weight: { type: Number, default: 250 }, // in grams
  length: { type: Number, default: 15 }, // in cm
  breadth: { type: Number, default: 10 },
  height: { type: Number, default: 8 },
})

const timelineEventSchema = new mongoose.Schema({
  orderId: { type: String },
  previousStatus: { type: String },
  newStatus: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actor: { type: String, default: 'SYSTEM' },
  actorType: {
    type: String,
    enum: ['CUSTOMER', 'ADMIN', 'SYSTEM', 'COURIER', 'WEBHOOK'],
    default: 'SYSTEM',
  },
  reason: { type: String, default: '' },
  source: { type: String, default: 'API' },
  externalEventId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
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
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, index: true },
    customerPhone: { type: String, required: true, index: true },
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    billingAddress: {
      fullName: { type: String },
      phone: { type: String },
      addressLine: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'India' },
    },
    items: [orderItemSchema],

    // Primary High-level Order State
    orderStatus: {
      type: String,
      enum: [
        'ACTIVE',
        'CANCELLED',
        'COMPLETED',
        'RTO',
        'RETURN',
        'REPLACEMENT',
        // Backward-compatibility legacy states
        'PENDING',
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'PAYMENT_FAILED',
        'RETURNED',
      ],
      default: 'ACTIVE',
      index: true,
    },

    // Granular Physical Fulfillment State
    fulfillmentStatus: {
      type: String,
      enum: [
        'NEW',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'SHIPMENT_CREATED',
        'LABEL_GENERATED',
        'READY_FOR_PICKUP',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'NEW',
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ['COD', 'CARD', 'ONLINE', 'RAZORPAY', 'UPI', 'NETBANKING', 'QR', 'WALLET'],
      default: 'COD',
    },

    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUND_PROCESSING', 'REFUNDED', 'NOT_REQUIRED'],
      default: 'PENDING',
      index: true,
    },

    codCollectionStatus: {
      type: String,
      enum: ['NOT_APPLICABLE', 'PENDING', 'COLLECTED', 'REMITTED', 'FAILED'],
      default: 'NOT_APPLICABLE',
      index: true,
    },
    codAmount: { type: Number, default: 0 },
    codCollectedAt: { type: Date },
    codCollectionReference: { type: String },

    returnStatus: {
      type: String,
      enum: [
        'NONE',
        'REQUESTED',
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
      ],
      default: 'NONE',
      index: true,
    },

    replacementStatus: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'APPROVED', 'CREATED', 'SHIPPED', 'DELIVERED', 'COMPLETED'],
      default: 'NONE',
      index: true,
    },

    rtoStatus: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'IN_TRANSIT', 'DELIVERED', 'RECEIVED'],
      default: 'NONE',
      index: true,
    },

    refundStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'NONE',
      index: true,
    },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    shippingMethod: {
      type: String,
      enum: ['STANDARD', 'EXPRESS', 'PRIORITY'],
      default: 'STANDARD',
    },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    activeShipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
    },
    shipments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
      },
    ],
    returnRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReturnRequest',
      },
    ],

    originalOrderId: { type: String },
    replacementOrderId: { type: String },
    returnRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReturnRequest',
    },

    trackingNumber: { type: String, index: true },
    courierPartner: { type: String, default: 'Delhivery Express' },
    estimatedDeliveryDate: { type: Date },
    estimatedDeliveryDays: { type: String, default: '2-3 Business Days' },

    // Delhivery B2C Courier Details
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

    // Package Details
    packageDetails: {
      deadWeight: { type: Number, default: 0.25 }, // in kg
      volumetricWeight: { type: Number, default: 0.25 },
      length: { type: Number, default: 15 }, // in cm
      breadth: { type: Number, default: 10 },
      height: { type: Number, default: 8 },
      chargedWeight: { type: Number, default: 0.25 },
    },

    // Razorpay Online Payment & Refund Details
    paymentDetails: {
      gateway: { type: String, default: 'Razorpay' },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      transactionId: { type: String },
      upiId: { type: String },
      cardLast4: { type: String },
      paidAt: { type: Date },
    },

    refundDetails: {
      razorpayRefundId: { type: String },
      refundAmount: { type: Number },
      refundedAt: { type: Date },
      refundReason: { type: String },
      status: { type: String, default: 'NONE' },
      failureReason: { type: String },
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

    addressUpdatedAt: { type: Date },
    addressEditHistory: [
      {
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: String, default: 'Customer' },
        reason: { type: String, default: 'Customer correction' },
        previous: {
          fullName: { type: String },
          phone: { type: String },
          addressLine: { type: String },
          city: { type: String },
          state: { type: String },
          postalCode: { type: String },
        },
        updated: {
          fullName: { type: String },
          phone: { type: String },
          addressLine: { type: String },
          city: { type: String },
          state: { type: String },
          postalCode: { type: String },
        },
      },
    ],

    invoiceNumber: { type: String },
    deliveryOtp: { type: String },
    deliveryRider: {
      name: { type: String },
      phone: { type: String },
    },
  },
  { timestamps: true }
)

orderSchema.index({ createdAt: -1 })
orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ orderNumber: 1, paymentStatus: 1, fulfillmentStatus: 1 })

export default mongoose.model('Order', orderSchema)
