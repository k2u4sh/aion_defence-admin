# Migration Architecture Documentation

## Overview

This document describes the improved architecture for models and MongoDB migrations in the Aion Defence project. The new system provides a robust, versioned, and maintainable approach to database schema management.

## Architecture Components

### 1. Base Model System (`src/models/BaseModel.ts`)

The base model system provides common functionality for all models:

- **Automatic timestamps**: `createdAt` and `updatedAt` fields
- **Soft delete support**: `isDeleted` field with automatic filtering
- **Common indexes**: Automatic indexing on common fields
- **Middleware**: Automatic field updates and query filtering
- **Static methods**: `findActive()`, `softDelete()`, `restore()`
- **Instance methods**: `softDelete()`, `restore()`

#### Usage Example

```typescript
import { BaseModelClass, BaseDocument } from './BaseModel';
import mongoose, { Schema } from 'mongoose';

interface UserDocument extends BaseDocument {
  email: string;
  name: string;
}

class UserModel extends BaseModelClass<UserDocument> {
  constructor() {
    const schema = new Schema<UserDocument>({
      email: { type: String, required: true },
      name: { type: String, required: true }
    });
    
    super(schema, 'User');
  }
}

export default new UserModel().getModel();
```

### 2. Database Connection Manager (`src/dbConfig/DatabaseManager.ts`)

Advanced database connection management with:

- **Connection pooling**: Configurable pool size and connection options
- **Retry logic**: Automatic retry on connection failures
- **Health monitoring**: Periodic health checks
- **Event handling**: Connection state events
- **Transaction support**: Built-in transaction management
- **Graceful shutdown**: Proper cleanup on process termination

#### Usage Example

```typescript
import { DatabaseManager } from './DatabaseManager';

const dbManager = DatabaseManager.getInstance({
  uri: process.env.MONGODB_URI!,
  poolSize: 10,
  maxRetries: 5,
  retryDelay: 5000
});

await dbManager.connect();

// Use transaction
await dbManager.transaction(async (session) => {
  // Your transaction logic here
});

await dbManager.disconnect();
```

### 3. Migration System (`src/migrations/`)

#### Migration Interface (`Migration.ts`)

Defines the contract for all migrations:

```typescript
export interface Migration {
  version: string;           // Unique version identifier
  name: string;             // Human-readable name
  description?: string;      // Optional description
  up(connection: any): Promise<void>;    // Migration logic
  down?(connection: any): Promise<void>; // Rollback logic
  validate?(): Promise<void>;            // Validation logic
  dependencies?: string[];   // Migration dependencies
}
```

#### Migration Manager (`MigrationManager.ts`)

Manages migration execution:

- **Version tracking**: Tracks applied migrations in database
- **Dependency management**: Ensures migrations run in correct order
- **Rollback support**: Ability to undo migrations
- **Validation**: Pre-execution validation
- **Error handling**: Comprehensive error tracking and reporting

#### Migration Loader (`MigrationLoader.ts`)

Automatically discovers and registers migrations:

- **Auto-discovery**: Scans migrations directory
- **Built-in migrations**: Pre-registered system migrations
- **Dynamic loading**: Runtime migration registration

### 4. Model Registry (`src/models/ModelRegistry.ts`)

Centralized model management:

- **Model registration**: Central registry for all models
- **Validation**: Model validation and health checks
- **Statistics**: Model usage statistics
- **Lifecycle management**: Model registration/unregistration

## Usage

### Running Migrations

#### Basic Migration

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Run migrations up to specific version
npm run migrate:up -- --target 001_initial_setup

# Validate migrations
npm run migrate:validate

# Rollback specific migration
npm run migrate:down 001_initial_setup
```

#### CLI Commands

```bash
# Show model registry status
npm run migrate:models

# Check database health
npm run migrate:health

# Create new migration
npm run migrate:create "Add user preferences"
```

### Creating Custom Migrations

1. **Create migration file**:

```typescript
import { BaseMigration } from '../src/migrations/Migration';

