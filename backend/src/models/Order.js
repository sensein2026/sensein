import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
})

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    shippingAddress: {
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    items: [orderItemSchema],
    paymentMethod: {
      type: String,
      enum: ['COD', 'CARD', 'ONLINE', 'RAZORPAY', 'UPI', 'NETBANKING', 'QR', 'WALLET'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: [
        'PENDING',
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'PAYMENT_FAILED',
        'CANCELLED',
        'RETURNED',
        'RTO',
      ],
      default: 'PENDING',
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
    trackingNumber: { type: String },
    courierPartner: { type: String, default: 'Delhivery Express' },
    estimatedDeliveryDate: { type: Date },

    // NimbusPost Logistics API Details
    nimbuspost: {
      nimbusOrderId: { type: String },
      shipmentId: { type: String },
      courierName: { type: String },
      awbNumber: { type: String },
      trackingUrl: { type: String },
      labelUrl: { type: String },
      status: { type: String },
    },

    // Delhivery B2C / MCP Dedicated Delivery Details
    delhivery: {
      waybill: { type: String },
      shipmentId: { type: String },
      sortCode: { type: String },
      courierName: { type: String, default: 'Delhivery Surface & Express B2C' },
      trackingUrl: { type: String },
      labelUrl: { type: String },
      status: { type: String },
      assignmentStatus: { type: String }, // ASSIGNED, PENDING, CANCELLED
      statusMessage: { type: String },
      isTestMode: { type: Boolean, default: true },
      rawResponse: { type: mongoose.Schema.Types.Mixed },
    },

    // Ekart Logistics (Flipkart Group) Dedicated B2C Delivery Details (OpenAPI 3.1.0)
    ekart: {
      ekartOrderId: { type: String },
      shipmentId: { type: String },
      awbNumber: { type: String },
      courierName: { type: String, default: 'Ekart Logistics Express' },
      trackingUrl: { type: String },
      labelUrl: { type: String },
      status: { type: String },
      assignmentStatus: { type: String },
      statusMessage: { type: String },
      barcodes: { type: mongoose.Schema.Types.Mixed },
      isTestMode: { type: Boolean, default: true },
      rawResponse: { type: mongoose.Schema.Types.Mixed },
    },

    // Package Details (Dead wt, volumetric wt, dimensions)
    packageDetails: {
      deadWeight: { type: Number, default: 0.05 }, // in kg
      volumetricWeight: { type: Number, default: 0.20 }, // in kg
      length: { type: Number, default: 10 }, // in cm
      breadth: { type: Number, default: 10 },
      height: { type: Number, default: 10 },
      chargedWeight: { type: Number, default: 0.20 }, // in kg
    },

    estimatedDeliveryDays: { type: String, default: '2-3 Business Days' },
    rawDelhiveryData: { type: mongoose.Schema.Types.Mixed },

    // Shiprocket API Details (Compatibility fallback)
    shiprocket: {
      shiprocketOrderId: { type: String },
      shipmentId: { type: String },
      courierCompanyId: { type: Number },
      courierName: { type: String },
      awbCode: { type: String },
      rtoStatus: { type: String },
      returnOrderId: { type: String },
      returnShipmentId: { type: String },
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
      status: { type: String, default: 'NONE' }, // NONE, PROCESSED, FAILED
    },

    trackingHistory: [
      {
        status: { type: String },
        title: { type: String },
        location: { type: String },
        timestamp: { type: Date, default: Date.now },
        description: { type: String },
      },
    ],
    // Address edit tracking (powers admin "Edited Address" side panel)
    addressUpdatedAt: { type: Date },
    addressEditHistory: [
      {
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: String, default: 'Customer' },
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

export default mongoose.model('Order', orderSchema)

