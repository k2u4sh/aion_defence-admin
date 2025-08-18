#!/usr/bin/env node

const { DatabaseManager } = require('../src/dbConfig/DatabaseManager');
const { MigrationManager } = require('../src/migrations/MigrationManager');
const { modelRegistry } = require('../src/models/ModelRegistry');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/defence-cart';

async function main() {
  console.log('🚀 Starting improved migration system...\n');
  
  const dbManager = DatabaseManager.getInstance({ uri: MONGODB_URI });
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await dbManager.connect();
    console.log('✅ Database connected successfully\n');
    
    // Initialize migration manager
    const migrationManager = MigrationManager.getInstance(dbManager, {
      validateBeforeRun: true,
      autoRun: false
    });
    
    // Load migrations
    const { createMigrationLoader } = require('../src/migrations/MigrationLoader');
    const migrationLoader = await createMigrationLoader(dbManager);
    
    // Get migration status
    const status = await migrationManager.getMigrationStatus();
    console.log('📊 Migration Status:');
    console.log(`  Total migrations: ${status.total}`);
    console.log(`  Applied: ${status.applied} ✅`);
    console.log(`  Pending: ${status.pending} ⏳`);
    console.log(`  Failed: ${status.failed} ❌\n`);
    
    if (status.pending === 0) {
      console.log('🎉 No pending migrations to run');
      return;
    }
    
    // Get pending migrations
    const pendingMigrations = await migrationManager.getPendingMigrations();
    console.log('📋 Pending Migrations:');
    pendingMigrations.forEach((migration, index) => {
      console.log(`  ${index + 1}. ${migration.version} - ${migration.name}`);
      if (migration.description) {
        console.log(`     ${migration.description}`);
      }
    });
    console.log();
    
    // Validate migrations
    console.log('🔍 Validating migrations...');
    const isValid = await migrationManager.validateMigrations();
    if (!isValid) {
      console.log('❌ Migration validation failed');
      return;
    }
    console.log('✅ All migrations are valid\n');
    
    // Run migrations
    console.log('🚀 Running migrations...');
    await migrationManager.runMigrations();
    
    // Final status
    const finalStatus = await migrationManager.getMigrationStatus();
    console.log('\n📊 Final Migration Status:');
    console.log(`  Total migrations: ${finalStatus.total}`);
    console.log(`  Applied: ${finalStatus.applied} ✅`);
    console.log(`  Pending: ${finalStatus.pending} ⏳`);
    console.log(`  Failed: ${finalStatus.failed} ❌`);
    
    if (finalStatus.failed > 0) {
      console.log('\n⚠️  Some migrations failed. Check the logs above for details.');
      process.exit(1);
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await dbManager.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration terminated');
  process.exit(0);
});

// Run migrations
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
