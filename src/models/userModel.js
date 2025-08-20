import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Clear any existing model to avoid schema conflicts (for hot-reload environments)
if (mongoose.models.User) {
  delete mongoose.models.User;
}

/**
 * Utility: pick a subset of keys from an object
 * @param {object} obj
 * @param {string[]} keys
 * @returns {object}
 */
function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      out[k] = obj[k];
    }
  }
  return out;
}

// Address subdocument schema
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    required: [true, "Country is required"],
    trim: true
  },
  zipCode: {
    type: String,
    required: [true, "Zip/Pin code is required"],
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// OTP subdocument schema
const otpSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["registration", "login", "forgotPassword", "emailChange"],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Main user schema
const meetingDetailsSchema = new mongoose.Schema({
  meetingDate: { type: String }, // e.g. '2025-07-15'
  meetingTimeFrom: { type: String }, // e.g. '13:00'
  meetingTimeTo: { type: String }, // e.g. '14:00'
  anyTimeInDay: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Optional meeting details for scheduling a meeting
  meetingDetails: meetingDetailsSchema,

  // Personal Information
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
    minlength: [2, "First name must be at least 2 characters"],
    maxlength: [50, "First name cannot exceed 50 characters"]
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
    minlength: [2, "Last name must be at least 2 characters"],
    maxlength: [50, "Last name cannot exceed 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email address"
    ]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false // Don't include password in queries by default
  },

  // Contact Information
  mobile: {
    type: String,
    required: [true, "Mobile number is required"],
    trim: true,
    match: [/^\+?[\d\s-()]+$/, "Please enter a valid mobile number"]
  },
  alternateEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid alternate email address"
    ]
  },

  // Business Information
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },
  roles: {
    type: [String],
    enum: {
      values: ["buyer", "seller", "partner", "admin"],
      message: "{VALUE} is not a valid role"
    },
    required: [true, "Please select at least one role"],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: "At least one role must be selected"
    }
  },
  companyName: {
    type: String,
    required: [true, "Company/Organization name is required"],
    trim: true,
    maxlength: [100, "Company name cannot exceed 100 characters"]
  },
  companyType: {
    type: String,
    enum: ["individual", "sme", "corporation", "government", "ngo"],
    default: "individual"
  },

  // Seller-specific Information
  sellerProfile: {
    businessLicense: {
      type: String,
      trim: true
    },
    taxId: {
      type: String,
      trim: true
    },
    businessDescription: {
      type: String,
      maxlength: [1000, "Business description cannot exceed 1000 characters"],
      trim: true
    },
    businessAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      routingNumber: String,
      swiftCode: String
    },
    isVerifiedSeller: {
      type: Boolean,
      default: false
    },
    sellerRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    joinedAsSellerAt: {
      type: Date,
      default: Date.now
    }
  },

  // Address Information
  addresses: [addressSchema],

  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },

  // Profile Information
  profilePicture: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"],
    trim: true
  },

  // Security & Authentication
  otp: otpSchema,

  // Password Reset (token is stored hashed; expiry is a Date)
  forgotPasswordToken: {
    type: String,
    select: false
  },
  forgotPasswordTokenExpiry: {
    type: Date,
    select: false
  },

  // Email Verification
  verifyToken: {
    type: String,
    select: false
  },
  verifyTokenExpiry: {
    type: Date,
    select: false
  },

  // Login Tracking
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date
  },

  // Preferences
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      default: "en",
      enum: ["en", "es", "fr", "de"]
    },
    timezone: {
      type: String,
      default: "UTC"
    }
  },

  // Soft Delete
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.forgotPasswordToken;
      delete ret.forgotPasswordTokenExpiry;
      delete ret.verifyToken;
      delete ret.verifyTokenExpiry;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance and lookups
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ mobile: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ isVerified: 1, isActive: 1 });
userSchema.index({ companyName: 1 });
userSchema.index({ deletedAt: 1 });
// IMPORTANT: Do NOT create a TTL index on otp.expiresAt because TTL would delete the entire user document when it expires.
// userSchema.index({ "otp.expiresAt": 1 }, { expireAfterSeconds: 0 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
});

// Virtual for default address
/**
 * Computes the user's default address.
 *
 * - Returns the address with isDefault === true.
 * - Falls back to the first address if none is marked default.
 * - Returns undefined when there are no addresses.
 *
 * @this {{ addresses?: Array<{ isDefault?: boolean }> }}
 * @returns {{ isDefault?: boolean } | undefined}
 */
