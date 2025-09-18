const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  phonecode: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
countrySchema.index({ name: 'text' }); // Text search index

// Static method to search countries
countrySchema.statics.searchCountries = function(query) {
  const searchQuery = {
    name: { $regex: query, $options: 'i' }
  };
  
  return this.find(searchQuery).sort({ name: 1 }).limit(50);
};

// Static method to get all countries with pagination
countrySchema.statics.getAllCountries = function(page = 1, limit = 100) {
  const skip = (page - 1) * limit;
  return this.find({}).sort({ name: 1 }).skip(skip).limit(limit);
};

// Static method to get total countries count
countrySchema.statics.getTotalCountriesCount = function() {
  return this.countDocuments({});
};

// Static method to get country by ID
countrySchema.statics.getCountryById = function(countryId) {
  return this.findOne({ id: countryId });
};

module.exports = mongoose.models.Country || mongoose.model('Country', countrySchema);
