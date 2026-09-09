import mongoose from 'mongoose'

const trackingConfigSchema = new mongoose.Schema(
  {
    googleAnalyticsId: {
      type: String,
      default: '',
      trim: true,
    },
    isGoogleAnalyticsEnabled: {
      type: Boolean,
      default: true,
    },
    clarityId: {
      type: String,
      default: '',
      trim: true,
    },
    isClarityEnabled: {
      type: Boolean,
      default: true,
    },
    metaPixelId: {
      type: String,
      default: '',
      trim: true,
    },
    isMetaPixelEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('TrackingConfig', trackingConfigSchema)
