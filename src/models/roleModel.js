import mongoose from "mongoose";

if (mongoose.models.Role) {
  delete mongoose.models.Role;
}

const roleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  permissions: { type: [String], default: [] }
}, { timestamps: true });

roleSchema.index({ key: 1 }, { unique: true });

const Role = mongoose.model("Role", roleSchema);
export default Role;


