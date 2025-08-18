const mongoose = require('mongoose');

class BaseModelClass {
  constructor(schema, modelName) {
    this.schema = schema;
    this.model = null;
    
    // Add common fields to all schemas
    schema.add({
      createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      isDeleted: {
        type: Boolean,
        default: false,
        select: false // Hide by default in queries
      }
    });

    // Add common indexes
    schema.index({ createdAt: -1 });
    schema.index({ updatedAt: -1 });
    schema.index({ isDeleted: 1 });

    // Add common middleware
    schema.pre('save', function(next) {
      if (this.isModified()) {
        this.updatedAt = new Date();
      }
      next();
    });

    schema.pre('find', function() {
      this.where({ isDeleted: { $ne: true } });
    });

    schema.pre('findOne', function() {
      this.where({ isDeleted: { $ne: true } });
    });

    schema.pre('findById', function() {
      this.where({ isDeleted: { $ne: true } });
    });

    // Add static methods
    schema.statics.findActive = function(filter = {}) {
      return this.find({ ...filter, isDeleted: { $ne: true } });
    };

    schema.statics.findActiveById = function(id) {
      return this.findOne({ _id: id, isDeleted: { $ne: true } });
    };

    schema.statics.softDelete = async function(id) {
      const result = await this.updateOne(
        { _id: id },
        { isDeleted: true, updatedAt: new Date() }
      );
      return result.modifiedCount > 0;
    };

    schema.statics.restore = async function(id) {
      const result = await this.updateOne(
        { _id: id },
        { isDeleted: false, updatedAt: new Date() }
      );
      return result.modifiedCount > 0;
    };

    // Add instance methods
    schema.methods.softDelete = function() {
      this.isDeleted = true;
      this.updatedAt = new Date();
      return this.save();
    };

    schema.methods.restore = function() {
      this.isDeleted = false;
      this.updatedAt = new Date();
      return this.save();
    };

    this.model = mongoose.model(modelName, schema);
  }

  getModel() {
    return this.model;
  }

  getSchema() {
    return this.schema;
  }
}

module.exports = { BaseModelClass };
