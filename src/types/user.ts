// User types for TypeScript
export interface Address {
  street?: string;
  city: string;
  state?: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface OTP {
  code: string;
  type: 'registration' | 'reset' | 'login';
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
}

export interface UserPreferences {
  newsletter: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  currency: string;
  timezone: string;
}

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  mobile?: string;
  password: string;
  roles: string[];
  companyName?: string;
  companyType?: string;
  addresses: Address[];
  defaultAddress?: Address;
  profilePicture?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  otp?: OTP;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  forgotPasswordToken?: string;
  forgotPasswordTokenExpiry?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  isLocked: boolean;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  compareOTP(otp: string): Promise<boolean>;
  isOTPValid(type: string): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  save(): Promise<IUser>;
}
