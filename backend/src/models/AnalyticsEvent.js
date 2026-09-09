import mongoose from 'mongoose'

const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ['page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase', 'custom'],
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    page: {
      type: String,
      default: '/',
    },
    pageTitle: {
      type: String,
      default: '',
    },
    referrer: {
      type: String,
      default: 'direct',
    },
    trafficSource: {
      type: String,
      enum: ['direct', 'instagram', 'facebook', 'google', 'whatsapp', 'youtube', 'referral', 'other'],
      default: 'direct',
      index: true,
    },
    utmSource: {
      type: String,
      default: '',
    },
    utmMedium: {
      type: String,
      default: '',
    },
    utmCampaign: {
      type: String,
      default: '',
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet'],
      default: 'mobile',
      index: true,
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    os: {
      type: String,
      default: 'Unknown',
    },
    city: {
      type: String,
      default: 'Gujarat',
      index: true,
    },
    state: {
      type: String,
      default: 'Gujarat',
    },
    country: {
      type: String,
      default: 'India',
    },
    ip: {
      type: String,
      default: '',
    },
    metadata: {
      productId: String,
      productName: String,
      price: Number,
      category: String,
      orderId: String,
      orderAmount: Number,
      itemsCount: Number,
      quantity: Number,
    },
  },
  {
    timestamps: true,
  }
)

analyticsEventSchema.index({ createdAt: -1 })
analyticsEventSchema.index({ eventType: 1, createdAt: -1 })

export default mongoose.model('AnalyticsEvent', analyticsEventSchema)
