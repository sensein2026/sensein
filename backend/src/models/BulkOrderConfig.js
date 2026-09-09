import mongoose from 'mongoose'

const DEFAULT_QUANTITIES = [
  '25 - 50 Units',
  '50 - 100 Units',
  '100 - 250 Units',
  '250 - 500 Units',
  '500 - 1000 Units',
  '1000+ Units',
]

const bulkOrderConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'bulk_order_settings', unique: true },
    quantities: {
      type: [String],
      default: DEFAULT_QUANTITIES,
    },
  },
  { timestamps: true }
)

export default mongoose.model('BulkOrderConfig', bulkOrderConfigSchema)
export { DEFAULT_QUANTITIES }
