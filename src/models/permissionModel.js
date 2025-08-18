import mongoose from "mongoose";

if (mongoose.models.Permission) {
  delete mongoose.models.Permission;
}

const permissionSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, trim: true }
}, { timestamps: true });

permissionSchema.index({ key: 1 }, { unique: true });
permissionSchema.index({ category: 1 });

const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;


