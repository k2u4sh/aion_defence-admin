const mongoose = require('mongoose');
const { EventEmitter } = require('events');

class DatabaseManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = {
      maxRetries: 5,
      retryDelay: 5000,
      poolSize: 10,
      ...config
    };
    this.connection = null;
    this.isConnecting = false;
    this.retryCount = 0;
    this.healthCheckInterval = null;
  }

  static getInstance(config) {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  async connect() {
    if (this.connection && this.connection.readyState === 1) {
      return this.connection;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        this.once('connected', resolve);
        this.once('connectionError', reject);
      });
    }

    this.isConnecting = true;

    try {
      const options = {
        maxPoolSize: this.config.poolSize,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        ...this.config.options
      };

      await mongoose.connect(this.config.uri, options);
      
      this.connection = mongoose.connection;
      this.retryCount = 0;
      this.isConnecting = false;

      this.setupEventHandlers();
      this.startHealthCheck();
      
      this.emit('connected', this.connection);
      console.log('✅ Connected to MongoDB successfully');
      
      return this.connection;
    } catch (error) {
      this.isConnecting = false;
      this.emit('connectionError', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      this.emit('disconnected');
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return this.connection?.readyState === 1;
  }

  async healthCheck() {
    if (!this.connection) {
      return false;
    }

    try {
      await this.connection.db.admin().ping();
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  setupEventHandlers() {
    if (!this.connection) return;

    this.connection.on('connected', () => {
      console.log('🟢 MongoDB connection established');
      this.emit('connected');
    });

    this.connection.on('error', (error) => {
      console.error('🔴 MongoDB connection error:', error);
      this.emit('error', error);
    });

    this.connection.on('disconnected', () => {
      console.log('🟡 MongoDB connection disconnected');
      this.emit('disconnected');
    });

    this.connection.on('reconnected', () => {
      console.log('🟢 MongoDB connection reestablished');
      this.emit('reconnected');
    });

    process.on('SIGINT', async () => {
      console.log('\n🛑 Gracefully shutting down...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Gracefully shutting down...');
      await this.disconnect();
      process.exit(0);
    });
  }

  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        console.warn('⚠️  Database health check failed');
        this.emit('healthCheckFailed');
      }
    }, 30000); // Check every 30 seconds
  }

  async transaction(callback) {
    if (!this.connection) {
      throw new Error('Database not connected');
    }

    const session = await this.connection.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
}

// Default export for backward compatibility
const connectDB = async (uri = process.env.MONGODB_URI) => {
  const dbManager = DatabaseManager.getInstance({ uri });
  return await dbManager.connect();
};

module.exports = { DatabaseManager, connectDB };
