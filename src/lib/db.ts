import mongoose from 'mongoose';

interface MongooseConnectionCache {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnectionCache: MongooseConnectionCache | undefined;
}

const globalForMongoose = global as typeof global & {
  mongooseConnectionCache?: MongooseConnectionCache;
};

export async function connectToDatabase(): Promise<typeof mongoose> {
  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    throw new Error('Missing required environment variable MONGODB_URI. Set it in your environment (e.g., .env.local).');
  }

  if (!globalForMongoose.mongooseConnectionCache) {
    globalForMongoose.mongooseConnectionCache = {
      connection: null,
      promise: null,
    };
  }

  const cached = globalForMongoose.mongooseConnectionCache;

  if (cached!.connection) {
    return cached!.connection;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(connectionString, {
      bufferCommands: false,
      // Keep connection options minimal and explicit
    }).then((mongooseInstance) => mongooseInstance);
  }

  cached!.connection = await cached!.promise;
  return cached!.connection;
}

export default connectToDatabase;




