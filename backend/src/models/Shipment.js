import mongoose from 'mongoose'

const shipmentSchema = new mongoose.Schema(
  {
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
    shipmentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shipmentType: {
      type: String,
      enum: ['FORWARD', 'REPLACEMENT', 'RETURN', 'RTO', 'ADDRESS_CHANGE'],
      default: 'FORWARD',
    },
    provider: {
      type: String,
      default: 'DELHIVERY',
    },
    courier: {
      type: String,
      default: 'Delhivery Surface & Express B2C',
    },
    waybill: {
      type: String,
      index: true,
    },
    shipmentId: {
      type: String,
    },
    labelUrl: {
      type: String,
    },
    trackingUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        'MANIFESTED',
        'SHIPMENT_CREATED',
        'LABEL_GENERATED',
        'READY_FOR_PICKUP',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RTO_REQUESTED',
        'RTO_IN_TRANSIT',
        'RTO_DELIVERED',
        'FAILED',
      ],
      default: 'SHIPMENT_CREATED',
      index: true,
    },
    pickupStatus: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'PICKED_UP', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    parentShipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      default: null,
    },
    origin: {
      name: { type: String, default: 'Sensein Central Logistics Hub' },
      addressLine: { type: String, default: '104, Vijaynagar 2, Yogichowk' },
      city: { type: String, default: 'Surat' },
      state: { type: String, default: 'Gujarat' },
      postalCode: { type: String, default: '395010' },
      phone: { type: String, default: '7984919956' },
    },
    destination: {
      fullName: { type: String },
      phone: { type: String },
      addressLine: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'India' },
    },
    packageDetails: {
      weight: { type: Number, default: 0.25 }, // in kg
      length: { type: Number, default: 15 }, // in cm
      breadth: { type: Number, default: 10 },
      height: { type: Number, default: 8 },
      chargedWeight: { type: Number, default: 0.25 },
    },
    itemsSnapshot: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String },
        sku: { type: String },
        quantity: { type: Number, default: 1 },
        price: { type: Number },
      },
    ],
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    rtoDetails: {
      initiatedAt: { type: Date },
      reason: { type: String },
      receivedAt: { type: Date },
    },
    rawCourierResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    webhookEvents: [
      {
        receivedAt: { type: Date, default: Date.now },
        event: { type: String },
        status: { type: String },
        location: { type: String },
        description: { type: String },
        raw: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  { timestamps: true }
)

shipmentSchema.index({ order: 1, isActive: 1 })
shipmentSchema.index({ waybill: 1, provider: 1 })

export default mongoose.model('Shipment', shipmentSchema)
