import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  line3: { type: String },
  country: { type: String, required: true },
  state: { type: String },
  city: { type: String, required: false },
  zipCode: { type: String, required: true },
  landline: { type: String },
  mobile: { type: String },
  email: { type: String },
  isMailing: { type: Boolean, default: false }
}, { _id: false });

const userDetailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const companySchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Link to registered user
  slug: { type: String, required: true }, // Unique slug for company
  name: { type: String, required: true },
  logo: { type: String }, // file path or URL
  description: { type: String, required: true },
  addresses: [addressSchema],
  mailingAddresses: [addressSchema],
  parentCompany: { type: String },
  parentCompanyNotAvailable: { type: Boolean, default: false },
  parentCompanyDescription: { type: String },
  website: { type: String },
  brochures: [{ type: String }], // file paths or URLs
  users: [userDetailSchema],
  subscriptionPlan: { type: String, enum: ["single", "multiple", "decide_later"], required: true },
  natureOfBusiness: [{ type: String }],
  typeOfBusiness: [{ type: String }],
  registrationNumber: { type: String },
  yearEstablished: { type: String },
  numEmployees: { type: String },
  servicesOffered: { type: String },
  currency: { type: String },
  gstNumber: { type: String, required: true },
  gstCertificates: [{ type: String, required: true }], // file paths or URLs
  cin: { type: String },
  cinDocuments: [{ type: String }], // file paths or URLs
  categories: [{ type: String }],
  agreedToTerms: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create indexes for better performance
companySchema.index({ slug: 1 }, { unique: true });
companySchema.index({ userId: 1 }, { unique: true }); // Ensure only one company per user

const Company = mongoose.models.Company || mongoose.model("Company", companySchema);
export default Company;
