class ModelRegistry {
  constructor() {
    this.models = new Map();
    this.baseModels = new Map();
  }

  static getInstance() {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  registerModel(name, model, schema) {
    if (this.models.has(name)) {
      console.warn(`Model ${name} is already registered. Overwriting...`);
    }

    this.models.set(name, {
      name,
      model,
      schema
    });

    console.log(`✅ Model ${name} registered successfully`);
  }

  registerBaseModel(name, baseModel) {
    this.baseModels.set(name, baseModel);
  }

  getModel(name) {
    const modelDef = this.models.get(name);
    return modelDef ? modelDef.model : null;
  }

  getBaseModel(name) {
    return this.baseModels.get(name);
  }

  getAllModels() {
    return new Map(this.models);
  }

  getAllBaseModels() {
    return new Map(this.baseModels);
  }

  hasModel(name) {
    return this.models.has(name);
  }

  hasBaseModel(name) {
    return this.baseModels.has(name);
  }

  unregisterModel(name) {
    return this.models.delete(name);
  }

  unregisterBaseModel(name) {
    return this.baseModels.delete(name);
  }

  async validateAllModels() {
    const valid = [];
    const invalid = [];
    const errors = {};

    for (const [name, modelDef] of this.models) {
      try {
        // Basic validation - check if model can be instantiated
        if (modelDef.model && typeof modelDef.model === 'function') {
          valid.push(name);
        } else {
          invalid.push(name);
          errors[name] = 'Invalid model definition';
        }
      } catch (error) {
        invalid.push(name);
        errors[name] = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return { valid, invalid, errors };
  }

  getModelStats() {
    return {
      totalModels: this.models.size,
      totalBaseModels: this.baseModels.size,
      modelNames: Array.from(this.models.keys()),
      baseModelNames: Array.from(this.baseModels.keys())
    };
  }

  async clearAllModels() {
    this.models.clear();
    this.baseModels.clear();
    console.log('🧹 All models cleared from registry');
  }
}

// Export singleton instance
const modelRegistry = ModelRegistry.getInstance();

module.exports = { ModelRegistry, modelRegistry };
