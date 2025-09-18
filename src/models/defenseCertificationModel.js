import mongoose from 'mongoose';

const defenseCertificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Quality Certification Providers',
      'Testing & Compliance Labs', 
      'Offset Advisory',
      'Reverse Engineering Partners',
      'R&D and Innovation Partners',
      'ITAR / SCOMET / MoD License Consultants',
      'Inventory Management',
      'Business Development Consultancy'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes
defenseCertificationSchema.index({ name: 1 });
defenseCertificationSchema.index({ slug: 1 });
defenseCertificationSchema.index({ category: 1 });
defenseCertificationSchema.index({ isActive: 1 });

const DefenseCertification = mongoose.models.DefenseCertification || mongoose.model('DefenseCertification', defenseCertificationSchema, 'defensecertifications');
export default DefenseCertification;
