import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  code: { type: String, required: true },
  purpose: { type: String, enum: ['verify_email', 'reset_password', 'other'], default: 'verify_email' },
  attempts: { type: Number, default: 0 },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });

// TTL index: document will be removed when expiresAt is reached
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Clear any existing model to avoid conflicts in dev/hot-reload
if (mongoose.models.Otp) delete mongoose.models.Otp;

// Instance method to compare provided OTP with stored code
otpSchema.methods.compareOTP = async function(candidateOTP) {
  // If stored code looks like a bcrypt hash, use bcrypt.compare
  const stored = this.code || '';
  if (typeof stored === 'string' && stored.startsWith('$2')) {
    // lazy import bcrypt to avoid bundling it in frontend builds
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(candidateOTP, stored);
  }
  return stored === candidateOTP;
};

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
