const { MigrationManager } = require('./MigrationManager');
const { DatabaseManager } = require('../dbConfig/DatabaseManager');
const { InitialSetupMigration } = require('./001_initial_setup');
const adminInitMigration = require('./002_admin_init');
const permRoleSeedMigration = require('./003_permissions_roles_seed');

class MigrationLoader {
  constructor(migrationManager) {
    this.migrationManager = migrationManager;
    this.loadedMigrations = new Map();
  }

  static getInstance(migrationManager) {
    if (!MigrationLoader.instance) {
      MigrationLoader.instance = new MigrationLoader(migrationManager);
    }
    return MigrationLoader.instance;
  }

  async loadMigrations() {
    console.log('📁 Loading migrations...');
    
    try {
      // Register built-in migrations
      await this.registerBuiltInMigrations();
      
      // Auto-discover migrations from migrations directory
      await this.discoverMigrations();
      
      console.log(`✅ Loaded ${this.loadedMigrations.size} migrations`);
      
    } catch (error) {
      console.error('❌ Error loading migrations:', error);
      throw error;
    }
  }

  async registerBuiltInMigrations() {
    // Register the initial setup migration
    const initialMigration = new InitialSetupMigration();
    this.migrationManager.registerMigration(initialMigration);
    this.loadedMigrations.set(initialMigration.version, initialMigration);
    
    console.log(`  📋 Registered built-in migration: ${initialMigration.version}`);

    // Register admin init migration
    this.migrationManager.registerMigration(adminInitMigration);
    this.loadedMigrations.set(adminInitMigration.version, adminInitMigration);
    console.log(`  📋 Registered built-in migration: ${adminInitMigration.version}`);

    // Register permissions/roles seed migration
    this.migrationManager.registerMigration(permRoleSeedMigration);
    this.loadedMigrations.set(permRoleSeedMigration.version, permRoleSeedMigration);
    console.log(`  📋 Registered built-in migration: ${permRoleSeedMigration.version}`);
  }

  async discoverMigrations() {
    // In a real implementation, you would scan the migrations directory
    // and dynamically import migration files. For now, we'll manually register
    // migrations as they're created.
    
    // Example of how this would work:
    // const migrationsDir = path.join(__dirname, 'migrations');
    // const migrationFiles = await fs.readdir(migrationsDir);
    // 
    // for (const file of migrationFiles) {
    //   if (file.endsWith('.js') && file !== 'index.js') {
    //     const migrationModule = require(`./${file}`);
    //     const MigrationClass = Object.values(migrationModule)[0];
    //     if (MigrationClass && typeof MigrationClass === 'function') {
    //       const migration = new MigrationClass();
    //       this.migrationManager.registerMigration(migration);
    //       this.loadedMigrations.set(migration.version, migration);
    //     }
    //   }
    // }
    
    console.log('  🔍 Migration discovery completed (manual registration mode)');
  }

  getLoadedMigrations() {
    return new Map(this.loadedMigrations);
  }

  async validateLoadedMigrations() {
    const valid = [];
    const invalid = [];
    const errors = {};

    for (const [version, migration] of this.loadedMigrations) {
      try {
        // Basic validation
        if (migration.version && migration.name && typeof migration.up === 'function') {
          valid.push(version);
        } else {
          invalid.push(version);
          errors[version] = 'Missing required properties or methods';
        }
      } catch (error) {
        invalid.push(version);
        errors[version] = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return { valid, invalid, errors };
  }

  async reloadMigrations() {
    console.log('🔄 Reloading migrations...');
    
    // Clear existing migrations
    this.loadedMigrations.clear();
    
    // Reload migrations
    await this.loadMigrations();
    
    console.log('✅ Migrations reloaded successfully');
  }
}

// Factory function to create a migration loader with database manager
const createMigrationLoader = async (dbManager) => {
  const migrationManager = MigrationManager.getInstance(dbManager);
  const loader = MigrationLoader.getInstance(migrationManager);
  await loader.loadMigrations();
  return loader;
};

module.exports = { MigrationLoader, createMigrationLoader };
