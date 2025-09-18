import mongoose from "mongoose";
import bcrypt from "bcryptjs";

if (mongoose.models.Admin) {
  delete mongoose.models.Admin;
}

const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },

  // Role can be: super_admin, admin, moderator, support, etc.
  role: {
    type: String,
    enum: ["super_admin", "admin", "moderator", "support"],
    required: true,
    default: "admin"
  },

  // Direct permissions assigned to the admin
  permissions: { type: [String], default: [] },

  // Group-based permissions
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "AdminGroup" }],

  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  deletedAt: { type: Date, default: null },

  // Password reset
  forgotPasswordToken: { type: String, select: false },
  forgotPasswordTokenExpiry: { type: Date, select: false }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      delete ret.password;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

// Password hashing
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Effective permissions = union of direct permissions + group permissions
adminSchema.virtual("effectivePermissions").get(function () {
  const direct = Array.isArray(this.permissions) ? this.permissions : [];
  const fromGroups = Array.isArray(this.groupsPermissions) ? this.groupsPermissions : [];
  return Array.from(new Set([...direct, ...fromGroups]));
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;


