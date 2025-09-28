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

// Index is already defined in the schema with unique: true, so no need for separate index

const Role = mongoose.model("Role", roleSchema);
export default Role;


