const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
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
  country_code: {
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
stateSchema.index({ country_id: 1, name: 1 });
stateSchema.index({ name: 'text' }); // Text search index

// Static method to get states by country
stateSchema.statics.getStatesByCountry = function(countryId) {
  return this.find({ country_id: countryId }).sort({ name: 1 });
};

// Static method to search states
stateSchema.statics.searchStates = function(query, countryId = null) {
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

// Static method to get all states with pagination
stateSchema.statics.getAllStates = function(page = 1, limit = 100) {
  const skip = (page - 1) * limit;
  return this.find({}).sort({ name: 1 }).skip(skip).limit(limit);
};

// Static method to get states count by country
stateSchema.statics.getStatesCountByCountry = function(countryId) {
  return this.countDocuments({ country_id: countryId });
};

// Static method to get total states count
stateSchema.statics.getTotalStatesCount = function() {
  return this.countDocuments({});
};

module.exports = mongoose.models.State || mongoose.model('State', stateSchema);
