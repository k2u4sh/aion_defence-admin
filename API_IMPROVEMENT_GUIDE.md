# API Improvement Guide

## Overview

This guide outlines the improvements made to all APIs based on the new MongoDB structure and schema design. The improvements focus on:

1. **Consistent Response Format** - Standardized API responses
2. **Better Error Handling** - Centralized error management
3. **Input Validation** - Schema-based validation
4. **Database Connection** - Improved connection management
5. **Performance** - Better query optimization

## 🏗️ **New Architecture Components**

### 1. **API Response Handler** (`src/utils/apiResponse.ts`)
- Standardized response format
- Built-in pagination support
- Consistent error responses
- Metadata tracking

### 2. **Database Connection** (`src/utils/db.ts`)
- Uses new DatabaseManager
- Connection pooling
- Health monitoring
- Graceful shutdown

### 3. **Validation System** (`src/utils/validation.ts`)
- Schema-based validation
- Type checking
- Custom validation rules
- Pre-built schemas for common entities

## 📋 **API Response Format**

### Success Response
```typescript
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-08-13T09:30:00.000Z",
    "version": "1.0.0"
  }
}
```

### Paginated Response
```typescript
{
  "success": true,
  "message": "Resources retrieved successfully",
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": { /* metadata */ }
}
```

### Error Response
```typescript
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Error message 1", "Error message 2"]
  },
  "meta": { /* metadata */ }
}
```

## 🔧 **Implementation Steps**

### Step 1: Update Imports
```typescript
// OLD
import { connectDB } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";

// NEW
import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";
```

### Step 2: Replace Response Handling
```typescript
// OLD
return NextResponse.json({
  message: "Success",
  success: true,
  data: result
}, { status: 200 });

// NEW
return ApiResponseHandler.success(result, "Success");
```

### Step 3: Add Input Validation
```typescript
// Validate input using schema
const validationErrors = Validator.validate(body, ValidationSchemas.user);
if (Object.keys(validationErrors).length > 0) {
  return ApiResponseHandler.validationError(validationErrors);
}
```

### Step 4: Improve Error Handling
```typescript
// OLD
return NextResponse.json({
  message: "User not found",
  success: false
}, { status: 404 });

// NEW
return ApiResponseHandler.notFound(ErrorMessages.RESOURCE.NOT_FOUND("User"));
```

## 📊 **API Endpoints to Improve**

### 1. **User Management APIs**
- [x] `POST /api/users/login` - ✅ Improved
- [ ] `POST /api/users/signup` - Needs improvement
- [ ] `GET /api/users/profile` - Needs improvement
- [ ] `PUT /api/users/profile` - Needs improvement
- [ ] `POST /api/users/verify` - Needs improvement
- [ ] `POST /api/users/resend-otp` - Needs improvement

### 2. **Product Management APIs**
- [x] `GET /api/products` - ✅ Improved
- [ ] `POST /api/products` - Needs improvement
- [ ] `GET /api/products/[id]` - Needs improvement
- [ ] `PUT /api/products/[id]` - Needs improvement
- [ ] `DELETE /api/products/[id]` - Needs improvement

### 3. **Category Management APIs**
- [ ] `GET /api/categories` - Needs improvement
- [ ] `POST /api/categories` - Needs improvement
- [ ] `GET /api/categories/[id]` - Needs improvement
- [ ] `PUT /api/categories/[id]` - Needs improvement
- [ ] `DELETE /api/categories/[id]` - Needs improvement

### 4. **Order Management APIs**
- [ ] `GET /api/orders` - Needs improvement
- [ ] `POST /api/orders` - Needs improvement
- [ ] `GET /api/orders/[id]` - Needs improvement
- [ ] `PUT /api/orders/[id]` - Needs improvement

### 5. **Cart Management APIs**
- [ ] `GET /api/cart` - Needs improvement
- [ ] `POST /api/cart` - Needs improvement
- [ ] `PUT /api/cart` - Needs improvement
- [ ] `DELETE /api/cart` - Needs improvement

### 6. **Other APIs**
- [ ] `GET /api/search` - Needs improvement
- [ ] `GET /api/analytics` - Needs improvement
- [ ] `GET /api/notifications` - Needs improvement
- [ ] `GET /api/payments` - Needs improvement

## 🎯 **Key Improvements Made**

### 1. **Login API** (`/api/users/login`)
- ✅ Centralized response handling
- ✅ Input validation with schemas
- ✅ Consistent error messages
- ✅ Better error handling
- ✅ Updated database connection

### 2. **Products API** (`/api/products`)
- ✅ Centralized response handling
- ✅ Input validation for pagination
- ✅ Price range validation
- ✅ Sorting validation
- ✅ Pagination response format
- ✅ Better error handling

## 🚀 **Next Steps for Each API**

