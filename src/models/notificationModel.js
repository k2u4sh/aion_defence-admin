import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // System notifications have no sender
  },
  type: {
    type: String,
    enum: [
      'order_placed',
      'order_confirmed',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'payment_received',
      'payment_failed',
      'product_low_stock',
      'product_out_of_stock',
      'new_message',
      'seller_verification',
      'product_approved',
      'product_rejected',
      'account_verification',
      'security_alert',
      'promotion',
      'system_maintenance'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Additional data (order ID, product ID, etc.)
    default: {}
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  channels: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    inApp: {
      shown: { type: Boolean, default: false },
      shownAt: Date
    }
  },
  readAt: Date,
  expiresAt: Date, // For temporary notifications
  actionUrl: String, // URL to redirect when notification is clicked
  imageUrl: String // Optional image for rich notifications
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
notificationSchema.index({ priority: 1, status: 1 });

// Mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Mark notification as archived
notificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static method to create and send notification
notificationSchema.statics.createAndSend = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  
  // Queue for sending via different channels
  await this.sendViaChannels(notification);
  
  return notification;
};

// Static method to send via multiple channels
notificationSchema.statics.sendViaChannels = async function(notification) {
  const User = mongoose.model('User');
  const user = await User.findById(notification.recipient);
  
  if (!user) return;

  // Send email if user preferences allow
  if (user.preferences?.notifications?.email && notification.priority !== 'low') {
    try {
      // Import mailer dynamically to avoid circular imports
      const { sendEmail } = await import('../utils/mailer');
      await sendEmail({
        email: user.email,
        subject: notification.title,
        message: notification.message
      });
      
      notification.channels.email.sent = true;
      notification.channels.email.sentAt = new Date();
    } catch (error) {
      notification.channels.email.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  // Send SMS for urgent notifications (if SMS service is configured)
  if (user.preferences?.notifications?.sms && notification.priority === 'urgent') {
    try {
      // Add SMS service integration here
      // await sendSMS(user.mobile, notification.message);
      notification.channels.sms.sent = true;
      notification.channels.sms.sentAt = new Date();
    } catch (error) {
      notification.channels.sms.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  await notification.save();
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    status: 'unread'
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, status: 'unread' },
    { 
      status: 'read', 
      readAt: new Date() 
    }
  );
};

// Static method to clean old notifications
notificationSchema.statics.cleanOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    status: 'archived',
    createdAt: { $lt: cutoffDate }
  });
};

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return this.createdAt.toLocaleDateString();
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
