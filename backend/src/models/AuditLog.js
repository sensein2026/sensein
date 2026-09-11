import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      type: String,
      default: 'system',
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetType: {
      type: String,
      default: 'SYSTEM',
      index: true,
    },
    targetId: {
      type: String,
      default: '',
      index: true,
    },
    reason: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Backward-compatibility aliases
    entityType: { type: String },
    entityId: { type: String },
    title: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performerEmail: { type: String },
    isRecoverable: { type: Boolean, default: false },
    snapshotData: { type: mongoose.Schema.Types.Mixed, default: null },
    recoveredAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
)

auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 })
auditLogSchema.index({ actor: 1, createdAt: -1 })
auditLogSchema.index({ createdAt: -1 })

// Pre-validate sync (runs before schema validation)
auditLogSchema.pre('validate', function (next) {
  if (!this.targetType && this.entityType) this.targetType = this.entityType
  if (!this.targetType) this.targetType = 'SYSTEM'
  if (this.targetType && !this.entityType) this.entityType = this.targetType
  if (this.targetId && !this.entityId) this.entityId = this.targetId
  if (!this.targetId && this.entityId) this.targetId = this.entityId
  if (this.actor && !this.performerEmail) this.performerEmail = this.actor
  if (!this.actor && this.performerEmail) this.actor = this.performerEmail
  if (this.metadata && !this.details) this.details = this.metadata
  if (!this.metadata && this.details) this.metadata = this.details
  if (!this.title) this.title = `${this.action} on ${this.targetType || 'Entity'} ${this.targetId || ''}`.trim()
  next()
})

const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export default AuditLog