export class AddUserPreferencesMigration extends BaseMigration {
  version = '002_add_user_preferences';
  name = 'Add User Preferences';
  description = 'Adds user preferences field to users collection';

  async up(connection: any): Promise<void> {
    await this.log('Adding user preferences...');
    
    try {
      const db = connection.db;
      const usersCollection = db.collection('users');
      
      // Add preferences field to all users
      await usersCollection.updateMany(
        { preferences: { $exists: false } },
        { $set: { preferences: {} } }
      );
      
      await this.success('User preferences added successfully');
    } catch (error) {
      await this.error('Failed to add user preferences', error);
      throw error;
    }
  }

  async down(connection: any): Promise<void> {
    await this.log('Removing user preferences...');
    
    try {
      const db = connection.db;
      const usersCollection = db.collection('users');
      
      // Remove preferences field
      await usersCollection.updateMany(
        {},
        { $unset: { preferences: 1 } }
      );
      
      await this.success('User preferences removed successfully');
    } catch (error) {
      await this.error('Failed to remove user preferences', error);
      throw error;
    }
  }
}
```

2. **Register migration** in `MigrationLoader.ts`:

```typescript
import { AddUserPreferencesMigration } from './002_add_user_preferences';

private async registerBuiltInMigrations(): Promise<void> {
  // ... existing code ...
  
  const preferencesMigration = new AddUserPreferencesMigration();
  this.migrationManager.registerMigration(preferencesMigration);
  this.loadedMigrations.set(preferencesMigration.version, preferencesMigration);
}
```

### Using Models with Base Functionality

```typescript
import User from '../models/userModel';

// Find active users only (excludes soft-deleted)
const activeUsers = await User.findActive({ role: 'admin' });

// Find active user by ID
const user = await User.findActiveById('user123');

// Soft delete user
await User.softDelete('user123');

// Restore user
await User.restore('user123');

// Instance methods
const user = await User.findById('user123');
await user.softDelete();
await user.restore();
```

## Configuration

### Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/defence-cart
```

### Database Configuration

```typescript
const dbConfig = {
  uri: process.env.MONGODB_URI!,
  poolSize: 10,
  maxRetries: 5,
  retryDelay: 5000,
  options: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  }
};
```

## Best Practices

### 1. Migration Naming

- Use descriptive names: `001_initial_setup`, `002_add_user_preferences`
- Include version numbers for ordering
- Use underscores for spaces

### 2. Migration Structure

- Always implement `up()` method
- Implement `down()` method for rollback support
- Include validation when possible
- Use transactions for data consistency

### 3. Error Handling

- Use try-catch blocks in migrations
- Log errors with context
- Implement proper rollback logic
- Validate data before and after migration

### 4. Performance

- Use bulk operations for large datasets
- Create appropriate indexes
- Test migrations on staging data first
- Monitor execution time

## Troubleshooting

### Common Issues

1. **Migration already applied**: Check migration history
2. **Connection failures**: Verify MongoDB URI and network
3. **Validation errors**: Check migration logic and data
4. **Rollback failures**: Ensure rollback logic is correct

### Debug Commands

```bash
# Check migration status
npm run migrate:status

# Validate migrations
npm run migrate:validate

# Check database health
npm run migrate:health

# View model registry
npm run migrate:models
```

### Logs

The system provides comprehensive logging:
- Migration execution progress
- Error details and stack traces
- Performance metrics
- Database connection status

## Migration from Old System

To migrate from the old migration system:

1. **Backup existing data**
2. **Run new migration system**: `npm run migrate`
3. **Verify data integrity**
4. **Update deployment scripts**

## Future Enhancements

- **Migration templates**: CLI generation of migration files
- **Data seeding**: Built-in data seeding support
- **Schema validation**: Automatic schema validation
- **Migration testing**: Test framework for migrations
- **Rollback chains**: Complex rollback scenarios
- **Migration scheduling**: Scheduled migration execution

## Support

For issues or questions:
1. Check migration logs
2. Verify database connectivity
3. Review migration dependencies
4. Check model validation
5. Consult this documentation
