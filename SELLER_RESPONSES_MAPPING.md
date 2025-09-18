# Seller Responses Array Mapping

This document shows how the `sellerResponses` array from the bid model is mapped and displayed across different components.

## Data Structure

The `sellerResponses` array contains objects with the following structure:

```javascript
sellerResponses: [{
  _id: String,                    // Unique response ID
  seller: {                       // Populated User object
    _id: String,
    firstName: String,
    lastName: String,
    companyName: String,
    email: String,
    phone: String
  },
  status: String,                 // 'pending' | 'accepted' | 'rejected'
  respondedAt: Date,              // Response timestamp
  quotedPrice: Number,            // Optional quoted price
  estimatedDelivery: String,      // Optional delivery estimate
  notes: String,                  // Optional seller notes
  attachments: [{                 // Array of attachment objects
    url: String,
    originalName: String,
    fileType: String,
    fileSize: Number
  }]
}]
```

## Mapping Patterns

### 1. Table View (SellerResponsesModal.tsx)

```tsx
{sellerResponses.map((response) => (
  <tr key={response._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
    {/* Seller Information */}
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {response.seller.firstName} {response.seller.lastName}
          </div>
          {response.seller.companyName && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {response.seller.companyName}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {response.seller.email}
          </div>
        </div>
      </div>
    </td>

    {/* Status Badge */}
    <td className="px-6 py-4 whitespace-nowrap">
      {getSellerStatusBadge(response.status)}
    </td>

    {/* Quoted Price */}
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
      {response.quotedPrice ? (
        <div className="font-semibold text-green-600 dark:text-green-400">
          ${response.quotedPrice.toLocaleString()}
        </div>
      ) : (
        <span className="text-gray-500 dark:text-gray-400">Not provided</span>
      )}
    </td>

    {/* Delivery Estimate */}
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
      {response.estimatedDelivery || (
        <span className="text-gray-500 dark:text-gray-400">Not provided</span>
      )}
    </td>

    {/* Comments */}
    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
      <div className="max-w-xs">
        {response.notes ? (
          <div className="line-clamp-3">{response.notes}</div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">No comments</span>
        )}
      </div>
    </td>

    {/* Attachments */}
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
      {response.attachments && response.attachments.length > 0 ? (
        <div className="space-y-1">
          {response.attachments.slice(0, 2).map((attachment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs truncate max-w-20" title={attachment.originalName}>
                {attachment.originalName}
              </span>
            </div>
          ))}
          {response.attachments.length > 2 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{response.attachments.length - 2} more
            </div>
          )}
        </div>
      ) : (
        <span className="text-gray-500 dark:text-gray-400">None</span>
      )}
    </td>

    {/* Response Time */}
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
      {formatDate(response.respondedAt)}
    </td>
  </tr>
))}
```

### 2. Card View (Bid Detail/Edit Pages)

```tsx
{bid.sellerResponses.map((response) => (
  <div key={response._id} className="border rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          {response.seller.firstName} {response.seller.lastName}
        </p>
        {response.seller.companyName && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {response.seller.companyName}
          </p>
        )}
      </div>
      {getSellerStatusBadge(response.status)}
    </div>
    
    {response.quotedPrice && (
      <div className="mb-2">
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quoted Price</label>
        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
          ${response.quotedPrice.toLocaleString()}
        </p>
      </div>
    )}
    
    {response.estimatedDelivery && (
      <div className="mb-2">
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Delivery</label>
        <p className="text-gray-900 dark:text-white">{response.estimatedDelivery}</p>
      </div>
    )}
    
    {response.notes && (
      <div className="mb-2">
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
        <p className="text-gray-700 dark:text-gray-300 text-sm">{response.notes}</p>
      </div>
    )}
    
    <div className="text-xs text-gray-500 dark:text-gray-400">
      Responded: {formatDate(response.respondedAt)}
    </div>
  </div>
))}
```

### 3. Attachments Array Mapping

Within each seller response, the attachments array is mapped as follows:

```tsx
{response.attachments && response.attachments.length > 0 ? (
  <div className="space-y-1">
    {response.attachments.slice(0, 2).map((attachment, index) => (
      <div key={index} className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span className="text-xs truncate max-w-20" title={attachment.originalName}>
          {attachment.originalName}
        </span>
      </div>
    ))}
    {response.attachments.length > 2 && (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        +{response.attachments.length - 2} more
      </div>
    )}
  </div>
) : (
  <span className="text-gray-500 dark:text-gray-400">None</span>
)}
```

## Key Mapping Features

### 1. **Conditional Rendering**
- Uses ternary operators to handle optional fields
- Shows "Not provided" or "None" for missing data
- Handles empty arrays gracefully

### 2. **Data Formatting**
- `quotedPrice.toLocaleString()` for currency formatting
- `formatDate()` for timestamp formatting
- `line-clamp-3` for text truncation

### 3. **Status Handling**
- `getSellerStatusBadge()` function for consistent status display
- Color-coded badges (pending/accepted/rejected)

### 4. **Responsive Design**
- `max-w-xs` for comment truncation
- `truncate max-w-20` for attachment names
- Horizontal scrolling for table view

### 5. **Accessibility**
- `title` attributes for truncated text
- Proper semantic HTML structure
- Keyboard navigation support

## Usage Examples

### Getting Seller Count
```tsx
const sellerCount = bid.sellerResponses?.length || 0;
```

### Filtering by Status
```tsx
const acceptedResponses = bid.sellerResponses?.filter(
  response => response.status === 'accepted'
) || [];
```

### Finding Specific Seller
```tsx
const sellerResponse = bid.sellerResponses?.find(
  response => response.seller._id === sellerId
);
```

### Mapping to Simple Array
```tsx
const sellerNames = bid.sellerResponses?.map(
  response => `${response.seller.firstName} ${response.seller.lastName}`
) || [];
```

This mapping structure provides a comprehensive way to display seller response data across different UI components while maintaining consistency and proper data handling.
