class BaseMigration {
  constructor() {
    this.version = '';
    this.name = '';
    this.description = '';
    this.dependencies = [];
  }

  async up(connection) {
    throw new Error('up method must be implemented');
  }

  async down(connection) {
    // Optional rollback method
  }

  async validate() {
    // Optional validation method
  }

  async executeWithTransaction(connection, operation) {
    const session = connection.startSession();
    try {
      await session.withTransaction(operation);
    } finally {
      await session.endSession();
    }
  }

  async log(message) {
    console.log(`[${this.version}] ${message}`);
  }

  async error(message, error) {
    console.error(`[${this.version}] ❌ ${message}`, error);
  }

  async success(message) {
    console.log(`[${this.version}] ✅ ${message}`);
  }
}

module.exports = { BaseMigration };
