import mongoose from 'mongoose'

const bulkInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    organizationName: { type: String, trim: true, default: '' },
    quantity: { type: String, required: true },
    state: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    product: { type: String, required: true },
    remarks: { type: String, trim: true, default: '' },
    purpose: {
      type: String,
      required: true,
      default: 'Corporate Gifting',
    },
    expectedDeliveryDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'quoted', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

export default mongoose.model('BulkInquiry', bulkInquirySchema)
