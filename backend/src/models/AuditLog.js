import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['UPLOAD', 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'RESET', 'EXPORT'],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['MediaAsset', 'HomepageConfig', 'Product', 'Order', 'Category', 'User', 'System', 'BulkOrder', 'BulkOrderConfig'],
    },
    entityId: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    performerEmail: {
      type: String,
      default: 'admin@sensein.com',
    },
    isRecoverable: {
      type: Boolean,
      default: false,
    },
    snapshotData: {
      type: mongoose.Schema.Types.Mixed,
      default: null, // Stores serialized item backup for 1-click recovery!
    },
    recoveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

auditLogSchema.index({ entityType: 1, action: 1, createdAt: -1 })

const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export default AuditLog
