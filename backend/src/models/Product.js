import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      default: '',
    },
    mainImage: {
      type: String,
      required: true,
    },
    gallery: [{ type: String }],
    stock: {
      type: Number,
      required: true,
      default: 10,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewsCount: {
      type: Number,
      default: 12,
    },
    ingredients: {
      type: String,
      default: '',
    },
    howToUse: {
      type: String,
      default: '',
    },
    weight: {
      type: Number,
      default: 250, // Weight in grams (e.g. 250g)
    },
    dimensions: {
      length: { type: Number, default: 15 }, // in cm
      breadth: { type: Number, default: 10 }, // in cm
      height: { type: Number, default: 8 }, // in cm
    },
    sku: {
      type: String,
      default: '',
    },
    hsnCode: {
      type: String,
      default: '3305',
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
)

productSchema.virtual('availableStock').get(function () {
  return Math.max(0, (this.stock || 0) - (this.reservedStock || 0))
})

export default mongoose.model('Product', productSchema)
