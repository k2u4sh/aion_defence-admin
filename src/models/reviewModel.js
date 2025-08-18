import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  // Review Target
  targetType: {
    type: String,
    enum: ['product', 'seller'],
    required: true,
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    refPath: 'targetType === "product" ? "Product" : "User"'
  },
  
  // Review Details
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true // Reviews must be linked to actual purchases
  },
  
  // Rating & Content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Media
  images: [{
    url: String,
    alt: String,
    order: { type: Number, default: 0 }
  }],
  videos: [{
    url: String,
    thumbnail: String,
    duration: Number // in seconds
  }],
  
  // Review Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reported'],
    default: 'pending',
    index: true
  },
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: true // Since reviews require order link
  },
  
  // Helpful votes
  helpfulVotes: {
    count: { type: Number, default: 0 },
    voters: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      helpful: Boolean, // true for helpful, false for not helpful
      votedAt: { type: Date, default: Date.now }
    }]
  },
  
  // Seller Response (for product reviews)
  sellerResponse: {
    content: String,
    respondedAt: Date,
    responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Moderation
  moderationNotes: String,
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: Date,
  
  // Flags & Reports
  reportCount: { type: Number, default: 0 },
  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'irrelevant', 'other']
    },
    description: String,
    reportedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better performance
reviewSchema.index({ targetType: 1, targetId: 1, status: 1 });
reviewSchema.index({ reviewer: 1, targetType: 1, targetId: 1 }, { unique: true }); // One review per user per target
reviewSchema.index({ rating: 1, status: 1 });
reviewSchema.index({ createdAt: -1, status: 1 });

// Virtual for reviewer info
reviewSchema.virtual('reviewerInfo', {
  ref: 'User',
  localField: 'reviewer',
  foreignField: '_id',
  justOne: true
});

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = function(userId, isHelpful) {
  // Remove existing vote if any
  this.helpfulVotes.voters = this.helpfulVotes.voters.filter(
    (vote) => vote.user.toString() !== userId
  );
  
  // Add new vote
  this.helpfulVotes.voters.push({
    user: userId,
    helpful: isHelpful,
    votedAt: new Date()
  });
  
  // Update count
  this.helpfulVotes.count = this.helpfulVotes.voters.filter(
    (vote) => vote.helpful
  ).length;
  
  return this.save();
};

// Instance method to add seller response
reviewSchema.methods.addSellerResponse = function(sellerId, content) {
  this.sellerResponse = {
    content,
    respondedAt: new Date(),
    responder: sellerId
  };
  return this.save();
};

// Instance method to report review
reviewSchema.methods.reportReview = function(reporterId, reason, description) {
  this.reports.push({
    reporter: reporterId,
    reason,
    description,
    reportedAt: new Date()
  });
  this.reportCount = this.reports.length;
  return this.save();
};

// Static method to get average rating for target
reviewSchema.statics.getAverageRating = function(targetType, targetId) {
  return this.aggregate([
    {
      $match: {
        targetType,
        targetId,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $addFields: {
        ratingDistribution: {
          5: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 5] }
              }
            }
          },
          4: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 4] }
              }
            }
          },
          3: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 3] }
              }
            }
          },
          2: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 2] }
              }
            }
          },
          1: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 1] }
              }
            }
          }
        }
      }
    }
  ]);
};

// Static method to check if user can review
reviewSchema.statics.canUserReview = async function(userId, targetType, targetId) {
  // Check if user has already reviewed
  const existingReview = await this.findOne({
    reviewer: userId,
    targetType,
    targetId
  });
  
  if (existingReview) {
    return { canReview: false, reason: 'Already reviewed' };
  }
  
  // Check if user has purchased the product
  const Order = mongoose.model('Order');
  const hasOrder = await Order.findOne({
    buyer: userId,
    'items.product': targetId,
    status: { $in: ['delivered', 'shipped'] }
  });
  
  if (!hasOrder) {
    return { canReview: false, reason: 'Must purchase to review' };
  }
  
  return { canReview: true };
};

// Static method to get review statistics
reviewSchema.statics.getReviewStats = function(targetType, targetId) {
  return this.aggregate([
    {
      $match: {
        targetType,
        targetId,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    }
  ]);
};

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export default Review;
