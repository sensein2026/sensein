import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Coupon title is required'],
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount value must be greater than 0'],
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    minSpend: {
      type: Number,
      default: 0,
      min: [0, 'Minimum spend cannot be negative'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    badge: {
      type: String,
      default: 'OFFER',
      trim: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    aliases: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Ensure code is stored in uppercase
couponSchema.pre('save', function (next) {
  if (this.code) {
    this.code = this.code.trim().toUpperCase()
  }
  if (this.aliases && Array.isArray(this.aliases)) {
    this.aliases = this.aliases.map((a) => a.trim().toUpperCase())
  }
  next()
})

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema)

export default Coupon
