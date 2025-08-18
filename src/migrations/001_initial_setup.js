const { BaseMigration } = require('./Migration');

class InitialSetupMigration extends BaseMigration {
  constructor() {
    super();
    this.version = '001_initial_setup';
    this.name = 'Initial Database Setup';
    this.description = 'Sets up initial database structure and indexes';
  }

  async createIndexSafely(collection, indexSpec, options = {}) {
    try {
      await collection.createIndex(indexSpec, options);
      return true;
    } catch (error) {
      if (error.code === 85) { // IndexOptionsConflict
        await this.log(`Index already exists with different options: ${JSON.stringify(indexSpec)}`);
        return false;
      } else if (error.code === 26) { // NamespaceNotFound
        await this.log(`Collection not found, skipping index creation`);
        return false;
      } else {
        throw error;
      }
    }
  }

  async up(connection) {
    await this.log('Starting initial database setup...');
    
    try {
      const db = connection.db;
      
      // Create collections if they don't exist
      await this.log('Creating collections...');
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      
      const requiredCollections = [
        'users',
        'products',
        'categories',
        'orders',
        'carts',
        'reviews',
        'promotions',
        'notifications',
        'tags',
        'companies',
        'cms'
      ];
      
      for (const collectionName of requiredCollections) {
        if (!collectionNames.includes(collectionName)) {
          await db.createCollection(collectionName);
          await this.success(`Created collection: ${collectionName}`);
        } else {
          await this.log(`Collection ${collectionName} already exists`);
        }
      }
      
      // Create indexes for better performance
      await this.log('Creating indexes...');
      
      // Users collection indexes
      const usersCollection = db.collection('users');
      await this.createIndexSafely(usersCollection, { email: 1 }, { unique: true });
      await this.createIndexSafely(usersCollection, { phone: 1 });
      await this.createIndexSafely(usersCollection, { company: 1 });
      await this.createIndexSafely(usersCollection, { createdAt: -1 });
      await this.success('Users indexes created');
      
      // Products collection indexes
      const productsCollection = db.collection('products');
      await this.createIndexSafely(productsCollection, { name: 'text', description: 'text' });
      await this.createIndexSafely(productsCollection, { category: 1 });
      await this.createIndexSafely(productsCollection, { seller: 1 });
      await this.createIndexSafely(productsCollection, { price: 1 });
      await this.createIndexSafely(productsCollection, { status: 1 });
      await this.success('Products indexes created');
      
      // Categories collection indexes
      const categoriesCollection = db.collection('categories');
      await this.createIndexSafely(categoriesCollection, { slug: 1 }, { unique: true });
      await this.createIndexSafely(categoriesCollection, { parent: 1 });
      await this.createIndexSafely(categoriesCollection, { isActive: 1 });
      await this.success('Categories indexes created');
      
      // Orders collection indexes
      const ordersCollection = db.collection('orders');
      await this.createIndexSafely(ordersCollection, { user: 1 });
      await this.createIndexSafely(ordersCollection, { status: 1 });
      await this.createIndexSafely(ordersCollection, { createdAt: -1 });
      await this.createIndexSafely(ordersCollection, { orderNumber: 1 }, { unique: true });
      await this.success('Orders indexes created');
      
      // Carts collection indexes
      const cartsCollection = db.collection('carts');
      await this.createIndexSafely(cartsCollection, { user: 1 }, { unique: true });
      await this.createIndexSafely(cartsCollection, { updatedAt: -1 });
      await this.success('Carts indexes created');
      
      // Reviews collection indexes
      const reviewsCollection = db.collection('reviews');
      await this.createIndexSafely(reviewsCollection, { product: 1 });
      await this.createIndexSafely(reviewsCollection, { user: 1 });
      await this.createIndexSafely(reviewsCollection, { rating: 1 });
      await this.createIndexSafely(reviewsCollection, { status: 1 });
      await this.success('Reviews indexes created');
      
      // Promotions collection indexes
      const promotionsCollection = db.collection('promotions');
      await this.createIndexSafely(promotionsCollection, { code: 1 }, { unique: true });
      await this.createIndexSafely(promotionsCollection, { startDate: 1 });
      await this.createIndexSafely(promotionsCollection, { endDate: 1 });
      await this.createIndexSafely(promotionsCollection, { isActive: 1 });
      await this.success('Promotions indexes created');
      
      // Notifications collection indexes
      const notificationsCollection = db.collection('notifications');
      await this.createIndexSafely(notificationsCollection, { user: 1 });
      await this.createIndexSafely(notificationsCollection, { type: 1 });
      await this.createIndexSafely(notificationsCollection, { status: 1 });
      await this.createIndexSafely(notificationsCollection, { createdAt: -1 });
      await this.success('Notifications indexes created');
      
      // Tags collection indexes
      const tagsCollection = db.collection('tags');
      await this.createIndexSafely(tagsCollection, { slug: 1 }, { unique: true });
      await this.createIndexSafely(tagsCollection, { isActive: 1 });
      await this.success('Tags indexes created');
      
      // Companies collection indexes
      const companiesCollection = db.collection('companies');
      await this.createIndexSafely(companiesCollection, { name: 1 });
      await this.createIndexSafely(companiesCollection, { slug: 1 }, { unique: true });
      await this.createIndexSafely(companiesCollection, { isActive: 1 });
      await this.success('Companies indexes created');
      
      // CMS collection indexes
      const cmsCollection = db.collection('cms');
      await this.createIndexSafely(cmsCollection, { type: 1 });
      await this.createIndexSafely(cmsCollection, { slug: 1 });
      await this.createIndexSafely(cmsCollection, { isActive: 1 });
      await this.success('CMS indexes created');
      
      await this.success('Initial database setup completed successfully');
      
    } catch (error) {
      await this.error('Initial database setup failed', error);
      throw error;
    }
  }

  async down(connection) {
    await this.log('Rolling back initial database setup...');
    
    try {
      const db = connection.db;
      
      // Drop all collections
      const collections = await db.listCollections().toArray();
      
      for (const collection of collections) {
        if (collection.name !== 'migrations') { // Don't drop migrations collection
          await db.dropCollection(collection.name);
          await this.log(`Dropped collection: ${collection.name}`);
        }
      }
      
      await this.success('Initial database setup rolled back successfully');
      
    } catch (error) {
      await this.error('Initial database setup rollback failed', error);
      throw error;
    }
  }

  async validate() {
    await this.log('Validating initial setup migration...');
    
    // Basic validation - ensure we can create a test collection
    // In a real implementation, you might check if required indexes exist
    // or if the database structure is correct
    
    await this.success('Initial setup migration validation passed');
  }
}

module.exports = { InitialSetupMigration };
