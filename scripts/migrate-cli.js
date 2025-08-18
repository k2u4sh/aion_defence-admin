#!/usr/bin/env node

const { Command } = require('commander');
const { DatabaseManager } = require('../src/dbConfig/DatabaseManager');
const { MigrationManager } = require('../src/migrations/MigrationManager');
const { modelRegistry } = require('../src/models/ModelRegistry');
require('dotenv').config({ path: '.env' });

const program = new Command();

program
  .name('migrate')
  .description('Database migration CLI tool')
  .version('1.0.0');

// Global options
program
  .option('-d, --database <uri>', 'MongoDB connection URI', process.env.MONGODB_URI || 'mongodb://localhost:27017/defence-cart')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--dry-run', 'Show what would be done without executing');

// Status command
program
  .command('status')
  .description('Show migration status')
  .action(async (options, command) => {
    try {
      const globalOpts = command.parent.opts();
      const dbManager = DatabaseManager.getInstance({ uri: globalOpts.database || process.env.MONGODB_URI || 'mongodb://localhost:27017/defence-cart' });
      await dbManager.connect();
      
      const migrationManager = MigrationManager.getInstance(dbManager);
      
      // Load migrations
      const { createMigrationLoader } = require('../src/migrations/MigrationLoader');
      const migrationLoader = await createMigrationLoader(dbManager);
      
      const status = await migrationManager.getMigrationStatus();
      const history = await migrationManager.getMigrationHistory();
      
      console.log('\n📊 Migration Status:');
      console.log(`Total migrations: ${status.total}`);
      console.log(`Applied: ${status.applied} ✅`);
      console.log(`Pending: ${status.pending} ⏳`);
      console.log(`Failed: ${status.failed} ❌`);
      
      if (history.length > 0) {
        console.log('\n📋 Migration History:');
        history.forEach(record => {
          const statusIcon = record.status === 'success' ? '✅' : '❌';
          const date = record.appliedAt.toLocaleString();
          console.log(`${statusIcon} ${record.version} - ${record.name} (${date})`);
        });
      }
      
      await dbManager.disconnect();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Run migrations command
program
  .command('up')
  .description('Run pending migrations')
  .option('-t, --target <version>', 'Run migrations up to specific version')
  .option('--force', 'Force run even if validation fails')
  .action(async (options, command) => {
    try {
      const globalOpts = command.parent.opts();
      const dbManager = DatabaseManager.getInstance({ uri: globalOpts.database || process.env.MONGODB_URI || 'mongodb://localhost:27017/defence-cart' });
      await dbManager.connect();
      
      const migrationManager = MigrationManager.getInstance(dbManager, {
        validateBeforeRun: !options.force
      });
      
      // Load migrations
      const { createMigrationLoader } = require('../src/migrations/MigrationLoader');
      const migrationLoader = await createMigrationLoader(dbManager);
      
      if (options.target) {
        await migrationManager.runMigrations(options.target);
      } else {
        await migrationManager.runMigrations();
      }
      
      await dbManager.disconnect();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Rollback command
program
  .command('down')
  .description('Rollback a specific migration')
  .argument('<version>', 'Migration version to rollback')
  .action(async (version, options, command) => {
    try {
      const globalOpts = command.parent.opts();
      const dbManager = DatabaseManager.getInstance({ uri: globalOpts.database || process.env.MONGODB_URI || 'mongodb://localhost:27017/defence-cart' });
      await dbManager.connect();
      
      const migrationManager = MigrationManager.getInstance(dbManager);
      
      // Load migrations
      const { createMigrationLoader } = require('../src/migrations/MigrationLoader');
      const migrationLoader = await createMigrationLoader(dbManager);
      
      await migrationManager.rollbackMigration(version);
      
      await dbManager.disconnect();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate pending migrations')
  .action(async (options, command) => {
    try {
      const globalOpts = command.parent.opts();
      const dbManager = DatabaseManager.getInstance({ uri: globalOpts.database || process.env.MONGODB_URI || 'mongodb://localhost:27017/defence-cart' });
      await dbManager.connect();
      
      const migrationManager = MigrationManager.getInstance(dbManager);
      
      // Load migrations
      const { createMigrationLoader } = require('../src/migrations/MigrationLoader');
      const migrationLoader = await createMigrationLoader(dbManager);
      
      const isValid = await migrationManager.validateMigrations();
      
      if (isValid) {
        console.log('✅ All migrations are valid');
      } else {
        console.log('❌ Some migrations failed validation');
        process.exit(1);
      }
      
      await dbManager.disconnect();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Create migration command
program
  .command('create')
  .description('Create a new migration file')
  .argument('<name>', 'Migration name')
  .option('-t, --type <type>', 'Migration type (default, user, product, etc.)', 'default')
  .action(async (name, options) => {
    try {
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const version = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}`;
      const className = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
      
      const template = `const { BaseMigration } = require('../src/migrations/Migration');

class ${className}Migration extends BaseMigration {
  version = '${version}';
  name = '${name}';
  description = '${name} migration';

  async up(connection) {
    await this.log('Starting ${name} migration...');
    
    try {
      // TODO: Implement migration logic here
      
      await this.success('${name} migration completed successfully');
    } catch (error) {
      await this.error('${name} migration failed', error);
      throw error;
    }
  }

  async down(connection) {
    await this.log('Rolling back ${name} migration...');
    
    try {
      // TODO: Implement rollback logic here
      
      await this.success('${name} migration rolled back successfully');
    } catch (error) {
      await this.error('${name} migration rollback failed', error);
      throw error;
    }
  }
}

module.exports = ${className}Migration;`;
      
      const filename = `src/migrations/${version}_${name.toLowerCase().replace(/\s+/g, '_')}.js`;
      
      console.log(`📝 Migration template created for: ${filename}`);
      console.log('\nTemplate:');
      console.log(template);
      
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Model status command
program
  .command('models')
  .description('Show model registry status')
  .action(async (options) => {
    try {
      const stats = modelRegistry.getModelStats();
      
      console.log('\n📊 Model Registry Status:');
      console.log(`Total models: ${stats.totalModels}`);
      console.log(`Total base models: ${stats.totalBaseModels}`);
      
      if (stats.modelNames.length > 0) {
        console.log('\n📋 Registered Models:');
        stats.modelNames.forEach(name => console.log(`  • ${name}`));
      }
      
      if (stats.baseModelNames.length > 0) {
        console.log('\n🔧 Base Models:');
        stats.baseModelNames.forEach(name => console.log(`  • ${name}`));
      }
      
      // Validate models
      const validation = await modelRegistry.validateAllModels();
      if (validation.invalid.length > 0) {
        console.log('\n⚠️  Invalid Models:');
        validation.invalid.forEach(name => {
          console.log(`  • ${name}: ${validation.errors[name]}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Database health check command
program
  .command('health')
  .description('Check database connection health')
  .action(async (options, command) => {
    try {
      const globalOpts = command.parent.opts();
      const dbManager = DatabaseManager.getInstance({ uri: globalOpts.database || process.env.MONGODB_URI || 'mongodb://localhost:27017/defence-cart' });
      
      console.log('🔍 Checking database health...');
      
      const connection = await dbManager.connect();
      const isHealthy = await dbManager.healthCheck();
      
      if (isHealthy) {
        console.log('✅ Database is healthy');
        console.log(`📊 Connection state: ${connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      } else {
        console.log('❌ Database health check failed');
        process.exit(1);
      }
      
      await dbManager.disconnect();
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
