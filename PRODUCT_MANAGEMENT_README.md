# Product Management System

A comprehensive product management system built for the Aion Defence Admin panel, featuring products, categories, and tags management with full CRUD operations.

## Features

### 🛍️ Products Management
- **Create, Read, Update, Delete** products
- **Advanced product attributes**: SKU, pricing, inventory, specifications
- **Image management** with primary image support
- **SEO optimization** with meta titles, descriptions, and keywords
- **Status management**: Draft, Active, Inactive, Archived
- **Inventory tracking** with low stock alerts
- **Product variants** support (sizes, colors, materials)
- **Digital/Physical product distinction**

### 📂 Categories Management
- **Hierarchical structure** with unlimited nesting (max 3 levels)
- **Parent-child relationships** with automatic level calculation
- **Sort order** management
- **SEO fields** for each category
- **Image and icon** support
- **Active/Inactive status**

### 🏷️ Tags Management
- **Color-coded tags** with custom color picker
- **Category-specific** or global tags
- **System tags** protection (cannot be deleted)
- **Product count tracking**
- **Sort order** management
- **Active/Inactive status**

## Architecture

### API Endpoints

#### Products
- `GET /api/admin/products` - List products with pagination and filters
- `POST /api/admin/products` - Create new product
- `GET /api/admin/products/[id]` - Get specific product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Soft delete product

#### Categories
- `GET /api/admin/categories` - List categories with hierarchy
- `POST /api/admin/categories` - Create new category
- `GET /api/admin/categories/[id]` - Get specific category
- `PUT /api/admin/categories/[id]` - Update category
- `DELETE /api/admin/categories/[id]` - Delete category (with validation)

#### Tags
- `GET /api/admin/tags` - List tags with filters
- `POST /api/admin/tags` - Create new tag
- `GET /api/admin/tags/[id]` - Get specific tag
- `PUT /api/admin/tags/[id]` - Update tag
- `DELETE /api/admin/tags/[id]` - Delete tag (with validation)

### Database Models

#### Product Model
```javascript
{
  name: String,           // Product name
  slug: String,           // URL-friendly identifier
  description: String,    // Full description
  shortDescription: String, // Brief description
  category: ObjectId,     // Main category
  subCategory: ObjectId,  // Sub-category
  tags: [ObjectId],       // Array of tag IDs
  basePrice: Number,      // Selling price
  comparePrice: Number,   // Original price for discounts
  cost: Number,           // Product cost
  sku: String,            // Stock keeping unit
  quantity: Number,       // Available stock
  status: String,         // draft/active/inactive/archived
  images: [Object],       // Product images with metadata
  specifications: [Object], // Product specifications
  seo: Object,            // SEO metadata
  // ... and many more fields
}
```

#### Category Model
```javascript
{
  name: String,           // Category name
  slug: String,           // URL-friendly identifier
  description: String,    // Category description
  parentCategory: ObjectId, // Parent category reference
  level: Number,          // Hierarchy level (0-3)
  sortOrder: Number,      // Display order
  isActive: Boolean,      // Active status
  image: String,          // Category image URL
  icon: String,           // Category icon
  metaTitle: String,      // SEO title
  metaDescription: String // SEO description
}
```

#### Tag Model
```javascript
{
  name: String,           // Tag name
  slug: String,           // URL-friendly identifier
  description: String,    // Tag description
  color: String,          // Hex color code
  category: ObjectId,     // Associated category (optional)
  isActive: Boolean,      // Active status
  isSystem: Boolean,      // System tag protection
  sortOrder: Number,      // Display order
  metadata: {             // Usage statistics
    totalProducts: Number,
    lastUsed: Date
  }
}
```

## UI Components

### Pages
1. **Products List** (`/admin-management/products`)
   - Search and filtering
   - Pagination
   - Status badges
   - Stock indicators
   - Quick actions (view, edit, delete)

2. **Categories List** (`/admin-management/categories`)
   - Hierarchical tree view
   - Expandable/collapsible categories
   - Parent-child relationships
   - Product counts

3. **Tags List** (`/admin-management/tags`)
   - Grid layout with color coding
   - Category filtering
   - Usage statistics
   - System tag indicators

4. **Product Detail** (`/admin-management/products/[id]`)
   - Comprehensive product information
   - Image gallery
   - Specifications table
   - SEO metadata
   - Edit and delete actions

### Modals
1. **ProductFormModal** - Full-featured product creation/editing
2. **CategoryFormModal** - Category management with hierarchy
3. **TagFormModal** - Tag creation with color picker
4. **DeleteConfirmationModal** - Reusable delete confirmation

## Usage Examples

### Creating a Product
1. Navigate to Products page
2. Click "Add Product" button
3. Fill in basic information (name, description, category)
4. Set pricing and inventory details
5. Add images and specifications
6. Configure SEO settings
7. Save product

### Managing Categories
1. Navigate to Categories page
2. Click "Add Category" button
3. Enter category name and description
4. Select parent category (optional)
5. Set sort order and status
6. Add image/icon if desired
7. Save category

### Working with Tags
1. Navigate to Tags page
2. Click "Add Tag" button
3. Enter tag name and description
4. Choose color (custom or predefined)
5. Select associated category (optional)
6. Set sort order and status
7. Save tag

## Security Features

- **Admin access control** for all operations
- **Soft delete** for products (archived instead of permanently deleted)
- **Validation** for category hierarchy (max 3 levels)
- **Dependency checks** before deletion (categories with products, tags with products)
- **System tag protection** (cannot be modified/deleted)

## Performance Optimizations

- **Database indexing** on frequently queried fields
- **Pagination** for large datasets
- **Populated references** to reduce database queries
- **Efficient filtering** with MongoDB aggregation
- **Lazy loading** for hierarchical data

## Future Enhancements

- **Bulk operations** (import/export, bulk status changes)
- **Advanced filtering** (price ranges, date ranges, custom attributes)
- **Product variants** management interface
- **Inventory alerts** and notifications
- **Product analytics** and reporting
- **Multi-language support**
- **Product templates** for quick creation
- **Advanced SEO tools** (keyword analysis, competitor tracking)

## Dependencies

- **Next.js 14** - React framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Getting Started

1. Ensure all dependencies are installed
2. Set up MongoDB connection
3. Run database migrations
4. Access the admin panel
5. Navigate to Admin Management > Products/Categories/Tags

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.
