import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  line3: { type: String },
  city: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
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
  name: { type: String, required: true },
  logo: { type: String }, // file path or URL
  description: { type: String, required: true },
  addresses: [addressSchema],
  mailingAddresses: [addressSchema],
  parentCompany: { type: String },
  parentCompanyNotAvailable: { type: Boolean, default: false },
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
  gstNumber: { type: String },
  gstCertificates: [{ type: String }], // file paths or URLs
  cin: { type: String },
  cinDocuments: [{ type: String }], // file paths or URLs
  categories: [{ type: String }],
  agreedToTerms: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Company = mongoose.models.Company || mongoose.model("Company", companySchema);
export default Company;
