# Profile Photo Upload Functionality

## Overview
This feature allows admin users to upload, display, and edit their profile photos. When no profile photo is available, the system automatically displays a name initials avatar as a fallback.

## Features

### 1. Profile Photo Upload
- **Endpoint**: `POST /api/admin/profile/photo`
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 2MB
- **Storage**: Files are stored in `public/uploads/profiles/admins/`
- **Security**: Only authenticated admin users can upload photos

### 2. Profile Photo Removal
- **Endpoint**: `DELETE /api/admin/profile/photo`
- **Functionality**: Removes the current profile photo and reverts to initials avatar

### 3. Name Initials Avatar
- **Fallback**: Automatically displayed when no profile photo is available
- **Colors**: 10 different colors generated consistently based on user's name
- **Sizes**: Available in sm, md, lg, xl sizes
- **Styling**: Rounded, colored background with white text

## Components

### NameInitialsAvatar
- **Location**: `src/components/ui/avatar/NameInitialsAvatar.tsx`
- **Props**: `firstName`, `lastName`, `size`, `className`
- **Features**: 
  - Generates consistent colors based on name
  - Responsive sizing
  - Accessible with title attribute

### UserDropdown
- **Location**: `src/components/header/UserDropdown.tsx`
- **Features**:
  - Displays profile photo if available
  - Falls back to name initials avatar
  - Shows avatar in both header and dropdown

### EditProfileModal
- **Location**: `src/components/header/EditProfileModal.tsx`
- **Features**:
  - Photo upload interface
  - Photo preview
  - Photo removal
  - Real-time updates

## Database Changes

### Admin Model
- **Field**: `profilePhoto` (String, optional)
- **Default**: `null`
- **Usage**: Stores the URL path to the uploaded photo

## API Endpoints

### Profile Photo Management
```typescript
// Upload photo
POST /api/admin/profile/photo
Body: FormData with 'photo' field

// Remove photo
DELETE /api/admin/profile/photo
```

### Profile Management
```typescript
// Update profile (including photo)
PUT /api/admin/profile
Body: { firstName, lastName, email, profilePhoto? }

// Get profile
GET /api/admin/profile
```

## File Structure
```
public/
  uploads/
    profiles/
      admins/
        [timestamp]_[filename].jpg
        [timestamp]_[filename].png
        ...
```

## Usage Examples

### Displaying Profile Photo
```tsx
{currentUser.profilePhoto ? (
  <Image
    src={currentUser.profilePhoto}
    alt="User"
    className="object-cover rounded-full"
  />
) : (
  <NameInitialsAvatar
    firstName={currentUser.firstName}
    lastName={currentUser.lastName}
    size="md"
  />
)}
```

### Uploading New Photo
```tsx
const formData = new FormData();
formData.append('photo', file);

const response = await fetch('/api/admin/profile/photo', {
  method: 'POST',
  credentials: 'include',
  body: formData,
});
```

## Security Features
- **Authentication**: All endpoints require valid admin authentication
- **File Validation**: File type and size validation
- **Path Sanitization**: Filenames are sanitized to prevent path traversal
- **Permission Check**: Uses `requirePermission` middleware

## Styling
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Compatible with dark/light themes
- **Consistent Sizing**: Standardized avatar sizes across the application
- **Hover Effects**: Interactive elements with proper hover states

## Future Enhancements
- Image cropping and resizing
- Multiple photo support
- Photo gallery management
- Cloud storage integration
- Image optimization and compression
