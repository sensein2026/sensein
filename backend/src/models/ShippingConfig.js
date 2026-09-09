import mongoose from 'mongoose'

const shippingConfigSchema = new mongoose.Schema(
  {
    isAutoShipEnabled: {
      type: Boolean,
      default: false,
    },
    defaultCourier: {
      type: String,
      default: 'DELHIVERY_B2C',
    },
    standardShippingFee: {
      type: Number,
      default: 79,
    },
    freeShippingThreshold: {
      type: Number,
      default: 999,
    },
    isFreeShippingEnabled: {
      type: Boolean,
      default: true,
    },
    shippingNote: {
      type: String,
      default: 'Standard shipping ₹79 • Free express delivery on orders above ₹999',
    },
    // Cart Progress Bar Mode: 'simple' (1-tier Free Shipping only) vs 'tiered' (3-Tier Gamified Milestones)
    cartProgressMode: {
      type: String,
      enum: ['simple', 'tiered'],
      default: 'tiered',
    },
    // Toggle for Gifts & Freebie Promotion Settings
    isGiftPromoEnabled: {
      type: Boolean,
      default: true,
    },
    giftMinSpend: {
      type: Number,
      default: 2999,
    },
    giftItemName: {
      type: String,
      default: 'Sensein Luxury Botanical Mini Elixir (30ml)',
    },
    giftBadge: {
      type: String,
      default: 'FREE GIFT',
    },
    giftNote: {
      type: String,
      default: 'Complimentary luxury haircare gift included on all orders above ₹2999',
    },

    // 3-Tier Gamified Milestones (Cart Progress Bar)
    tier1Enabled: {
      type: Boolean,
      default: true,
    },
    tier1Threshold: {
      type: Number,
      default: 999,
    },
    tier1Title: {
      type: String,
      default: 'Free Delivery',
    },

    tier2Enabled: {
      type: Boolean,
      default: true,
    },
    tier2Threshold: {
      type: Number,
      default: 1999,
    },
    tier2Title: {
      type: String,
      default: 'Special Coupon',
    },
    tier2CouponCode: {
      type: String,
      default: 'EXTRA10',
    },
    tier2DiscountText: {
      type: String,
      default: '10% Instant Off',
    },

    tier3Enabled: {
      type: Boolean,
      default: true,
    },
    tier3Threshold: {
      type: Number,
      default: 2999,
    },
    tier3Title: {
      type: String,
      default: 'Special Gift Free',
    },
    tier3ItemName: {
      type: String,
      default: 'Sensein Luxury Botanical Mini Elixir (30ml)',
    },
    tier3ProductLink: {
      type: String,
      default: '/shop',
    },
    tier3Badge: {
      type: String,
      default: 'FREE GIFT',
    },
    tier3Note: {
      type: String,
      default: 'Complimentary luxury gift included on all orders above ₹2999',
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('ShippingConfig', shippingConfigSchema)
