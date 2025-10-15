const { BaseMigration } = require('./Migration');

class PermissionsRolesSeedMigration extends BaseMigration {
  constructor() {
    super();
    this.version = '003';
    this.name = 'permissions_roles_seed';
    this.description = 'Create permissions and roles collections and seed defaults';
    this.dependencies = ['002'];
  }

  async up(connection) {
    const db = connection.db;
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);

    if (!names.includes('permissions')) await db.createCollection('permissions');
    if (!names.includes('roles')) await db.createCollection('roles');

    const permissionsCol = db.collection('permissions');
    const rolesCol = db.collection('roles');

    await permissionsCol.createIndex({ key: 1 }, { unique: true }).catch(() => {});
    await permissionsCol.createIndex({ category: 1 }).catch(() => {});
    await rolesCol.createIndex({ key: 1 }, { unique: true }).catch(() => {});

    const permissions = [
      { key: 'admin:read', name: 'Read Admins', category: 'admin' },
      { key: 'admin:write', name: 'Manage Admins', category: 'admin' },
      { key: 'group:read', name: 'Read Groups', category: 'groups' },
      { key: 'group:write', name: 'Manage Groups', category: 'groups' },
      { key: 'role:read', name: 'Read Roles', category: 'roles' },
      { key: 'role:write', name: 'Manage Roles', category: 'roles' },
      { key: 'user:read', name: 'Read Users', category: 'users' },
      { key: 'user:write', name: 'Manage Users', category: 'users' },
      { key: 'product:read', name: 'Read Products', category: 'products' },
      { key: 'product:write', name: 'Manage Products', category: 'products' },
      { key: 'order:read', name: 'Read Orders', category: 'orders' },
      { key: 'order:write', name: 'Manage Orders', category: 'orders' },
      { key: 'cms:access', name: 'Access CMS', category: 'cms' },
      { key: 'cms:read', name: 'Read CMS', category: 'cms' },
      { key: 'cms:write', name: 'Manage CMS', category: 'cms' }
    ];

    for (const p of permissions) {
      await permissionsCol.updateOne({ key: p.key }, { $setOnInsert: p }, { upsert: true });
    }

    const roles = [
      { key: 'super_admin', name: 'Super Admin', permissions: ['*'] },
      { key: 'admin', name: 'Admin', permissions: permissions.map(p => p.key) },
      { key: 'moderator', name: 'Moderator', permissions: ['user:read','user:write','product:read','product:write','order:read'] },
      { key: 'support', name: 'Support', permissions: ['user:read','order:read'] }
    ];

    for (const r of roles) {
      await rolesCol.updateOne({ key: r.key }, { $set: r }, { upsert: true });
    }

    await this.success('Permissions and roles collections created/seeded');
  }

  async down(connection) {
    const db = connection.db;
    try { await db.collection('roles').drop(); } catch {}
    try { await db.collection('permissions').drop(); } catch {}
    await this.success('Dropped roles and permissions');
  }
}

module.exports = new PermissionsRolesSeedMigration();