userSchema
  .virtual('defaultAddress')
  .get(function getDefaultAddress() {
    const addresses = this.addresses;
    if (!Array.isArray(addresses) || addresses.length === 0) return undefined;

    const preferred = addresses.find(addr => addr?.isDefault === true);
    return preferred || addresses[0];
  });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified or new
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre 'findOneAndUpdate' middleware to hash password when updated via query operators
userSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate() || {};
    const hasDirect = Object.prototype.hasOwnProperty.call(update, 'password');
    const hasSet = update.$set && Object.prototype.hasOwnProperty.call(update.$set, 'password');
    const newPassword = hasDirect ? update.password : hasSet ? update.$set.password : undefined;

    if (newPassword) {
      const salt = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(String(newPassword), salt);

      if (hasDirect) update.password = hashed;
      if (hasSet) update.$set.password = hashed;

      this.setUpdate(update);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Pre-save middleware to hash OTP
userSchema.pre('save', async function(next) {
  if (this.otp && this.otp.code && this.isModified('otp.code')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.otp.code = await bcrypt.hash(this.otp.code, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Ensure only one default address per user
userSchema.pre('save', function(next) {
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
    if (defaultAddresses.length > 1) {
      // Set only the first one as default, rest as false
      this.addresses.forEach((addr, index) => {
        addr.isDefault = index === 0;
      });
    } else if (defaultAddresses.length === 0 && this.addresses.length > 0) {
      // If no default, set first as default
      this.addresses[0].isDefault = true;
    }
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to compare OTP
userSchema.methods.compareOTP = async function(candidateOTP) {
  if (!this.otp || !this.otp.code) return false;
  return await bcrypt.compare(candidateOTP, this.otp.code);
};

// Instance method to check if OTP is valid
userSchema.methods.isOTPValid = function(type) {
  if (!this.otp || this.otp.isUsed) return false;
  if (this.otp.type !== type) return false;
  if (this.otp.expiresAt < new Date()) return false;
  if (this.otp.attempts >= 5) return false;
  return true;
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockedUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // If we have hit max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockedUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockedUntil: 1 }
  });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true, deletedAt: null });
};

// Static method to find by role
userSchema.statics.findByRole = function(role) {
  return this.find({ roles: role, isActive: true, deletedAt: null });
};

// Instance method for soft delete
userSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

/**
 * PASSWORD RESET: Create a reset token (returns plain token for email; stores hashed token + expiry)
 * @returns {Promise<string>} plain reset token
 */
userSchema.methods.createPasswordResetToken = async function() {
  // Generate a 32-byte token and hash it before storing
  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

  this.forgotPasswordToken = hashedToken;
  // 15 minutes expiry (adjust as needed)
  this.forgotPasswordTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

  // Save without triggering validations on other fields
  await this.save({ validateBeforeSave: false });
  return plainToken;
};

/**
 * PASSWORD RESET: Complete reset by token
 * @param {string} token - plain token from email
 * @param {string} newPassword
 * @returns {Promise<boolean>} true on success
 */
userSchema.statics.resetPasswordByToken = async function(token, newPassword) {
  const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');

  const user = await this.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordTokenExpiry: { $gt: new Date() }
  }).select('+password'); // password hashing is handled by pre-save

  if (!user) return false;

  user.password = String(newPassword);
  user.forgotPasswordToken = undefined;
  user.forgotPasswordTokenExpiry = undefined;
  // Also clear lockouts and login attempts on password reset
  user.loginAttempts = 0;
  user.lockedUntil = undefined;

  await user.save();
  return true;
};

/**
 * PASSWORD RESET: Directly set a new password for the current user instance
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
userSchema.methods.setPassword = async function(newPassword) {
  this.password = String(newPassword);
  // Clear any outstanding reset tokens
  this.forgotPasswordToken = undefined;
  this.forgotPasswordTokenExpiry = undefined;
  await this.save();
};

/**
 * EDIT USER DETAILS (safe): restrict updates to allowed fields and run validators
 * Disallows direct password changes (use setPassword or resetPasswordByToken)
 * @param {object} updates
 * @param {{ new?: boolean, runValidators?: boolean }=} options
 * @returns {Promise<mongoose.Document>}
 */
userSchema.statics.updateEditableFieldsById = async function(id, updates, options = {}) {
  const ALLOWED_FIELDS = [
    'firstName',
    'lastName',
    'mobile',
    'alternateEmail',
    'companyName',
    'companyType',
    'addresses',
    'preferences',
    'profilePicture',
    'bio',
    'meetingDetails',
    'sellerProfile'
  ];

  const filtered = pick(updates, ALLOWED_FIELDS);

  // Guard: prevent accidental password/role/status updates via this path
  delete filtered.password;
  delete filtered.roles;
  delete filtered.isActive;
  delete filtered.isBlocked;
  delete filtered.isVerified;
  delete filtered.deletedAt;

  const doc = await this.findByIdAndUpdate(
    id,
    { $set: filtered },
    {
      new: options.new ?? true,
      runValidators: options.runValidators ?? true,
      context: 'query'
    }
  );

  return doc;
};

/**
 * EDIT USER DETAILS (instance): assign allowed fields and save
 * @param {object} updates
 * @returns {Promise<mongoose.Document>}
 */
userSchema.methods.updateProfile = async function(updates) {
  const ALLOWED_FIELDS = [
    'firstName',
    'lastName',
    'mobile',
    'alternateEmail',
    'companyName',
    'companyType',
    'addresses',
    'preferences',
    'profilePicture',
    'bio',
    'meetingDetails',
    'sellerProfile'
  ];
  const filtered = pick(updates, ALLOWED_FIELDS);

  Object.assign(this, filtered);
  return this.save();
};

/**
 * HARD DELETE: Permanently delete this user document
 * @returns {Promise<void>}
 */
userSchema.methods.hardDelete = async function() {
  await this.deleteOne(); // Deletes this document permanently
};

/**
 * HARD DELETE: Permanently delete a user by ID
 * @param {mongoose.Types.ObjectId | string} id
 * @returns {Promise<{deletedCount: number}>}
 */
userSchema.statics.hardDeleteById = async function(id) {
  return this.deleteOne({ _id: id });
};

// Create the model
const User = mongoose.model("User", userSchema);
export default User;