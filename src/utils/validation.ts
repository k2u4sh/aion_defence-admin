import { ErrorMessages } from './apiResponse';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'url' | 'objectId';
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Validator {
  static validate(data: any, schema: ValidationSchema): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors: string[] = [];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(ErrorMessages.VALIDATION.REQUIRED_FIELD(field));
        continue;
      }

      // Skip other validations if value is not present
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (rules.type) {
        const typeError = this.validateType(value, rules.type, field);
        if (typeError) {
          fieldErrors.push(typeError);
        }
      }

      // String length validation
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          fieldErrors.push(ErrorMessages.VALIDATION.MIN_LENGTH(field, rules.minLength));
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          fieldErrors.push(ErrorMessages.VALIDATION.MAX_LENGTH(field, rules.maxLength));
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          fieldErrors.push(ErrorMessages.VALIDATION.INVALID_FORMAT(field));
        }
      }

      // Custom validation
      if (rules.custom) {
        const customResult = rules.custom(value);
        if (customResult !== true) {
          fieldErrors.push(typeof customResult === 'string' ? customResult : `Invalid ${field}`);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return errors;
  }

  private static validateType(value: any, type: string, field: string): string | null {
    switch (type) {
      case 'string':
        return typeof value === 'string' ? null : `${field} must be a string`;
      case 'number':
        return typeof value === 'number' && !isNaN(value) ? null : `${field} must be a valid number`;
      case 'boolean':
        return typeof value === 'boolean' ? null : `${field} must be a boolean`;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : ErrorMessages.VALIDATION.INVALID_EMAIL;
      case 'phone':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(value.replace(/\s/g, '')) ? null : ErrorMessages.VALIDATION.INVALID_PHONE;
      case 'url':
        try {
          new URL(value);
          return null;
        } catch {
          return `${field} must be a valid URL`;
        }
      case 'objectId':
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(value) ? null : `${field} must be a valid ObjectId`;
      default:
        return null;
    }
  }

  static validatePagination(params: any): { page: number; limit: number } {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 20));
    
    return { page, limit };
  }

  static validateSorting(params: any, allowedFields: string[]): { field: string; order: 1 | -1 } {
    const field = allowedFields.includes(params.sortBy) ? params.sortBy : 'createdAt';
    const order = params.sortOrder === 'asc' ? 1 : -1;
    
    return { field, order };
  }

  static validateSearchQuery(query: string): string {
    if (typeof query !== 'string') return '';
    return query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static validatePriceRange(minPrice?: string, maxPrice?: string): { min?: number; max?: number } | null {
    if (!minPrice && !maxPrice) return null;
    
    const min = minPrice ? parseFloat(minPrice) : undefined;
    const max = maxPrice ? parseFloat(maxPrice) : undefined;
    
    if (min !== undefined && (isNaN(min) || min < 0)) {
      throw new ValidationError('minPrice', 'Minimum price must be a valid positive number');
    }
    
    if (max !== undefined && (isNaN(max) || max < 0)) {
      throw new ValidationError('maxPrice', 'Maximum price must be a valid positive number');
    }
    
    if (min !== undefined && max !== undefined && min > max) {
      throw new ValidationError('priceRange', 'Minimum price cannot be greater than maximum price');
    }
    
    return { min, max };
  }

  static validateDateRange(startDate?: string, endDate?: string): { start?: Date; end?: Date } | null {
    if (!startDate && !endDate) return null;
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    if (start && isNaN(start.getTime())) {
      throw new ValidationError('startDate', 'Start date must be a valid date');
    }
    
    if (end && isNaN(end.getTime())) {
      throw new ValidationError('endDate', 'End date must be a valid date');
    }
    
    if (start && end && start > end) {
      throw new ValidationError('dateRange', 'Start date cannot be after end date');
    }
    
    return { start, end };
  }
}

// Common validation schemas
export const ValidationSchemas = {
  user: {
    firstName: { required: true, minLength: 2, maxLength: 50, type: 'string' },
    lastName: { required: true, minLength: 2, maxLength: 50, type: 'string' },
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 8, type: 'string' },
    mobile: { type: 'phone' },
    companyName: { maxLength: 100, type: 'string' }
  },
  
  product: {
    name: { required: true, minLength: 3, maxLength: 200, type: 'string' },
    description: { required: true, minLength: 10, maxLength: 2000, type: 'string' },
    basePrice: { required: true, type: 'number' },
    category: { required: true, type: 'objectId' },
    seller: { required: true, type: 'objectId' }
  },
  
  category: {
    name: { required: true, minLength: 2, maxLength: 100, type: 'string' },
    slug: { required: true, pattern: /^[a-z0-9-]+$/, type: 'string' },
    description: { maxLength: 500, type: 'string' }
  },
  
  order: {
    user: { required: true, type: 'objectId' },
    items: { required: true, custom: (value: any) => Array.isArray(value) && value.length > 0 },
    shippingAddress: { required: true, type: 'objectId' },
    paymentMethod: { required: true, type: 'string' }
  }
};
