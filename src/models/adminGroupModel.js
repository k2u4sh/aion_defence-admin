import mongoose from "mongoose";

// Avoid model overwrite in Next.js dev
if (mongoose.models.AdminGroup) {
  delete mongoose.models.AdminGroup;
}

const adminGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Group name is required"],
    trim: true,
    unique: true,
    minlength: [2, "Group name must be at least 2 characters"],
    maxlength: [100, "Group name cannot exceed 100 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  permissions: {
    type: [String],
    default: []
    // Note: Keep flexible; can validate against a whitelist later
  }
}, {
  timestamps: true
});

adminGroupSchema.index({ name: 1 }, { unique: true });

const AdminGroup = mongoose.model("AdminGroup", adminGroupSchema);
export default AdminGroup;


