import mongoose from "mongoose";

// Bid Comment Schema
const bidCommentSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, 'Comment message is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorRole: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true
  },
  attachments: [{
    url: String,
    originalName: String,
    fileType: String,
    fileSize: Number
  }]
}, { timestamps: true });

// Main Bid Schema
const bidSchema = new mongoose.Schema({
  // Basic Information
  bidName: {
    type: String,
    required: [true, 'Bid name is required'],
    trim: true,
    maxlength: [200, 'Bid name cannot exceed 200 characters']
  },
  
  // Buyer Information
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required'],
    index: true
  },
  
  // Removed product field - bids are now general, not product-specific
  
  // Technical Requirements
  technicalRequirements: {
    type: String,
    trim: true,
    maxlength: [5000, 'Technical requirements cannot exceed 5000 characters']
  },
  
  // Technical Requirement Documents
  technicalDocuments: [{
    url: String,
    originalName: String,
    fileType: String,
    fileSize: Number
  }],
  
  // Duration/Validity
  duration: {
    type: String,
    required: [true, 'Duration/Validity is required'],
    trim: true,
    maxlength: [100, 'Duration cannot exceed 100 characters']
  },
  
  // Bid Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Removed budget range - bids no longer include budget information
  
  // Seller Responses (multiple sellers can respond to a bid)
  sellerResponses: [{
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    quotedPrice: {
      type: Number,
      min: 0
    },
    estimatedDelivery: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Response notes cannot exceed 1000 characters']
    },
    attachments: [{
      url: String,
      originalName: String,
      fileType: String,
      fileSize: Number
    }]
  }],
  
  // Comments/Communication
  comments: [bidCommentSchema],
  
  // Important Dates
  submittedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  respondedAt: Date,
  completedAt: Date,
  
  // Additional Metadata
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bidSchema.index({ buyer: 1, status: 1 });
bidSchema.index({ 'sellerResponse.seller': 1, status: 1 });
bidSchema.index({ submittedAt: -1 });
bidSchema.index({ expiresAt: 1 });
bidSchema.index({ category: 1, status: 1 });

// Virtual for checking if bid is expired
bidSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for time remaining
bidSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.expiresAt - now;
  return remaining > 0 ? remaining : 0;
});

// Pre-save middleware to handle expiration
bidSchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

// Instance methods
bidSchema.methods.addComment = function(message, authorId, authorRole, attachments = []) {
  this.comments.push({
    message,
    author: authorId,
    authorRole,
    attachments
  });
  this.updatedBy = authorId;
  return this.save();
};

bidSchema.methods.updateStatus = function(status, sellerId = null, responseData = {}) {
  this.status = status;
  this.respondedAt = new Date();
  
  if (sellerId) {
    this.sellerResponse = {
      seller: sellerId,
      status: status,
      respondedAt: new Date(),
      ...responseData
    };
  }
  
  if (status === 'accepted' || status === 'rejected') {
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Static methods
bidSchema.statics.findByBuyer = function(buyerId, status = null) {
  const query = { buyer: buyerId };
  if (status) query.status = status;
  return this.find(query).populate('buyer sellerResponse.seller product category').sort({ createdAt: -1 });
};

bidSchema.statics.findBySeller = function(sellerId, status = null) {
  const query = { 'sellerResponse.seller': sellerId };
  if (status) query.status = status;
  return this.find(query).populate('buyer sellerResponse.seller product category').sort({ createdAt: -1 });
};

bidSchema.statics.findPendingBids = function() {
  return this.find({ 
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('buyer product category').sort({ createdAt: -1 });
};

// Clear any existing model to avoid schema conflicts
if (mongoose.models.Bid) {
  delete mongoose.models.Bid;
}

const Bid = mongoose.model("Bid", bidSchema);
module.exports = Bid;
