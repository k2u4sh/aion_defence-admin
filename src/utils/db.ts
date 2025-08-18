import { DatabaseManager } from '../dbConfig/DatabaseManager';

let dbManager: DatabaseManager | null = null;

export async function connectDB(): Promise<void> {
  if (!dbManager) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    dbManager = DatabaseManager.getInstance({ uri });
  }
  
  if (dbManager) {
    await dbManager.connect();
  }
}

export async function disconnectDB(): Promise<void> {
  if (dbManager) {
    await dbManager.disconnect();
    dbManager = null;
  }
}

export function getDBManager(): DatabaseManager {
  if (!dbManager) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return dbManager;
}

export function isConnected(): boolean {
  return dbManager?.isConnected() || false;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  await disconnectDB();
  process.exit(0);
});
