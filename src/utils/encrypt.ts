import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// For better type-safety, we can define the return type of our token generator
interface TokenPair {
  rawToken: string;
  hashedToken: string;
}

/**
 * Hashes a plaintext password using bcrypt.
 * @param password - The plaintext password to hash.
 * @returns The hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compares a candidate password with a hashed password.
 * @param candidatePassword - The plaintext password from user input.
 * @param hashedPassword - The hashed password stored in the database.
 * @returns True if the passwords match, false otherwise.
 */
export const comparePassword = async (
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

/**
 * Generates a random token and its hashed version for database storage.
 * @returns An object containing the raw token (for the user) and the hashed token (for the DB).
 */
export const generateToken = (): TokenPair => {
  const rawToken = crypto.randomBytes(32).toString('hex');

  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  return { rawToken, hashedToken };
};

/**
 * Hashes a token provided by a user (e.g., from an email link).
 * @param rawToken - The raw token from the user.
 * @returns The hashed token for database comparison.
 */
export const hashToken = (rawToken: string): string => {
  return crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
};