const { DatabaseManager } = require('../dbConfig/DatabaseManager');

class MigrationManager {
  constructor(dbManager, config = {}) {
    this.dbManager = dbManager;
    this.config = {
      collectionName: 'migrations',
      autoRun: false,
      validateBeforeRun: true,
      ...config
    };
    this.migrationCollection = this.config.collectionName;
    this.migrations = new Map();
  }

  static getInstance(dbManager, config) {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager(dbManager, config);
    }
    return MigrationManager.instance;
  }

  registerMigration(migration) {
    if (this.migrations.has(migration.version)) {
      throw new Error(`Migration version ${migration.version} already exists`);
    }
    this.migrations.set(migration.version, migration);
  }

  async getMigrationHistory() {
    const connection = this.dbManager.getConnection();
    if (!connection) {
      throw new Error('Database not connected');
    }

    try {
      const collection = connection.db.collection(this.migrationCollection);
      const records = await collection.find({}).sort({ version: 1 }).toArray();
      return records.map(record => ({
        version: record.version,
        name: record.name,
        appliedAt: record.appliedAt,
        executionTime: record.executionTime,
        status: record.status,
        error: record.error
      }));
    } catch (error) {
      // Collection might not exist yet
      return [];
    }
  }

  async getPendingMigrations() {
    const history = await this.getMigrationHistory();
    const appliedVersions = new Set(history.map(record => record.version));
    
    return Array.from(this.migrations.values())
      .filter(migration => !appliedVersions.has(migration.version))
      .sort((a, b) => a.version.localeCompare(b.version));
  }

  async runMigrations(targetVersion) {
    const connection = this.dbManager.getConnection();
    if (!connection) {
      throw new Error('Database not connected');
    }

    // Ensure migrations collection exists
    await this.ensureMigrationsCollection(connection);

    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    if (targetVersion) {
      const targetMigration = this.migrations.get(targetVersion);
      if (!targetMigration) {
        throw new Error(`Target migration version ${targetVersion} not found`);
      }
      
      const targetIndex = pendingMigrations.findIndex(m => m.version === targetVersion);
      if (targetIndex === -1) {
        console.log(`✅ Target migration ${targetVersion} already applied`);
        return;
      }
      
      pendingMigrations.splice(targetIndex + 1);
    }

    console.log(`🚀 Running ${pendingMigrations.length} migrations...`);

    for (const migration of pendingMigrations) {
      await this.runMigration(migration, connection);
    }

    console.log('🎉 All migrations completed successfully');
  }

  async rollbackMigration(version) {
    const connection = this.dbManager.getConnection();
    if (!connection) {
      throw new Error('Database not connected');
    }

    const migration = this.migrations.get(version);
    if (!migration) {
      throw new Error(`Migration version ${version} not found`);
    }

    const history = await this.getMigrationHistory();
    const record = history.find(h => h.version === version);
    
    if (!record) {
      throw new Error(`Migration version ${version} has not been applied`);
    }

    if (!migration.down) {
      throw new Error(`Migration version ${version} does not support rollback`);
    }

    console.log(`🔄 Rolling back migration ${version}: ${migration.name}`);

    try {
      const startTime = Date.now();
      
      await migration.down(connection);
      
      const executionTime = Date.now() - startTime;
      
      // Remove from migration history
      const collection = connection.db.collection(this.migrationCollection);
      await collection.deleteOne({ version });
      
      console.log(`✅ Migration ${version} rolled back successfully (${executionTime}ms)`);
    } catch (error) {
      console.error(`❌ Failed to rollback migration ${version}:`, error);
      throw error;
    }
  }

  async validateMigrations() {
    const pendingMigrations = await this.getPendingMigrations();
    
    for (const migration of pendingMigrations) {
      try {
        if (migration.validate) {
          await migration.validate();
        }
      } catch (error) {
        console.error(`❌ Migration ${migration.version} validation failed:`, error);
        return false;
      }
    }
    
    return true;
  }

  async runMigration(migration, connection) {
    console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);
    
    const startTime = Date.now();
    
    try {
      // Run validation if available
      if (this.config.validateBeforeRun && migration.validate) {
        await migration.validate();
      }

      // Run migration
      await migration.up(connection);
      
      const executionTime = Date.now() - startTime;
      
      // Record successful migration
      await this.recordMigration(migration, executionTime, 'success');
      
      console.log(`✅ Migration ${migration.version} completed successfully (${executionTime}ms)`);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record failed migration
      await this.recordMigration(migration, executionTime, 'failed', error);
      
      console.error(`❌ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  async recordMigration(migration, executionTime, status, error) {
    const connection = this.dbManager.getConnection();
    if (!connection) return;

    const collection = connection.db.collection(this.migrationCollection);
    
    const record = {
      version: migration.version,
      name: migration.name,
      appliedAt: new Date(),
      executionTime,
      status,
      error: error?.message || error
    };

    if (status === 'success') {
      await collection.insertOne(record);
    } else {
      await collection.updateOne(
        { version: migration.version },
        { $set: record },
        { upsert: true }
      );
    }
  }

  async ensureMigrationsCollection(connection) {
    const collections = await connection.db.listCollections().toArray();
    const exists = collections.some(col => col.name === this.migrationCollection);
    
    if (!exists) {
      await connection.db.createCollection(this.migrationCollection);
      await connection.db.collection(this.migrationCollection).createIndex(
        { version: 1 }, 
        { unique: true }
      );
    }
  }

  getMigrations() {
    return new Map(this.migrations);
  }

  async getMigrationStatus() {
    const history = await this.getMigrationHistory();
    const total = this.migrations.size;
    const applied = history.filter(h => h.status === 'success').length;
    const failed = history.filter(h => h.status === 'failed').length;
    const pending = total - applied - failed;

    return { total, applied, pending, failed };
  }
}

module.exports = { MigrationManager };
