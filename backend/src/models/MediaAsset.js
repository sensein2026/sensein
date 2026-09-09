import mongoose from 'mongoose'

const mediaAssetSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0, // In bytes
    },
    category: {
      type: String,
      default: 'general', // 'hero', 'product', 'concern', 'reels', 'reviews', 'before_after', 'instagram', 'general'
    },
    status: {
      type: String,
      enum: ['active', 'in_use', 'trash'],
      default: 'active',
    },
    usageLocation: {
      type: String,
      default: '', // e.g. "Hero Slide #1", "Damage Repair Shampoo"
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploaderName: {
      type: String,
      default: 'Administrator',
    },
  },
  {
    timestamps: true,
  }
)

// Indexing for faster searching and status filtering
mediaAssetSchema.index({ status: 1, isDeleted: 1, createdAt: -1 })

const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema)
export default MediaAsset
