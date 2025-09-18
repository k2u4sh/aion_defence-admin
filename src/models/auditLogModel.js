import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  requestId: { type: String, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  level: { type: String, enum: ['info', 'warn', 'error'], default: 'info', index: true },
  environment: { type: String, default: process.env.NODE_ENV || 'development' },

  // Request context
  method: { type: String },
  url: { type: String, index: true },
  route: { type: String },
  status: { type: Number },
  durationMs: { type: Number },

  // Identity
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  roles: [{ type: String, index: true }],
  ip: { type: String },
  userAgent: { type: String },

  // Payloads (redacted)
  query: { type: Object },
  params: { type: Object },
  bodySummary: { type: Object },

  // App specific
  action: { type: String, index: true },
  message: { type: String },
  errorName: { type: String },
  errorMessage: { type: String },
  errorStack: { type: String },
}, { timestamps: false });

auditLogSchema.index({ timestamp: -1, userId: 1 });

// Use existing model if it exists, otherwise create new one
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