### **User APIs**
```typescript
// Add validation schemas
const signupSchema = {
  firstName: { required: true, minLength: 2, maxLength: 50, type: 'string' },
  lastName: { required: true, minLength: 2, maxLength: 50, type: 'string' },
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 8, type: 'string' },
  mobile: { type: 'phone' },
  companyName: { maxLength: 100, type: 'string' }
};

// Validate input
const validationErrors = Validator.validate(body, signupSchema);
if (Object.keys(validationErrors).length > 0) {
  return ApiResponseHandler.validationError(validationErrors);
}
```

### **Product APIs**
```typescript
// Add validation for product creation
const productSchema = {
  name: { required: true, minLength: 3, maxLength: 200, type: 'string' },
  description: { required: true, minLength: 10, maxLength: 2000, type: 'string' },
  basePrice: { required: true, type: 'number' },
  category: { required: true, type: 'objectId' },
  sku: { required: true, type: 'string' }
};

// Validate input
const validationErrors = Validator.validate(body, productSchema);
if (Object.keys(validationErrors).length > 0) {
  return ApiResponseHandler.validationError(validationErrors);
}
```

### **Category APIs**
```typescript
// Add validation for category creation
const categorySchema = {
  name: { required: true, minLength: 2, maxLength: 100, type: 'string' },
  slug: { required: true, pattern: /^[a-z0-9-]+$/, type: 'string' },
  description: { maxLength: 500, type: 'string' },
  parent: { type: 'objectId' }
};

// Validate input
const validationErrors = Validator.validate(body, categorySchema);
if (Object.keys(validationErrors).length > 0) {
  return ApiResponseHandler.validationError(validationErrors);
}
```

## 🔍 **Validation Rules**

### **Common Validation Types**
- `required` - Field must be present
- `minLength` - Minimum string length
- `maxLength` - Maximum string length
- `pattern` - Regex pattern validation
- `type` - Data type validation
- `custom` - Custom validation function

### **Supported Types**
- `string` - String validation
- `number` - Number validation
- `boolean` - Boolean validation
- `email` - Email format validation
- `phone` - Phone number validation
- `url` - URL format validation
- `objectId` - MongoDB ObjectId validation

## 📈 **Performance Improvements**

### 1. **Database Queries**
- Use indexes effectively
- Implement pagination
- Optimize aggregation pipelines
- Use projection to limit fields

### 2. **Response Optimization**
- Implement caching headers
- Compress responses
- Use streaming for large datasets
- Implement rate limiting

### 3. **Error Handling**
- Log errors appropriately
- Return meaningful error messages
- Implement retry logic
- Use proper HTTP status codes

## 🧪 **Testing Improvements**

### 1. **Unit Tests**
- Test validation schemas
- Test response formats
- Test error handling
- Test edge cases

### 2. **Integration Tests**
- Test API endpoints
- Test database connections
- Test authentication
- Test pagination

### 3. **Performance Tests**
- Test response times
- Test database query performance
- Test concurrent requests
- Test memory usage

## 📚 **Best Practices**

### 1. **Response Consistency**
- Always use ApiResponseHandler
- Include proper HTTP status codes
- Provide meaningful error messages
- Use consistent field names

### 2. **Input Validation**
- Validate all inputs
- Use appropriate validation schemas
- Sanitize user inputs
- Handle validation errors gracefully

### 3. **Error Handling**
- Log errors with context
- Return user-friendly messages
- Use appropriate HTTP status codes
- Implement proper error recovery

### 4. **Database Operations**
- Use transactions when needed
- Implement proper indexing
- Optimize queries
- Handle connection errors

## 🔄 **Migration Checklist**

For each API endpoint:

- [ ] Update imports to use new utilities
- [ ] Replace NextResponse with ApiResponseHandler
- [ ] Add input validation using Validator
- [ ] Update error handling
- [ ] Test the endpoint
- [ ] Update documentation
- [ ] Add proper logging
- [ ] Implement rate limiting if needed

## 📖 **Examples**

### **Complete Improved API Example**
```typescript
import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate input
    const validationErrors = Validator.validate(body, ValidationSchemas.user);
    if (Object.keys(validationErrors).length > 0) {
      return ApiResponseHandler.validationError(validationErrors);
    }
    
    // Process request
    const result = await processUserCreation(body);
    
    // Return success response
    return ApiResponseHandler.success(result, SuccessMessages.CREATED("User"));
    
  } catch (error) {
    console.error("User creation error:", error);
    
    if (error.code === 11000) {
      return ApiResponseHandler.conflict(ErrorMessages.RESOURCE.ALREADY_EXISTS("User"));
    }
    
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}
```

This guide provides a comprehensive approach to improving all APIs with consistent patterns, better error handling, and improved performance.
