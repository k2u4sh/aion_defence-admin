const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  country_id: {
    type: Number,
    required: true,
    index: true
  },
  state_id: {
    type: Number,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  country_name: {
    type: String,
    required: true,
    index: true
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
citySchema.index({ country_id: 1, name: 1 });
citySchema.index({ state_id: 1, name: 1 });
citySchema.index({ name: 'text' }); // Text search index

// Static method to get cities by country
citySchema.statics.getCitiesByCountry = function(countryId) {
  return this.find({ country_id: countryId }).sort({ name: 1 });
};

// Static method to search cities
citySchema.statics.searchCities = function(query, countryId = null) {
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { country_name: { $regex: query, $options: 'i' } }
    ]
  };
  
  if (countryId) {
    searchQuery.country_id = countryId;
  }
  
  return this.find(searchQuery).sort({ name: 1 }).limit(50);
};

// Static method to get all cities with pagination
citySchema.statics.getAllCities = function(page = 1, limit = 100) {
  const skip = (page - 1) * limit;
  return this.find({}).sort({ name: 1 }).skip(skip).limit(limit);
};

// Static method to get cities count by country
citySchema.statics.getCitiesCountByCountry = function(countryId) {
  return this.countDocuments({ country_id: countryId });
};

// Static method to get total cities count
citySchema.statics.getTotalCitiesCount = function() {
  return this.countDocuments({});
};

module.exports = mongoose.models.City || mongoose.model('City', citySchema);
