const { BaseMigration } = require('./Migration');

class AdminInitMigration extends BaseMigration {
  constructor() {
    super();
    this.version = '002';
    this.name = 'admin_init';
    this.description = 'Create admin and admin_groups collections with indexes';
    this.dependencies = ['001_initial_setup'];
  }

  async up(connection) {
    const db = connection.db;

    // Create collections if not exist
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);

    if (!names.includes('admingroups')) {
      await db.createCollection('admingroups');
    }
    if (!names.includes('admins')) {
      await db.createCollection('admins');
    }

    // Indexes for AdminGroup
    const adminGroups = db.collection('admingroups');
    await adminGroups.createIndex({ name: 1 }, { unique: true }).catch(() => {});
    await adminGroups.createIndex({ createdAt: -1 }).catch(() => {});

    // Indexes for Admin
    const admins = db.collection('admins');
    await admins.createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await admins.createIndex({ role: 1 }).catch(() => {});
    await admins.createIndex({ isActive: 1 }).catch(() => {});
    await admins.createIndex({ deletedAt: 1 }).catch(() => {});

    await this.success('Admin and AdminGroup collections prepared');
  }

  async down(connection) {
    const db = connection.db;
    try {
      await db.collection('admins').drop();
    } catch {}
    try {
      await db.collection('admingroups').drop();
    } catch {}
    await this.success('Dropped admin collections');
  }
}

module.exports = new AdminInitMigration();


